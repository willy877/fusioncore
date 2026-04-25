import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserCheck, UserX, Search, Users, MessageCircle, Phone, Video, X, Loader2, Bell } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { api } from '@/api';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const Avatar = ({ name, avatar, size = 'md', status }) => {
  const s = size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-14 h-14' : 'w-11 h-11';
  return (
    <div className="relative flex-shrink-0">
      <img
        src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
        alt={name}
        className={`${s} rounded-full border-2 border-slate-600 object-cover`}
      />
      {status && (
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
      )}
    </div>
  );
};

const FriendsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { socket, startCall } = useSocket();
  const navigate = useNavigate();
  const [tab, setTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [fr, rq] = await Promise.all([api.friends.getAll(), api.friends.getRequests()]);
      setFriends(fr.friends || []);
      setRequests(rq.requests || []);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error cargando amigos' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) loadData(); }, [user]);

  useEffect(() => {
    if (!socket) return;
    socket.on('friend:request', (data) => {
      setRequests(prev => [data, ...prev]);
      toast({ title: `Solicitud de amistad de ${data.sender_username}` });
    });
    socket.on('friend:accepted', () => loadData());
    socket.on('friend:rejected', () => loadData());
    return () => {
      socket.off('friend:request');
      socket.off('friend:accepted');
      socket.off('friend:rejected');
    };
  }, [socket, loadData]);

  const handleSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await api.profile.search(q);
        setSearchResults((data.users || []).filter(u => u.id !== user?.id));
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
  };

  const sendRequest = async (receiverId) => {
    try {
      await api.friends.sendRequest(receiverId);
      toast({ title: 'Solicitud enviada' });
      setSearchResults(prev => prev.filter(u => u.id !== receiverId));
    } catch (e) {
      toast({ variant: 'destructive', title: e.message || 'Error' });
    }
  };

  const acceptRequest = async (id) => {
    try {
      await api.friends.accept(id);
      toast({ title: '¡Nuevo amigo!' });
      loadData();
    } catch { toast({ variant: 'destructive', title: 'Error' }); }
  };

  const rejectRequest = async (id) => {
    try {
      await api.friends.reject(id);
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch {}
  };

  const removeFriend = async (friendId) => {
    try {
      await api.friends.remove(friendId);
      setFriends(prev => prev.filter(f => f.friend_id !== friendId));
      toast({ title: 'Amigo eliminado' });
    } catch {}
  };

  const displayName = (f) => f.friend_display || f.friend_username || 'Usuario';
  const senderName = (r) => r.sender_display || r.sender_username || 'Usuario';

  return (
    <Layout>
      <Helmet><title>Amigos - Fusion Core</title></Helmet>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-effect rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Amigos</h1>
            {requests.length > 0 && (
              <span className="ml-auto flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold px-2.5 py-1 rounded-full">
                <Bell className="w-3 h-3" />{requests.length} solicitud{requests.length > 1 ? 'es' : ''}
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar usuarios para agregar..."
              className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search results */}
          <AnimatePresence>
            {(searchResults.length > 0 || searching) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-1 overflow-hidden">
                {searching ? (
                  <div className="flex justify-center py-3"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /></div>
                ) : (
                  searchResults.map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-700/50 transition-colors">
                      <Avatar name={u.display_name || u.username} avatar={u.avatar_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{u.display_name || u.username}</p>
                        <p className="text-xs text-gray-500">@{u.username}</p>
                      </div>
                      <button onClick={() => sendRequest(u.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors">
                        <UserPlus className="w-3.5 h-3.5" /> Agregar
                      </button>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900/60 rounded-xl p-1 border border-white/5">
          {[
            { id: 'friends', label: `Amigos (${friends.length})` },
            { id: 'requests', label: `Solicitudes${requests.length > 0 ? ` (${requests.length})` : ''}` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
        ) : tab === 'friends' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {friends.length === 0 ? (
              <div className="glass-effect rounded-2xl p-12 text-center">
                <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Sin amigos aún. ¡Busca usuarios arriba!</p>
              </div>
            ) : (
              friends.map(f => (
                <motion.div key={f.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="glass-effect rounded-xl p-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
                  <Avatar name={displayName(f)} avatar={f.friend_avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{displayName(f)}</p>
                    <p className="text-xs text-gray-500">@{f.friend_username}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => navigate(`/dm`)}
                      className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
                      title="Mensaje">
                      <MessageCircle className="w-4 h-4 text-indigo-400" />
                    </button>
                    <button onClick={() => startCall(f.friend_id, displayName(f), f.friend_avatar, 'audio')}
                      className="w-8 h-8 bg-slate-700 hover:bg-green-700 rounded-lg flex items-center justify-center transition-colors"
                      title="Llamada de voz">
                      <Phone className="w-4 h-4 text-green-400" />
                    </button>
                    <button onClick={() => startCall(f.friend_id, displayName(f), f.friend_avatar, 'video')}
                      className="w-8 h-8 bg-slate-700 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors"
                      title="Videollamada">
                      <Video className="w-4 h-4 text-blue-400" />
                    </button>
                    <button onClick={() => navigate(`/profile/${f.friend_id}`)}
                      className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
                      title="Ver perfil">
                      <UserCheck className="w-4 h-4 text-gray-400" />
                    </button>
                    <button onClick={() => removeFriend(f.friend_id)}
                      className="w-8 h-8 bg-slate-700 hover:bg-red-700 rounded-lg flex items-center justify-center transition-colors"
                      title="Eliminar amigo">
                      <UserX className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {requests.length === 0 ? (
              <div className="glass-effect rounded-2xl p-12 text-center">
                <Bell className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Sin solicitudes pendientes.</p>
              </div>
            ) : (
              requests.map(r => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="glass-effect rounded-xl p-4 flex items-center gap-3">
                  <Avatar name={senderName(r)} avatar={r.sender_avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{senderName(r)}</p>
                    <p className="text-xs text-gray-500">@{r.sender_username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => acceptRequest(r.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors">
                      Aceptar
                    </button>
                    <button onClick={() => rejectRequest(r.id)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-gray-300 text-xs font-medium rounded-lg transition-colors">
                      Rechazar
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default FriendsPage;
