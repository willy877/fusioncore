import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Gamepad2, MessageSquare, Trophy, Sparkles, Users, Zap, ChevronRight, Github, Twitter, Instagram } from "lucide-react";
import { supabase } from "@/supabaseClient";

const FEATURES = [
  { icon: Gamepad2, title: "Zona Gamer", desc: "Snake, Tetris y más juegos competitivos con leaderboard en tiempo real.", color: "#3b82f6" },
  { icon: MessageSquare, title: "Chat Social", desc: "Mensajes directos, grupos y comunidades. Todo en un solo lugar.", color: "#8b5cf6" },
  { icon: Sparkles, title: "Nova IA", desc: "Tu asistente inteligente powered by Llama 3.3. Siempre disponible.", color: "#ec4899" },
  { icon: Trophy, title: "Rankings", desc: "Compite globalmente. Sube al top y demuestra quién es el mejor.", color: "#f59e0b" },
  { icon: Users, title: "Amigos", desc: "Conecta, agrega amigos y juega junto a ellos en tiempo real.", color: "#10b981" },
  { icon: Zap, title: "Tiempo Real", desc: "Todo sincronizado al instante. Sin recargas, sin esperas.", color: "#06b6d4" },
];

const GAMES = [
  { name: "Snake", emoji: "🐍", desc: "Clásico competitivo con modos y velocidades", color: "from-green-500/20 to-emerald-500/20", border: "border-green-500/30" },
  { name: "Tetris", emoji: "🟦", desc: "Ghost piece, preview y niveles progresivos", color: "from-cyan-500/20 to-blue-500/20", border: "border-cyan-500/30" },
  { name: "Reacción", emoji: "⚡", desc: "Pon a prueba tus reflejos al límite", color: "from-yellow-500/20 to-orange-500/20", border: "border-yellow-500/30" },
];

