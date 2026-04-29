import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as db from '../lib/supabaseService';

const AuthContext = createContext();
const AUTH_BOOT_TIMEOUT_MS = 4000;

const resolveUserRole = async (currentUser) => {
  if (!currentUser) return 'VIEWER';

  const { data: profile, error } = await db.fetchProfileById(currentUser.id);

  if (error) {
    console.warn('Profile fetch error (table might not exist yet):', error.message);
    return 'VIEWER';
  }

  return profile?.role || 'VIEWER';
};

const AuthLoadingScreen = () => (
  <div className="min-h-screen bg-[#0a192f] flex items-center justify-center p-6">
    <div className="text-center text-white">
      <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-white/15 border-t-orange-500" />
      <h1 className="text-2xl font-black tracking-tight">A-Tracker</h1>
      <p className="mt-2 text-sm font-medium text-slate-300">
        正在載入登入狀態...
      </p>
    </div>
  </div>
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('VIEWER');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const finishLoading = () => {
      if (active) setLoading(false);
    };

    const timeoutId = window.setTimeout(() => {
      console.warn('Auth bootstrap timed out. Falling back to viewer mode.');
      if (!active) return;
      setUser(null);
      setRole('VIEWER');
      setLoading(false);
    }, AUTH_BOOT_TIMEOUT_MS);

    // Check active sessions and sets the user
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        if (!active) return;
        setUser(currentUser);
        setRole(await resolveUserRole(currentUser));
      } catch (err) {
        console.error("Auth session error:", err);
        if (active) setRole('VIEWER');
      } finally {
        finishLoading();
      }
    };

    getSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        const currentUser = session?.user ?? null;
        if (!active) return;
        setUser(currentUser);
        setRole(await resolveUserRole(currentUser));
      } catch {
        if (active) setRole('VIEWER');
      } finally {
        finishLoading();
      }
    });

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signUp = (email, password) => supabase.auth.signUp({ email, password });
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err.message);
    } finally {
      // Force clear state to ensure UI updates even if onAuthStateChange is delayed
      setUser(null);
      setRole('VIEWER');
    }
  };
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
      {loading ? <AuthLoadingScreen /> : children}
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
