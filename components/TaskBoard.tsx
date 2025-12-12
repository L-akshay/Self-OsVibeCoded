import React, { useState, useEffect } from 'react';
import { Plus, GripVertical, MoreHorizontal, CheckCircle2, Circle, Clock, Archive, Layers, Zap, Trash2, CalendarDays } from 'lucide-react';
import { Task } from '../types';
import { db } from '../services/db';

const COLUMNS: { id: Task['status']; label: string; icon: any; color: string; bg: string; border: string }[] = [
  { id: 'INBOX', label: 'Inbox', icon: Layers, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  { id: 'TODAY', label: 'Today', icon: Zap, color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/20' },
  { id: 'NEXT', label: 'Up Next', icon: Clock, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20' },
  { id: 'BACKLOG', label: 'Backlog', icon: Archive, color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20' },
  { id: 'DONE', label: 'Completed', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
];

interface TaskBoardProps {
  onInteraction: (type: 'TASK') => void;
  userId: string;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ onInteraction, userId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [newTaskInput, setNewTaskInput] = useState('');

  useEffect(() => {
    const loadedTasks = db.getTasks(userId);
    setTasks(loadedTasks);
  }, [userId]);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent ghost image could be set here
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    if (draggedTaskId) {
      const updatedTasks = tasks.map(t => 
        t.id === draggedTaskId ? { ...t, status } : t
      );
      setTasks(updatedTasks);
      db.saveTasks(userId, updatedTasks);

      if (status === 'DONE') {
        onInteraction('TASK');
      }
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
      tags: ['New'],
      userId
    };

    const newTasks = [newTask, ...tasks];
    setTasks(newTasks);
    db.saveTasks(userId, newTasks);
    setNewTaskInput('');
    onInteraction('TASK');
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Delete this task?')) {
        const updatedTasks = tasks.filter(t => t.id !== taskId);
        setTasks(updatedTasks);
        db.saveTasks(userId, updatedTasks);
    }
  };

  return (
    <div className="h-full flex flex-col bg-navy-950/50 backdrop-blur-sm rounded-[2rem] border border-white/5 overflow-hidden">
      
      {/* Header / Smart Add */}
      <div className="p-6 border-b border-white/5 bg-navy-900/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neon-blue/10">
            <CalendarDays className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
             <h2 className="text-xl font-light tracking-wide text-white">Task Matrix</h2>
             <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Drag & Drop Organization</div>
          </div>
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
             className="w-full bg-navy-950/80 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-neon-blue focus:border-neon-blue/50 transition-all shadow-inner font-light"
           />
           <div className="absolute inset-y-0 right-2 flex items-center">
             <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-gray-500 font-mono opacity-0 group-focus-within:opacity-100 transition-opacity">ENTER</span>
           </div>
        </form>

        <div className="flex gap-2">
           <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-mono text-gray-400">
              {tasks.filter(t => t.status === 'DONE').length} / {tasks.length} Done
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
                 className={`flex flex-col w-80 h-full rounded-2xl border transition-colors duration-300 ${
                     draggedTaskId ? 'bg-white/[0.03] border-white/10' : 'bg-transparent border-white/5'
                 }`}
                 onDragOver={handleDragOver}
                 onDrop={(e) => handleDrop(e, col.id)}
               >
                 {/* Column Header */}
                 <div className={`p-4 flex items-center justify-between border-b border-white/5 ${col.bg} rounded-t-2xl`}>
                    <div className="flex items-center gap-2">
                       <col.icon className={`w-4 h-4 ${col.color}`} />
                       <span className="text-sm font-medium text-gray-200">{col.label}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] text-gray-400 font-mono border border-white/5">
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
                        className={`group relative p-4 rounded-xl bg-navy-800/60 border border-white/5 hover:bg-navy-800 hover:border-neon-blue/30 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-lg hover:-translate-y-1 ${
                            draggedTaskId === task.id ? 'opacity-50 scale-95 border-dashed border-neon-blue/50' : ''
                        }`}
                      >
                         <div className="flex justify-between items-start mb-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider border uppercase ${
                              task.priority === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              task.priority === 'MEDIUM' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                              'bg-green-500/10 text-green-400 border-green-500/20'
                            }`}>
                              {task.priority}
                            </span>
                            
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1 hover:bg-white/10 rounded transition-colors text-gray-500 hover:text-white">
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                    className="p-1 hover:bg-red-500/20 rounded transition-colors text-gray-500 hover:text-red-400"
                                    title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                         </div>
                         
                         <h4 className="text-sm text-gray-200 font-normal leading-relaxed mb-3">
                           {task.title}
                         </h4>
                         
                         <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                            <div className="flex flex-wrap gap-1.5">
                                {task.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] text-gray-500 font-mono">
                                    #{tag}
                                </span>
                                ))}
                            </div>
                            {col.id === 'DONE' && <CheckCircle2 className="w-4 h-4 text-green-500/50" />}
                         </div>

                         {/* Hover Grip Indication */}
                         <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-20 text-white pointer-events-none">
                           <GripVertical className="w-4 h-4" />
                         </div>
                      </div>
                    ))}
                    
                    {colTasks.length === 0 && (
                       <div className="h-24 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl text-gray-600 text-[10px] font-mono uppercase tracking-widest opacity-50 hover:opacity-80 transition-opacity">
                          Drop Here
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