import React, { useState, useEffect } from 'react';
import { Layout, Brain, MessageSquare, Activity, Calendar, Mic, Sparkles, Clock, Zap, ChevronRight, Hash, UserCircle, Fingerprint, GitMerge, Trophy, Workflow, Heart, Smile, BookOpen, Star, Shield, LogOut, Menu } from 'lucide-react';
import { ViewMode, AiIdentity, User } from './types';
import { ChatInterface } from './components/ChatInterface';
import { LiveAvatar } from './components/LiveAvatar';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { AvatarStudio } from './components/AvatarStudio';
import { TaskBoard } from './components/TaskBoard';
import { StrategyMap } from './components/StrategyMap';
import { WorkflowEngine } from './components/WorkflowEngine';
import { AuthScreen } from './components/AuthScreen';
import { db } from './services/db';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Core App State
  const [view, setView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [showLive, setShowLive] = useState(false);
  const [identity, setIdentity] = useState<AiIdentity>({
    name: 'SELF-OS',
    avatarUrl: null
  });
  
  // Gamification State
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);

  // Initialize Auth
  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIdentity(prev => ({ ...prev, name: user.name + "'s Companion", avatarUrl: user.avatarUrl }));
      setXp(user.xp || 0);
      setLevel(user.level || 1);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIdentity(prev => ({ ...prev, name: user.name + "'s Companion", avatarUrl: user.avatarUrl }));
    setXp(user.xp || 0);
    setLevel(user.level || 1);
  };

  const handleLogout = () => {
    db.logout();
    setCurrentUser(null);
  };

  const handleInteraction = (type: 'CHAT' | 'TASK' | 'MAP') => {
    let xpGain = 0;
    switch(type) {
      case 'CHAT': xpGain = 5; break;
      case 'TASK': xpGain = 20; break;
      case 'MAP': xpGain = 15; break;
    }
    
    setXp(prev => {
      const nextXp = prev + xpGain;
      if (nextXp >= 100) {
        const newLevel = level + 1;
        setLevel(newLevel);
        if (currentUser) {
            db.updateUserProfile(currentUser.id, { xp: nextXp - 100, level: newLevel });
        }
        return nextXp - 100;
      }
      if (currentUser) {
          db.updateUserProfile(currentUser.id, { xp: nextXp });
      }
      return nextXp;
    });
  };

  // Sync identity changes to DB
  const handleUpdateIdentity = (newId: AiIdentity) => {
    setIdentity(newId);
    if (currentUser && newId.avatarUrl) {
       db.updateUserProfile(currentUser.id, { avatarUrl: newId.avatarUrl });
    }
  };

  if (isLoading) return <div className="h-screen bg-navy-950 text-white flex items-center justify-center font-mono">Initializing System...</div>;

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const navItems = [
    { id: ViewMode.DASHBOARD, icon: Layout, label: 'Home' },
    { id: ViewMode.AI_CONSOLE, icon: MessageSquare, label: 'Chat' },
    { id: ViewMode.KNOWLEDGE_GRAPH, icon: Brain, label: 'Brain' },
    { id: ViewMode.TASKBOARD, icon: Calendar, label: 'Tasks' },
    { id: ViewMode.WORKFLOWS, icon: Workflow, label: 'Habits' },
    { id: ViewMode.STRATEGY_MAP, icon: GitMerge, label: 'Strategy' },
    { id: ViewMode.AVATAR_STUDIO, icon: Smile, label: 'Avatar' },
  ];

  return (
    <div className="flex h-screen bg-navy-950 text-white font-sans selection:bg-neon-blue/30 overflow-hidden relative">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <div className="hidden lg:flex w-72 border-r border-white/5 bg-navy-900/80 backdrop-blur-xl flex-col z-20 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
        <div className="p-8 flex items-center gap-4">
           <div className="relative group cursor-pointer" onClick={() => setShowLive(true)}>
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-neon-blue/50">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-neon-blue/10 blur-lg group-hover:bg-neon-blue/20 transition-all"></div>
                    <Brain className="w-6 h-6 text-neon-cyan relative z-10" />
                  </>
                )}
             </div>
             <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-navy-900 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
           </div>
           <div className="overflow-hidden">
             <div className="font-bold text-xl tracking-wider font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 truncate">{currentUser.name}</div>
             <div className="text-[10px] text-neon-blue tracking-[0.2em] uppercase font-medium">Online</div>
           </div>
        </div>

        {/* Gamification Bar */}
        <div className="px-8 mb-4">
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mb-2 uppercase tracking-wider">
            <span>Sync Level</span>
            <span className="text-neon-purple">Lv. {level}</span>
          </div>
          <div className="h-1.5 w-full bg-navy-950 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-neon-blue to-neon-purple transition-all duration-500" 
              style={{ width: `${xp}%` }}
            ></div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-4 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2 text-xs font-mono text-gray-500 uppercase tracking-widest">Menu</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                view === item.id 
                  ? 'bg-white/5 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] border border-white/5' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-neon-blue rounded-r-full transition-all duration-300 shadow-[0_0_15px_#4C6EF5] ${view === item.id ? 'opacity-100' : 'opacity-0'}`}></div>
              <item.icon className={`w-5 h-5 ${view === item.id ? 'text-neon-blue drop-shadow-[0_0_8px_rgba(76,110,245,0.6)]' : 'text-gray-400 group-hover:text-white'} transition-colors relative z-10`} />
              <span className="font-medium tracking-wide text-sm relative z-10">{item.label}</span>
              {view === item.id && <ChevronRight className="w-4 h-4 ml-auto text-white/20" />}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto space-y-4">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
             <LogOut className="w-4 h-4" />
             <span className="text-xs font-mono uppercase tracking-widest">Terminate Session</span>
           </button>

           <div className="p-4 rounded-2xl bg-navy-950/50 border border-white/5 relative overflow-hidden group">
             {/* System Health Pulse */}
             <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-neon-pink animate-pulse"></div>
                 <span className="text-[10px] font-mono text-neon-pink tracking-wider">HEARTBEAT</span>
               </div>
             </div>
             
             {/* Dynamic Waveform */}
             <div className="h-8 flex items-end justify-between gap-1 opacity-50">
                {[40, 70, 45, 90, 60, 80, 50, 75, 45, 60].map((h, i) => (
                  <div key={i} className="w-1 bg-neon-purple/80 rounded-t-sm transition-all duration-500" style={{ height: `${h}%` }}></div>
                ))}
             </div>
           </div>

          <button 
             onClick={() => setShowLive(true)}
             className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-neon-blue via-indigo-500 to-neon-purple hover:brightness-110 transition-all shadow-[0_4px_30px_rgba(76,110,245,0.4)] group relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
            <Mic className="w-5 h-5 text-white group-hover:scale-110 transition-transform relative z-10" />
            <span className="font-bold text-sm tracking-wide relative z-10">TALK TO ME</span>
          </button>
        </div>
      </div>

      {/* --- MOBILE CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-navy-950 relative">
        
        {/* Mobile Header */}
        <div className="lg:hidden h-16 border-b border-white/5 bg-navy-900/80 backdrop-blur-md flex items-center justify-between px-4 z-30 shrink-0">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-white/10 flex items-center justify-center overflow-hidden">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Brain className="w-4 h-4 text-neon-cyan" />
                )}
             </div>
             <span className="font-mono text-sm font-bold text-white tracking-widest">{identity.name.split(' ')[0]}</span>
           </div>
           
           <div className="flex items-center gap-2">
             <button onClick={() => setShowLive(true)} className="p-2 rounded-full bg-neon-blue/10 text-neon-blue border border-neon-blue/20">
               <Mic className="w-4 h-4" />
             </button>
             <button onClick={handleLogout} className="p-2 rounded-full hover:bg-white/5 text-gray-400">
               <LogOut className="w-4 h-4" />
             </button>
           </div>
        </div>

        {/* Ambient Background Layer */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
           <div className="absolute inset-0 bg-grid opacity-[0.03]"></div>
           <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-neon-blue/5 rounded-full blur-[150px] animate-float"></div>
           <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] bg-neon-purple/5 rounded-full blur-[150px] animate-float" style={{ animationDelay: '-5s' }}></div>
        </div>

        {/* Main View Render */}
        <div className="flex-1 relative z-10 flex flex-col min-h-0 overflow-hidden">
          {showLive ? (
            <div className="absolute inset-0 z-50 bg-navy-950 animate-in fade-in zoom-in-95 duration-500">
               <button 
                 onClick={() => setShowLive(false)}
                 className="absolute top-6 right-6 z-50 p-3 rounded-full bg-black/40 text-white/70 hover:text-white transition-colors border border-white/10 backdrop-blur-md">
                 <ChevronRight className="w-6 h-6 rotate-90 lg:rotate-0" />
               </button>
               <LiveAvatar onClose={() => setShowLive(false)} identity={identity} />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col p-4 lg:p-8 pb-20 lg:pb-8 overflow-y-auto custom-scrollbar">
              {view === ViewMode.DASHBOARD && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
                  
                  {/* Greeting Hero */}
                  <div className="col-span-1 md:col-span-12 lg:col-span-8 p-6 lg:p-10 glass-panel rounded-[2rem] relative overflow-hidden group border border-white/10">
                     <div className="absolute top-0 right-0 w-[300px] lg:w-[500px] h-[300px] lg:h-[500px] bg-gradient-to-br from-neon-blue/10 to-transparent blur-[80px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                     
                     <div className="relative z-10">
                       <div className="flex items-center gap-3 mb-4 opacity-0 animate-in slide-in-from-bottom-4 fade-in duration-700">
                          <span className="px-2 py-1 rounded text-[10px] font-mono bg-neon-blue/10 text-neon-blue border border-neon-blue/20">Online</span>
                          <span className="text-gray-500 text-xs font-mono uppercase tracking-widest">Ready</span>
                       </div>
                       
                       <h2 className="text-3xl lg:text-6xl font-light mb-4 tracking-tight leading-tight opacity-0 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
                         Welcome back, {currentUser.name}. <br/>
                         <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink font-semibold">Ready to think.</span>
                       </h2>
                       
                       <p className="text-gray-400 text-sm lg:text-lg mb-8 max-w-lg font-light leading-relaxed opacity-0 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200">
                         I've synchronized your local neural database. {xp > 0 ? `You are at Sync Level ${level}.` : "Let's start building your second brain."}
                       </p>
                       
                       {/* Context / Focus Areas */}
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 opacity-0 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer active:scale-95 duration-200" onClick={() => setView(ViewMode.KNOWLEDGE_GRAPH)}>
                            <div className="flex items-center gap-2 mb-2 text-neon-cyan">
                               <Brain className="w-4 h-4" />
                               <span className="text-[10px] font-mono uppercase tracking-wider">Recall</span>
                            </div>
                            <div className="text-sm text-gray-200 font-medium">Second Brain</div>
                          </div>
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer active:scale-95 duration-200" onClick={() => setView(ViewMode.WORKFLOWS)}>
                            <div className="flex items-center gap-2 mb-2 text-neon-purple">
                               <Workflow className="w-4 h-4" />
                               <span className="text-[10px] font-mono uppercase tracking-wider">Habit</span>
                            </div>
                            <div className="text-sm text-gray-200 font-medium">Daily Routines</div>
                          </div>
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer active:scale-95 duration-200" onClick={() => setView(ViewMode.TASKBOARD)}>
                            <div className="flex items-center gap-2 mb-2 text-neon-pink">
                               <Star className="w-4 h-4" />
                               <span className="text-[10px] font-mono uppercase tracking-wider">Priority</span>
                            </div>
                            <div className="text-sm text-gray-200 font-medium">Current Focus</div>
                          </div>
                       </div>
                     </div>
                  </div>

                  {/* Companion Status */}
                  <div className="col-span-1 md:col-span-12 lg:col-span-4 flex flex-col gap-6">
                    <div className="glass-panel rounded-[2rem] p-6 flex flex-col h-full border border-white/10 relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                       
                       <h3 className="text-lg font-medium mb-6 flex items-center gap-2 relative z-10">
                          <Heart className="w-4 h-4 text-neon-pink" />
                          <span className="tracking-wide text-sm font-mono uppercase text-gray-300">Companion State</span>
                       </h3>
                       
                       <div className="space-y-4 flex-1 relative z-10">
                          {/* Mood */}
                          <div className="flex items-center justify-between p-4 rounded-xl bg-navy-800/40 border border-white/5">
                             <div className="flex items-center gap-3">
                               <div className="p-2 rounded-lg bg-black/30 text-neon-blue">
                                  <Smile className="w-5 h-5" />
                               </div>
                               <div>
                                 <div className="text-sm text-gray-200 font-medium">Current Mood</div>
                                 <div className="text-[10px] text-gray-500 font-mono">Based on interactions</div>
                               </div>
                             </div>
                             <span className="text-sm text-neon-blue font-medium">Resonant</span>
                          </div>

                          {/* Memory Stats */}
                          <div className="flex items-center justify-between p-4 rounded-xl bg-navy-800/40 border border-white/5">
                             <div className="flex items-center gap-3">
                               <div className="p-2 rounded-lg bg-black/30 text-neon-purple">
                                  <BookOpen className="w-5 h-5" />
                               </div>
                               <div>
                                 <div className="text-sm text-gray-200 font-medium">Memories</div>
                                 <div className="text-[10px] text-gray-500 font-mono">Stored in Graph</div>
                               </div>
                             </div>
                             <span className="text-sm text-white font-mono">1,024</span>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}
              
              {view === ViewMode.AI_CONSOLE && (
                 <div className="h-full glass-panel rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 relative">
                   <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-md z-0"></div>
                   <div className="relative z-10 h-full">
                     <ChatInterface identity={identity} onInteraction={handleInteraction} userId={currentUser.id} />
                   </div>
                 </div>
              )}
              
              {view === ViewMode.WORKFLOWS && (
                <div className="h-full glass-panel rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 relative">
                   <WorkflowEngine />
                </div>
              )}

              {view === ViewMode.KNOWLEDGE_GRAPH && (
                <div className="h-full glass-panel rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                   <KnowledgeGraph />
                </div>
              )}
              
              {view === ViewMode.STRATEGY_MAP && (
                <div className="h-full glass-panel rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                   <StrategyMap onInteraction={handleInteraction} />
                </div>
              )}

              {view === ViewMode.TASKBOARD && (
                 <div className="h-full glass-panel rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                    <TaskBoard onInteraction={handleInteraction} userId={currentUser.id} />
                 </div>
              )}

              {view === ViewMode.AVATAR_STUDIO && (
                <div className="h-full glass-panel rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                  <AvatarStudio 
                    currentIdentity={identity} 
                    onUpdateIdentity={handleUpdateIdentity}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-navy-950/90 backdrop-blur-xl border-t border-white/10 flex justify-between px-6 py-3 pb-safe z-40">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-200 ${
              view === item.id ? 'text-neon-blue transform -translate-y-1' : 'text-gray-500'
            }`}
          >
            <div className={`p-2 rounded-xl ${view === item.id ? 'bg-neon-blue/10' : ''}`}>
              <item.icon className={`w-5 h-5 ${view === item.id ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[9px] font-mono uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
        {/* Overflow Menu for items > 5 could go here, but for now we just show top 5 */}
      </div>

    </div>
  );
}