const Particles = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv.getContext("2d");
    let W = cv.width = window.innerWidth;
    let H = cv.height = window.innerHeight;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5, a: Math.random() * 0.4 + 0.1,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.a})`;
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
};

const PublicLeaderboard = () => {
  const [scores, setScores] = useState([]);
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("scores")
        .select("*, profiles(username, avatar_url)")
        .order("score", { ascending: false }).limit(10);
      if (data) {
        const grouped = {};
        data.forEach(s => {
          const u = s.profiles?.username || "Jugador";
          if (!grouped[u] || s.score > grouped[u].score)
            grouped[u] = { ...s, username: u, avatar: s.profiles?.avatar_url };
        });
        setScores(Object.values(grouped).sort((a, b) => b.score - a.score).slice(0, 5));
      }
    };
    fetch();
  }, []);
  const medals = ["🥇","🥈","🥉","4","5"];
  return (
    <div className="space-y-2">
      {scores.length === 0 ? (
        <p className="text-center text-gray-500 py-4 text-sm">Sé el primero en el ranking</p>
      ) : scores.map((s, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <span className="text-lg w-6 text-center">{medals[i]}</span>
          <img src={s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.username}`} className="w-8 h-8 rounded-full" alt="" />
          <span className="flex-1 text-white font-medium text-sm">{s.username}</span>
          <span className="font-mono font-bold text-yellow-400 text-sm">{s.score} pts</span>
        </div>
      ))}
    </div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden" style={{ fontFamily: "DM Sans, sans-serif" }}>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap");
        .font-display { font-family: "Syne", sans-serif; }
        .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.07); }
        .glow-blue { box-shadow: 0 0 40px rgba(59,130,246,0.15); }
        .text-gradient { background: linear-gradient(135deg,#fff 0%,#94a3b8 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .text-gradient-blue { background: linear-gradient(135deg,#3b82f6,#8b5cf6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
      `}</style>
      <Particles />

      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5" style={{ background: "rgba(8,12,20,0.85)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Gamepad2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white">Fusion Core</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/login")} className="text-gray-400 hover:text-white text-sm transition-colors px-4 py-2">Iniciar sesión</button>
          <button onClick={() => navigate("/login")} className="bg-white text-black text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-all hover:scale-105">Comenzar gratis</button>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20" style={{ zIndex: 1 }}>
        <div className="text-center max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              PLATAFORMA DE GAMING Y RED SOCIAL
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
              <span className="text-gradient">Juega. Conecta.</span><br />
              <span className="text-gradient-blue">Domina.</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              La plataforma todo-en-uno para gamers. Compite, chatea con amigos, sube al leaderboard y habla con Nova IA.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate("/login")} className="group flex items-center justify-center gap-2 bg-white text-black font-medium px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-all hover:scale-105 text-sm">
                Crear cuenta gratis <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => navigate("/login")} className="flex items-center justify-center gap-2 glass text-white font-medium px-8 py-3.5 rounded-xl text-sm hover:bg-white/8 transition-all">
                Ver demo
              </button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-8 mt-16">
            {[{n:"3+",l:"Juegos"},{n:"∞",l:"Usuarios"},{n:"IA",l:"Nova asistente"},{n:"24/7",l:"En línea"}].map((s,i) => (
              <div key={i} className="text-center">
                <p className="font-display text-3xl font-bold text-white">{s.n}</p>
                <p className="text-gray-500 text-xs mt-1 uppercase tracking-wide">{s.l}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative py-24 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-blue-400 text-xs tracking-widest uppercase mb-3">CARACTERÍSTICAS</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gradient mb-4">Todo lo que necesitas</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Una plataforma completa pensada para la comunidad gamer.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="glass rounded-2xl p-6 hover:bg-white/6 transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: f.color+"20", border: "1px solid "+f.color+"30" }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-purple-400 text-xs tracking-widest uppercase mb-3">JUEGOS</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gradient mb-4">Zona Gamer</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Compite, supera tus records y sube al leaderboard global.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {GAMES.map((g, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={"glass rounded-2xl p-8 text-center bg-gradient-to-br "+g.color+" border "+g.border+" hover:scale-105 transition-all cursor-pointer group"}
                onClick={() => navigate("/login")}>
                <div className="text-6xl mb-4">{g.emoji}</div>
                <h3 className="font-display text-xl font-bold text-white mb-2">{g.name}</h3>
                <p className="text-gray-400 text-sm">{g.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-xs text-gray-500 group-hover:text-white transition-colors">
                  Jugar ahora <ChevronRight className="w-3 h-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-yellow-400 text-xs tracking-widest uppercase mb-3">RANKING</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gradient mb-4">Top Jugadores</h2>
            <p className="text-gray-500">Los mejores de la plataforma. ¿Puedes superarlos?</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-6 glow-blue">
            <PublicLeaderboard />
            <button onClick={() => navigate("/login")} className="w-full mt-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm transition-all">
              Ver ranking completo →
            </button>
          </motion.div>
        </div>
      </section>

      <section className="relative py-24 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="glass rounded-3xl p-12 border border-blue-500/20" style={{ background: "linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.08))" }}>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">¿Listo para jugar?</h2>
            <p className="text-gray-400 mb-8 text-lg">Únete gratis. Sin tarjeta de crédito.</p>
            <button onClick={() => navigate("/login")} className="group inline-flex items-center gap-2 bg-white text-black font-medium px-10 py-4 rounded-xl hover:bg-gray-100 transition-all hover:scale-105">
              Empezar ahora <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      <footer className="relative border-t border-white/5 py-12 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Gamepad2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-white">Fusion Core</span>
            <span className="text-gray-600 text-sm ml-2">© 2026</span>
          </div>
          <p className="text-gray-600 text-sm">Plataforma gaming · Infomatrix Nacional 2026</p>
          <div className="flex items-center gap-4">
            {[Twitter, Instagram, Github].map((Icon, i) => (
              <button key={i} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-gray-500 hover:text-white transition-colors">
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;