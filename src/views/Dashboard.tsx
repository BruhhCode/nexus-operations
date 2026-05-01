import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Task, Project, Client, Invoice } from '../types';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, Users, CheckCircle, Briefcase, Activity, FileText, Loader2 } from 'lucide-react';
import { generateOperationalReport } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const unsubT = onSnapshot(query(collection(db, 'tasks')), (snap) => setTasks(snap.docs.map(d => d.data()) as Task[]), (e) => handleFirestoreError(e, OperationType.LIST, 'tasks'));
    const unsubP = onSnapshot(query(collection(db, 'projects')), (snap) => setProjects(snap.docs.map(d => d.data()) as Project[]), (e) => handleFirestoreError(e, OperationType.LIST, 'projects'));
    const unsubC = onSnapshot(query(collection(db, 'clients')), (snap) => setClients(snap.docs.map(d => d.data()) as Client[]), (e) => handleFirestoreError(e, OperationType.LIST, 'clients'));
    const unsubI = onSnapshot(query(collection(db, 'invoices')), (snap) => setInvoices(snap.docs.map(d => d.data()) as Invoice[]), (e) => handleFirestoreError(e, OperationType.LIST, 'invoices'));
    return () => { unsubT(); unsubP(); unsubC(); unsubI(); };
  }, []);

  const handleGenerateReport = async () => {
    setGenerating(true);
    const result = await generateOperationalReport({ tasks, projects, clients, invoices });
    setReport(result);
    setGenerating(false);
  };

  const activeTasks = tasks.filter(t => t.status !== 'done').length;
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.amount, 0);
  const clientCount = clients.length;
  const projectLoad = projects.length > 0 ? Math.round((projects.filter(p => p.status === 'active').length / projects.length) * 100) : 0;

  const stats = [
    { label: 'Project Efficiency', value: '92.4%', icon: CheckCircle, progress: 92, color: 'bg-emerald-500' },
    { label: 'Total Capital', value: formatCurrency(totalRevenue), icon: TrendingUp, trend: '+12.5% from last month', color: 'text-emerald-600' },
    { label: 'Active Projects', value: projects.filter(p => p.status === 'active').length, icon: Briefcase, avatars: true },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time operational overview and performance audit.</p>
        </div>
        <button 
          onClick={handleGenerateReport}
          disabled={generating}
          className="btn-primary shadow-lg shadow-indigo-100 disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Run AI Audit
        </button>
      </div>

      {report && (
        <div className="bg-indigo-900 text-white p-8 rounded-2xl relative animate-in fade-in zoom-in-95 duration-300 shadow-xl shadow-indigo-100">
           <button 
             onClick={() => setReport(null)}
             className="absolute top-4 right-6 text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
           >
             Close_X
           </button>
           <div className="flex items-center gap-2 mb-6">
             <div className="p-2 bg-white/10 rounded-lg">
                <Activity className="w-4 h-4 text-indigo-300" />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">AI Operational Intelligence</span>
           </div>
           <div className="prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-indigo-100 prose-strong:text-white">
             <ReactMarkdown>{report}</ReactMarkdown>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card-sleek p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <stat.icon className="w-4 h-4 text-slate-300" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
            
            {stat.progress && (
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className={cn("h-full transition-all duration-1000", stat.color)} style={{ width: `${stat.progress}%` }} />
              </div>
            )}
            
            {stat.trend && (
              <p className={cn("text-[10px] font-bold mt-3 uppercase tracking-wider", stat.color)}>{stat.trend}</p>
            )}

            {stat.avatars && (
              <div className="flex mt-4 -space-x-2">
                {[1,2,3].map(i => (
                  <img key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" src={`https://ui-avatars.com/api/?name=U${i}&background=random`} />
                ))}
                <div className="w-8 h-8 rounded-full bg-slate-100 text-[10px] flex items-center justify-center font-bold text-slate-400 border-2 border-white shadow-sm">+5</div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 card-sleek flex flex-col p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-slate-900">Pending Tasks</h2>
            <button className="text-indigo-600 text-sm font-semibold hover:underline">View All</button>
          </div>
          <div className="overflow-hidden border border-slate-100 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.slice(0, 4).map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 truncate max-w-[200px]">{t.title}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        t.status === 'done' ? "bg-emerald-100 text-emerald-700" :
                        t.status === 'in-progress' ? "bg-indigo-100 text-indigo-700" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {t.status.replace('-', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2 card-sleek p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">System Log</h2>
          <div className="space-y-6">
             {tasks.slice(0, 5).map((t, i) => (
               <div key={i} className="flex gap-4 relative">
                 <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                    {i !== 4 && <div className="w-px h-full bg-slate-100 mt-2" />}
                 </div>
                 <div className="pb-6">
                   <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider leading-none mb-1">Status Transition</p>
                   <p className="text-sm font-medium text-slate-900 leading-snug">{t.title}</p>
                 </div>
               </div>
             ))}
             {tasks.length === 0 && (
               <div className="text-center py-20 opacity-20 font-mono text-xs uppercase italic">No active telemetry</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
