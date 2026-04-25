import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';

const Post = ({ post, user, onPostUpdate }) => {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    setIsLiked(post.post_likes.some(like => like.user_id === user.id));
    setLikeCount(post.post_likes.length);
    setComments(post.post_comments);
    setCommentCount(post.post_comments.length);
  }, [post, user.id]);

  const handleLike = async () => {
    if (isLiked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .match({ post_id: post.id, user_id: user.id });
      if (error) {
        toast({ title: 'Error', description: 'No se pudo quitar el "me gusta".', variant: 'destructive' });
      }
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: post.id, user_id: user.id });
      if (error) {
        toast({ title: 'Error', description: 'No se pudo dar "me gusta".', variant: 'destructive' });
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const { error } = await supabase
      .from('post_comments')
      .insert({ post_id: post.id, user_id: user.id, content: newComment });

    if (error) {
      toast({ title: 'Error', description: 'No se pudo añadir el comentario.', variant: 'destructive' });
    } else {
      setNewComment('');
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " años";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " días";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " horas";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutos";
    return Math.floor(seconds) + " segundos";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-effect p-5 rounded-xl"
    >
      <div className="flex items-center gap-3 mb-4">
        <img
          className="w-10 h-10 rounded-full"
          src={post.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.profiles.username}`}
          alt={post.profiles.username}
        />
        <div>
          <p className="font-semibold text-white">{post.profiles.username}</p>
          <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
        </div>
      </div>
      <p className="text-gray-200 mb-4">{post.content}</p>
      <div className="flex items-center gap-4 text-gray-400">
        <button onClick={handleLike} className="flex items-center gap-1 hover:text-red-500 transition-colors">
          <Heart className={cn("h-5 w-5", isLiked && "text-red-500 fill-current")} />
          <span>{likeCount}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1 hover:text-blue-400 transition-colors">
          <MessageCircle className="h-5 w-5" />
          <span>{commentCount}</span>
        </button>
      </div>
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-700"
          >
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {comments.map(comment => (
                <div key={comment.id} className="flex items-start gap-2">
                  <img
                    className="w-8 h-8 rounded-full"
                    src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.profiles?.username}`}
                    alt={comment.profiles?.username}
                  />
                  <div className="bg-slate-800/70 rounded-lg p-2 flex-1">
                    <p className="font-semibold text-sm text-white">{comment.profiles?.username}</p>
                    <p className="text-sm text-gray-300">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Añade un comentario..."
                className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-gray-400"
              />
              <Button onClick={handleAddComment} size="icon" className="bg-gradient-to-r from-blue-500 to-purple-600">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SocialFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (username, avatar_url),
        post_likes (user_id),
        post_comments (id, content, created_at, user_id, profiles (username, avatar_url))
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las publicaciones.', variant: 'destructive' });
    } else {
      setPosts(data);
    }
  }, [toast]);

  useEffect(() => {
    fetchPosts();

    const postSubscription = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, fetchPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(postSubscription);
    };
  }, [fetchPosts]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    const { error } = await supabase
      .from('posts')
      .insert({ content: newPostContent, user_id: user.id });

    if (error) {
      toast({ title: 'Error', description: 'No se pudo crear la publicación.', variant: 'destructive' });
    } else {
      setNewPostContent('');
      toast({ title: 'Éxito', description: 'Publicación creada.' });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-effect p-5 rounded-xl">
        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="¿Qué estás pensando?"
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
        />
        <div className="flex justify-end mt-3">
          <Button onClick={handleCreatePost} className="bg-gradient-to-r from-blue-500 to-purple-600">
            Publicar
          </Button>
        </div>
      </motion.div>

      <div className="space-y-4">
        <AnimatePresence>
          {posts.map(post => (
            <Post key={post.id} post={post} user={user} onPostUpdate={fetchPosts} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SocialFeed;