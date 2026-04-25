import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import SnakeGame from '@/components/SnakeGame';
import TetrisGame from '@/components/TetrisGame';

const ReactionGame = ({ onGameEnd }) => {
  const [state, setState] = useState('idle');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [results, setResults] = useState([]);
  const totalRounds = 5;

  useEffect(() => {
    if (state !== 'waiting') return;
    const delay = 1500 + Math.random() * 3000;
    const t = setTimeout(() => { setState('ready'); setStartTime(Date.now()); }, delay);
    return () => clearTimeout(t);
  }, [state, round]);

  const handleClick = () => {
    if (state === 'ready') {
      const reaction = Date.now() - startTime;
      const pts = Math.max(0, Math.floor(1000 - reaction));
      setResults(p => [...p, reaction]);
      const newScore = score + pts;
      setScore(newScore);
      if (round + 1 >= totalRounds) { setState('finished'); onGameEnd(newScore); }
      else { setRound(p => p + 1); setState('waiting'); }
    } else if (state === 'waiting') {
      setState('toosoon');
      setTimeout(() => setState('waiting'), 1000);
    }
  };

  const reset = () => { setState('idle'); setScore(0); setRound(0); setResults([]); };

  if (state === 'finished') return (
    <div className="text-center py-8 space-y-4">
      <p className="text-5xl font-bold text-cyan-400">{score} pts</p>
      <p className="text-gray-400">Promedio: {Math.round(results.reduce((a,b)=>a+b,0)/results.length)}ms</p>
      <Button onClick={reset} className="bg-gradient-to-r from-cyan-500 to-blue-500">Jugar de nuevo</Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <span className="text-gray-400 font-mono">Ronda {round+1}/{totalRounds}</span>
        <span className="text-gray-400 font-mono">Score: <span className="text-cyan-400 font-bold">{score}</span></span>
      </div>
      {state === 'idle' ? (
        <div className="text-center py-8">
          <Button onClick={() => setState('waiting')} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-lg px-8 py-4">▶ Jugar</Button>
        </div>
      ) : (
        <button onClick={handleClick} className={`w-full h-48 rounded-2xl text-2xl font-bold transition-all border-2 ${
          state === 'waiting' ? 'bg-slate-700 border-slate-600 text-gray-400' :
          state === 'ready' ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 text-white scale-105 shadow-lg shadow-green-500/30' :
          'bg-gradient-to-br from-red-500 to-red-700 border-red-400 text-white'
        }`}>
          {state === 'waiting' ? '⏳ Espera...' : state === 'ready' ? '⚡ AHORA!' : '❌ Muy rapido'}
        </button>
      )}
    </div>
  );
};

const Leaderboard = ({ gameFilter }) => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let q = supabase.from('scores').select('*, profiles(username, avatar_url)').order('score', { ascending: false }).limit(10);
      if (gameFilter && gameFilter !== 'Global') q = q.eq('game', gameFilter);
      const { data } = await q;
      if (gameFilter === 'Global') {
        const grouped = {};
        (data || []).forEach(s => {
          const u = s.profiles?.username || 'Jugador';
          grouped[u] = (grouped[u] || 0) + s.score;
        });
        const sorted = Object.entries(grouped).sort((a,b) => b[1]-a[1]).slice(0,10);
        setScores(sorted.map(([username, total]) => ({ username, total })));
      } else {
        setScores(data || []);
      }
      setLoading(false);
    };
    fetch();
    const sub = supabase.channel('scores-lb').on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, fetch).subscribe();
    return () => supabase.removeChannel(sub);
  }, [gameFilter]);

  const medals = ['🥇','🥈','🥉'];
  if (loading) return <div className="text-center text-gray-400 py-8">Cargando...</div>;
  if (scores.length === 0) return <div className="text-center text-gray-400 py-8">Sin puntuaciones aun. Se el primero!</div>;

  return (
    <div className="space-y-2">
      {scores.map((s, i) => (
        <div key={i} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
          <span className="text-xl w-8 text-center">{medals[i] || `#${i+1}`}</span>
          {!s.username && <img src={s.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.profiles?.username}`} className="w-8 h-8 rounded-full" alt="" />}
          <span className="flex-1 font-semibold text-white">{s.username || s.profiles?.username || 'Jugador'}</span>
          <span className="font-mono font-bold text-yellow-400">{s.total || s.score} pts</span>
          {s.game && <span className="text-xs text-gray-500 font-mono">{s.game}</span>}
        </div>
      ))}
    </div>
  );
};

const GAMES = [
  { id: 'reaction', title: 'Reaccion Rapida', icon: '⚡', color: 'from-cyan-500 to-blue-600', desc: 'Pon a prueba tus reflejos' },
  { id: 'snake', title: 'Snake', icon: '🐍', color: 'from-green-500 to-emerald-600', desc: 'Clasico competitivo' },
  { id: 'tetris', title: 'Tetris', icon: '🟦', color: 'from-purple-500 to-pink-600', desc: 'Encaja las piezas' },
];

const LB_TABS = ['Global', 'Reaccion', 'Snake', 'Tetris'];

const Gaming = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeGame, setActiveGame] = useState(null);
  const [activeTab, setActiveTab] = useState('games');
  const [lbTab, setLbTab] = useState('Global');

  const saveScore = async (game, score) => {
    if (!user || score <= 0) return;
    await supabase.from('scores').insert({ user_id: user.id, game, score });
    toast({ title: '🏆 Score guardado!', description: `${score} puntos en ${game}` });
  };

  return (
    <Layout>
      <Helmet><title>Gaming - Fusion Core</title></Helmet>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold gradient-text mb-2">Zona Gamer</h1>
          <p className="text-gray-400">Juega, compite y domina el leaderboard.</p>
        </motion.div>

        <div className="flex gap-2">
          {['games','leaderboard'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setActiveGame(null); }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab===tab ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}>
              {tab === 'games' ? '🎮 Juegos' : '🏆 Leaderboard'}
            </button>
          ))}
        </div>

        {activeTab === 'games' && !activeGame && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GAMES.map(game => (
              <motion.div key={game.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setActiveGame(game.id)}
                className="glass-effect p-6 rounded-xl cursor-pointer border-2 border-transparent hover:border-blue-400 transition-all">
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${game.color} mb-4 text-3xl`}>{game.icon}</div>
                <h3 className="text-xl font-bold text-white mb-1">{game.title}</h3>
                <p className="text-gray-400 text-sm">{game.desc}</p>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'games' && activeGame && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-effect rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{GAMES.find(g=>g.id===activeGame)?.title}</h2>
              <Button variant="outline" onClick={() => setActiveGame(null)} className="border-slate-600 text-gray-400">
                <RotateCcw className="w-4 h-4 mr-2" /> Volver
              </Button>
            </div>
            {activeGame === 'reaction' && <ReactionGame onGameEnd={(s) => saveScore('Reaccion', s)} />}
            {activeGame === 'snake' && <SnakeGame onGameEnd={(s) => saveScore('Snake', s)} />}
            {activeGame === 'tetris' && <TetrisGame onGameEnd={(s) => saveScore('Tetris', s)} />}
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-effect rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Trophy className="text-yellow-400" /> Rankings</h2>
            <div className="flex gap-2 mb-6 flex-wrap">
              {LB_TABS.map(t => (
                <button key={t} onClick={() => setLbTab(t)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${lbTab===t ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}>
                  {t === 'Global' ? '🌍 Global' : t}
                </button>
              ))}
            </div>
            <Leaderboard gameFilter={lbTab} />
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Gaming;