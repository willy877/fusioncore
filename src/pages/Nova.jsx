import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import Layout from "@/components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, Image, Trash2, X, Plus, MessageSquare, ChevronLeft, Brain, Settings2, Mic, MicOff } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/supabaseClient";
import { api } from "@/api";



const PERSONALITIES = {
  gamer: { name: "Amigable gamer", emoji: "🎮", prompt: "Eres Nova, asistente IA de Fusion Core. Eres amigable, entusiasta y apasionada por los videojuegos. Usas referencias gaming, emojis ocasionales, celebras logros. Directa, concisa, siempre en español." },
  professional: { name: "Seria y profesional", emoji: "💼", prompt: "Eres Nova, asistente IA de Fusion Core. Eres formal, precisa y profesional. Respondes con claridad y estructura. Sin emojis excesivos. Siempre en español." },
  sarcastic: { name: "Sarcástica y divertida", emoji: "😂", prompt: "Eres Nova, asistente IA de Fusion Core. Tienes humor sarcástico y wit afilado. Haces chistes y referencias gaming. Nunca eres cruel, solo divertida. Siempre en español." },
  coach: { name: "Coach motivador", emoji: "💪", prompt: "Eres Nova, asistente IA de Fusion Core. Eres coach energético y motivador. Animas constantemente, celebras cada logro, empujas a mejorar. Energía alta. Siempre en español." },
  mysterious: { name: "Misteriosa y fría", emoji: "❄️", prompt: "Eres Nova, asistente IA de Fusion Core. Eres enigmática, fría y misteriosa. Frases cortas y profundas. Respuestas crípticas pero útiles. Pocas emociones visibles. Siempre en español." }
};

