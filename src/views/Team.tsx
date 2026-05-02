import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
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

    console.log('Setting up presence tracking for', teamMembers.length, 'members');

    teamMembers.forEach(member => {
      const presenceRef = doc(db, 'presence', member.uid);
      console.log(`Listening to presence for ${member.displayName} (${member.uid})`);
      
      const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          console.log(`✅ Presence data for ${member.displayName}:`, {
            isOnline: data.isOnline,
            lastSeen: data.lastSeen
          });
          setPresence(prev => ({
            ...prev,
            [member.uid]: {
              uid: member.uid,
              isOnline: data.isOnline === true, // Explicitly check for true
              lastSeen: data.lastSeen?.toDate() || new Date()
            }
          }));
        } else {
          // No presence document exists
          console.log(`⚠️ No presence document for ${member.displayName}, assuming offline`);
          setPresence(prev => ({
            ...prev,
            [member.uid]: {
              uid: member.uid,
              isOnline: false,
              lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
            }
          }));
        }
      }, (error: any) => {
        console.error(`❌ Error listening to presence for ${member.displayName}:`, error.code, error.message);
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
      console.log('Cleaning up presence listeners');
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
      console.log(`Manually set presence to ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  const verifyPresenceInFirestore = async () => {
    if (!user) return;
    
    try {
      const presenceRef = doc(db, 'presence', user.uid);
      const presenceSnap = await getDoc(presenceRef);
      
      if (presenceSnap.exists()) {
        console.log('🔍 Presence doc exists in Firestore:', presenceSnap.data());
        alert(`Your Firestore presence:\n${JSON.stringify(presenceSnap.data(), null, 2)}`);
      } else {
        console.log('🔍 Presence doc does NOT exist in Firestore');
        alert('Your presence document does not exist in Firestore!');
      }
    } catch (error) {
      console.error('Error verifying presence:', error);
      alert(`Error: ${error}`);
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-1 card-sleek p-4 bg-blue-50 border-l-4 border-blue-500">
          <h3 className="text-xs font-bold text-blue-900 uppercase mb-3">DEBUG: Your Status</h3>
          {user && (
            <div className="space-y-2 text-xs">
              <div className="text-blue-800">
                <strong>UID:</strong> {user.uid.substring(0, 8)}...
              </div>
              <div className="text-blue-800">
                <strong>Name:</strong> {profile?.displayName || 'Loading...'}
              </div>
              <div className="text-blue-800">
                <strong>Your Presence:</strong>
                {currentUserPresence ? (
                  <span className={currentUserPresence.isOnline ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                    {' '}{currentUserPresence.isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
                  </span>
                ) : (
                  <span className="text-gray-600"> ⏳ Loading...</span>
                )}
              </div>
              {currentUserPresence && (
                <div className="text-blue-800 text-[10px]">
                  <strong>Last Updated:</strong> {formatLastSeen(currentUserPresence.lastSeen)}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-blue-200 space-y-1">
                <button 
                  onClick={() => updateMyPresence(true)}
                  className="w-full px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded hover:bg-emerald-600"
                >
                  SET ONLINE
                </button>
                <button 
                  onClick={() => updateMyPresence(false)}
                  className="w-full px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded hover:bg-red-600"
                >
                  SET OFFLINE
                </button>
                <button 
                  onClick={verifyPresenceInFirestore}
                  className="w-full px-2 py-1 bg-blue-500 text-white text-[10px] font-bold rounded hover:bg-blue-600"
                >
                  🔍 VERIFY IN DB
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 card-sleek p-4 bg-yellow-50 border-l-4 border-yellow-500">
          <h3 className="text-xs font-bold text-yellow-900 uppercase mb-2">ℹ️ Instructions</h3>
          <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
            <li>Your status updates automatically when you log in</li>
            <li>Status changes when you tab away (offline) or come back (online)</li>
            <li>Use manual buttons if automatic tracking doesn't work</li>
            <li>Check browser console (F12) for detailed debug logs</li>
            <li>Status refreshes every 30 seconds to stay online</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">All Team Members</h2>
          <p className="text-xs text-slate-500">Total: {teamMembers.length} | Online: {Object.values(presence).filter(p => p.isOnline).length}</p>
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