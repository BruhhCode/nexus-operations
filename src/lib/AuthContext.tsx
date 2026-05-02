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
        console.log('User authenticated:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });

        // Set user as online
        const presenceRef = doc(db, 'presence', user.uid);
        try {
          await setDoc(presenceRef, {
            isOnline: true,
            lastSeen: serverTimestamp()
          });
          console.log('Presence set to online');

          // Set up disconnect handler to mark as offline
          // Note: This is a simplified approach using page visibility
          const handleVisibilityChange = async () => {
            try {
              if (document.hidden) {
                await updateDoc(presenceRef, {
                  isOnline: false,
                  lastSeen: serverTimestamp()
                });
              } else {
                await updateDoc(presenceRef, {
                  isOnline: true,
                  lastSeen: serverTimestamp()
                });
              }
            } catch (error) {
              console.error('Error updating presence on visibility change:', error);
            }
          };

          // Handle page unload
          const handleBeforeUnload = async () => {
            try {
              await updateDoc(presenceRef, {
                isOnline: false,
                lastSeen: serverTimestamp()
              });
            } catch (error) {
              console.error('Error updating presence on unload:', error);
            }
          };

          document.addEventListener('visibilitychange', handleVisibilityChange);
          window.addEventListener('beforeunload', handleBeforeUnload);

          // Store cleanup functions
          const cleanup = () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
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
          console.error('Error setting up presence:', error);
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
