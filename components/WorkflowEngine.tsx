import React, { useState } from 'react';
import { Workflow, Zap, ArrowRight, Bot, Database, Mail, MessageSquare, Play, Pause, Activity, Layers, Cpu, FileText, X, Loader2, Check, Inbox } from 'lucide-react';
import { geminiService } from '../services/gemini';
import { db } from '../services/db';
import { Task } from '../types';

interface AutomationRule {
  id: string;
  name: string;
  trigger: { type: string; icon: any; label: string };
  action: { type: string; icon: any; label: string };
  status: 'ACTIVE' | 'PAUSED';
  lastRun: string;
  efficiency: number;
  description?: string;
}

const MOCK_WORKFLOWS: AutomationRule[] = [
  {
    id: '1',
    name: 'Contextual Memory Sync',
    trigger: { type: 'CHAT', icon: MessageSquare, label: 'After We Chat' },
    action: { type: 'DB', icon: Database, label: 'Remember Key Details' },
    status: 'ACTIVE',
    lastRun: '2m ago',
    efficiency: 98,
    description: 'Automatically commits important conversation details to long-term memory.'
  },
  {
    id: '2',
    name: 'Smart Task Extraction',
    trigger: { type: 'MAIL', icon: Mail, label: 'New Email' },
    action: { type: 'AGENT', icon: Bot, label: 'Plan My Day' },
    status: 'ACTIVE',
    lastRun: 'Pending',
    efficiency: 94,
    description: 'Analyzes email content to extract tasks and schedule items.'
  },
  {
    id: '3',
    name: 'Daily Reflection Loop',
    trigger: { type: 'TIME', icon: Activity, label: 'Every 8:00 PM' },
    action: { type: 'GENERATE', icon: Zap, label: 'Ask Me How Day Went' },
    status: 'PAUSED',
    lastRun: '1d ago',
    efficiency: 89,
    description: 'Initiates a reflective chat session to track mood and progress.'
  }
];