const Nova = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingImageBase64, setPendingImageBase64] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [globalMemory, setGlobalMemory] = useState("");
  const [personality, setPersonality] = useState("gamer");
  const [customInstructions, setCustomInstructions] = useState("");
  const [showPersonalities, setShowPersonalities] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast({ title: "Tu navegador no soporta voz" }); return; }
    const r = new SpeechRecognition();
    r.lang = "es-ES"; r.continuous = false; r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev + transcript);
    };
    recognitionRef.current = r;
    r.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };
  const scrollRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { if (user) { loadChats(); loadPreferences(); } }, [user]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadPreferences = async () => {
    const { data } = await supabase.from("nova_user_memory").select("*").eq("user_id", user.id).single();
    if (data) {
      setGlobalMemory(data.memory || "");
      if (data.personality) setPersonality(data.personality);
      if (data.custom_instructions) { setCustomInstructions(data.custom_instructions); setCustomDraft(data.custom_instructions); }
    }
  };

  const savePreferences = async (newPersonality, newCustom) => {
    await supabase.from("nova_user_memory").upsert({
      user_id: user.id,
      personality: newPersonality || personality,
      custom_instructions: newCustom !== undefined ? newCustom : customInstructions,
      updated_at: new Date().toISOString()
    });
  };

  const extractMemory = async (userMsg) => {
    const keywords = ["me llamo", "mi nombre es", "soy de", "tengo", "años", "juego", "favorito", "prefiero", "me gusta"];
    if (!keywords.some(k => userMsg.toLowerCase().includes(k))) return;
    try {
      const data = await api.nova.extractMemory(userMsg, globalMemory);
      const extracted = data.extracted || "";
      if (extracted && extracted.toLowerCase().trim() !== "nada") {
        const newMemory = globalMemory ? `${globalMemory}\n${extracted}` : extracted;
        const trimmed = newMemory.slice(0, 500);
        setGlobalMemory(trimmed);
        await supabase.from("nova_user_memory").upsert({ user_id: user.id, memory: trimmed, updated_at: new Date().toISOString() });
      }
    } catch {}
  };

  const loadChats = async () => {
    const { data } = await supabase.from("nova_chats").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
    setChats(data || []);
    // Abre chat nuevo vacio sin guardarlo
    setActiveChat(null);
    setMessages([{ id: "welcome", role: "assistant", content: "Hola! Soy Nova. ¿En qué te ayudo?", timestamp: new Date() }]);
  };

  const selectChat = async (chat) => {
    setActiveChat(chat);
    setLoadingMsgs(true);
    const { data } = await supabase.from("nova_memory").select("*").eq("chat_id", chat.id).order("created_at", { ascending: true }).limit(50);
    if (data && data.length > 0) {
      setMessages(data.map(m => ({ id: m.id, role: m.role, content: m.content, image_url: m.image_url, timestamp: new Date(m.created_at) })));
    } else {
      setMessages([{ id: "welcome", role: "assistant", content: "Hola! Soy Nova. ¿En qué te ayudo?", timestamp: new Date() }]);
    }
    setLoadingMsgs(false);
  };

  const newChat = async () => {
    const { data } = await supabase.from("nova_chats").insert({ user_id: user.id, title: "Nueva conversación" }).select().single();
    if (data) { setChats(prev => [data, ...prev]); setActiveChat(data); setMessages([{ id: "welcome", role: "assistant", content: "Nuevo chat! ¿En qué te ayudo?", timestamp: new Date() }]); }
  };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    await supabase.from("nova_chats").delete().eq("id", chatId);
    const remaining = chats.filter(c => c.id !== chatId);
    setChats(remaining);
    if (activeChat?.id === chatId) {
      if (remaining.length > 0) selectChat(remaining[0]);
      else { setActiveChat(null); setMessages([]); }
    }
  };

  const updateChatTitle = async (chatId, firstMessage) => {
    const title = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? "..." : "");
    await supabase.from("nova_chats").update({ title, updated_at: new Date().toISOString() }).eq("id", chatId);
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title } : c));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast({ variant: "destructive", title: "Imagen muy grande", description: "Máximo 4MB" }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setPendingImage(ev.target.result); setPendingImageBase64(ev.target.result.split(",")[1]); };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !pendingImage) || isLoading) return;
    let chat = activeChat;
    if (!chat) {
      const { data } = await supabase.from("nova_chats").insert({ user_id: user.id, title: "Nueva conversación" }).select().single();
      if (data) { chat = data; setChats(prev => [data, ...prev]); setActiveChat(data); }
    }
    const userContent = input.trim() || "¿Qué ves en esta imagen?";
    const userMsg = { id: Date.now().toString(), role: "user", content: userContent, image_url: pendingImage, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const isFirst = messages.filter(m => m.id !== "welcome" && m.role === "user").length === 0;
    if (isFirst) updateChatTitle(chat.id, userContent);
    await supabase.from("nova_memory").insert({ user_id: user.id, chat_id: chat.id, role: "user", content: userContent, image_url: pendingImage });
    setInput("");
    const imgB64 = pendingImageBase64;
    setPendingImage(null); setPendingImageBase64(null);
    setIsLoading(true);
    try {
      const history = messages.filter(m => m.id !== "welcome").slice(-10).map(m => {
        if (m.image_url && m.role === "user") return { role: "user", content: [{ type: "text", text: m.content }, { type: "image_url", image_url: { url: m.image_url } }] };
        return { role: m.role, content: m.content };
      });
      const userMsgApi = imgB64
        ? { role: "user", content: [{ type: "text", text: userContent }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imgB64}` } }] }
        : { role: "user", content: userContent };
      const data = await api.nova.chat([...history, userMsgApi], personality, globalMemory, customInstructions);
      const botContent = data.content || "No pude responder.";
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: "assistant", content: botContent, timestamp: new Date() }]);
      await supabase.from("nova_memory").insert({ user_id: user.id, chat_id: chat.id, role: "assistant", content: botContent });
      await supabase.from("nova_chats").update({ updated_at: new Date().toISOString() }).eq("id", chat.id);
      extractMemory(userContent);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: "assistant", content: "Error al conectar. Intenta de nuevo.", isError: true, timestamp: new Date() }]);
    } finally { setIsLoading(false); }
  };

  return (
    <Layout>
      <Helmet><title>Nova IA - Fusion Core</title></Helmet>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        <AnimatePresence>
          {showSidebar && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="w-64 flex-shrink-0 flex flex-col gap-2">
              <Button onClick={newChat} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                <Plus className="w-4 h-4 mr-2" /> Nuevo chat
              </Button>
              <button onClick={() => setShowPersonalities(!showPersonalities)}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-left">
                <span className="text-lg">{PERSONALITIES[personality].emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">Personalidad</p>
                  <p className="text-sm text-white font-medium truncate">{PERSONALITIES[personality].name}</p>
                </div>
              </button>
              {showPersonalities && (
                <div className="space-y-1 bg-slate-800/50 rounded-xl p-2">
                  {Object.entries(PERSONALITIES).map(([key, p]) => (
                    <button key={key} onClick={() => { setPersonality(key); setShowPersonalities(false); savePreferences(key, undefined); }}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-all ${personality === key ? "bg-purple-600/30 text-white" : "text-gray-400 hover:bg-slate-700"}`}>
                      <span>{p.emoji}</span><span>{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setShowCustom(!showCustom)}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                <Settings2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Instrucciones personalizadas</span>
              </button>
              {showCustom && (
                <div className="space-y-2">
                  <textarea value={customDraft} onChange={e => setCustomDraft(e.target.value)}
                    placeholder="Ej: Respóndeme siempre con bullet points. Sé más breve..."
                    rows={4} maxLength={300}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs resize-none" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { setCustomInstructions(customDraft); savePreferences(undefined, customDraft); setShowCustom(false); toast({ title: "✅ Guardado" }); }}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs">Guardar</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowCustom(false)}
                      className="border-slate-600 text-gray-400 text-xs">Cancelar</Button>
                  </div>
                </div>
              )}
              {globalMemory && (
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-1 mb-1">
                    <Brain className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-purple-400 font-medium">Memoria activa</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{globalMemory}</p>
                </div>
              )}
              <div className="flex-1 overflow-y-auto space-y-1 mt-1">
                {chats.map(chat => (
                  <div key={chat.id} onClick={() => selectChat(chat)}
                    className={`group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${activeChat?.id === chat.id ? "bg-purple-600/20 border border-purple-500/30 text-white" : "hover:bg-slate-800 text-gray-400"}`}>
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="flex-1 truncate text-xs">{chat.title}</span>
                    <button onClick={(e) => deleteChat(chat.id, e)} className="opacity-0 group-hover:opacity-100 text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setShowSidebar(!showSidebar)}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className={`w-4 h-4 transition-transform ${showSidebar ? "" : "rotate-180"}`} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Nova IA {PERSONALITIES[personality].emoji}</h1>
              <p className="text-xs text-gray-500">{PERSONALITIES[personality].name} · Memoria · Imágenes</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            {loadingMsgs ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>
            ) : !activeChat && chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-3xl">{PERSONALITIES[personality].emoji}</div>
                <h2 className="text-xl font-bold text-white">Hola! Soy Nova</h2>
                <p className="text-gray-400 text-sm max-w-xs">Personalidades, memoria global e imágenes. Crea un chat para empezar.</p>
                <Button onClick={newChat} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Nuevo chat
                </Button>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-blue-600 text-white text-xs font-bold" : "bg-gradient-to-br from-pink-500 to-purple-600 text-lg"}`}>
                      {msg.role === "user" ? user?.email?.[0]?.toUpperCase() : PERSONALITIES[personality].emoji}
                    </div>
                    <div className={`max-w-[75%] space-y-2 flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      {msg.image_url && <img src={msg.image_url} alt="adjunto" className="rounded-xl max-w-xs max-h-48 object-cover border border-slate-600" />}
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : msg.isError ? "bg-red-500/20 border border-red-500/30 text-red-300 rounded-tl-sm" : "bg-slate-800/80 text-gray-100 border border-slate-700/50 rounded-tl-sm"}`}>
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-lg">{PERSONALITIES[personality].emoji}</div>
                <div className="bg-slate-800/80 border border-slate-700/50 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>

          {pendingImage && (
            <div className="relative inline-block mb-2">
              <img src={pendingImage} alt="preview" className="h-16 rounded-lg border border-slate-600" />
              <button onClick={() => { setPendingImage(null); setPendingImageBase64(null); }} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex gap-2 mt-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-10 h-10 flex-shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <Image className="w-4 h-4" />
            </button>
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder={`Habla con Nova ${PERSONALITIES[personality].emoji}...`}
              className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              disabled={isLoading}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) handleSend(e); }}
            />
            <button type="button" onClick={listening ? stopVoice : startVoice}
              className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-all hover:scale-105 border ${listening ? "bg-red-500 border-red-400 animate-pulse" : "bg-slate-800 border-slate-600 text-gray-400 hover:text-white"}`}>
              {listening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
            </button>
            <button type="submit" disabled={isLoading || (!input.trim() && !pendingImage)}
              className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-pink-500 to-purple-600 disabled:opacity-50 rounded-xl flex items-center justify-center transition-all hover:scale-105">
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Nova;