import React, { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet";
import Layout from "@/components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Check, CheckCheck, Search, UserPlus, X, ArrowLeft, Loader2, MessageCircle, Clock, Smile, Paperclip, Phone, Video, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { api } from "@/api";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/supabaseClient";
import EmojiPicker from "@/components/EmojiPicker";

const API_URL = import.meta.env.VITE_API_URL || "https://fusioncore.space";
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const DoubleTick = ({ status }) => {
  if (status === "sent") return <Check className="w-3.5 h-3.5 text-gray-400" />;
  if (status === "delivered") return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
  if (status === "read") return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
  return null;
};

const Avatar = ({ name, avatar, size = "md" }) => {
  const s = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return avatar
    ? <img src={avatar} alt={name} className={`${s} rounded-full object-cover flex-shrink-0`} />
    : <div className={`${s} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
        {name?.[0]?.toUpperCase() || "?"}
      </div>;
};

// Lightbox component
const Lightbox = ({ src, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
    <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300">
      <X className="w-8 h-8" />
    </button>
    <img src={src} alt="lightbox" className="max-w-[90vw] max-h-[90vh] rounded-lg object-contain" onClick={e => e.stopPropagation()} />
  </div>
);

// DM Message component
const DMMessage = ({ msg, myId, onReact, onEdit, onDelete }) => {
  const isMine = msg.sender_id === myId;
  const [showReactions, setShowReactions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(msg.content);
  const [lightbox, setLightbox] = useState(null);

  const reactions = msg.reactions || [];
  const myReactions = new Set(reactions.flatMap(r => (r.users || []).includes(myId) ? [r.reaction] : []));

  const handleEdit = async () => {
    if (editContent === msg.content) { setEditing(false); return; }
    await onEdit(msg.id, editContent);
    setEditing(false);
  };

  const isImage = msg.file_type?.startsWith('image/') || (msg.file_url && /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.file_url));
  const isAudio = msg.file_type?.startsWith('audio/') || (msg.file_url && /\.(mp3|mp4|webm|ogg|wav)$/i.test(msg.file_url));

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex ${isMine ? "justify-end" : "justify-start"} group`}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      <div className={`max-w-[75%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        <div className="relative">
          {/* Quick reaction + actions bar on hover */}
          <AnimatePresence>
            {showReactions && !editing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`absolute ${isMine ? 'right-full mr-2' : 'left-full ml-2'} top-0 flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 z-10 shadow-xl`}
              >
                {QUICK_REACTIONS.map(r => (
                  <button key={r} onClick={() => onReact(msg.id, r)}
                    className={`text-sm hover:scale-125 transition-transform ${myReactions.has(r) ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                    {r}
                  </button>
                ))}
                <EmojiPicker onEmojiSelect={(e) => onReact(msg.id, e)}>
                  <button className="text-xs text-gray-400 hover:text-white px-1">+</button>
                </EmojiPicker>
                {isMine && !msg.is_deleted && (
                  <>
                    <button onClick={() => { setEditing(true); setEditContent(msg.content); }}
                      className="text-gray-400 hover:text-white ml-1">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(msg.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message bubble */}
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              isMine
                ? "bg-purple-600 text-white rounded-br-sm"
                : "bg-slate-800 text-gray-100 border border-slate-700/50 rounded-bl-sm"
            } ${msg.is_deleted ? 'opacity-50 italic' : ''}`}
            onDoubleClick={() => isMine && !msg.is_deleted && (setEditing(true), setEditContent(msg.content))}
          >
            {editing ? (
              <div className="flex gap-2 min-w-48">
                <input
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setEditing(false); }}
                  className="flex-1 bg-white/10 rounded px-2 py-1 text-white text-sm outline-none"
                  autoFocus
                />
                <button onClick={handleEdit} className="text-green-400 hover:text-green-300 text-xs">✓</button>
                <button onClick={() => setEditing(false)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
              </div>
            ) : (
              <>
                {msg.content && <p>{msg.content}</p>}
                {msg.file_url && isImage && (
                  <img src={msg.file_url} alt="adjunto" className="rounded-lg max-w-xs mt-2 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setLightbox(msg.file_url)} />
                )}
                {msg.file_url && isAudio && (
                  <audio src={msg.file_url} controls className="mt-2 max-w-xs" />
                )}
                {msg.file_url && !isImage && !isAudio && (
                  <a href={msg.file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 mt-2 p-2 bg-white/10 rounded-lg text-xs hover:bg-white/20">
                    <Paperclip className="w-3.5 h-3.5" /> Archivo adjunto
                  </a>
                )}
              </>
            )}
          </div>
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {reactions.map(r => (
              <button key={r.reaction} onClick={() => onReact(msg.id, r.reaction)}
                className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                  myReactions.has(r.reaction)
                    ? 'bg-purple-500/30 border-purple-500/60 text-white'
                    : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:bg-slate-600'
                }`}>
                {r.reaction} <span>{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Time + status */}
        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'flex-row' : 'flex-row-reverse'}`}>
          <span className="text-[10px] text-gray-600">
            {new Date(msg.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            {msg.is_edited && <span className="ml-1 text-gray-700">(editado)</span>}
          </span>
          {isMine && <DoubleTick status={msg.status} />}
        </div>
      </div>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </motion.div>
  );
};

const DirectMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { socket: globalSocket, startCall } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [mobileView, setMobileView] = useState("list");
  const [uploading, setUploading] = useState(false);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const searchTimeout = useRef(null);
  const fileInputRef = useRef(null);
  const myId = user?.id;

  // Use global socket for DM events
  useEffect(() => {
    if (!globalSocket) return;
    socketRef.current = globalSocket;

    globalSocket.on("dm:request", (data) => {
      toast({ title: `Solicitud de DM de ${data.sender_username}` });
      setRequests(prev => [data, ...prev]);
    });

    globalSocket.on("dm:message", (msg) => {
      if (activeConvRef.current?.other_user_id === msg.sender_id) {
        setMessages(prev => [...prev, { ...msg, reactions: [] }]);
        api.dm.markRead(msg.sender_id).catch(() => {});
        globalSocket.emit("dm:read_confirm", { message_ids: [msg.id], to: msg.sender_id });
      } else {
        setConversations(prev => prev.map(c =>
          c.other_user_id === msg.sender_id
            ? { ...c, last_message: msg.content, last_message_at: msg.created_at, unread_count: (parseInt(c.unread_count) || 0) + 1 }
            : c
        ));
        toast({ title: `DM de ${msg.sender_display || msg.sender_username}`, description: msg.content?.slice(0, 60) });
      }
    });

    globalSocket.on("dm:delivered", ({ message_ids }) => {
      setMessages(prev => prev.map(m =>
        message_ids.includes(m.id) && m.status === "sent" ? { ...m, status: "delivered" } : m
      ));
    });

    globalSocket.on("dm:read", ({ message_ids }) => {
      setMessages(prev => prev.map(m =>
        message_ids.includes(m.id) ? { ...m, status: "read" } : m
      ));
    });

    globalSocket.on("dm:accepted", () => loadConversations());

    globalSocket.on("dm:edit", (updatedMsg) => {
      setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, content: updatedMsg.content, is_edited: true } : m));
    });

    globalSocket.on("dm:delete", ({ id }) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, content: 'Mensaje eliminado', is_deleted: true } : m));
    });

    globalSocket.on("dm:reaction", ({ message_id, reactions }) => {
      setMessages(prev => prev.map(m => m.id === message_id ? { ...m, reactions } : m));
    });

    return () => {
      globalSocket.off("dm:request");
      globalSocket.off("dm:message");
      globalSocket.off("dm:delivered");
      globalSocket.off("dm:read");
      globalSocket.off("dm:accepted");
      globalSocket.off("dm:edit");
      globalSocket.off("dm:delete");
      globalSocket.off("dm:reaction");
    };
  }, [globalSocket]);

  const activeConvRef = useRef(activeConv);
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  const loadConversations = useCallback(async () => {
    try {
      const [convData, reqData] = await Promise.all([api.dm.getConversations(), api.dm.getRequests()]);
      setConversations(convData.conversations || []);
      setRequests(reqData.requests || []);
    } catch {
      toast({ variant: "destructive", title: "Error cargando mensajes" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) loadConversations(); }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = async (conv) => {
    setActiveConv(conv);
    setMobileView("chat");
    setMessages([]);
    try {
      const data = await api.dm.getMessages(conv.other_user_id);
      setMessages((data.messages || []).map(m => ({ ...m, reactions: m.reactions || [] })));
      await api.dm.markRead(conv.other_user_id);
      setConversations(prev => prev.map(c =>
        c.other_user_id === conv.other_user_id ? { ...c, unread_count: 0 } : c
      ));
    } catch {}
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !activeConv || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    const tempId = `temp_${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, sender_id: myId, receiver_id: activeConv.other_user_id, content, status: "sent", created_at: new Date().toISOString(), reactions: [] }]);
    try {
      const data = await api.dm.sendMessage(activeConv.other_user_id, content);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...data.message, reactions: [] } : m));
      setConversations(prev => prev.map(c =>
        c.other_user_id === activeConv.other_user_id
          ? { ...c, last_message: content, last_message_at: new Date().toISOString() }
          : c
      ));
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast({ variant: "destructive", title: err.message || "Error enviando mensaje" });
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeConv) return;
    setUploading(true);
    const fileName = `dm/${myId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('chat-media').upload(fileName, file);
    setUploading(false);
    if (error) {
      // Try fallback bucket
      const { error: e2 } = await supabase.storage.from('chat_files').upload(fileName, file);
      if (e2) { toast({ variant: 'destructive', title: 'Error subiendo imagen' }); return; }
    }
    const bucket = error ? 'chat_files' : 'chat-media';
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    setSending(true);
    try {
      const data = await api.dm.sendMessage(activeConv.other_user_id, '', publicUrl, file.type);
      setMessages(prev => [...prev, { ...data.message, reactions: [] }]);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error enviando archivo' });
    } finally {
      setSending(false);
      e.target.value = '';
    }
  };

  const handleReact = async (msgId, reaction) => {
    try {
      const data = await api.dm.reactMessage(msgId, reaction);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: data.reactions } : m));
    } catch {}
  };

  const handleEdit = async (msgId, content) => {
    try {
      await api.dm.editMessage(msgId, content);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content, is_edited: true } : m));
    } catch {}
  };

  const handleDelete = async (msgId) => {
    try {
      await api.dm.deleteMessage(msgId);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: 'Mensaje eliminado', is_deleted: true } : m));
    } catch {}
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await api.profile.search(q);
        setSearchResults((data.users || []).filter(u => u.id !== myId));
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
  };

  const sendRequest = async (userId) => {
    try {
      await api.dm.sendRequest(userId);
      toast({ title: "Solicitud enviada" });
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      toast({ variant: "destructive", title: err.message || "Error enviando solicitud" });
    }
  };

  const respondRequest = async (id, action) => {
    try {
      await api.dm.respondRequest(id, action);
      setRequests(prev => prev.filter(r => r.id !== id));
      if (action === "accept") { await loadConversations(); toast({ title: "DM aceptado" }); }
    } catch {}
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const diff = Date.now() - d;
    if (diff < 60000) return "ahora";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("es", { day: "2-digit", month: "2-digit" });
  };

  const displayName = (conv) => conv.other_display || conv.other_username || "Usuario";

  return (
    <Layout>
      <Helmet><title>Mensajes - Fusion Core</title></Helmet>
      <div className="flex h-[calc(100vh-8rem)] gap-0 rounded-2xl overflow-hidden border border-white/5">

        {/* Sidebar */}
        <div className={`${mobileView === "chat" ? "hidden md:flex" : "flex"} w-full md:w-80 flex-shrink-0 flex-col bg-slate-900/60 border-r border-white/5`}>
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white">Mensajes</h2>
              <div className="flex gap-2">
                {requests.length > 0 && (
                  <button onClick={() => setShowRequests(!showRequests)}
                    className="relative w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                    <Clock className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {requests.length > 9 ? "9+" : requests.length}
                    </span>
                  </button>
                )}
                <button onClick={() => setShowSearch(!showSearch)}
                  className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showSearch && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input value={searchQuery} onChange={e => handleSearch(e.target.value)}
                      placeholder="Buscar usuario..."
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    {searchQuery && <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>}
                  </div>
                  {searching && <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-purple-400" /></div>}
                  {searchResults.map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors" onClick={() => sendRequest(u.id)}>
                      <Avatar name={u.display_name || u.username} avatar={u.avatar_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{u.display_name || u.username}</p>
                        <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                      </div>
                      <UserPlus className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {showRequests && requests.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="border-b border-white/5 p-3 space-y-2 bg-slate-800/30">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-1">Solicitudes pendientes</p>
                {requests.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/60">
                    <Avatar name={r.sender_username} avatar={r.sender_avatar} size="sm" />
                    <div className="flex-1 min-w-0"><p className="text-sm text-white font-medium truncate">{r.sender_username}</p></div>
                    <div className="flex gap-1">
                      <button onClick={() => respondRequest(r.id, "accept")} className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg">Aceptar</button>
                      <button onClick={() => respondRequest(r.id, "reject")} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-gray-300 text-xs rounded-lg">Rechazar</button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                <MessageCircle className="w-12 h-12 text-gray-700" />
                <p className="text-gray-500 text-sm">Sin conversaciones aún.</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button key={conv.other_user_id} onClick={() => openConversation(conv)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${activeConv?.other_user_id === conv.other_user_id ? "bg-white/5 border-r-2 border-purple-500" : ""}`}>
                  <div className="relative">
                    <Avatar name={displayName(conv)} avatar={conv.other_avatar} />
                    {parseInt(conv.unread_count) > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-purple-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {conv.unread_count > 9 ? "9+" : conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${parseInt(conv.unread_count) > 0 ? "text-white" : "text-gray-300"}`}>{displayName(conv)}</p>
                      <span className="text-[10px] text-gray-600 flex-shrink-0">{formatTime(conv.last_message_at)}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${parseInt(conv.unread_count) > 0 ? "text-gray-300 font-medium" : "text-gray-500"}`}>
                      {conv.last_message || "Sin mensajes aún"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className={`${mobileView === "list" ? "hidden md:flex" : "flex"} flex-1 flex-col bg-slate-950/40`}>
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
              <MessageCircle className="w-16 h-16 text-gray-700" />
              <h3 className="text-xl font-bold text-gray-500">Selecciona una conversación</h3>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-slate-900/40">
                <button onClick={() => { setMobileView("list"); setActiveConv(null); }}
                  className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Avatar name={displayName(activeConv)} avatar={activeConv.other_avatar} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{displayName(activeConv)}</p>
                  <p className="text-xs text-gray-500">@{activeConv.other_username}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => startCall(activeConv.other_user_id, displayName(activeConv), activeConv.other_avatar, 'audio')}
                    className="w-8 h-8 bg-slate-700/50 hover:bg-green-700/50 rounded-lg flex items-center justify-center transition-colors"
                    title="Llamada de voz">
                    <Phone className="w-4 h-4 text-green-400" />
                  </button>
                  <button onClick={() => startCall(activeConv.other_user_id, displayName(activeConv), activeConv.other_avatar, 'video')}
                    className="w-8 h-8 bg-slate-700/50 hover:bg-blue-700/50 rounded-lg flex items-center justify-center transition-colors"
                    title="Videollamada">
                    <Video className="w-4 h-4 text-blue-400" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <DMMessage
                      key={msg.id}
                      msg={msg}
                      myId={myId}
                      onReact={handleReact}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
                <div ref={scrollRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="flex items-center gap-2 px-4 py-3 border-t border-white/5 bg-slate-900/40">
                <EmojiPicker onEmojiSelect={(e) => setInput(prev => prev + e)}>
                  <button type="button" className="w-9 h-9 flex-shrink-0 bg-slate-700/50 hover:bg-slate-700 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                    <Smile className="w-4 h-4" />
                  </button>
                </EmojiPicker>

                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  disabled={sending || uploading}
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) sendMessage(e); }}
                />

                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*,video/*,audio/*" />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  disabled={sending || uploading}
                  className="w-9 h-9 flex-shrink-0 bg-slate-700/50 hover:bg-slate-700 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                </button>

                <button type="submit" disabled={!input.trim() || sending}
                  className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-purple-600 to-indigo-600 disabled:opacity-40 rounded-xl flex items-center justify-center transition-all hover:scale-105">
                  {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DirectMessages;
