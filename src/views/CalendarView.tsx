import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Project, Task } from '../types';
import { cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const unsubP = onSnapshot(query(collection(db, 'projects')), (snap) => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Project[]));
    const unsubT = onSnapshot(query(collection(db, 'tasks')), (snap) => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Task[]));
    return () => { unsubP(); unsubT(); };
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Timeline</h1>
          <p className="text-sm text-slate-500 mt-1">Global view of enterprise benchmarks and project milestones.</p>
        </div>
        <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
          <button 
            onClick={prevMonth}
            className="p-2 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all focus:outline-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-6 flex items-center font-bold text-slate-900 text-sm min-w-[160px] justify-center tracking-tight">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <button 
            onClick={nextMonth}
            className="p-2 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all focus:outline-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="card-sleek overflow-hidden bg-white">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold text-[10px] uppercase tracking-widest text-center">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="py-4 border-r border-slate-100 last:border-r-0">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {/* Pad for first day of month */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`pad-${i}`} className="h-32 border-r border-b border-slate-100 bg-slate-50/20 last:border-r-0" />
          ))}

          {days.map((day) => {
            const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className="h-32 border-r border-b border-slate-100 p-4 relative group hover:bg-slate-50/50 last:border-r-0 transition-colors">
                 <span className={cn(
                   "text-xs font-bold transition-all",
                   isToday ? "bg-indigo-600 text-white w-7 h-7 flex items-center justify-center rounded-lg shadow-lg shadow-indigo-100" : "text-slate-400"
                 )}>
                   {format(day, 'd')}
                 </span>
                 <div className="mt-3 space-y-1.5">
                   {dayTasks.map(t => (
                     <div key={t.id} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-[9px] font-bold border border-indigo-100/50 truncate shadow-sm">
                        {t.title}
                     </div>
                   ))}
                 </div>
              </div>
            );
          })}

          {/* Pad for last day of month */}
          {Array.from({ length: (6 - monthEnd.getDay()) }).map((_, i) => (
            <div key={`end-pad-${i}`} className="h-32 border-r border-b border-slate-100 bg-slate-50/20 last:border-r-0" />
          ))}
        </div>
      </div>

      <div className="flex gap-8 justify-center">
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-lg shadow-indigo-100" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Milestones</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Standard Interval</span>
         </div>
      </div>
    </div>
  );
}
