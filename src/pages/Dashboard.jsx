import React, { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useNavigate } from "react-router-dom";
import { Gamepad2, MessageSquare, Sparkles, Trophy, Users, ChevronRight, Star, TrendingUp } from "lucide-react";
import { api } from "@/api";

const LEVELS = [
  { min: 0,    max: 99,       name: 'Novato',   emoji: '🌱', color: '#94a3b8' },
  { min: 100,  max: 299,      name: 'Aprendiz', emoji: '⚡', color: '#60a5fa' },
  { min: 300,  max: 699,      name: 'Jugador',  emoji: '🎮', color: '#34d399' },
  { min: 700,  max: 1499,     name: 'Experto',  emoji: '🏆', color: '#f59e0b' },
  { min: 1500, max: 2999,     name: 'Maestro',  emoji: '🔥', color: '#f97316' },
  { min: 3000, max: Infinity, name: 'Leyenda',  emoji: '👑', color: '#a78bfa' },
];
function getLevel(score) {
  return LEVELS.find(l => (score || 0) >= l.min && (score || 0) <= l.max) || LEVELS[0];
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await api.reputation.leaderboard();
      setLeaderboard(data.slice(0, 5));
    } catch {}
  }, []);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  const displayName = user?.display_name || user?.username || user?.email?.split('@')[0] || 'Gamer';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const totalRep = (user?.social_score || 0) + (user?.gamer_score || 0) + (user?.knowledge_score || 0);
  const userLevel = getLevel(user?.reputation || 0);

  const MODULES = [
    { title: 'Gaming', desc: 'Snake, Tetris y más', icon: Gamepad2, link: '/gaming', color: 'from-green-500 to-emerald-600', glow: 'shadow-green-900/30' },
    { title: 'Social', desc: 'Comunidades y canales', icon: MessageSquare, link: '/social', color: 'from-blue-500 to-cyan-600', glow: 'shadow-blue-900/30' },
    { title: 'Nova IA', desc: 'Tu asistente IA', icon: Sparkles, link: '/nova', color: 'from-pink-500 to-purple-600', glow: 'shadow-purple-900/30' },
    { title: 'Perfil', desc: 'Reputación y logros', icon: Trophy, link: '/profile', color: 'from-yellow-500 to-orange-600', glow: 'shadow-yellow-900/30' },
  ];

  return (
    <Layout>
      <Helmet><title>Dashboard - Fusion Core</title></Helmet>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Saludo + nivel */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-2xl p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{greeting},</p>
              <h1 className="text-3xl font-bold text-white mt-1">
                {userLevel.emoji} {displayName}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: userLevel.color + '22', color: userLevel.color, border: `1px solid ${userLevel.color}44` }}>
                  {userLevel.name}
                </span>
                <span className="text-gray-500 text-xs">{user?.reputation || 0} pts totales</span>
              </div>
            </div>
            <div className="hidden md:grid grid-cols-3 gap-3">
              {[
                { label: 'Social',   score: user?.social_score    || 0, color: '#60a5fa', icon: Users },
                { label: 'Gaming',   score: user?.gamer_score     || 0, color: '#34d399', icon: Gamepad2 },
                { label: 'Saber',    score: user?.knowledge_score || 0, color: '#f59e0b', icon: Star },
              ].map(s => {
                const lvl = getLevel(s.score);
                return (
                  <div key={s.label} className="text-center px-3 py-2 rounded-xl"
                    style={{ background: s.color + '15', border: `1px solid ${s.color}33` }}>
                    <p className="text-lg">{lvl.emoji}</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: s.color }}>{s.score}</p>
                    <p className="text-gray-500 text-xs">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Módulos */}
          <div className="md:col-span-2 space-y-3">
            <h2 className="text-white font-bold text-lg">Módulos</h2>
            <div className="grid grid-cols-2 gap-3">
              {MODULES.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }} onClick={() => navigate(m.link)}
                  className={`glass-effect rounded-2xl p-5 cursor-pointer hover:scale-105 transition-all group shadow-lg ${m.glow}`}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-3 shadow-lg`}>
                    <m.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white font-bold">{m.title}</h3>
                  <p className="text-gray-400 text-xs mt-1">{m.desc}</p>
                  <div className="flex items-center gap-1 mt-3 text-gray-500 group-hover:text-white transition-colors">
                    <span className="text-xs">Abrir</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="space-y-3">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> Top Reputación
            </h2>
            <div className="glass-effect rounded-2xl p-4 space-y-2">
              {leaderboard.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Sin datos aún</p>
              ) : leaderboard.map((p, i) => {
                const lvl = getLevel(p.reputation);
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-base w-6 text-center">
                      {['🥇','🥈','🥉','4️⃣','5️⃣'][i]}
                    </span>
                    <img
                      src={p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`}
                      className="w-8 h-8 rounded-full border-2 border-slate-600" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {lvl.emoji} {p.display_name || p.username}
                      </p>
                      <p className="text-xs" style={{ color: lvl.color }}>{lvl.name}</p>
                    </div>
                    <span className="font-mono font-bold text-sm" style={{ color: lvl.color }}>
                      {p.reputation}
                    </span>
                  </div>
                );
              })}
              <button onClick={() => navigate('/profile')}
                className="w-full mt-2 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white text-xs transition-all">
                Ver mi perfil →
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
