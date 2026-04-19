import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('VIEWER');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          // Fallback: hardcoded admin email
          if (currentUser.email === 'ss-furtherstudies@hkbuas.edu.hk') {
            setRole('ADMIN');
          } else {
            // Fetch role from public.profiles with error handling
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', currentUser.id)
              .single();
            
            if (error) {
              console.warn("Profile fetch error (table might not exist yet):", error.message);
              setRole('VIEWER');
            } else {
              setRole(profile?.role || 'VIEWER');
            }
          }
        }
      } catch (err) {
        console.error("Auth session error:", err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          if (currentUser.email === 'ss-furtherstudies@hkbuas.edu.hk') {
            setRole('ADMIN');
          } else {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', currentUser.id)
              .single();
            
            if (error) {
              setRole('VIEWER');
            } else {
              setRole(profile?.role || 'VIEWER');
            }
          }
        } else {
          setRole('VIEWER');
        }
      } catch (err) {
        setRole('VIEWER');
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signUp = (email, password) => supabase.auth.signUp({ email, password });
  const signOut = () => supabase.auth.signOut();
  const signInWithGoogle = () => supabase.auth.signInWithOAuth({ provider: 'google' });
  const resetPassword = (email) => supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/settings`,
  });
  const updatePassword = (newPassword) => supabase.auth.updateUser({ password: newPassword });

  const value = {
    user,
    role,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
