import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Edit, Trash2, Download, SmilePlus } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmojiPicker from '@/components/EmojiPicker';
import { cn } from '@/lib/utils';

const Message = ({ message, conversation, onUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const isSender = message.sender_id === user.id;
  const participantsCount = conversation.participants.length;
  const readCount = message.message_read_status.filter(s => s.user_id !== user.id).length;

  let statusIcon = null;
  if (isSender) {
    if (readCount >= participantsCount - 1 && participantsCount > 1) {
      statusIcon = <CheckCheck className="h-4 w-4 text-blue-400" />; // All read
    } else if (message.id) { // Simple check to see if message is sent
      statusIcon = <CheckCheck className="h-4 w-4 text-gray-400" />; // Delivered/Sent
    } else {
      statusIcon = <Check className="h-4 w-4 text-gray-400" />; // Pending send
    }
  }

  const handleDelete = async () => {
    const { error } = await supabase.from('messages').delete().eq('id', message.id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el mensaje.', variant: 'destructive' });
    } else {
      onUpdate();
    }
  };

  const handleEdit = async () => {
    if (editedContent === message.content) {
      setIsEditing(false);
      return;
    }
    const { error } = await supabase
      .from('messages')
      .update({ content: editedContent, is_edited: true, updated_at: new Date().toISOString() })
      .eq('id', message.id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo editar el mensaje.', variant: 'destructive' });
    } else {
      setIsEditing(false);
      onUpdate();
    }
  };

  const handleReaction = async (emoji) => {
    const existingReaction = message.message_reactions.find(r => r.user_id === user.id && r.reaction === emoji);
    if (existingReaction) {
      // User is removing their reaction
      await supabase.from('message_reactions').delete().eq('id', existingReaction.id);
    } else {
      // User is adding a new reaction
      await supabase.from('message_reactions').insert({
        message_id: message.id,
        user_id: user.id,
        reaction: emoji,
      });
    }
    onUpdate();
  };

  const groupedReactions = (message.message_reactions || []).reduce((acc, r) => {
    acc[r.reaction] = (acc[r.reaction] || 0) + 1;
    return acc;
  }, {});
  
  const userReactions = new Set((message.message_reactions || []).filter(r => r.user_id === user.id).map(r => r.reaction));

  const renderFile = () => {
    if (!message.file_url) return null;
    const { type, name } = message.file_metadata || {};

    if (type?.startsWith('image/')) {
      return <img src={message.file_url} alt={name || 'Imagen adjunta'} className="rounded-lg max-w-xs mt-2 cursor-pointer" onClick={() => window.open(message.file_url, '_blank')} />;
    }
    if (type?.startsWith('video/')) {
      return <video src={message.file_url} controls className="rounded-lg max-w-xs mt-2" />;
    }
    return (
      <div className="mt-2 p-3 bg-slate-600/50 rounded-lg flex items-center gap-3">
        <p className="text-sm text-gray-200 truncate flex-1">{name || 'Archivo adjunto'}</p>
        <a href={message.file_url} target="_blank" rel="noopener noreferrer" download>
          <Download className="h-5 w-5 text-gray-300 hover:text-white" />
        </a>
      </div>
    );
  };

  return (
    <div className={`flex flex-col group ${isSender ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-end gap-2 ${isSender ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isSender && (
          <img
            className="w-8 h-8 rounded-full self-start"
            alt={message.sender.username}
            src={message.sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender.username}`}
          />
        )}
        <div className={`relative max-w-md px-4 py-2 rounded-lg ${isSender ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-slate-700 text-white'}`}>
          {!isSender && <p className="text-xs font-bold text-blue-300 mb-1">{message.sender.username}</p>}
          {isEditing ? (
            <div className="flex gap-2">
              <Input value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="bg-slate-800 text-white" />
              <Button onClick={handleEdit} size="sm">Guardar</Button>
              <Button onClick={() => setIsEditing(false)} variant="ghost" size="sm">Cancelar</Button>
            </div>
          ) : (
            <>
              {message.content && <p className="break-words">{message.content}</p>}
              {renderFile()}
            </>
          )}
          <div className="flex items-center justify-end gap-1 text-xs opacity-70 mt-1">
            {message.is_edited && <span>(editado)</span>}
            <span>{new Date(message.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
            {statusIcon}
          </div>
        </div>

        <div className={`flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isSender ? 'flex-row-reverse' : ''}`}>
           <EmojiPicker onEmojiSelect={handleReaction} asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7"><SmilePlus className="h-4 w-4" /></Button>
           </EmojiPicker>
          {isSender && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDelete}><Trash2 className="h-4 w-4 text-red-400" /></Button>
            </>
          )}
        </div>
      </div>
      
      {Object.keys(groupedReactions).length > 0 && (
         <div className={`flex gap-1 mt-1 ${isSender ? 'justify-end' : 'justify-start ml-10'}`}>
            {Object.entries(groupedReactions).map(([emoji, count]) => (
                <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className={cn(
                        "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors",
                        userReactions.has(emoji) 
                            ? 'bg-blue-500/30 border-blue-500 text-white' 
                            : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:bg-slate-600'
                    )}
                >
                    <span>{emoji}</span>
                    <span>{count}</span>
                </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default Message;