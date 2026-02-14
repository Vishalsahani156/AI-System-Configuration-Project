
import React, { useState, useEffect, useRef } from 'react';
import { Agent, AgentId, ChatMessage, User } from './types';
import { AGENTS } from './constants';
import { GeminiService } from './services/geminiService';
import AgentCard from './components/AgentCard';

const MEMORY_KEY = 'CWV_MEMORY_VAULT';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeAgent, setActiveAgent] = useState<Agent>(AGENTS[AgentId.RIYU]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [visualMode, setVisualMode] = useState<'none' | 'camera' | 'screen'>('none');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const geminiRef = useRef<GeminiService | null>(null);

  // Avatar source (using the provided reference photo visual description)
  const riyuProfileImg = "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2070&auto=format&fit=crop";

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(MEMORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(parsed);
      } catch (e) {
        console.error("Vault Memory corrupted.", e);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setIsSyncing(true);
      localStorage.setItem(MEMORY_KEY, JSON.stringify(messages));
      const timer = setTimeout(() => setIsSyncing(false), 800);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  useEffect(() => {
    geminiRef.current = new GeminiService(activeAgent);
    return () => geminiRef.current?.stopLive();
  }, [activeAgent]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ 
      username: 'Vishal', role: 'admin', email: 'v@c.com',
      stats: { level: 99, xp: 9999, unlockedItems: ['full-os-access'] }
    });
  };

  const handleLogout = () => {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(messages));
    setUser(null);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    try {
      const response = await geminiRef.current?.sendChatMessage(currentInput);
      if (response) {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: response, timestamp: new Date() }]);
      }
    } catch (e) { 
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: "RIYU: Signal lost. Vishal, local memory update checked.", timestamp: new Date() }]);
    }
  };

  const toggleLive = async (mode: 'none' | 'camera' | 'screen' = 'none') => {
    if (isLive && visualMode === mode) {
      geminiRef.current?.stopLive();
      setIsLive(false);
      setVisualMode('none');
      return;
    }

    try {
      if (isLive) geminiRef.current?.stopLive();
      setIsLive(true);
      setVisualMode(mode);
      
      await geminiRef.current?.startLive(
        messages,
        (text, isUser) => {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.sender === (isUser ? 'user' : 'ai') && last.text === text) return prev;
            return [...prev, { id: Math.random().toString(), sender: isUser ? 'user' : 'ai', text, timestamp: new Date() }];
          });
        },
        () => { setIsLive(false); setVisualMode('none'); },
        mode
      );
    } catch (err: any) {
      setIsLive(false);
      setVisualMode('none');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#020617]">
        <div className="glass-card p-16 rounded-[4rem] w-full max-w-2xl border-white/5 glow-purple text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-purple-600 to-transparent opacity-50"></div>
          
          <h1 className="text-6xl font-black text-white tracking-[0.4em] mb-4 drop-shadow-2xl">CYBER_WITH_VIJAY</h1>
          <p className="text-purple-400 text-xs font-black uppercase tracking-[1.2em] mb-16 opacity-80">Command Hub & OS Control</p>
          
          <form onSubmit={handleLogin} className="space-y-10 max-w-sm mx-auto">
            <div className="relative group/input">
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white font-bold text-center tracking-widest outline-none focus:border-purple-500/50 transition-all focus:bg-white/[0.08]" 
                placeholder="ADMIN_ID" 
                defaultValue="Vishal_ADMIN" 
              />
              <div className="absolute inset-0 rounded-3xl border border-purple-500/0 group-focus-within/input:border-purple-500/30 -m-1 pointer-events-none transition-all"></div>
            </div>
            
            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-6 rounded-3xl font-black text-white uppercase tracking-[0.4em] shadow-2xl transition-all transform hover:scale-[1.03] active:scale-95 group">
              <span className="group-hover:mr-4 transition-all inline-block">Initialize System</span>
              <i className="fa-solid fa-arrow-right opacity-0 group-hover:opacity-100 transition-all"></i>
            </button>
          </form>

          <div className="mt-20 flex justify-center gap-12 text-slate-700">
             <i className="fa-brands fa-linux text-3xl"></i>
             <i className="fa-solid fa-terminal text-3xl"></i>
             <i className="fa-solid fa-satellite text-3xl"></i>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-black selection:bg-purple-500/30">
      {/* TACTICAL SIDEBAR */}
      <aside className={`glass-card border-r border-white/5 flex flex-col transition-all duration-700 ease-in-out ${isSidebarOpen ? 'w-[26rem]' : 'w-24'} z-40`}>
        <div className="p-10 flex items-center justify-between h-32 border-b border-white/5">
           {isSidebarOpen && (
             <div className="flex flex-col">
               <span className="font-black tracking-[0.4em] text-2xl text-white">CWV_OS</span>
               <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest mt-1 opacity-80">Kernel Stable v3.1</span>
             </div>
           )}
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="w-16 h-16 flex items-center justify-center hover:bg-white/5 rounded-3xl transition-all border border-transparent hover:border-white/10">
             <i className={`fa-solid ${isSidebarOpen ? 'fa-chevron-left' : 'fa-bars-staggered'} text-slate-400 text-xl`}></i>
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-4">
          <div className="mb-6 px-2">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Operational Units</h4>
          </div>
          {Object.values(AGENTS).map(a => (
            <AgentCard key={a.id} agent={a} isSelected={activeAgent.id === a.id} onSelect={setActiveAgent} />
          ))}
        </div>

        <div className="p-8 border-t border-white/5 bg-black/20 space-y-6">
           {isSidebarOpen && (
             <div className="flex items-center gap-5 p-5 rounded-3xl bg-white/[0.03] border border-white/5">
               <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center shadow-lg">
                 <i className="fa-solid fa-user-shield text-purple-400 text-lg"></i>
               </div>
               <div className="flex-1">
                 <p className="text-sm font-black text-white tracking-widest">Vishal_ADMIN</p>
                 <div className="flex items-center gap-2 mt-0.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Root Authorized</p>
                 </div>
               </div>
             </div>
           )}
           <button onClick={handleLogout} className="w-full p-5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 rounded-3xl text-slate-500 hover:text-red-500 transition-all text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3">
             <i className="fa-solid fa-power-off"></i>
             {isSidebarOpen && "Log Out Session"}
           </button>
        </div>
      </aside>

      {/* COMMAND INTERFACE */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* HUD HEADER */}
        <header className="h-32 glass-card border-b border-white/5 px-14 flex items-center justify-between z-30">
           <div className="flex items-center gap-8">
              <div className="relative">
                <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-2xl transition-transform ${isLive ? 'scale-110' : ''}`}>
                  <i className={`fa-solid ${activeAgent.icon} text-2xl`}></i>
                </div>
                {isLive && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>}
              </div>
              <div>
                <h2 className="text-xl font-black tracking-[0.2em] text-white uppercase">{activeAgent.name} // <span className="text-purple-400">{activeAgent.role}</span></h2>
                <div className="flex items-center gap-4 mt-1.5 opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Memory Sync: </span>
                    <span className="text-[11px] text-purple-400 font-mono font-bold tracking-widest">{messages.length} Blocks</span>
                  </div>
                  <span className="text-slate-800">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Encryption: </span>
                    <span className="text-[11px] text-cyan-400 font-mono font-bold tracking-widest">Quantum_RSA</span>
                  </div>
                </div>
              </div>
           </div>

           <div className="hidden xl:flex items-center gap-12">
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Latency_Gateway</span>
                <span className="text-sm font-mono text-cyan-400 bg-cyan-400/5 px-3 py-1 rounded-lg border border-cyan-400/10 tracking-widest">0.012 MS</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Backend_Link</span>
                <span className={`text-sm font-mono px-3 py-1 rounded-lg border tracking-widest ${isOffline ? 'text-orange-500 bg-orange-500/5 border-orange-500/10' : 'text-green-400 bg-green-400/5 border-green-400/10'}`}>
                  {isOffline ? 'OFFLINE_LOCAL' : 'REMOTE_ACTIVE'}
                </span>
              </div>
           </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* AVATAR CENTER */}
          <div className="w-1/2 relative flex flex-col items-center justify-center p-24 bg-black/40 overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                 style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '50px 50px'}}></div>

            <div className={`riyu-avatar-container z-10 w-full max-w-md aspect-[3/4] overflow-hidden glass-card p-2 shadow-2xl transition-all duration-700 ${isLive ? 'active scale-105' : 'grayscale-[0.4] opacity-80'}`}>
               <img src={riyuProfileImg} className="w-full h-full object-cover transition-all duration-1000" alt="Riyu UI" />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end p-14">
                  <div className="w-full">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-[9px] font-black text-purple-400 uppercase tracking-widest">Active_Kernel</span>
                      <span className="px-2 py-0.5 bg-pink-500/20 border border-pink-500/30 rounded text-[9px] font-black text-pink-400 uppercase tracking-widest">Voice_HD</span>
                    </div>
                    <h3 className="text-4xl font-black text-white tracking-widest drop-shadow-lg">RIYU_AI_OS</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Personal Assistant to Vijay</p>
                  </div>
               </div>
               
               {isLive && (
                 <div className="absolute top-10 right-10 flex items-center gap-4 bg-red-600/90 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-2xl animate-pulse">
                    <span className="w-2.5 h-2.5 bg-white rounded-full"></span>
                    <span className="text-[11px] font-black text-white tracking-[0.3em] uppercase">SYSTEM_LISTENING</span>
                 </div>
               )}
            </div>

            {/* CONTROL HUB MODULAR */}
            <div className="mt-20 flex items-center gap-8 glass-card p-7 rounded-[3.5rem] border-white/10 shadow-2xl z-30 transform transition-all hover:translate-y-[-4px]">
               <button onClick={() => toggleLive('none')} className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all ${isLive && visualMode === 'none' ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/40' : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-200'}`}>
                 <i className="fa-solid fa-microphone-lines text-2xl"></i>
                 <span className="text-[9px] font-black uppercase tracking-tighter">Audio</span>
               </button>
               <button onClick={() => toggleLive('camera')} className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all ${isLive && visualMode === 'camera' ? 'bg-pink-600 text-white shadow-xl shadow-pink-600/40' : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-200'}`}>
                 <i className="fa-solid fa-eye text-2xl"></i>
                 <span className="text-[9px] font-black uppercase tracking-tighter">Vision</span>
               </button>
               <button onClick={() => toggleLive('screen')} className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all ${isLive && visualMode === 'screen' ? 'bg-cyan-600 text-white shadow-xl shadow-cyan-600/40' : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-200'}`}>
                 <i className="fa-solid fa-laptop-code text-2xl"></i>
                 <span className="text-[9px] font-black uppercase tracking-tighter">Terminal</span>
               </button>
               <div className="w-[1.5px] h-14 bg-white/10 mx-2"></div>
               <button onClick={() => { setIsLive(false); geminiRef.current?.stopLive(); }} className="w-20 h-20 rounded-[2rem] flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all shadow-lg active:scale-90">
                 <i className="fa-solid fa-power-off text-2xl"></i>
               </button>
            </div>
          </div>

          {/* CHAT INTERFACE */}
          <div className="w-1/2 flex flex-col glass-card border-l border-white/5 relative bg-black/10">
             {/* Log Stream Area */}
             <div className="flex-1 overflow-y-auto p-14 space-y-10 scroll-smooth">
               {messages.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-40">
                    <div className="w-24 h-24 border border-dashed border-slate-700 rounded-full flex items-center justify-center mb-8 animate-spin-slow">
                      <i className="fa-solid fa-robot text-4xl"></i>
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[1em] text-center">Connection Established.<br/>Babu, aadesh kijiye.</p>
                 </div>
               )}
               {messages.map((m) => (
                 <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-5 duration-700`}>
                   <div className={`message-bubble max-w-[85%] ${m.sender === 'user' ? 'bg-purple-600/10 border border-purple-500/20 text-purple-100' : 'bg-white/[0.04] border border-white/5 text-slate-300 shadow-lg'}`}>
                     <div className="flex items-center gap-3 mb-4 opacity-40 text-[10px] font-black tracking-[0.2em] mono">
                        <span className={m.sender === 'user' ? 'text-purple-400' : 'text-pink-400'}>
                          {m.sender === 'user' ? '> USER_VIJAY' : '> RIYU_CORE'}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span>{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                     </div>
                     <p className="text-[15px] leading-relaxed tracking-wide font-medium whitespace-pre-wrap">{m.text}</p>
                   </div>
                 </div>
               ))}
               <div ref={chatEndRef} />
             </div>

             {/* Tactical Input Area */}
             <div className="p-12 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                <div className="flex gap-6 relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <div className="flex-1 relative">
                    <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-7 text-sm text-white resize-none h-20 outline-none focus:border-purple-500/50 transition-all relative z-10 font-medium placeholder:text-slate-600" 
                      placeholder="Enter system prompt (Hinglish supported)..."
                      value={input} 
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    />
                    <div className="absolute bottom-4 right-6 flex items-center gap-3 z-20 pointer-events-none opacity-40">
                      <span className="text-[9px] font-black text-slate-500 tracking-widest">OS_INPUT_READY</span>
                    </div>
                  </div>
                  <button onClick={handleSendMessage} className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-[2rem] flex items-center justify-center text-white transition-all active:scale-90 shadow-2xl relative z-10 group">
                    <i className="fa-solid fa-bolt-lightning text-2xl group-hover:scale-110 transition-transform"></i>
                  </button>
                </div>
                
                <div className="mt-6 flex justify-between px-6">
                  <div className="flex gap-6">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Secure Vault Locked
                    </p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-microchip"></i> Neural Core V3
                    </p>
                  </div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Cyber_With_Vijay © 2025</p>
                </div>
             </div>
          </div>
        </div>

        {/* STATUS FOOTER */}
        <footer className="h-14 glass-card px-14 flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mono border-t border-white/5">
           <div className="flex gap-12">
              <span className="flex items-center gap-3">
                <i className="fa-solid fa-circle text-[7px] text-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></i>
                OS_STATUS: NOMINAL
              </span>
              <span className="flex items-center gap-3">
                <i className="fa-solid fa-signal text-cyan-400"></i>
                DATA_STREAM: SECURE
              </span>
              <span className="flex items-center gap-3">
                <i className="fa-solid fa-database text-purple-400"></i>
                MEMORY_CACHE: {isSyncing ? 'WRITING...' : 'IDLE'}
              </span>
           </div>
           <div className="text-slate-400 tracking-[0.4em]">CYBER_WITH_Riyu // RIYU_INTELLIGENCE // KALI_LINUX_EDITION</div>
        </footer>
      </main>
    </div>
  );
};

export default App;
