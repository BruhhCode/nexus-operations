import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';
import { Circle, Users, Shield, User, Wifi, WifiOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';

interface UserPresence {
  uid: string;
  isOnline: boolean;
  lastSeen: Date;
}

export default function Team() {
  const { user, profile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [presence, setPresence] = useState<Record<string, UserPresence>>({});

  // Debug: Show current user's presence status
  const currentUserPresence = user ? presence[user.uid] : null;

  useEffect(() => {
    // Fetch all team members
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      })) as UserProfile[];
      setTeamMembers(members);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Track presence for each team member
    const presenceRefs: any[] = [];

    teamMembers.forEach(member => {
      const presenceRef = doc(db, 'presence', member.uid);
      const unsubscribe = onSnapshot(presenceRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          console.log(`Presence update for ${member.displayName}:`, data);
          setPresence(prev => ({
            ...prev,
            [member.uid]: {
              uid: member.uid,
              isOnline: data.isOnline || false,
              lastSeen: data.lastSeen?.toDate() || new Date()
            }
          }));
        } else {
          // No presence document exists, assume offline
          console.log(`No presence data for ${member.displayName}, setting offline`);
          setPresence(prev => ({
            ...prev,
            [member.uid]: {
              uid: member.uid,
              isOnline: false,
              lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
            }
          }));
        }
      }, (error) => {
        console.error('Error tracking presence for', member.displayName, error);
        // On error, assume offline
        setPresence(prev => ({
          ...prev,
          [member.uid]: {
            uid: member.uid,
            isOnline: false,
            lastSeen: new Date()
          }
        }));
      });

      presenceRefs.push(unsubscribe);
    });

    return () => {
      presenceRefs.forEach(unsubscribe => unsubscribe());
    };
  }, [teamMembers]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'member':
        return <User className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-700 bg-red-50';
      case 'member':
        return 'text-blue-700 bg-blue-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const updateMyPresence = async (isOnline: boolean) => {
    if (!user) return;
    
    try {
      const presenceRef = doc(db, 'presence', user.uid);
      await setDoc(presenceRef, {
        isOnline: isOnline,
        lastSeen: serverTimestamp()
      });
      console.log(`Manually set presence to ${isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor team member status and availability.</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Debug: Current user status */}
          {currentUserPresence && (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm">
              <Circle className={cn(
                "w-2 h-2",
                currentUserPresence.isOnline ? "fill-emerald-500 text-emerald-500" : "fill-slate-300 text-slate-300"
              )} />
              <span className="font-medium">You: {currentUserPresence.isOnline ? 'Online' : 'Offline'}</span>
              <div className="flex gap-1 ml-2">
                <button 
                  onClick={() => updateMyPresence(true)}
                  className="px-2 py-1 bg-emerald-500 text-white text-xs rounded hover:bg-emerald-600"
                >
                  Online
                </button>
                <button 
                  onClick={() => updateMyPresence(false)}
                  className="px-2 py-1 bg-slate-500 text-white text-xs rounded hover:bg-slate-600"
                >
                  Offline
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Users className="w-4 h-4" />
            <span>{teamMembers.length} members</span>
          </div>
        </div>
      </div>

      <div className="card-sleek">
        <div className="overflow-hidden border border-slate-100 rounded-xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamMembers.map((member) => {
                const memberPresence = presence[member.uid];
                const isOnline = memberPresence?.isOnline || false;

                return (
                  <tr key={member.uid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {member.photoURL ? (
                            <img
                              src={member.photoURL}
                              alt={member.displayName}
                              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm">
                              {member.displayName?.slice(0, 2).toUpperCase() || '??'}
                            </div>
                          )}
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white",
                            isOnline ? "bg-emerald-500" : "bg-slate-300"
                          )} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{member.displayName}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.role)}
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          getRoleColor(member.role)
                        )}>
                          {member.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Circle className={cn(
                          "w-2 h-2",
                          isOnline ? "fill-emerald-500 text-emerald-500" : "fill-slate-300 text-slate-300"
                        )} />
                        <span className={cn(
                          "text-xs font-medium",
                          isOnline ? "text-emerald-700" : "text-slate-500"
                        )}>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500">
                        {memberPresence ? formatLastSeen(memberPresence.lastSeen) : 'Never'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {teamMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No team members found.</p>
          </div>
        )}
      </div>
    </div>
  );
}