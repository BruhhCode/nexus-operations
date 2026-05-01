import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { Task } from '../types';
import { cn } from '../lib/utils';
import { Plus, Trash2, CheckCircle, Clock, AlertCircle, PlayCircle } from 'lucide-react';

export default function Tasks() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState<{ title: string; status: Task['status']; priority: Task['priority'] }>({ 
    title: '', 
    status: 'todo', 
    priority: 'medium' 
  });

  useEffect(() => {
    const q = query(collection(db, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });
    return () => unsubscribe();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newTask.title) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        creatorId: profile.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewTask({ title: '', status: 'todo', priority: 'medium' });
      setIsAdding(false);
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (id: string, status: Task['status']) => {
    await updateDoc(doc(db, 'tasks', id), { status, updatedAt: serverTimestamp() });
  };

  const deleteTask = async (id: string) => {
    if (confirm('DESTRUCTIVE_ACTION: Confirm deletion?')) {
      await deleteDoc(doc(db, 'tasks', id));
    }
  };

  const statusIcons = {
    'todo': <Clock className="w-3 h-3" />,
    'in-progress': <PlayCircle className="w-3 h-3 text-blue-500" />,
    'review': <AlertCircle className="w-3 h-3 text-orange-500" />,
    'done': <CheckCircle className="w-3 h-3 text-green-500" />
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Board</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and orchestrate tactical task execution.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={cn(
            "btn-primary shadow-lg",
            isAdding ? "bg-slate-200 text-slate-600 hover:bg-slate-300 shadow-none" : "shadow-indigo-100"
          )}
        >
          {isAdding ? 'Discard Draft' : (
            <>
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddTask} className="card-sleek p-8 bg-white space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Task Title</label>
              <input 
                autoFocus
                placeholder="What needs to be done?"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Priority Level</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newTask.priority}
                onChange={e => setNewTask({...newTask, priority: e.target.value as Task['priority']})}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full btn-primary justify-center py-4 text-xs tracking-widest shadow-lg shadow-indigo-100">
            COMMIT TASK TO BOARD
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(['todo', 'in-progress', 'review', 'done'] as const).map((status) => {
          const colTasks = tasks.filter(t => t.status === status);
          return (
            <div key={status} className="space-y-4">
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                   <div className={cn(
                     "w-2 h-2 rounded-full",
                     status === 'done' ? "bg-emerald-500" : status === 'in-progress' ? "bg-indigo-500" : "bg-slate-300"
                   )} />
                   {status.replace('-', ' ')}
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              
              <div className="space-y-3 min-h-[400px]">
                {colTasks.map(task => (
                  <div key={task.id} className="card-sleek p-5 group flex flex-col gap-4 relative">
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="absolute top-2 right-2 p-1 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-3">{task.title}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                       <span className={cn(
                         "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                         task.priority === 'urgent' ? "bg-red-50 text-red-600" :
                         task.priority === 'high' ? "bg-amber-50 text-amber-600" :
                         "bg-slate-50 text-slate-400"
                       )}>
                         {task.priority}
                       </span>
                       <select 
                         className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer outline-none uppercase tracking-wide"
                         value={task.status}
                         onChange={e => updateStatus(task.id, e.target.value as Task['status'])}
                       >
                         <option value="todo">To Do</option>
                         <option value="in-progress">Progress</option>
                         <option value="review">Review</option>
                         <option value="done">Done</option>
                       </select>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="border-2 border-dashed border-slate-100 rounded-2xl p-8 flex flex-col items-center justify-center opacity-40">
                    <Clock className="w-6 h-6 mb-2 text-slate-200" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center">No Tasks Found</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
