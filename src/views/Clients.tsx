import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { Client } from '../types';
import { Trash2, Plus, Search } from 'lucide-react';

export default function Clients() {
  const { isAdmin } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [newClient, setNewClient] = useState({ name: '', company: '', email: '', phone: '' });

  useEffect(() => {
    const q = query(collection(db, 'clients'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[]);
    });
    return () => unsubscribe();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name) return;
    try {
      await addDoc(collection(db, 'clients'), {
        ...newClient,
        createdAt: serverTimestamp(),
      });
      setNewClient({ name: '', company: '', email: '', phone: '' });
      setIsAdding(false);
    } catch (e) { console.error(e); }
  };

  const deleteClient = async (id: string) => {
    if (confirm('DESTRUCTIVE_ACTION: Remove client from registry?')) {
      await deleteDoc(doc(db, 'clients', id));
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
       <div className="flex items-end justify-between border-b-2 border-[#141414] pb-4">
        <div>
          <h2 className="font-mono text-xs uppercase opacity-50 mb-1">Identity_Registry</h2>
          <h1 className="font-serif italic text-4xl leading-none">Global Clients</h1>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#141414] text-white px-6 py-2 text-xs font-mono uppercase tracking-widest hover:bg-white hover:text-[#141414] border border-[#141414] transition-all"
        >
          {isAdding ? 'CANCEL_REG' : 'Register_Client+'}
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          <input 
            type="text" 
            placeholder="FILTER_ENTITIES..."
            className="w-full bg-white border border-[#141414] px-10 py-3 text-xs font-mono focus:outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddClient} className="border-2 border-[#141414] p-6 bg-white space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="CLIENT_NAME*" className="bg-[#E4E3E0] p-3 text-xs font-mono uppercase" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
            <input placeholder="COMPANY_NAME" className="bg-[#E4E3E0] p-3 text-xs font-mono uppercase" value={newClient.company} onChange={e => setNewClient({...newClient, company: e.target.value})} />
            <input placeholder="EMAIL_ADDRESS" className="bg-[#E4E3E0] p-3 text-xs font-mono uppercase" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
            <input placeholder="PHONE_NUM" className="bg-[#E4E3E0] p-3 text-xs font-mono uppercase" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
          </div>
          <button type="submit" className="w-full bg-[#141414] text-white py-3 text-xs font-mono uppercase tracking-widest">
            FINALIZE_REGISTRATION
          </button>
        </form>
      )}

      <div className="border border-[#141414] bg-white overflow-hidden shadow-[8px_8px_0px_0px_rgba(20,20,20,0.05)]">
        <table className="w-full text-left font-sans">
          <thead>
            <tr className="bg-[#141414] text-[#E4E3E0] font-mono text-[10px] uppercase tracking-widest">
              <th className="p-4 border-r border-[#E4E3E0]/20">Entity</th>
              <th className="p-4 border-r border-[#E4E3E0]/20">Contact</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs divide-y divide-[#141414]">
             {filteredClients.map(client => (
               <tr key={client.id} className="hover:bg-[#f5f5f5] transition-colors group">
                <td className="p-4 border-r border-[#141414]">
                  <p className="font-bold uppercase tracking-tight">{client.name}</p>
                  <p className="text-[10px] opacity-50 uppercase font-mono">{client.company || 'INDEPENDENT_ENTITY'}</p>
                </td>
                <td className="p-4 border-r border-[#141414]">
                  <p>{client.email || 'N/A'}</p>
                  <p className="text-[10px] opacity-50 font-mono uppercase">{client.phone || 'NO_PHONE'}</p>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-4">
                    <button className="font-mono font-bold hover:underline">VIEW_DTLS</button>
                    {isAdmin && (
                      <button 
                        onClick={() => deleteClient(client.id)}
                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
             ))}
             {filteredClients.length === 0 && (
               <tr>
                 <td colSpan={3} className="p-12 text-center opacity-20 font-mono text-[10px] uppercase">REGISTRY_EMPTY</td>
               </tr>
             )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
