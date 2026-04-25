import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  User, Camera, Save, Trophy, Gamepad2, Users, Lock, Bell,
  Sparkles, Palette, LogOut, MessageSquare, TrendingUp, Star, Zap
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { api } from '@/api';

// ── Constantes de niveles ──────────────────────────────────
const LEVELS = [
  { min: 0,    max: 99,        level: 1, name: 'Novato',   color: '#94a3b8', emoji: '🌱' },
  { min: 100,  max: 299,       level: 2, name: 'Aprendiz', color: '#60a5fa', emoji: '⚡' },
  { min: 300,  max: 699,       level: 3, name: 'Jugador',  color: '#34d399', emoji: '🎮' },
  { min: 700,  max: 1499,      level: 4, name: 'Experto',  color: '#f59e0b', emoji: '🏆' },
  { min: 1500, max: 2999,      level: 5, name: 'Maestro',  color: '#f97316', emoji: '🔥' },
  { min: 3000, max: Infinity,  level: 6, name: 'Leyenda',  color: '#a78bfa', emoji: '👑' },
];

function getLevel(score) {
  const s = score || 0;
  const tier = LEVELS.find(l => s >= l.min && s <= l.max) || LEVELS[LEVELS.length - 1];
  const next = LEVELS.find(l => l.level === tier.level + 1);
  const progress = next ? Math.min(100, Math.round((s - tier.min) / (next.min - tier.min) * 100)) : 100;
  return { ...tier, next_min: next?.min ?? null, progress };
}

// ── Componente: barra de progreso de score ────────────────
const ScoreBar = ({ label, icon: Icon, score, color, dimension }) => {
  const lvl = getLevel(score);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '22' }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <span className="text-white font-medium text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color }}>{lvl.emoji} {lvl.name}</span>
          <span className="text-gray-400 text-xs font-mono">{score} pts</span>
        </div>
      </div>
      <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${lvl.progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Nivel {lvl.level}</span>
        {lvl.next_min && <span>{lvl.next_min - score} pts para Nivel {lvl.level + 1}</span>}
        {!lvl.next_min && <span>¡Nivel máximo!</span>}
      </div>
    </div>
  );
};

// ── Componente: evento reciente ───────────────────────────
const EventBadge = ({ event }) => {
  const dimColors = { social: '#60a5fa', gamer: '#34d399', knowledge: '#f59e0b' };
  const color = dimColors[event.dimension] || '#94a3b8';
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
      <span className="text-gray-300 text-xs">{event.label || event.action_type.replace(/_/g, ' ')}</span>
      <span className="text-xs font-bold font-mono" style={{ color }}>+{event.points}</span>
    </div>
  );
};

