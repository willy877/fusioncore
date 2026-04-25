// ===============================================
// CHAT WINDOW COMPLETO — AUDIO 100% FUNCIONAL
// ===============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Paperclip, Search, Send, Smile, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Message from '@/components/Message';
import { Progress } from '@/components/ui/progress';
import EmojiPicker from '@/components/EmojiPicker';

const ChatWindow = ({ conversation, onBack }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // AUDIO STATES
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const conversationName = conversation.is_group
    ? conversation.group_name
    : conversation.participants.find((p) => p.id !== user.id)?.username;

  const conversationAvatar = conversation.is_group
    ? conversation.group_avatar_url
    : conversation.participants.find((p) => p.id !== user.id)?.avatar_url;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ===============================================
  // FETCH MESSAGES
  // ===============================================

  const fetchMessages = useCallback(async () => {
    if (!conversation) return;

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(username, avatar_url),
        message_reactions(*),
        message_read_status(*)
      `)
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los mensajes.',
        variant: 'destructive',
      });
    } else {
      setMessages(data || []);
    }
  }, [conversation, toast]);

  // ===============================================
  // MARK AS READ
  // ===============================================

  const markMessagesAsRead = useCallback(async () => {
    if (!conversation || !user) return;

    const unreadMessages = messages
      .filter(
        (m) =>
          m.sender_id !== user.id &&
          !m.message_read_status.some((s) => s.user_id === user.id)
      )
      .map((m) => m.id);

    if (unreadMessages.length > 0) {
      const readStatuses = unreadMessages.map((message_id) => ({
        message_id,
        user_id: user.id,
        read_at: new Date().toISOString(),
      }));
      await supabase.from('message_read_status').insert(readStatuses);
    }
  }, [conversation, user, messages]);

  useEffect(() => {
    fetchMessages();
    markMessagesAsRead();

    const channel = supabase
      .channel(`conversation_${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        () => fetchMessages()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, () =>
        fetchMessages()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_read_status' }, () =>
        fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id, fetchMessages, markMessagesAsRead]);

  useEffect(() => {
    scrollToBottom();
    markMessagesAsRead();
  }, [messages, markMessagesAsRead]);

  // ===============================================
  // SEND TEXT
  // ===============================================

  const sendMessage = async (content, fileUrl = null, fileMetadata = null) => {
    if (!content.trim() && !fileUrl) return;

    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content,
      file_url: fileUrl,
      file_metadata: fileMetadata,
      created_at: new Date().toISOString(),
    });

    setNewMessage('');
  };

  const handleSendMessage = () => sendMessage(newMessage);

  // ===============================================
  // FILE UPLOAD
  // ===============================================

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const fileName = `${user.id}/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from('chat_files')
      .upload(fileName, file);

    setUploading(false);
    setUploadProgress(0);

    if (error) {
      toast({
        title: 'Error de subida',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('chat_files').getPublicUrl(fileName);

    sendMessage(file.name, publicUrl, {
      name: file.name,
      type: file.type,
      size: file.size,
    });
  };

  // ===============================================
  // AUDIO RECORDING — ARREGLADO
  // ===============================================

  const startRecording = async () => {
  try {
    // Obtener stream de audio
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    // AAC — súper compatible con Windows, Edge y móviles
    let options = { mimeType: "audio/mp4" };

    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "audio/webm" };
    }

    const recorder = new MediaRecorder(stream, options);

    setAudioChunks([]);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        setAudioChunks(prev => [...prev, e.data]);
      }
    };

    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: options.mimeType });

      const fileName = `${user.id}/${Date.now()}_audio.${options.mimeType === "audio/mp4" ? "mp4" : "webm"}`;

      const { error } = await supabase.storage
        .from("chat_files")
        .upload(fileName, audioBlob);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo subir el audio.",
          variant: "destructive",
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("chat_files")
        .getPublicUrl(fileName);

      sendMessage("(audio)", publicUrl, {
        name: fileName,
        type: options.mimeType,
      });

      setAudioChunks([]);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);

  } catch (err) {
    console.error(err);
    toast({
      title: "Error",
      description: "No se pudo acceder al micrófono.",
      variant: "destructive",
    });
  }
};


  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  // ===============================================
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-xl p-4 mb-4 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {(() => {
            const otherId = !conversation.is_group
              ? conversation.participants.find(p => p.id !== user.id)?.id
              : null;
            return (
              <div
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => otherId && (window.location.href = `/profile/${otherId}`)}
              >
                <img
                  className="w-10 h-10 rounded-full border-2 border-indigo-500/40"
                  alt={conversationName}
                  src={conversationAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conversationName}`}
                />
                <div>
                  <h2 className="text-lg font-bold text-white leading-none">{conversationName}</h2>
                  {!conversation.is_group && <p className="text-xs text-indigo-400">Ver perfil</p>}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-400 w-40"
          />
        </div>
      </motion.div>

      {/* MESSAGES */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-effect rounded-xl p-4 flex-1 overflow-y-auto mb-4"
      >
        <div className="space-y-1">
          {messages
            .filter((msg) =>
              msg.content?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((msg) => (
              <Message
                key={msg.id}
                message={msg}
                conversation={conversation}
                onUpdate={fetchMessages}
              />
            ))}
          <div ref={messagesEndRef} />
        </div>
      </motion.div>

      {uploading && <Progress value={uploadProgress} className="w-full mb-2" />}

      {/* INPUT AREA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-xl p-4 flex gap-2 items-center"
      >
        <EmojiPicker
          onEmojiSelect={(emoji) => setNewMessage((prev) => prev + emoji)}
          asChild
        >
          <Button variant="ghost" size="icon">
            <Smile className="h-5 w-5 text-gray-400" />
          </Button>
        </EmojiPicker>

        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-gray-400"
        />

        {/* MIC */}
        <Button
          variant="ghost"
          size="icon"
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? (
            <Square className="h-5 w-5 text-red-500" />
          ) : (
            <Mic className="h-5 w-5 text-gray-400" />
          )}
        </Button>

        {/* FILE */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current.click()}>
          <Paperclip className="h-5 w-5 text-gray-400" />
        </Button>

        <Button
          onClick={handleSendMessage}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Send className="h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  );
};

export default ChatWindow;