export const WorkflowEngine: React.FC = () => {
  const [workflows, setWorkflows] = useState(MOCK_WORKFLOWS);
  
  // Extraction State
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<{tasks: any[], summary: string, sentiment: string} | null>(null);

  const toggleStatus = (id: string) => {
    setWorkflows(prev => prev.map(w => 
      w.id === id ? { ...w, status: w.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : w
    ));
  };

  const handleRunWorkflow = (id: string) => {
    if (id === '2') {
      setActiveWorkflowId(id);
      setEmailInput('');
      setExtractionResult(null);
    }
  };

  const handleExtract = async () => {
    if (!emailInput.trim()) return;
    setIsProcessing(true);
    
    try {
      // Call Gemini Service
      const result = await geminiService.analyzeContent(`
        EMAIL CONTENT:
        ${emailInput}
        
        INSTRUCTIONS:
        1. Summarize the intent of this email.
        2. Extract actionable tasks.
        3. Determine sentiment.
      `);
      
      setExtractionResult(result);

      // Auto-save tasks to DB
      const user = db.getCurrentUser();
      if (user && result.tasks && Array.isArray(result.tasks)) {
         result.tasks.forEach((t: any) => {
            const newTask: Task = {
               id: Date.now().toString() + Math.random().toString().slice(2,5),
               title: t.title || "Untitled Extracted Task",
               status: 'INBOX',
               priority: (t.priority?.toUpperCase() === 'HIGH' || t.priority?.toUpperCase() === 'MEDIUM' || t.priority?.toUpperCase() === 'LOW') ? t.priority.toUpperCase() : 'MEDIUM',
               tags: ['Email', 'Extracted'],
               userId: user.id
            };
            db.addTask(user.id, newTask);
         });
      }

    } catch (e) {
      console.error("Extraction Failed", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const closeOverlay = () => {
    setActiveWorkflowId(null);
    setExtractionResult(null);
  };

  return (
    <div className="h-full flex flex-col bg-navy-950/50 backdrop-blur-sm rounded-[2rem] border border-white/5 overflow-hidden p-6 md:p-10 relative">
      
      <div className="mb-10 space-y-2">
        <h2 className="text-3xl font-light text-white flex items-center gap-3">
          <Workflow className="w-8 h-8 text-neon-pink" />
          Habits & Routines
        </h2>
        <p className="text-gray-400 font-mono text-sm max-w-2xl">
          Let's build a better version of you. I can automatically organize your thoughts, remind you of healthy habits, or prepare your daily brief.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 overflow-y-auto custom-scrollbar pb-20">
        {workflows.map((flow) => (
          <div key={flow.id} className="group relative bg-navy-900/60 border border-white/5 rounded-2xl p-6 transition-all hover:border-neon-pink/30 hover:shadow-[0_0_30px_rgba(217,70,239,0.1)]">
            
            {/* Background Circuit Lines */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none opacity-20">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              
              {/* Left: Info */}
              <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-3 mb-2">
                   <div className={`w-2 h-2 rounded-full ${flow.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                   <h3 className="text-lg font-medium text-white">{flow.name}</h3>
                 </div>
                 <p className="text-xs text-gray-400 mb-3">{flow.description}</p>
                 <div className="flex items-center gap-4 text-xs font-mono text-gray-500 uppercase tracking-wider">
                   <span>Last Active: {flow.lastRun}</span>
                   <span className="text-neon-cyan">Success Rate: {flow.efficiency}%</span>
                 </div>
              </div>

              {/* Center: Visualization */}
              <div className="flex items-center gap-4 flex-1 justify-center w-full md:w-auto bg-black/20 p-4 rounded-xl border border-white/5">
                
                {/* Trigger */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-navy-800 border border-white/10 flex items-center justify-center group-hover:border-neon-pink/50 transition-colors">
                    <flow.trigger.icon className="w-5 h-5 text-gray-300" />
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono uppercase">{flow.trigger.type}</span>
                </div>

                {/* Connector */}
                <div className="flex-1 flex flex-col items-center gap-1 min-w-[60px]">
                  <div className={`h-[2px] w-full ${flow.status === 'ACTIVE' ? 'bg-gradient-to-r from-gray-700 via-neon-pink to-gray-700 animate-pulse' : 'bg-gray-800'}`}></div>
                  <ArrowRight className="w-4 h-4 text-gray-600" />
                </div>

                {/* Action */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-navy-800 border border-white/10 flex items-center justify-center group-hover:border-neon-cyan/50 transition-colors">
                    <flow.action.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono uppercase">{flow.action.type}</span>
                </div>

              </div>

              {/* Right: Controls */}
              <div className="flex items-center gap-3">
                 {flow.id === '2' && (
                   <button
                     onClick={() => handleRunWorkflow(flow.id)}
                     className="px-4 py-3 rounded-xl border border-white/10 hover:bg-neon-pink/10 hover:border-neon-pink/50 hover:text-neon-pink text-gray-300 text-xs font-mono uppercase tracking-wider transition-all"
                   >
                     Test Run
                   </button>
                 )}
                 
                 <button 
                   onClick={() => toggleStatus(flow.id)}
                   className={`p-3 rounded-xl border transition-all ${
                     flow.status === 'ACTIVE' 
                       ? 'bg-neon-pink/10 border-neon-pink/50 text-neon-pink hover:bg-neon-pink/20' 
                       : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                   }`}
                 >
                   {flow.status === 'ACTIVE' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                 </button>
              </div>

            </div>
          </div>
        ))}

        {/* Add New Placeholder */}
        <button className="w-full py-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-neon-blue hover:border-neon-blue/30 hover:bg-neon-blue/5 transition-all group">
           <Layers className="w-8 h-8 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
           <span className="text-sm font-mono uppercase tracking-widest">Create New Routine</span>
        </button>
      </div>

      <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center text-xs font-mono text-gray-500">
         <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            <span>Pattern Recognition Active</span>
         </div>
         <div>Active Habits: 3/5</div>
      </div>

      {/* --- EMAIL EXTRACTION OVERLAY --- */}
      {activeWorkflowId === '2' && (
        <div className="absolute inset-0 z-50 bg-navy-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
           <button onClick={closeOverlay} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
           </button>

           <div className="w-full max-w-2xl bg-navy-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
              
              <div className="p-6 border-b border-white/5 bg-navy-800/50 flex items-center gap-4">
                 <div className="p-3 rounded-lg bg-neon-pink/10 text-neon-pink">
                    <Bot className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-lg font-light text-white">Extraction Agent</h3>
                    <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Gemini 2.5 Flash • Context Window 32k</div>
                 </div>
              </div>

              {!extractionResult ? (
                <div className="flex-1 p-6 flex flex-col gap-4">
                   <p className="text-sm text-gray-400">Paste an email below. I will analyze sentiment, summarize content, and auto-add tasks to your inbox.</p>
                   <textarea
                     value={emailInput}
                     onChange={(e) => setEmailInput(e.target.value)}
                     placeholder="Subject: Project Update..."
                     className="flex-1 w-full bg-navy-950 border border-white/10 rounded-xl p-4 text-sm font-mono text-gray-300 focus:border-neon-pink focus:ring-1 focus:ring-neon-pink resize-none min-h-[200px]"
                   />
                   <div className="flex justify-end">
                      <button 
                        onClick={handleExtract}
                        disabled={isProcessing || !emailInput.trim()}
                        className="px-6 py-3 rounded-xl bg-neon-pink text-white font-medium shadow-lg hover:shadow-neon-pink/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                         {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                         {isProcessing ? 'Analyzing...' : 'Extract Tasks'}
                      </button>
                   </div>
                </div>
              ) : (
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                   <div className="flex items-center gap-2 mb-6 text-green-400 bg-green-500/10 px-4 py-2 rounded-lg w-fit border border-green-500/20">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-mono uppercase tracking-wider">Extraction Complete</span>
                   </div>

                   <div className="space-y-6">
                      
                      {/* Summary Section */}
                      <div className="space-y-2">
                         <h4 className="text-xs font-mono uppercase tracking-widest text-gray-500">Summary</h4>
                         <p className="text-sm text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                            {extractionResult.summary}
                         </p>
                      </div>

                      {/* Extracted Tasks */}
                      <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <h4 className="text-xs font-mono uppercase tracking-widest text-gray-500">Action Items Added</h4>
                            <span className="text-xs text-neon-cyan flex items-center gap-1">
                               <Inbox className="w-3 h-3" />
                               Saved to Inbox
                            </span>
                         </div>
                         <div className="grid gap-2">
                            {extractionResult.tasks?.map((task: any, idx: number) => (
                               <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-navy-950 border border-white/5">
                                  <div className="flex items-center gap-3">
                                     <div className={`w-1.5 h-1.5 rounded-full ${
                                        task.priority === 'HIGH' ? 'bg-red-500' : 
                                        task.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                                     }`}></div>
                                     <span className="text-sm text-white">{task.title}</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-gray-500 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                                     {task.priority}
                                  </span>
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* Sentiment */}
                      <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                         <span className="text-xs font-mono uppercase tracking-widest text-gray-500">Detected Sentiment:</span>
                         <span className="text-sm text-white font-medium capitalize">{extractionResult.sentiment}</span>
                      </div>

                   </div>

                   <div className="mt-8 flex justify-end">
                      <button 
                         onClick={() => { setExtractionResult(null); setEmailInput(''); }}
                         className="px-4 py-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-xs font-mono uppercase"
                      >
                         Process Another
                      </button>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

    </div>
  );
};