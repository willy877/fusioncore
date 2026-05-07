import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationsContext';
import Layout from '@/components/Layout';
import {
  Bell, UserPlus, MessageCircle, Trophy, Gamepad2,
  Heart, AtSign, Check, CheckCheck, Trash2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_CONFIG = {
  friend_request:    { icon: UserPlus,      color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  friend_accepted:   { icon: UserPlus,      color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  message:           { icon: MessageCircle, color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20' },
  achievement:       { icon: Trophy,        color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  game_invite:       { icon: Gamepad2,      color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  like:              { icon: Heart,         color: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'border-pink-500/20' },
  mention:           { icon: AtSign,        color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  default:           { icon: Bell,          color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20' },
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const NotifCard = ({ notif, onRead, onDelete, navigate }) => {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.default;
  const Icon = cfg.icon;
  const link = notif.data?.link;

  const handleClick = () => {
    if (!notif.read) onRead(notif.id);
    if (link) navigate(link);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer group
        ${ notif.read
            ? 'bg-white/2 border-white/5 hover:bg-white/5'
            : `${cfg.bg} ${cfg.border} hover:brightness-110`
        }`}
      onClick={handleClick}
    >
      {!notif.read && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-400" />
      )}

      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${notif.read ? 'text-gray-300' : 'text-white'}`}>
          {notif.title}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notif.body}</p>
        <p className="text-[10px] text-gray-600 mt-1">{timeAgo(notif.created_at)}</p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
        {!notif.read && (
          <button
            onClick={(e) => { e.stopPropagation(); onRead(notif.id); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-400/10 transition-all"
            title="Marcar como leída"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
          title="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, fetchNotifications } = useNotifications();

  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              Notificaciones
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-400 mt-1">{unreadCount} sin leer</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifications}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/20 transition-all"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {notifications.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-effect rounded-2xl p-12 text-center"
          >
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Todo al día</p>
            <p className="text-gray-600 text-sm mt-1">No tienes notificaciones nuevas</p>
          </motion.div>
        )}

        {/* Sin leer */}
        {unread.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Sin leer</p>
            <AnimatePresence mode="popLayout">
              {unread.map(n => (
                <NotifCard key={n.id} notif={n} onRead={markAsRead} onDelete={deleteNotification} navigate={navigate} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Leídas */}
        {read.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Anteriores</p>
            <AnimatePresence mode="popLayout">
              {read.map(n => (
                <NotifCard key={n.id} notif={n} onRead={markAsRead} onDelete={deleteNotification} navigate={navigate} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Notifications;
