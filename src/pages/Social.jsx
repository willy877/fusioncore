import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Users, Hash, Send, Plus, Loader2,
  Smile, Paperclip, X, Pencil, Trash2, Check, Image as ImageIcon,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { api } from '@/api';
import { supabase } from '@/supabaseClient';
import { io } from 'socket.io-client';
import EmojiPicker from '@/components/EmojiPicker';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.fusioncore.space';
const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

// ── Lightbox ──────────────────────────────────────────────
const Lightbox = ({ src, onClose }) => (
  <div
    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
    onClick={onClose}
  >
    <button
      className="absolute top-4 right-4 text-white hover:text-gray-300"
      onClick={onClose}
    >
      <X className="w-8 h-8" />
    </button>
    <img
      src={src}
      className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
      onClick={(e) => e.stopPropagation()}
      alt="preview"
    />
  </div>
);

// ── ChannelView ───────────────────────────────────────────
const ChannelView = ({ channel, user }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null); // { id, content }
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [reactions, setReactions] = useState({}); // { msgId: { emoji: count } }
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    setLoading(true);
    api.channels.messages(channel.id, { limit: 50 })
      .then(data => {
        setMessages(data);
        // Init reactions from message data if present
        const rxMap = {};
        data.forEach(m => {
          if (m.reactions) rxMap[m.id] = m.reactions;
        });
        setReactions(rxMap);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [channel.id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('fc_access_token');
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('join:channel', channel.id));

    socket.on('message:receive', (msg) => {
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
    });

    socket.on('message:edited', ({ id, content }) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, content } : m));
    });

    socket.on('message:deleted', ({ id }) => {
      setMessages(prev => prev.filter(m => m.id !== id));
    });

    socket.on('message:reaction', ({ messageId, reactions: rx }) => {
      setReactions(prev => ({ ...prev, [messageId]: rx }));
    });

    socket.on('user:typing', ({ username: u, isTyping }) => {
      if (u === user?.username) return;
      setTypingUsers(prev => isTyping ? [...new Set([...prev, u])] : prev.filter(x => x !== u));
    });

    socket.on('connect_error', (err) => console.error('Socket error:', err.message));

    return () => {
      socket.emit('leave:channel', channel.id);
      socket.disconnect();
    };
  }, [channel.id, user?.username]);

  const handleSend = async () => {
    if ((!input.trim() && !sending) || sending) return;
    setSending(true);
    try {
      await api.channels.sendMessage(channel.id, input.trim());
      setInput('');
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el mensaje' });
    }
    setSending(false);
  };

  const handleTyping = (val) => {
    setInput(val);
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('user:typing', { channelId: channel.id, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit('user:typing', { channelId: channel.id, isTyping: false });
    }, 2000);
  };

  const handleEdit = async (msgId, newContent) => {
    if (!newContent.trim()) return;
    try {
      await api.channels.editMessage(msgId, newContent.trim());
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: newContent.trim() } : m));
      setEditingMsg(null);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo editar el mensaje' });
    }
  };

  const handleDelete = async (msgId) => {
    try {
      await api.channels.deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el mensaje' });
    }
  };

  const handleReact = async (msgId, emoji) => {
    // Optimistic update
    setReactions(prev => {
      const msgRx = { ...(prev[msgId] || {}) };
      msgRx[emoji] = (msgRx[emoji] || 0) + 1;
      return { ...prev, [msgId]: msgRx };
    });
    try {
      await api.channels.reactMessage(msgId, emoji);
    } catch {
      // Revert optimistic
      setReactions(prev => {
        const msgRx = { ...(prev[msgId] || {}) };
        if (msgRx[emoji] > 1) msgRx[emoji]--;
        else delete msgRx[emoji];
        return { ...prev, [msgId]: msgRx };
      });
    }
  };

  const handleImageUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `channel-${channel.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('chat-media')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
      await api.channels.sendMessage(channel.id, '', urlData.publicUrl, 'image');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo subir la imagen' });
    }
    setUploading(false);
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  const getAvatar = (msg) =>
    msg.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.username || 'user'}`;
  const isImage = (url) => url && /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      {/* Header */}
      <div className="glass-effect rounded-xl p-4 mb-4 flex items-center gap-3">
        <Hash className="w-5 h-5 text-indigo-400" />
        <div>
          <h2 className="text-lg font-bold text-white leading-none">{channel.name}</h2>
          {channel.description && <p className="text-xs text-gray-400">{channel.description}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="glass-effect rounded-xl p-4 flex-1 overflow-y-auto mb-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-center text-gray-500 py-8">Sin mensajes aún. ¡Sé el primero!</p>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          const msgReactions = reactions[msg.id] || {};
          const isEditing = editingMsg?.id === msg.id;
          const fileIsImage = msg.file_url && isImage(msg.file_url);

          return (
            <div
              key={msg.id}
              className={`group flex gap-3 relative ${isMe ? 'flex-row-reverse' : ''}`}
              onMouseEnter={() => setHoveredMsgId(msg.id)}
              onMouseLeave={() => setHoveredMsgId(null)}
            >
              <img
                src={getAvatar(msg)}
                className="w-8 h-8 rounded-full border-2 border-slate-600 flex-shrink-0 self-start mt-1"
                alt=""
              />
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs font-semibold text-indigo-300">
                    {msg.display_name || msg.username}
                  </span>
                  <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
                  {msg.edited_at && <span className="text-xs text-gray-600 italic">(editado)</span>}
                </div>

                {/* Bubble */}
                {isEditing ? (
                  <div className="flex gap-2 w-full">
                    <Input
                      autoFocus
                      value={editingMsg.content}
                      onChange={(e) => setEditingMsg({ ...editingMsg, content: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEdit(msg.id, editingMsg.content);
                        if (e.key === 'Escape') setEditingMsg(null);
                      }}
                      className="bg-slate-700 border-indigo-500 text-white text-sm"
                    />
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(msg.id, editingMsg.content)}>
                      <Check className="w-4 h-4 text-green-400" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingMsg(null)}>
                      <X className="w-4 h-4 text-gray-400" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`px-3 py-2 rounded-xl text-sm text-white leading-relaxed ${
                      isMe
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-700 rounded-tr-none'
                        : 'bg-slate-800/80 rounded-tl-none'
                    }`}
                    onDoubleClick={() => isMe && setEditingMsg({ id: msg.id, content: msg.content })}
                  >
                    {fileIsImage ? (
                      <img
                        src={msg.file_url}
                        className="max-w-xs max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightboxSrc(msg.file_url)}
                        alt="imagen"
                      />
                    ) : msg.file_url ? (
                      <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="underline text-blue-300">
                        Archivo adjunto
                      </a>
                    ) : null}
                    {msg.content && <p>{msg.content}</p>}
                  </div>
                )}

                {/* Reactions display */}
                {Object.keys(msgReactions).length > 0 && (
                  <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                    {Object.entries(msgReactions).map(([emoji, count]) => (
                      count > 0 && (
                        <button
                          key={emoji}
                          onClick={() => handleReact(msg.id, emoji)}
                          className="flex items-center gap-0.5 bg-slate-700/60 hover:bg-slate-600 rounded-full px-1.5 py-0.5 text-xs transition-colors"
                        >
                          <span>{emoji}</span>
                          <span className="text-gray-300">{count}</span>
                        </button>
                      )
                    ))}
                  </div>
                )}
              </div>

              {/* Hover actions */}
              {hoveredMsgId === msg.id && !isEditing && (
                <div className={`absolute top-0 ${isMe ? 'left-10' : 'right-0'} flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-1 py-0.5 shadow-lg z-10`}>
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(msg.id, emoji)}
                      className="text-base hover:scale-125 transition-transform px-0.5"
                    >
                      {emoji}
                    </button>
                  ))}
                  {isMe && (
                    <>
                      <button
                        onClick={() => setEditingMsg({ id: msg.id, content: msg.content })}
                        className="ml-1 p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <p className="text-xs text-gray-500 italic">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'está' : 'están'} escribiendo...
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass-effect rounded-xl p-3 flex gap-2 items-center">
        {/* Image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); e.target.value = ''; }}
        />
        <Button
          variant="ghost" size="icon"
          className="text-gray-400 hover:text-white flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </Button>

        {/* Emoji picker */}
        <EmojiPicker onEmojiSelect={(e) => setInput(prev => prev + e)} asChild>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white flex-shrink-0">
            <Smile className="w-4 h-4" />
          </Button>
        </EmojiPicker>

        <Input
          value={input}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          placeholder={`Mensaje en #${channel.name}...`}
          className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-gray-400"
          disabled={sending}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

// ── Social principal ──────────────────────────────────────
const Social = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadCommunities = useCallback(async () => {
    try {
      const data = await api.communities.list();
      setCommunities(data);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las comunidades' });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { loadCommunities(); }, [loadCommunities]);

  const selectCommunity = async (community) => {
    setSelectedCommunity(community);
    setSelectedChannel(null);
    try {
      await api.communities.join(community.id).catch(() => {});
      const data = await api.communities.channels(community.id);
      setChannels(data);
      if (data.length > 0) setSelectedChannel(data[0]);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los canales' });
    }
  };

  const createCommunity = async () => {
    if (!newCommunityName.trim()) return;
    try {
      const community = await api.communities.create({ name: newCommunityName.trim(), description: '' });
      toast({ title: 'Comunidad creada', description: community.name });
      setNewCommunityName('');
      setShowCreateForm(false);
      await loadCommunities();
      await selectCommunity(community);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <Layout>
      <Helmet><title>Social - Fusion Core</title></Helmet>
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        {/* Sidebar — Comunidades */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-64 flex-shrink-0 glass-effect rounded-xl p-4 flex flex-col gap-3 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> Comunidades
            </h2>
            <Button
              variant="ghost" size="icon"
              onClick={() => setShowCreateForm(!showCreateForm)}
              title="Crear comunidad"
            >
              <Plus className="w-4 h-4 text-gray-400" />
            </Button>
          </div>

          {showCreateForm && (
            <div className="flex gap-2">
              <Input
                value={newCommunityName}
                onChange={(e) => setNewCommunityName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createCommunity()}
                placeholder="Nombre..."
                className="bg-slate-800 border-slate-700 text-white text-xs h-8"
              />
              <Button size="sm" onClick={createCommunity} className="h-8 px-2 bg-indigo-600">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          )}

          {loading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /></div>}

          {communities.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCommunity(c)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                selectedCommunity?.id === c.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {c.name[0].toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.member_count || 0} miembros</p>
                </div>
              </div>
            </button>
          ))}

          {!loading && communities.length === 0 && (
            <p className="text-gray-500 text-xs text-center py-4">
              No hay comunidades. ¡Crea la primera!
            </p>
          )}
        </motion.div>

        {/* Sidebar — Canales */}
        {selectedCommunity && (
          <motion.div
            key={selectedCommunity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-48 flex-shrink-0 glass-effect rounded-xl p-4 overflow-y-auto"
          >
            <h3 className="text-white font-bold text-sm mb-3 truncate">{selectedCommunity.name}</h3>
            <div className="space-y-1">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-all ${
                    selectedChannel?.id === ch.id
                      ? 'bg-slate-700 text-white'
                      : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Hash className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Main */}
        <div className="flex-1 min-w-0">
          {!selectedChannel ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-xl h-full flex items-center justify-center"
            >
              <div className="text-center text-gray-400">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Selecciona una comunidad y un canal</p>
                <p className="text-sm mt-1">Para empezar a chatear en tiempo real</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={selectedChannel.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full"
            >
              <ChannelView channel={selectedChannel} user={user} />
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Social;
