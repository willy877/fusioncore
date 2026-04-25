import React, { useEffect, useRef, useState, useCallback } from 'react';

const W=24,H=24,CS=20;

const SPEEDS = {
  'Lento':    220,
  'Normal':   150,
  'Rapido':   90,
  'Extremo':  50,
};

const MODES = {
  'Clasico':  'classic',
  'Sin Muros':'portal',
  'Oscuro':   'dark',
};

const COLORS = {
  'Verde Neon': {head:'#22c55e',body:'#16a34a',glow:'#22c55e'},
  'Azul Cyber': {head:'#06b6d4',body:'#0891b2',glow:'#06b6d4'},
  'Morado':     {head:'#a855f7',body:'#7c3aed',glow:'#a855f7'},
  'Rojo Fuego': {head:'#ef4444',body:'#dc2626',glow:'#ef4444'},
};

const randFood=(snake)=>{
  let p;
  do{p={x:Math.floor(Math.random()*W),y:Math.floor(Math.random()*H)};}
  while(snake.some(s=>s.x===p.x&&s.y===p.y));
  return p;
};

const SnakeGame=({onGameEnd})=>{
  const cvRef=useRef(null);
  const st=useRef(null);
  const rafRef=useRef(null);
  const lastRef=useRef(0);
  const [screen,setScreen]=useState('menu');
  const [cfg,setCfg]=useState({speed:'Normal',mode:'Clasico',color:'Verde Neon'});
  const [uiScore,setUiScore]=useState(0);
  const [uiHs,setUiHs]=useState(()=>parseInt(localStorage.getItem('snk_hs')||'0'));
  const [newRec,setNewRec]=useState(false);
  const [tab,setTab]=useState('speed');

  const initState=useCallback(()=>{
    const snake=[{x:12,y:12},{x:11,y:12},{x:10,y:12},{x:9,y:12}];
    st.current={
      snake, dir:{x:1,y:0}, nextDir:{x:1,y:0},
      food:randFood(snake), score:0,
      particles:[], foodAnim:0, deathFlash:0,
      speed:SPEEDS[cfg.speed], mode:MODES[cfg.mode],
      color:COLORS[cfg.color], darkFoods:[]
    };
    if(MODES[cfg.mode]==='dark'){
      for(let i=0;i<6;i++) st.current.darkFoods.push(randFood(snake));
    }
  },[cfg]);

  const startGame=useCallback(()=>{
    initState();
    setUiScore(0);
    setNewRec(false);
    setScreen('game');
  },[initState]);

  const spawnParticles=(x,y,color)=>{
    for(let i=0;i<14;i++){
      st.current.particles.push({
        x:x*CS+CS/2,y:y*CS+CS/2,
        vx:(Math.random()-0.5)*6,vy:(Math.random()-0.5)*6,
        life:1,color,r:2+Math.random()*3
      });
    }
  };

  useEffect(()=>{
    if(screen!=='game') return;
    const onKey=(e)=>{
      if(!st.current) return;
      const map={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},
                 w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0}};
      const nd=map[e.key];
      if(nd){
        const cd=st.current.dir;
        if(nd.x!==-cd.x||nd.y!==-cd.y) st.current.nextDir=nd;
        e.preventDefault();
      }
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[screen]);

  useEffect(()=>{
    if(screen!=='game') return;
    const cv=cvRef.current;
    if(!cv) return;
    const ctx=cv.getContext('2d');

    const tick=(ts)=>{
      if(!st.current){rafRef.current=requestAnimationFrame(tick);return;}
      const s=st.current;
      s.foodAnim=(s.foodAnim||0)+0.05;

      // Update particles
      s.particles=s.particles.filter(p=>{
        p.x+=p.vx;p.y+=p.vy;p.vx*=0.92;p.vy*=0.92;p.life-=0.04;
        return p.life>0;
      });

      // Game tick
      if(ts-lastRef.current>s.speed){
        lastRef.current=ts;
        s.dir=s.nextDir;
        const head={x:s.snake[0].x+s.dir.x,y:s.snake[0].y+s.dir.y};

        if(s.mode==='portal'){
          head.x=(head.x+W)%W;
          head.y=(head.y+H)%H;
        } else if(s.mode==='classic'||s.mode==='dark'){
          if(head.x<0||head.x>=W||head.y<0||head.y>=H||s.snake.some(seg=>seg.x===head.x&&seg.y===head.y)){
            s.deathFlash=1;
            const final=s.score;
            const hs=parseInt(localStorage.getItem('snk_hs')||'0');
            if(final>hs){localStorage.setItem('snk_hs',final);setUiHs(final);setNewRec(true);}
            onGameEnd(final);
            setTimeout(()=>setScreen('dead'),400);
            return;
          }
        }

        const newSnake=[head,...s.snake];
        const ateNormal=head.x===s.food.x&&head.y===s.food.y;
        const darkIdx=s.darkFoods?.findIndex(f=>f.x===head.x&&f.y===head.y);
        const ateDark=darkIdx!==-undefined&&darkIdx>=0;

        if(ateNormal){
          s.score+=10+Math.floor(s.score/100)*5;
          spawnParticles(head.x,head.y,s.color.glow);
          s.food=randFood(newSnake);
          setUiScore(s.score);
        } else if(s.mode==='dark'&&ateDark){
          s.score+=25;
          spawnParticles(head.x,head.y,'#fbbf24');
          s.darkFoods.splice(darkIdx,1);
          s.darkFoods.push(randFood(newSnake));
          setUiScore(s.score);
        } else {
          newSnake.pop();
        }
        s.snake=newSnake;
      }

      // DRAW
      const isDark=s.mode==='dark';
      ctx.fillStyle=isDark?'#000':'#080d1a';
      ctx.fillRect(0,0,W*CS,H*CS);

      // Grid
      ctx.strokeStyle=isDark?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.04)';
      ctx.lineWidth=0.5;
      for(let i=0;i<=W;i++){ctx.beginPath();ctx.moveTo(i*CS,0);ctx.lineTo(i*CS,H*CS);ctx.stroke();}
      for(let i=0;i<=H;i++){ctx.beginPath();ctx.moveTo(0,i*CS);ctx.lineTo(W*CS,i*CS);ctx.stroke();}

      // Portal mode border effect
      if(s.mode==='portal'){
        const g=ctx.createLinearGradient(0,0,W*CS,0);
        g.addColorStop(0,'#a855f7');g.addColorStop(0.5,'#06b6d4');g.addColorStop(1,'#a855f7');
        ctx.strokeStyle=g;ctx.lineWidth=3;
        ctx.strokeRect(1,1,W*CS-2,H*CS-2);
      }

      // Dark mode bonus foods
      if(isDark){
        s.darkFoods.forEach(f=>{
          ctx.shadowColor='#fbbf24';ctx.shadowBlur=15;
          ctx.fillStyle='#fbbf24';
          ctx.beginPath();
          ctx.moveTo(f.x*CS+CS/2,f.y*CS+2);
          ctx.lineTo(f.x*CS+CS-2,f.y*CS+CS-2);
          ctx.lineTo(f.x*CS+2,f.y*CS+CS-2);
          ctx.closePath();ctx.fill();
          ctx.shadowBlur=0;
        });
      }

      // Food
      const fp=s.food;
      const pulse=(Math.sin(s.foodAnim*3)+1)/2;
      ctx.shadowColor='#ef4444';ctx.shadowBlur=10+pulse*15;
      ctx.fillStyle=`hsl(${0+pulse*20},100%,${55+pulse*10}%)`;
      ctx.beginPath();
      ctx.arc(fp.x*CS+CS/2,fp.y*CS+CS/2,CS/2-1+pulse*2,0,Math.PI*2);
      ctx.fill();
      ctx.shadowBlur=0;

      // Snake
      s.snake.forEach((seg,i)=>{
        const ratio=Math.max(0.3,1-(i/s.snake.length)*0.7);
        const isHead=i===0;
        ctx.shadowColor=isHead?s.color.glow:'transparent';
        ctx.shadowBlur=isHead?16:0;
        const grad=ctx.createLinearGradient(seg.x*CS,seg.y*CS,seg.x*CS+CS,seg.y*CS+CS);
        grad.addColorStop(0,isHead?s.color.head:s.color.body);
        grad.addColorStop(1,isHead?s.color.body:`hsl(${parseInt(s.color.body.slice(1),16)>>8&0xff},60%,${20*ratio}%)`);
        ctx.fillStyle=grad;
        const r=isHead?6:4;
        ctx.beginPath();
        ctx.roundRect(seg.x*CS+1,seg.y*CS+1,CS-2,CS-2,r);
        ctx.fill();
        if(isHead){
          ctx.fillStyle='rgba(255,255,255,0.9)';
          ctx.beginPath();ctx.arc(seg.x*CS+5,seg.y*CS+5,2.5,0,Math.PI*2);ctx.fill();
          ctx.beginPath();ctx.arc(seg.x*CS+CS-5,seg.y*CS+5,2.5,0,Math.PI*2);ctx.fill();
          ctx.fillStyle='#000';
          ctx.beginPath();ctx.arc(seg.x*CS+5,seg.y*CS+5,1,0,Math.PI*2);ctx.fill();
          ctx.beginPath();ctx.arc(seg.x*CS+CS-5,seg.y*CS+5,1,0,Math.PI*2);ctx.fill();
        }
      });
      ctx.shadowBlur=0;

      // Particles
      s.particles.forEach(p=>{
        ctx.globalAlpha=p.life;
        ctx.fillStyle=p.color;
        ctx.shadowColor=p.color;ctx.shadowBlur=6;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;
      });
      ctx.globalAlpha=1;

      // Score HUD
      ctx.fillStyle='rgba(0,0,0,0.5)';
      ctx.fillRect(4,4,120,30);
      ctx.fillStyle=s.color.glow;
      ctx.font='bold 14px monospace';
      ctx.fillText(`SCORE: ${s.score}`,10,24);

      rafRef.current=requestAnimationFrame(tick);
    };

    rafRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(rafRef.current);
  },[screen,onGameEnd]);

  if(screen==='menu') return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <div className="text-6xl mb-2">🐍</div>
        <h2 className="text-3xl font-bold text-white font-mono tracking-wider">SNAKE</h2>
        <p className="text-gray-400 text-sm mt-1">Elige tu modo y domina el tablero</p>
      </div>

      <div className="flex gap-2 bg-slate-800 rounded-xl p-1">
        {['speed','mode','color'].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab===t?'bg-blue-600 text-white':'text-gray-400 hover:text-white'}`}>
            {t==='speed'?'⚡ Velocidad':t==='mode'?'🎮 Modo':'🎨 Color'}
          </button>
        ))}
      </div>

      {tab==='speed'&&(
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {Object.keys(SPEEDS).map(s=>(
            <button key={s} onClick={()=>setCfg(c=>({...c,speed:s}))}
              className={`p-4 rounded-xl border-2 font-bold transition-all ${cfg.speed===s?'border-blue-500 bg-blue-500/20 text-white':'border-slate-600 bg-slate-800 text-gray-400 hover:border-slate-400'}`}>
              {s==='Lento'?'🐢':s==='Normal'?'🐍':s==='Rapido'?'⚡':'🔥'} {s}
            </button>
          ))}
        </div>
      )}

      {tab==='mode'&&(
        <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
          {Object.entries(MODES).map(([name,val])=>(
            <button key={name} onClick={()=>setCfg(c=>({...c,mode:name}))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${cfg.mode===name?'border-purple-500 bg-purple-500/20 text-white':'border-slate-600 bg-slate-800 text-gray-400 hover:border-slate-400'}`}>
              <span className="font-bold text-white">{name==='Clasico'?'🏆':name==='Sin Muros'?'🌀':'🌑'} {name}</span>
              <p className="text-xs text-gray-500 mt-1">{name==='Clasico'?'Muros = muerte. El original.':name==='Sin Muros'?'Atraviesa paredes, sal por el otro lado.':'Modo oscuro con comida bonus dorada.'}</p>
            </button>
          ))}
        </div>
      )}

      {tab==='color'&&(
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {Object.entries(COLORS).map(([name,val])=>(
            <button key={name} onClick={()=>setCfg(c=>({...c,color:name}))}
              className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${cfg.color===name?'border-white':'border-slate-600 bg-slate-800 hover:border-slate-400'}`}
              style={cfg.color===name?{borderColor:val.glow,background:`${val.glow}20`}:{}}>
              <div className="w-6 h-6 rounded-full" style={{background:val.head,boxShadow:`0 0 10px ${val.glow}`}}/>
              <span className={`font-medium ${cfg.color===name?'text-white':'text-gray-400'}`}>{name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="text-center">
        {uiHs>0&&<p className="text-gray-500 text-sm font-mono mb-3">🏆 Record: {uiHs} pts</p>}
        <button onClick={startGame}
          className="px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-2xl text-xl shadow-lg shadow-green-900/40 transition-all hover:scale-105 active:scale-95">
          ▶ JUGAR
        </button>
      </div>
    </div>
  );

  if(screen==='dead') return (
    <div className="flex flex-col items-center gap-4 py-8">
      {newRec&&<div className="text-yellow-400 font-bold text-2xl animate-bounce">🏆 NUEVO RECORD!</div>}
      <p className="text-red-400 font-bold text-4xl font-mono">GAME OVER</p>
      <p className="text-white font-mono text-3xl">{st.current?.score||uiScore} pts</p>
      <p className="text-gray-400 font-mono">Record: {uiHs} pts</p>
      <div className="flex gap-3 mt-4">
        <button onClick={startGame} className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl text-lg transition-all hover:scale-105">
          Reintentar
        </button>
        <button onClick={()=>{setScreen('menu');}} className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-lg transition-all hover:scale-105">
          Menu
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-between w-full max-w-md px-2">
        <div className="bg-slate-800 rounded-xl px-4 py-2 text-center">
          <p className="text-gray-400 text-xs font-mono">SCORE</p>
          <p className="text-yellow-400 font-bold text-2xl font-mono">{uiScore}</p>
        </div>
        <div className="bg-slate-800 rounded-xl px-4 py-2 text-center">
          <p className="text-gray-400 text-xs font-mono">MODO</p>
          <p className="text-cyan-400 font-bold text-sm font-mono">{cfg.mode}</p>
        </div>
        <div className="bg-slate-800 rounded-xl px-4 py-2 text-center">
          <p className="text-gray-400 text-xs font-mono">RECORD</p>
          <p className="text-purple-400 font-bold text-2xl font-mono">{uiHs}</p>
        </div>
      </div>

      <canvas ref={cvRef} width={W*CS} height={H*CS}
        className="rounded-xl border-2 border-slate-600 shadow-2xl"
        style={{imageRendering:'pixelated'}}/>

      <div className="grid grid-cols-3 gap-2 mt-1">
        <div/>
        <button onPointerDown={()=>{if(st.current?.dir.y!==1)st.current.nextDir={x:0,y:-1};}} className="w-12 h-12 bg-slate-700 active:bg-slate-500 rounded-xl text-white text-xl select-none">↑</button>
        <div/>
        <button onPointerDown={()=>{if(st.current?.dir.x!==1)st.current.nextDir={x:-1,y:0};}} className="w-12 h-12 bg-slate-700 active:bg-slate-500 rounded-xl text-white text-xl select-none">←</button>
        <button onPointerDown={()=>{if(st.current?.dir.y!==-1)st.current.nextDir={x:0,y:1};}} className="w-12 h-12 bg-slate-700 active:bg-slate-500 rounded-xl text-white text-xl select-none">↓</button>
        <button onPointerDown={()=>{if(st.current?.dir.x!==-1)st.current.nextDir={x:1,y:0};}} className="w-12 h-12 bg-slate-700 active:bg-slate-500 rounded-xl text-white text-xl select-none">→</button>
      </div>
      <p className="text-gray-500 text-xs">Flechas o WASD · <button onClick={()=>setScreen('menu')} className="text-blue-400 hover:underline">Cambiar modo</button></p>
    </div>
  );
};

export default SnakeGame;