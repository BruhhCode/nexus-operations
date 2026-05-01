import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, ShieldCheck } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { Message } from '../types';
import { cn } from '../lib/utils';

export default function TeamChat() {
  const { profile } = useAuth();
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'chat_rooms', 'global', 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(fetchedMessages);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chat_rooms/global/messages');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim() || !profile) return;

    try {
      await addDoc(collection(db, 'chat_rooms', 'global', 'messages'), {
        senderId: profile.uid,
        senderName: profile.displayName,
        text: msg.trim(),
        timestamp: serverTimestamp(),
        roomId: 'global'
      });
      setMsg('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chat_rooms/global/messages');
    }
  };

  return (
    <div className="h-[calc(100vh-14rem)] flex flex-col border border-[#141414] bg-white">
       <div className="p-4 border-b border-[#141414] bg-[#141414] text-white flex justify-between items-center">
         <div>
          <h2 className="font-mono text-xs uppercase tracking-widest font-bold">Channel: GLOBAL_COMM</h2>
          <p className="font-mono text-[8px] opacity-50 uppercase mt-0.5">SECURE_LINE ACTIVE // DATA_SYNC ENABLED</p>
         </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
        {messages.map((m) => (
          <div key={m.id} className={cn("max-w-[80%] flex flex-col gap-1", m.senderId === profile?.uid ? 'ml-auto items-end' : 'items-start')}>
             <div className="flex items-center gap-2 font-mono text-[8px] uppercase opacity-40">
               <span>{m.senderName}</span>
               <span>{m.timestamp?.toDate() ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(m.timestamp.toDate()) : '...'}</span>
             </div>
             <div className={cn(
               "px-4 py-3 text-xs leading-relaxed border border-[#141414]", 
               m.senderId === profile?.uid ? 'bg-[#141414] text-white' : 'bg-white'
             )}>
               {m.text}
             </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center opacity-20 flex-col gap-4">
             <div className="font-mono text-[10px] uppercase">COMM_BUFFER_EMPTY</div>
             <div className="w-12 h-px bg-[#141414]" />
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-[#141414] flex gap-4 bg-[#E4E3E0]/30">
        <input 
          type="text" 
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="ENTER_MESSAGE..." 
          className="flex-1 bg-white border border-[#141414] px-4 py-3 text-xs font-mono placeholder:opacity-30 focus:outline-none"
        />
        <button type="submit" className="bg-[#141414] text-white p-3 hover:bg-white hover:text-[#141414] border border-[#141414] transition-all">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
