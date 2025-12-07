import React, { useState } from 'react';
import { Plus, GripVertical, MoreHorizontal, CheckCircle2, Circle, Clock, Archive, Layers, Zap } from 'lucide-react';
import { Task } from '../types';
import { MOCK_TASKS } from '../constants';

const COLUMNS: { id: Task['status']; label: string; icon: any; color: string }[] = [
  { id: 'INBOX', label: 'Inbox', icon: Layers, color: 'text-gray-400' },
  { id: 'TODAY', label: 'Today', icon: Zap, color: 'text-neon-blue' },
  { id: 'NEXT', label: 'Up Next', icon: Clock, color: 'text-neon-cyan' },
  { id: 'BACKLOG', label: 'Backlog', icon: Archive, color: 'text-neon-purple' },
  { id: 'DONE', label: 'Completed', icon: CheckCircle2, color: 'text-green-500' },
];

export const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS as Task[]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [newTaskInput, setNewTaskInput] = useState('');

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image or default
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    if (draggedTaskId) {
      setTasks(prev => prev.map(t => 
        t.id === draggedTaskId ? { ...t, status } : t
      ));
      setDraggedTaskId(null);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskInput,
      status: 'INBOX',
      priority: 'MEDIUM',
      tags: ['New']
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTaskInput('');
  };

  return (
    <div className="h-full flex flex-col bg-navy-950/50 backdrop-blur-sm rounded-[2rem] border border-white/5 overflow-hidden">
      
      {/* Header / Smart Add */}
      <div className="p-6 border-b border-white/5 bg-navy-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-6 h-6 text-neon-blue" />
          <h2 className="text-xl font-light tracking-wide text-white">Task Matrix</h2>
        </div>
        
        <form onSubmit={handleAddTask} className="flex-1 max-w-xl mx-8 relative group">
           <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
             <Plus className="w-4 h-4 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
           </div>
           <input 
             type="text" 
             value={newTaskInput}
             onChange={(e) => setNewTaskInput(e.target.value)}
             placeholder="Add a new task..." 
             className="w-full bg-navy-950/80 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-neon-blue focus:border-neon-blue/50 transition-all shadow-inner"
           />
           <div className="absolute inset-y-0 right-2 flex items-center">
             <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-gray-500 font-mono">ENTER</span>
           </div>
        </form>

        <div className="flex gap-2">
           {/* Filters or View Options could go here */}
           <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-mono text-gray-400">
              {tasks.filter(t => t.status === 'DONE').length} / {tasks.length} Completed
           </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex h-full gap-6 min-w-max">
          {COLUMNS.map(col => {
             const colTasks = tasks.filter(t => t.status === col.id);
             
             return (
               <div 
                 key={col.id} 
                 className="flex flex-col w-80 h-full rounded-2xl bg-white/[0.02] border border-white/5"
                 onDragOver={handleDragOver}
                 onDrop={(e) => handleDrop(e, col.id)}
               >
                 {/* Column Header */}
                 <div className="p-4 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-2">
                       <col.icon className={`w-4 h-4 ${col.color}`} />
                       <span className="text-sm font-medium text-gray-300">{col.label}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] text-gray-500 font-mono">
                      {colTasks.length}
                    </span>
                 </div>

                 {/* Task List */}
                 <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {colTasks.map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={`group relative p-4 rounded-xl bg-navy-800/40 border border-white/5 hover:bg-navy-800/80 hover:border-white/20 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-lg ${
                            draggedTaskId === task.id ? 'opacity-50 scale-95 border-dashed border-neon-blue/50' : ''
                        }`}
                      >
                         <div className="flex justify-between items-start mb-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider border ${
                              task.priority === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              task.priority === 'MEDIUM' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                              'bg-green-500/10 text-green-400 border-green-500/20'
                            }`}>
                              {task.priority}
                            </span>
                            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity">
                               <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </button>
                         </div>
                         
                         <h4 className="text-sm text-gray-200 font-light leading-snug mb-3">
                           {task.title}
                         </h4>
                         
                         <div className="flex flex-wrap gap-1.5 mt-auto">
                            {task.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-gray-400">
                                #{tag}
                              </span>
                            ))}
                         </div>

                         {/* Hover Grip Indication */}
                         <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-20 text-white">
                           <GripVertical className="w-4 h-4" />
                         </div>
                      </div>
                    ))}
                    
                    {colTasks.length === 0 && (
                       <div className="h-24 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl text-gray-600 text-xs font-mono uppercase tracking-widest opacity-50">
                          Empty Slot
                       </div>
                    )}
                 </div>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
};