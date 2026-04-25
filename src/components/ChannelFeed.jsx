import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const ChannelFeed = () => {
  const { toast } = useToast();
  const [channels, setChannels] = useState([]);
  const [posts, setPosts] = useState({});

  const fetchChannels = useCallback(async () => {
    const { data, error } = await supabase.from('channels').select('*');
    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los canales.', variant: 'destructive' });
    } else {
      setChannels(data);
      data.forEach(channel => fetchPosts(channel.id));
    }
  }, [toast]);

  const fetchPosts = async (channelId) => {
    const { data, error } = await supabase
      .from('channel_posts')
      .select('*, profiles(username, avatar_url)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false });
    
    if (!error) {
      setPosts(prev => ({ ...prev, [channelId]: data }));
    }
  };

  useEffect(() => {
    fetchChannels();
    const subscription = supabase
      .channel('public:channels')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, fetchChannels)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channel_posts' }, (payload) => {
        if (payload.new.channel_id) {
          fetchPosts(payload.new.channel_id);
        }
      })
      .subscribe();
      
    return () => supabase.removeChannel(subscription);
  }, [fetchChannels]);

  return (
    <div className="space-y-6">
      {channels.map(channel => (
        <motion.div
          key={channel.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect p-5 rounded-xl"
        >
          <h2 className="text-2xl font-bold gradient-text mb-1">{channel.name}</h2>
          <p className="text-gray-400 mb-4">{channel.description}</p>
          <div className="space-y-4 border-t border-slate-700 pt-4">
            {(posts[channel.id] || []).map(post => (
              <div key={post.id} className="bg-slate-800/50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    className="w-8 h-8 rounded-full"
                    src={post.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.profiles.username}`}
                    alt={post.profiles.username}
                  />
                  <div>
                    <p className="font-semibold text-white">{post.profiles.username}</p>
                    <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-gray-200">{post.content}</p>
              </div>
            ))}
            {(posts[channel.id] || []).length === 0 && <p className="text-gray-500">No hay publicaciones en este canal.</p>}
          </div>
        </motion.div>
      ))}
      {channels.length === 0 && <p className="text-center text-gray-400 py-8">No hay canales disponibles.</p>}
    </div>
  );
};

export default ChannelFeed;