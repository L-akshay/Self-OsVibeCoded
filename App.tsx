import React, { useState } from 'react';
import { Layout, Brain, MessageSquare, Activity, Calendar, Mic, Sparkles, Clock, Zap, ChevronRight, Hash, UserCircle, Fingerprint, GitMerge } from 'lucide-react';
import { ViewMode, AiIdentity } from './types';
import { ChatInterface } from './components/ChatInterface';
import { LiveAvatar } from './components/LiveAvatar';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { AvatarStudio } from './components/AvatarStudio';
import { TaskBoard } from './components/TaskBoard';
import { StrategyMap } from './components/StrategyMap';

export default function App() {
  const [view, setView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [showLive, setShowLive] = useState(false);
  const [identity, setIdentity] = useState<AiIdentity>({
    name: 'SELF-OS',
    avatarUrl: null
  });

  const navItems = [
    { id: ViewMode.DASHBOARD, icon: Layout, label: 'Dashboard' },
    { id: ViewMode.AI_CONSOLE, icon: MessageSquare, label: 'AI Friend' },
    { id: ViewMode.STRATEGY_MAP, icon: GitMerge, label: 'Strategy Map' },
    { id: ViewMode.KNOWLEDGE_GRAPH, icon: Brain, label: 'Neural Graph' },
    { id: ViewMode.TASKBOARD, icon: Calendar, label: 'Task Matrix' },
    { id: ViewMode.AVATAR_STUDIO, icon: Fingerprint, label: 'Identity Studio' },
  ];

  return (
    <div className="flex h-screen bg-navy-950 text-white font-sans selection:bg-neon-blue/30 overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-20 lg:w-72 border-r border-white/5 bg-navy-900/80 backdrop-blur-xl flex flex-col z-20 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
        <div className="p-8 flex items-center gap-4">
           <div className="relative group cursor-pointer" onClick={() => setShowLive(true)}>
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-neon-blue/50">
                {identity.avatarUrl ? (
                  <img src={identity.avatarUrl} alt="Avatar" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-neon-blue/10 blur-lg group-hover:bg-neon-blue/20 transition-all"></div>
                    <Brain className="w-6 h-6 text-neon-cyan relative z-10" />
                  </>
                )}
             </div>
             <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-navy-900 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
           </div>
           <div className="hidden lg:block">
             <div className="font-bold text-xl tracking-wider font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{identity.name}</div>
             <div className="text-[10px] text-neon-blue tracking-[0.2em] uppercase font-medium">System Online</div>
           </div>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-4">
          <div className="px-4 py-2 text-xs font-mono text-gray-500 uppercase tracking-widest hidden lg:block">Navigation</div>
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
              <span className="hidden lg:block font-medium tracking-wide text-sm relative z-10">{item.label}</span>
              {view === item.id && <ChevronRight className="w-4 h-4 ml-auto text-white/20 hidden lg:block" />}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto space-y-6">
           <div className="hidden lg:block p-4 rounded-2xl bg-navy-950/50 border border-white/5 relative overflow-hidden group">
             {/* System Health Pulse */}
             <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></div>
                 <span className="text-[10px] font-mono text-neon-cyan tracking-wider">NEURAL LINK</span>
               </div>
               <span className="text-[10px] font-mono text-gray-400">98ms</span>
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
            <span className="hidden lg:block font-bold text-sm tracking-wide relative z-10">OPEN COMM LINK</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col min-w-0 bg-navy-950">
        {/* Ambient Background Layer */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
           <div className="absolute inset-0 bg-grid opacity-[0.03]"></div>
           <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-neon-blue/5 rounded-full blur-[150px] animate-float"></div>
           <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] bg-neon-purple/5 rounded-full blur-[150px] animate-float" style={{ animationDelay: '-5s' }}></div>
        </div>

        {/* Content Render */}
        <div className="flex-1 p-4 lg:p-8 relative z-10 flex flex-col h-full overflow-hidden">
          {showLive ? (
            <div className="w-full h-full glass-panel rounded-[2rem] animate-in fade-in zoom-in-95 duration-500 border border-white/10 shadow-2xl relative overflow-hidden">
               <button 
                 onClick={() => setShowLive(false)}
                 className="absolute top-6 right-6 z-50 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/50 hover:text-white transition-colors border border-white/5">
                 <ChevronRight className="w-6 h-6 rotate-90 lg:rotate-0" />
               </button>
               <LiveAvatar onClose={() => setShowLive(false)} identity={identity} />
            </div>
          ) : (
            <>
              {view === ViewMode.DASHBOARD && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full auto-rows-min overflow-y-auto custom-scrollbar pr-2 pb-20">
                  
                  {/* Greeting Hero */}
                  <div className="col-span-1 md:col-span-12 lg:col-span-8 p-8 lg:p-10 glass-panel rounded-[2rem] relative overflow-hidden group border border-white/10">
                     <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-neon-blue/10 to-transparent blur-[80px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                     
                     <div className="relative z-10">
                       <div className="flex items-center gap-3 mb-4 opacity-0 animate-in slide-in-from-bottom-4 fade-in duration-700">
                          <span className="px-2 py-1 rounded text-[10px] font-mono bg-neon-blue/10 text-neon-blue border border-neon-blue/20">BETA v1.4</span>
                          <span className="text-gray-500 text-xs font-mono uppercase tracking-widest">System Optimal</span>
                       </div>
                       
                       <h2 className="text-4xl lg:text-6xl font-light mb-4 tracking-tight leading-tight opacity-0 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
                         Welcome back, <br/>
                         <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink font-semibold">Explorer</span>.
                       </h2>
                       
                       <p className="text-gray-400 text-lg mb-10 max-w-lg font-light leading-relaxed opacity-0 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200">
                         I've analyzed your recent inputs. Your productivity patterns suggest a high-focus interval is recommended.
                       </p>
                       
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 opacity-0 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
                          {[
                            { label: 'Tasks Pending', value: '12', icon: Zap, color: 'text-neon-cyan', bg: 'bg-neon-cyan/5', border: 'border-neon-cyan/10' },
                            { label: 'Neural Nodes', value: '843', icon: Brain, color: 'text-neon-purple', bg: 'bg-neon-purple/5', border: 'border-neon-purple/10' },
                            { label: 'Sync Status', value: 'Active', icon: Activity, color: 'text-neon-pink', bg: 'bg-neon-pink/5', border: 'border-neon-pink/10' }
                          ].map((stat, i) => (
                            <div key={i} className={`p-4 rounded-2xl ${stat.bg} ${stat.border} border hover:bg-white/5 transition-all duration-300 group/stat cursor-default`}>
                               <div className="flex items-center gap-2 mb-3">
                                  <div className={`p-1.5 rounded-lg bg-black/20 ${stat.color}`}>
                                    <stat.icon className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-gray-400 text-[10px] font-mono uppercase tracking-wider">{stat.label}</span>
                               </div>
                               <div className="text-2xl font-mono font-medium tracking-tight group-hover/stat:scale-105 transition-transform origin-left">{stat.value}</div>
                            </div>
                          ))}
                       </div>
                     </div>
                  </div>

                  {/* Quick Access Grid */}
                  <div className="col-span-1 md:col-span-12 lg:col-span-4 flex flex-col gap-6">
                    <div className="glass-panel rounded-[2rem] p-6 flex flex-col h-full border border-white/10 relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                       
                       <h3 className="text-lg font-medium mb-6 flex items-center gap-2 relative z-10">
                          <Sparkles className="w-4 h-4 text-neon-pink" />
                          <span className="tracking-wide text-sm font-mono uppercase text-gray-300">Quick Actions</span>
                       </h3>
                       
                       <div className="space-y-3 flex-1 relative z-10">
                          <button onClick={() => setView(ViewMode.AI_CONSOLE)} className="w-full text-left p-4 rounded-2xl bg-navy-800/50 hover:bg-navy-700 border border-white/5 transition-all group hover:border-neon-blue/30 hover:shadow-[0_0_20px_rgba(76,110,245,0.1)]">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-neon-blue font-medium group-hover:translate-x-1 transition-transform">Talk to {identity.name}</span>
                                <div className="p-1.5 rounded-full bg-neon-blue/10 group-hover:bg-neon-blue/20 transition-colors">
                                  <MessageSquare className="w-3.5 h-3.5 text-neon-blue" />
                                </div>
                             </div>
                             <div className="text-xs text-gray-500 font-light">Deep conversation & planning.</div>
                          </button>
                          
                          <button onClick={() => setView(ViewMode.STRATEGY_MAP)} className="w-full text-left p-4 rounded-2xl bg-navy-800/50 hover:bg-navy-700 border border-white/5 transition-all group hover:border-neon-pink/30 hover:shadow-[0_0_20px_rgba(217,70,239,0.1)]">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-neon-pink font-medium group-hover:translate-x-1 transition-transform">Strategize Goal</span>
                                <div className="p-1.5 rounded-full bg-neon-pink/10 group-hover:bg-neon-pink/20 transition-colors">
                                  <GitMerge className="w-3.5 h-3.5 text-neon-pink" />
                                </div>
                             </div>
                             <div className="text-xs text-gray-500 font-light">Generate mind maps for life goals.</div>
                          </button>

                          <button onClick={() => setView(ViewMode.KNOWLEDGE_GRAPH)} className="w-full text-left p-4 rounded-2xl bg-navy-800/50 hover:bg-navy-700 border border-white/5 transition-all group hover:border-neon-cyan/30 hover:shadow-[0_0_20px_rgba(0,208,179,0.1)]">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-neon-cyan font-medium group-hover:translate-x-1 transition-transform">Visual Memory</span>
                                <div className="p-1.5 rounded-full bg-neon-cyan/10 group-hover:bg-neon-cyan/20 transition-colors">
                                  <Brain className="w-3.5 h-3.5 text-neon-cyan" />
                                </div>
                             </div>
                             <div className="text-xs text-gray-500 font-light">Explore your neural map.</div>
                          </button>
                       </div>
                    </div>
                  </div>

                  {/* System Stream */}
                  <div className="col-span-12 glass-panel rounded-[2rem] p-8 border border-white/10 min-h-[300px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                       <Activity className="w-64 h-64 text-white" />
                    </div>
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                       <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400 flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          System Stream
                       </h3>
                    </div>
                    
                    <div className="font-mono text-sm space-y-2 relative z-10">
                       {[
                         { time: '10:42 AM', type: 'INFO', msg: 'Syncing local memory with semantic vector store...', color: 'text-neon-cyan' },
                         { time: '10:38 AM', type: 'AGENT', msg: 'Planner agent generated 3 new tasks based on email context.', color: 'text-neon-purple' },
                         { time: '09:15 AM', type: 'SYSTEM', msg: 'Daily backup completed successfully.', color: 'text-neon-blue' },
                         { time: '08:00 AM', type: 'WAKE', msg: 'System initialized. Good morning.', color: 'text-neon-pink' }
                       ].map((log, i) => (
                         <div key={i} className="flex gap-6 p-4 rounded-xl bg-navy-900/50 border border-white/5 hover:border-white/10 transition-colors items-center group">
                            <span className="text-xs text-gray-600 font-medium w-16">{log.time}</span>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded bg-white/5 ${log.color} w-16 text-center`}>{log.type}</span>
                            <span className="text-gray-400 group-hover:text-gray-200 transition-colors truncate">{log.msg}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              )}
              
              {view === ViewMode.AI_CONSOLE && (
                 <div className="h-full glass-panel rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 relative">
                   <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-md z-0"></div>
                   <div className="relative z-10 h-full">
                     <ChatInterface identity={identity} />
                   </div>
                 </div>
              )}
              
              {view === ViewMode.KNOWLEDGE_GRAPH && (
                <div className="h-full glass-panel rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                   <KnowledgeGraph />
                </div>
              )}
              
              {view === ViewMode.STRATEGY_MAP && (
                <div className="h-full glass-panel rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                   <StrategyMap />
                </div>
              )}

              {view === ViewMode.TASKBOARD && (
                 <div className="h-full glass-panel rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                    <TaskBoard />
                 </div>
              )}

              {view === ViewMode.AVATAR_STUDIO && (
                <div className="h-full glass-panel rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                  <AvatarStudio 
                    currentIdentity={identity} 
                    onUpdateIdentity={setIdentity}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}