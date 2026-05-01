import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { Invoice, Client, Project } from '../types';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { CreditCard, DollarSign, FileText, Trash2 } from 'lucide-react';

export default function Finances() {
  const { isAdmin } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ amount: 0, clientId: '', projectId: '', status: 'draft' as Invoice['status'], dueDate: '' });

  useEffect(() => {
    const unsubI = onSnapshot(query(collection(db, 'invoices')), (snap) => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Invoice[]);
    });
    const unsubC = onSnapshot(query(collection(db, 'clients')), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Client[]);
    });
    const unsubP = onSnapshot(query(collection(db, 'projects')), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Project[]);
    });
    return () => { unsubI(); unsubC(); unsubP(); };
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.amount || !newInvoice.clientId) return;
    try {
      await addDoc(collection(db, 'invoices'), {
        ...newInvoice,
        currency: 'USD',
        createdAt: serverTimestamp(),
      });
      setNewInvoice({ amount: 0, clientId: '', projectId: '', status: 'draft', dueDate: '' });
      setIsAdding(false);
    } catch (e) { console.error(e); }
  };

  const deleteInvoice = async (id: string) => {
    if (confirm('DESTRUCTIVE_ACTION: Revoke invoice?')) {
      await deleteDoc(doc(db, 'invoices', id));
    }
  };

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'UNKNOWN';

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.amount, 0);
  const outstandingRevenue = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-8">
       <div className="flex items-end justify-between border-b-2 border-[#141414] pb-4">
        <div>
          <h2 className="font-mono text-xs uppercase opacity-50 mb-1">Capital_Ledger</h2>
          <h1 className="font-serif italic text-4xl leading-none">Financial Tracking</h1>
        </div>
        <div className="flex gap-4">
          <button 
             onClick={() => setIsAdding(!isAdding)}
             className="bg-[#141414] text-white px-6 py-2 text-xs font-mono uppercase tracking-widest hover:bg-white hover:text-[#141414] border border-[#141414] transition-all"
          >
            {isAdding ? 'CANCEL_ISSUE' : 'Issue_Invoice+'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'TOTAL_CLEARED', value: formatCurrency(totalRevenue), trend: 'DEPOSITED' },
          { label: 'OUTSTANDING', value: formatCurrency(outstandingRevenue), trend: `${invoices.filter(i => i.status !== 'paid').length} INVOICES` },
          { label: 'PENDING_DRAFTS', value: formatCurrency(invoices.filter(i => i.status === 'draft').reduce((acc, i) => acc + i.amount, 0)), trend: 'NOT_SENT' },
          { label: 'INVOICE_TTL', value: invoices.length, trend: 'TOTAL_RECORDS' },
        ].map((stat, i) => (
          <div key={i} className="border border-[#141414] bg-white p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.05)]">
            <p className="font-mono text-[9px] opacity-50 uppercase tracking-widest mb-4">{stat.label}</p>
            <p className="text-2xl font-bold tracking-tighter">{stat.value}</p>
            <p className="font-mono text-[9px] opacity-40 mt-1 uppercase">{stat.trend}</p>
          </div>
        ))}
      </div>

      {isAdding && (
        <form onSubmit={handleCreateInvoice} className="border-2 border-[#141414] p-6 bg-white space-y-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="number" placeholder="AMOUNT*" className="bg-[#E4E3E0] p-3 text-xs font-mono uppercase" value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: Number(e.target.value)})} />
            <select className="bg-[#E4E3E0] p-3 text-xs font-mono uppercase" value={newInvoice.clientId} onChange={e => setNewInvoice({...newInvoice, clientId: e.target.value})}>
              <option value="">SELECT_CLIENT*</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" className="bg-[#E4E3E0] p-3 text-xs font-mono uppercase" value={newInvoice.dueDate} onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})} />
            <select className="bg-[#E4E3E0] p-3 text-xs font-mono uppercase" value={newInvoice.status} onChange={e => setNewInvoice({...newInvoice, status: e.target.value as Invoice['status']})}>
              <option value="draft">DRAFT</option>
              <option value="sent">SENT</option>
              <option value="paid">PAID</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-[#141414] text-white py-3 text-xs font-mono uppercase tracking-widest">
            COMMIT_INVOICE
          </button>
        </form>
      )}

      <div className="border border-[#141414] bg-white">
        <div className="p-4 bg-[#141414] text-white font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
           <FileText className="w-3 h-3" />
           Recent_Invoices
        </div>
        <div className="divide-y divide-[#141414]">
           {invoices.map((inv) => (
             <div key={inv.id} className="p-4 flex items-center justify-between text-xs hover:bg-[#f5f5f5] group">
               <div className="flex items-center gap-6">
                 <span className="font-mono opacity-50 uppercase text-[9px]">{inv.id.slice(0, 8)}</span>
                 <span className="font-bold uppercase tracking-tight">{getClientName(inv.clientId)}</span>
               </div>
               <div className="flex items-center gap-8">
                 <span className="font-mono font-bold">{formatCurrency(inv.amount)}</span>
                 <span className="font-mono text-[9px] opacity-40 uppercase">DUE: {inv.dueDate || 'N/A'}</span>
                 <span className={cn(
                   "px-2 py-1 border border-[#141414] font-mono text-[9px] uppercase tracking-tighter transition-colors", 
                   inv.status === 'paid' ? 'bg-[#141414] text-white' : 
                   inv.status === 'overdue' ? 'bg-red-500 text-white border-red-500' : 'bg-white'
                 )}>
                   {inv.status}
                 </span>
                 {isAdmin && (
                   <button 
                     onClick={() => deleteInvoice(inv.id)}
                     className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Trash2 className="w-3 h-3" />
                   </button>
                 )}
               </div>
             </div>
           ))}
           {invoices.length === 0 && (
             <div className="p-12 text-center opacity-20 font-mono text-[10px] uppercase">LEDGER_EMPTY</div>
           )}
        </div>
      </div>
    </div>
  );
}