// ── Sección Reputación ────────────────────────────────────
const ReputationSection = ({ userId, username }) => {
  const [repData, setRepData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    api.profile.reputation(userId)
      .then(d => { setRepData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-indigo-500" />
    </div>
  );

  if (!repData) return (
    <p className="text-gray-500 text-sm text-center py-4">No se pudo cargar la reputación</p>
  );

  const { scores, levels, recent_events } = repData;
  const totalLvl = getLevel(scores.total);

  return (
    <div className="space-y-6">
      {/* Total badge */}
      <div className="flex items-center gap-4 p-4 rounded-xl border"
        style={{ background: totalLvl.color + '11', borderColor: totalLvl.color + '44' }}>
        <div className="text-4xl">{totalLvl.emoji}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg">{totalLvl.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: totalLvl.color + '33', color: totalLvl.color }}>
              Nivel {totalLvl.level}
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-0.5">
            {scores.total} puntos de reputación total
          </p>
          {totalLvl.next_min && (
            <p className="text-xs mt-1" style={{ color: totalLvl.color }}>
              {totalLvl.next_min - scores.total} pts para {LEVELS.find(l => l.level === totalLvl.level + 1)?.name}
            </p>
          )}
        </div>
      </div>

      {/* 3 dimensiones */}
      <div className="space-y-5">
        <ScoreBar
          label="Social"
          icon={Users}
          score={scores.social}
          color="#60a5fa"
          dimension="social"
        />
        <ScoreBar
          label="Gaming"
          icon={Gamepad2}
          score={scores.gamer}
          color="#34d399"
          dimension="gamer"
        />
        <ScoreBar
          label="Conocimiento"
          icon={Star}
          score={scores.knowledge}
          color="#f59e0b"
          dimension="knowledge"
        />
      </div>

      {/* Cómo ganar puntos */}
      <div className="p-4 rounded-xl bg-slate-800/40 border border-white/5">
        <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" /> Cómo ganar puntos
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <span>💬 Enviar mensaje → +1 social</span>
          <span>🏘️ Unirse a comunidad → +5 social</span>
          <span>🏗️ Crear comunidad → +15 social</span>
          <span>📢 Crear canal → +10 social</span>
          <span>🎮 Jugar partida → +2 gaming</span>
          <span>🏆 Nuevo récord → +10 gaming</span>
          <span>📝 Crear post → +3 conocimiento</span>
          <span>⭐ Dar reacción → +1 conocimiento</span>
        </div>
      </div>

      {/* Últimos eventos */}
      {recent_events?.length > 0 && (
        <div>
          <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Actividad reciente
          </h4>
          <div className="bg-slate-800/40 rounded-xl p-3">
            {recent_events.map((ev, i) => <EventBadge key={i} event={ev} />)}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Tabs de la página ─────────────────────────────────────
const TABS = [
  { id: 'profile',    label: 'Perfil',       icon: User },
  { id: 'reputation', label: 'Reputación',   icon: Trophy },
  { id: 'security',   label: 'Seguridad',    icon: Lock },
  { id: 'appearance', label: 'Apariencia',   icon: Palette },
  { id: 'notifications', label: 'Notifs',    icon: Bell },
];

// ── Página principal ──────────────────────────────────────
const Profile = () => {
  const { user, signOut, updateUserPassword } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    display_name: '', bio: '', avatar_url: '', username: ''
  });
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [savingPass, setSavingPass] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    setProfile({
      display_name: user.display_name || user.username || '',
      username: user.username || '',
      bio: user.bio || '',
      avatar_url: user.avatar_url || '',
    });
    setLoading(false);
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.profile.update({
        display_name: profile.display_name.trim(),
        bio: profile.bio.trim(),
        avatar_url: profile.avatar_url,
        banner_url: null,
      });
      toast({ title: 'Perfil guardado' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
    setSaving(false);
  };

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Error', description: 'Imagen menor a 2MB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setProfile(prev => ({ ...prev, avatar_url: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async () => {
    if (passwords.new.length < 6) {
      toast({ variant: 'destructive', title: 'Error', description: 'Mínimo 6 caracteres' });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({ variant: 'destructive', title: 'Error', description: 'Las contraseñas no coinciden' });
      return;
    }
    setSavingPass(true);
    const { error } = await updateUserPassword(passwords.new);
    setSavingPass(false);
    if (!error) { setPasswords({ new: '', confirm: '' }); toast({ title: 'Contraseña actualizada' }); }
  };

  const avatarSrc = profile.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username || user?.email}`;

  if (loading || !user) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-blue-500" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <Helmet><title>Perfil - Fusion Core</title></Helmet>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header del perfil */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-2xl p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="flex flex-col items-center gap-2">
              <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                <img src={avatarSrc} alt="avatar"
                  className="w-24 h-24 rounded-full border-4 border-indigo-500 object-cover shadow-lg shadow-indigo-900/30" />
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-7 h-7 text-white" />
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              <p className="text-gray-500 text-xs">Click para cambiar</p>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-white">
                {profile.display_name || profile.username || 'Sin nombre'}
              </h1>
              <p className="text-gray-400 text-sm mt-1">{profile.bio || 'Sin bio aún'}</p>
              <p className="text-gray-500 text-xs mt-1">@{profile.username}</p>

              {/* Scores resumen rápido */}
              <div className="flex gap-3 mt-3 flex-wrap justify-center md:justify-start">
                {[
                  { label: 'Social', score: user.social_score || 0, color: '#60a5fa' },
                  { label: 'Gamer',  score: user.gamer_score  || 0, color: '#34d399' },
                  { label: 'Saber',  score: user.knowledge_score || 0, color: '#f59e0b' },
                ].map(s => {
                  const lvl = getLevel(s.score);
                  return (
                    <div key={s.label} className="text-center px-3 py-1 rounded-lg"
                      style={{ background: s.color + '15', border: `1px solid ${s.color}33` }}>
                      <p className="text-xs font-bold" style={{ color: s.color }}>{lvl.emoji} {lvl.name}</p>
                      <p className="text-gray-500 text-xs">{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button onClick={signOut} variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 flex-shrink-0">
              <LogOut className="w-4 h-4 mr-2" /> Salir
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all
                ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido del tab */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-2xl p-6">

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Editar Perfil</h2>

              {/* Avatares predefinidos */}
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Avatar</label>
                <div className="grid grid-cols-10 gap-2 mb-4">
                  {["adventurer","avataaars","big-ears","bottts","croodles","fun-emoji","icons",
                    "identicon","micah","miniavs","notionists","open-peeps","personas",
                    "pixel-art","rings","shapes","thumbs","big-smile","lorelei","initials"
                  ].map((style) => {
                    const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${profile.username || 'user'}`;
                    return (
                      <img key={style} src={url} alt={style}
                        onClick={() => setProfile(prev => ({ ...prev, avatar_url: url }))}
                        className={`w-10 h-10 rounded-full cursor-pointer hover:scale-110 transition-transform border-2
                          ${profile.avatar_url === url ? 'border-indigo-500' : 'border-transparent'}`} />
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Nombre visible</label>
                <Input value={profile.display_name}
                  onChange={e => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Tu nombre..." maxLength={50}
                  className="bg-slate-800 border-slate-600 text-white focus-visible:ring-indigo-500" />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Bio</label>
                <textarea value={profile.bio}
                  onChange={e => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Cuéntanos algo de ti..." maxLength={150} rows={3}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm" />
                <p className="text-gray-500 text-xs text-right">{profile.bio.length}/150</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Email</label>
                <Input value={user?.email || ''} disabled
                  className="bg-slate-900 border-slate-700 text-gray-500 cursor-not-allowed" />
              </div>
              <Button onClick={handleSave} disabled={saving}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          )}

          {activeTab === 'reputation' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" /> Reputación e Identidad
              </h2>
              <ReputationSection userId={user?.id} username={user?.username} />
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Seguridad</h2>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Nueva contraseña</label>
                <Input type="password" value={passwords.new}
                  onChange={e => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                  placeholder="Mínimo 6 caracteres..."
                  className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Confirmar</label>
                <Input type="password" value={passwords.confirm}
                  onChange={e => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                  placeholder="Repite la contraseña..."
                  className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <Button onClick={handleChangePassword} disabled={savingPass}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold">
                <Lock className="w-4 h-4 mr-2" />
                {savingPass ? 'Actualizando...' : 'Cambiar Contraseña'}
              </Button>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Apariencia</h2>
              <div>
                <p className="text-sm text-gray-400 mb-3">Color de acento</p>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { name: 'Índigo', color: '#6366f1' }, { name: 'Cyan', color: '#06b6d4' },
                    { name: 'Verde', color: '#22c55e' },  { name: 'Rosa', color: '#ec4899' },
                    { name: 'Naranja', color: '#f97316' },{ name: 'Violeta', color: '#a78bfa' },
                  ].map(a => (
                    <button key={a.color}
                      onClick={() => { document.documentElement.style.setProperty('--accent', a.color); toast({ title: `Tema ${a.name}` }); }}
                      className="w-10 h-10 rounded-full cursor-pointer hover:scale-110 transition-transform ring-2 ring-white/10 hover:ring-white/40"
                      style={{ background: a.color }} title={a.name} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Notificaciones</h2>
              {[
                { id: 'msgs', label: 'Mensajes', desc: 'Nuevos mensajes en canales', def: true },
                { id: 'rep',  label: 'Reputación', desc: 'Cuando ganes puntos', def: true },
                { id: 'lvl',  label: 'Nivel nuevo', desc: 'Al subir de nivel', def: true },
              ].map(n => (
                <div key={n.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-white/5">
                  <div>
                    <p className="text-white font-medium">{n.label}</p>
                    <p className="text-gray-500 text-sm">{n.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={n.def} className="sr-only peer"
                      onChange={e => localStorage.setItem(`notif-${n.id}`, e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                  </label>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Profile;
