import React, { useState, useEffect, useCallback, useRef } from 'react';

const BOARD_W = 10;
const BOARD_H = 20;
const EMPTY = 0;
const PIECES = [
  { shape: [[1,1,1,1]], color: '#06b6d4' },
  { shape: [[1,1],[1,1]], color: '#eab308' },
  { shape: [[0,1,0],[1,1,1]], color: '#8b5cf6' },
  { shape: [[1,0,0],[1,1,1]], color: '#f97316' },
  { shape: [[0,0,1],[1,1,1]], color: '#3b82f6' },
  { shape: [[1,1,0],[0,1,1]], color: '#22c55e' },
  { shape: [[0,1,1],[1,1,0]], color: '#ef4444' },
];
const emptyBoard = () => Array.from({length:BOARD_H}, () => Array(BOARD_W).fill(EMPTY));
const rotate = (shape) => shape[0].map((_,i) => shape.map(r => r[i]).reverse());

const TetrisGame = ({ onGameEnd }) => {
  const [board, setBoard] = useState(emptyBoard());
  const [piece, setPiece] = useState(null);
  const [pos, setPos] = useState({x:0,y:0});
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [dead, setDead] = useState(false);
  const [level, setLevel] = useState(1);
  const st = useRef({board:emptyBoard(),piece:null,pos:{x:0,y:0},score:0,level:1});

  const randPiece = () => PIECES[Math.floor(Math.random()*PIECES.length)];

  const isValid = (b,p,px,py) => {
    for(let y=0;y<p.shape.length;y++)
      for(let x=0;x<p.shape[y].length;x++)
        if(p.shape[y][x]){
          const nx=px+x,ny=py+y;
          if(nx<0||nx>=BOARD_W||ny>=BOARD_H) return false;
          if(ny>=0&&b[ny][nx]!==EMPTY) return false;
        }
    return true;
  };

  const place = useCallback((b,p,px,py) => {
    const nb=b.map(r=>[...r]);
    for(let y=0;y<p.shape.length;y++)
      for(let x=0;x<p.shape[y].length;x++)
        if(p.shape[y][x]&&py+y>=0) nb[py+y][px+x]=p.color;
    return nb;
  },[]);

  const clearLines = useCallback((b) => {
    const kept=b.filter(r=>r.some(c=>c===EMPTY));
    const n=BOARD_H-kept.length;
    const pts=[0,100,300,500,800][n]||0;
    return {nb:[...Array.from({length:n},()=>Array(BOARD_W).fill(EMPTY)),...kept],pts};
  },[]);

  const spawn = useCallback((b) => {
    const p=randPiece();
    const px=Math.floor(BOARD_W/2)-Math.floor(p.shape[0].length/2);
    if(!isValid(b,p,px,0)){setRunning(false);setDead(true);onGameEnd(st.current.score);return;}
    st.current.piece=p; st.current.pos={x:px,y:0};
    setPiece(p); setPos({x:px,y:0});
  },[onGameEnd]);

  const start = () => {
    const b=emptyBoard();
    st.current={board:b,piece:null,pos:{x:0,y:0},score:0,level:1};
    setBoard(b);setScore(0);setLevel(1);setDead(false);setRunning(true);
    spawn(b);
  };

  useEffect(()=>{
    if(!running) return;
    const spd=Math.max(100,600-(st.current.level-1)*50);
    const iv=setInterval(()=>{
      const {board:b,piece:p,pos:ps}=st.current;
      if(!p) return;
      const ny=ps.y+1;
      if(isValid(b,p,ps.x,ny)){
        st.current.pos={...ps,y:ny}; setPos({...ps,y:ny});
      } else {
        const nb=place(b,p,ps.x,ps.y);
        const {nb:cl,pts}=clearLines(nb);
        const ns=st.current.score+pts+10;
        const nl=Math.floor(ns/500)+1;
        st.current.board=cl;st.current.score=ns;st.current.level=nl;
        setBoard(cl);setScore(ns);setLevel(nl);
        spawn(cl);
      }
    },spd);
    return ()=>clearInterval(iv);
  },[running,spawn,place,clearLines]);

  useEffect(()=>{
    if(!running) return;
    const onKey=(e)=>{
      const {board:b,piece:p,pos:ps}=st.current;
      if(!p) return;
      if(e.key==='ArrowLeft'&&isValid(b,p,ps.x-1,ps.y)){st.current.pos={...ps,x:ps.x-1};setPos({...ps,x:ps.x-1});}
      if(e.key==='ArrowRight'&&isValid(b,p,ps.x+1,ps.y)){st.current.pos={...ps,x:ps.x+1};setPos({...ps,x:ps.x+1});}
      if(e.key==='ArrowDown'&&isValid(b,p,ps.x,ps.y+1)){st.current.pos={...ps,y:ps.y+1};setPos({...ps,y:ps.y+1});}
      if(e.key==='ArrowUp'){const r={...p,shape:rotate(p.shape)};if(isValid(b,r,ps.x,ps.y)){st.current.piece=r;setPiece(r);}}
      if(e.key===' '){
        let ny=ps.y;
        while(isValid(b,p,ps.x,ny+1))ny++;
        const nb=place(b,p,ps.x,ny);
        const {nb:cl,pts}=clearLines(nb);
        const ns=st.current.score+pts+10;
        st.current.board=cl;st.current.score=ns;
        setBoard(cl);setScore(ns);spawn(cl);
      }
      e.preventDefault();
    };
    window.addEventListener('keydown',onKey);
    return ()=>window.removeEventListener('keydown',onKey);
  },[running,place,clearLines,spawn]);

  const cs=28;
  const disp=piece?place(board,piece,pos.x,pos.y):board;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-8 text-center">
        <div><p className="text-gray-400 text-xs font-mono">SCORE</p><p className="text-yellow-400 font-bold text-xl font-mono">{score}</p></div>
        <div><p className="text-gray-400 text-xs font-mono">NIVEL</p><p className="text-cyan-400 font-bold text-xl font-mono">{level}</p></div>
      </div>
      <div className="relative border-2 border-slate-600 rounded-lg overflow-hidden bg-slate-900"
        style={{width:BOARD_W*cs,height:BOARD_H*cs}}>
        {disp.map((row,y)=>row.map((cell,x)=>cell!==EMPTY&&(
          <div key={`${x}-${y}`} className="absolute border border-black/20 rounded-sm"
            style={{left:x*cs,top:y*cs,width:cs,height:cs,background:cell}}/>
        )))}
        {!running&&!dead&&(
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
            <p className="text-white font-bold text-2xl font-mono">TETRIS</p>
            <button onClick={start} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-lg">Jugar</button>
          </div>
        )}
        {dead&&(
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
            <p className="text-red-400 font-bold text-2xl">Game Over</p>
            <p className="text-white font-mono text-xl">{score} pts</p>
            <button onClick={start} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl">Reintentar</button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div/>
        <button onClick={()=>{const{piece:p,pos:ps,board:b}=st.current;if(!p)return;const r={...p,shape:rotate(p.shape)};if(isValid(b,r,ps.x,ps.y)){st.current.piece=r;setPiece(r);}}} className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xl">↻</button>
        <div/>
        <button onClick={()=>{const{piece:p,pos:ps,board:b}=st.current;if(!p||!isValid(b,p,ps.x-1,ps.y))return;st.current.pos={...ps,x:ps.x-1};setPos({...ps,x:ps.x-1});}} className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xl">←</button>
        <button onClick={()=>{const{piece:p,pos:ps,board:b}=st.current;if(!p||!isValid(b,p,ps.x,ps.y+1))return;st.current.pos={...ps,y:ps.y+1};setPos({...ps,y:ps.y+1});}} className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xl">↓</button>
        <button onClick={()=>{const{piece:p,pos:ps,board:b}=st.current;if(!p||!isValid(b,p,ps.x+1,ps.y))return;st.current.pos={...ps,x:ps.x+1};setPos({...ps,x:ps.x+1});}} className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xl">→</button>
      </div>
      <p className="text-gray-500 text-xs">Flechas: mover · Arriba/Rotate: rotar · Espacio: caida rapida</p>
    </div>
  );
};

export default TetrisGame;