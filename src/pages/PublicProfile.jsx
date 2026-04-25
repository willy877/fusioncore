import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, UserCheck, Phone, Video, MessageCircle, Clock } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { api } from '@/api';
import { useToast } from '@/components/ui/use-toast';

const PublicProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { startCall } = useSocket();
  const [profile, setProfile] = useState(null);
  const [friendship, setFriendship] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchFriendStatus();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const data = await api.profile.getById(id);
      setProfile(data);
    } catch {}
    setLoading(false);
  };

  const fetchFriendStatus = async () => {
    try {
      const data = await api.friends.status(id);
      setFriendship(data.friendship || null);
    } catch {}
  };

  const sendRequest = async () => {
    try {
      await api.friends.sendRequest(id);
      toast({ title: 'Solicitud enviada' });
      fetchFriendStatus();
    } catch (e) {
      toast({ variant: 'destructive', title: e.message || 'Error' });
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
      </div>
    </Layout>
  );

  if (!profile) return (
    <Layout>
      <div className="text-center py-20 text-gray-400">Usuario no encontrado.</div>
    </Layout>
  );

  const isFriend = friendship?.status === 'accepted';
  const isPending = friendship?.status === 'pending';
  const isSentByMe = friendship?.sender_id === user?.id;
  const avatarSrc = profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;
  const displayName = profile.display_name || profile.username;

  return (
    <Layout>
      <Helmet><title>{displayName} - Fusion Core</title></Helmet>
      <div className="max-w-md mx-auto space-y-4">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-2xl p-8 text-center space-y-4">
          <img src={avatarSrc} alt={displayName}
            className="w-24 h-24 rounded-full border-4 border-indigo-500/50 mx-auto object-cover shadow-lg" />
          <div>
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            <p className="text-gray-500 text-sm">@{profile.username}</p>
            {isFriend && profile.bio && (
              <p className="text-gray-400 text-sm mt-2">{profile.bio}</p>
            )}
            {!isFriend && (
              <p className="text-gray-600 text-xs mt-2 italic">Hazte amigo para ver más</p>
            )}
          </div>

          {user?.id !== id && (
            <div className="pt-2 space-y-3">
              {isFriend ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-medium mb-3">
                    <UserCheck className="w-4 h-4" /> Amigos
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => navigate('/dm')}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/40 text-indigo-300 text-sm rounded-xl transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" /> Mensaje
                    </button>
                    <button
                      onClick={() => startCall(id, displayName, profile.avatar_url, 'audio')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/40 hover:bg-green-600/40 text-green-300 text-sm rounded-xl transition-colors"
                    >
                      <Phone className="w-4 h-4" /> Llamar
                    </button>
                    <button
                      onClick={() => startCall(id, displayName, profile.avatar_url, 'video')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/40 text-blue-300 text-sm rounded-xl transition-colors"
                    >
                      <Video className="w-4 h-4" /> Video
                    </button>
                  </div>
                </>
              ) : isPending ? (
                <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  {isSentByMe ? 'Solicitud enviada' : 'Solicitud recibida'}
                </div>
              ) : (
                <Button onClick={sendRequest}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <UserPlus className="w-4 h-4 mr-2" /> Agregar amigo
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default PublicProfile;
