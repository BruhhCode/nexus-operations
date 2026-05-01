import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { Project, Client } from '../types';
import { Briefcase, ExternalLink, Trash2, Link as LinkIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', clientId: '', driveUrl: '', status: 'active' as Project['status'] });

  useEffect(() => {
    const qP = query(collection(db, 'projects'));
    const unsubP = onSnapshot(qP, (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Project[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    const qC = query(collection(db, 'clients'));
    const unsubC = onSnapshot(qC, (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Client[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clients');
    });

    return () => { unsubP(); unsubC(); };
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.clientId) return;
    try {
      await addDoc(collection(db, 'projects'), {
        ...newProject,
        members: [],
        createdAt: serverTimestamp(),
      });
      setNewProject({ name: '', description: '', clientId: '', driveUrl: '', status: 'active' });
      setIsAdding(false);
    } catch (e) { console.error(e); }
  };

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'UNKNOWN_CLIENT';

  return (
    <div className="space-y-8">
       <div className="flex items-end justify-between border-b-2 border-[#141414] pb-4">
        <div>
          <h2 className="font-mono text-xs uppercase opacity-50 mb-1">Portfolio_Registry</h2>
          <h1 className="font-serif italic text-4xl leading-none">Active Projects</h1>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#141414] text-white px-6 py-2 text-xs font-mono uppercase tracking-widest hover:bg-white hover:text-[#141414] border border-[#141414] transition-all"
        >
          {isAdding ? 'HALT_INIT' : 'Initiate_Project+'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddProject} className="border-2 border-[#141414] p-6 bg-white space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="PROJECT_NAME*" className="bg-[#E4E3E0] p-3 text-xs font-mono uppercase" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
            <select className="bg-[#E4E3E0] p-3 text-xs font-mono uppercase" value={newProject.clientId} onChange={e => setNewProject({...newProject, clientId: e.target.value})}>
              <option value="">SELECT_CLIENT*</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <textarea placeholder="DESCRIPTION" className="bg-[#E4E3E0] p-3 text-xs font-mono uppercase md:col-span-2" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
            <input placeholder="DRIVE_SYMLINK" className="bg-[#E4E3E0] p-3 text-xs font-mono uppercase md:col-span-2" value={newProject.driveUrl} onChange={e => setNewProject({...newProject, driveUrl: e.target.value})} />
          </div>
          <button type="submit" className="w-full bg-[#141414] text-white py-3 text-xs font-mono uppercase tracking-widest">
            AUTHORIZE_DEPLOYMENT
          </button>
        </form>
      )}

      <div className="space-y-4">
        {projects.map((proj) => (
          <div key={proj.id} className="border border-[#141414] p-6 bg-white flex items-center justify-between group hover:shadow-[8px_8px_0px_0px_#141414] transition-all relative">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 opacity-50" />
                <h3 className="font-bold text-lg uppercase tracking-tight">{proj.name}</h3>
              </div>
              <p className="font-mono text-[10px] uppercase opacity-50">
                {getClientName(proj.clientId)} // STATUS: {proj.status}
              </p>
              {proj.driveUrl && (
                <a href={proj.driveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-mono text-[8px] uppercase text-blue-600 hover:underline mt-2">
                  <LinkIcon className="w-2 h-2" />
                  DRIVE_REPOSITORY_LINK
                </a>
              )}
            </div>
            
            <div className="flex items-center gap-6">
               <div className="text-right">
                  <p className="font-mono text-[8px] uppercase opacity-40 mb-1">MEMBER_LIST</p>
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-[#141414] text-white text-[8px] flex items-center justify-center font-mono">+</div>
                  </div>
               </div>
               <button className="bg-[#141414] text-white px-4 py-2 text-[10px] font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity uppercase">
                  View_Specs
               </button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="p-12 border border-dashed border-[#141414]/20 text-center opacity-20 font-mono text-[10px] uppercase">
            NO_ACTIVE_PROJECTS_FOUND
          </div>
        )}
      </div>
    </div>
  );
}
