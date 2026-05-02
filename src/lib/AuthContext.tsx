import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isMember: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          console.log('User authenticated:', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          });

          // Set user as online immediately
          const presenceRef = doc(db, 'presence', user.uid);
          
          // Set presence to online with merge to avoid overwriting
          await setDoc(presenceRef, {
            isOnline: true,
            lastSeen: serverTimestamp(),
            uid: user.uid
          }, { merge: false });
          console.log('✅ Presence successfully set to ONLINE for', user.uid);

          // Keep user online with periodic updates (every 30 seconds)
          const presenceInterval = setInterval(async () => {
            try {
              if (!document.hidden) { // Only update if tab is visible
                await updateDoc(presenceRef, {
                  isOnline: true,
                  lastSeen: serverTimestamp()
                });
                console.log('💚 Presence heartbeat - keeping user online');
              }
            } catch (error) {
              console.error('Error updating presence heartbeat:', error);
            }
          }, 30000);

          // Handle page visibility changes
          const handleVisibilityChange = async () => {
            try {
              const isOnline = !document.hidden;
              console.log('👁️ Visibility changed, setting presence to:', isOnline);
              await updateDoc(presenceRef, {
                isOnline: isOnline,
                lastSeen: serverTimestamp()
              });
            } catch (error) {
              console.error('Error updating presence on visibility change:', error);
            }
          };

          // Handle page unload
          const handleBeforeUnload = () => {
            try {
              // Use sendBeacon for reliable offline update
              console.log('🚪 Page unloading, marking offline');
              navigator.sendBeacon('/api/offline', JSON.stringify({ uid: user.uid }));
              // Also try to update directly (might complete before unload)
              updateDoc(presenceRef, {
                isOnline: false,
                lastSeen: serverTimestamp()
              }).catch(err => console.error('Error on unload:', err));
            } catch (error) {
              console.error('Error on beforeunload:', error);
            }
          };

          // Set up event listeners
          document.addEventListener('visibilitychange', handleVisibilityChange);
          window.addEventListener('beforeunload', handleBeforeUnload);
          console.log('✅ Presence event listeners attached');

          // Cleanup function
          const cleanup = () => {
            clearInterval(presenceInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            console.log('🧹 Presence listeners cleaned up');
          };

          // Get or create profile
          const profileRef = doc(db, 'users', user.uid);
          try {
            const profileSnap = await getDoc(profileRef);

            if (!profileSnap.exists()) {
              // Extract name from email if displayName is not available
              const getDisplayName = () => {
                if (user.displayName && user.displayName.trim()) {
                  return user.displayName.trim();
                }
                // Fallback: use email prefix as display name
                if (user.email) {
                  return user.email.split('@')[0];
                }
                return 'User';
              };

              const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                displayName: getDisplayName(),
                role: 'member', // Default role
                photoURL: user.photoURL || undefined,
                createdAt: new Date().toISOString(),
              };

              console.log('Creating new profile:', newProfile);

              try {
                await setDoc(profileRef, newProfile);
                setProfile(newProfile);
                console.log('Profile created successfully');
              } catch (setDocError) {
                console.error('Failed to create user profile in Firestore:', setDocError);
                // Still set the profile locally so user can proceed
                setProfile(newProfile);
                console.log('Using local profile fallback');
              }
            } else {
              const existingProfile = profileSnap.data() as UserProfile;
              console.log('Using existing profile:', existingProfile);
              setProfile(existingProfile);

              // Listen for profile changes (roles etc)
              onSnapshot(profileRef, (doc) => {
                const updatedProfile = doc.data() as UserProfile;
                console.log('Profile updated:', updatedProfile);
                setProfile(updatedProfile);
              }, (error) => {
                console.error('Error listening to profile changes:', error);
                // Keep the existing profile data
              });
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            // Create a basic profile from auth data as last resort
            const fallbackProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              role: 'member',
              photoURL: user.photoURL || undefined,
              createdAt: new Date().toISOString(),
            };
            setProfile(fallbackProfile);
            console.log('Using fallback profile:', fallbackProfile);
          }
        } catch (error) {
          console.error('Error in auth setup:', error);
          // Still set a basic profile so user can proceed
          setProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            role: 'member',
            photoURL: user.photoURL || undefined,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = profile?.role === 'admin';
  const isMember = profile?.role === 'member' || profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
