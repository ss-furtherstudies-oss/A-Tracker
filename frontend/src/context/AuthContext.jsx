import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as db from '../lib/supabaseService';

const AuthContext = createContext();
const AUTH_BOOT_TIMEOUT_MS = 60000;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const resolveUserRole = async (currentUser) => {
  if (!currentUser) return 'VIEWER';

  try {
    const { data: profile, error } = await Promise.race([
      db.fetchProfileById(currentUser.id),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 10000))
    ]);
    
    if (error) return 'VIEWER';
    return profile?.role || 'VIEWER';
  } catch {
    return 'VIEWER';
  }
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
  
  const userRef = useRef(null);
  const roleRef = useRef('VIEWER');
  const idleTimerRef = useRef(null);
  const roleResolvedForRef = useRef(null); // tracks which user ID we've already resolved

  const updateAuth = useCallback((newUser, newRole) => {
    userRef.current = newUser;
    roleRef.current = newRole;
    setUser(newUser);
    setRole(newRole);
  }, []);

  // ─── Idle Timeout ─────────────────────────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (userRef.current) {
      idleTimerRef.current = setTimeout(async () => {
        console.log('[AUTH] Idle timeout reached. Signing out.');
        roleResolvedForRef.current = null;
        updateAuth(null, 'VIEWER');
        try { await supabase.auth.signOut(); } catch {}
      }, IDLE_TIMEOUT_MS);
    }
  }, [updateAuth]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handler = () => { if (userRef.current) resetIdleTimer(); };
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  // ─── Auth Bootstrap ───────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    const finishLoading = () => {
      if (active) {
        setLoading(false);
        window.clearTimeout(timeoutId);
      }
    };

    const timeoutId = window.setTimeout(() => {
      console.warn('[AUTH] Bootstrap timed out.');
      if (!active) return;
      updateAuth(null, 'VIEWER');
      setLoading(false);
    }, AUTH_BOOT_TIMEOUT_MS);

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        const currentUser = session?.user ?? null;
        if (!active) return;

        if (currentUser) {
          const resolvedRole = await resolveUserRole(currentUser);
          roleResolvedForRef.current = currentUser.id;
          updateAuth(currentUser, resolvedRole);
          resetIdleTimer();
        } else {
          updateAuth(null, 'VIEWER');
        }
      } catch (err) {
        console.error('[AUTH] Session error:', err);
        if (active) updateAuth(null, 'VIEWER');
      } finally {
        finishLoading();
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      const currentUser = session?.user ?? null;

      // Sign-out or no session → clear everything
      if (event === 'SIGNED_OUT' || !currentUser) {
        roleResolvedForRef.current = null;
        updateAuth(null, 'VIEWER');
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        finishLoading();
        return;
      }

      // Same user we already resolved → keep existing role, just refresh user object
      if (roleResolvedForRef.current === currentUser.id) {
        userRef.current = currentUser;
        setUser(currentUser);
        resetIdleTimer();
        finishLoading();
        return;
      }

      // Genuinely new user → resolve role
      try {
        const newRole = await resolveUserRole(currentUser);
        if (active) {
          roleResolvedForRef.current = currentUser.id;
          updateAuth(currentUser, newRole);
          resetIdleTimer();
        }
      } catch (err) {
        console.error('[AUTH] Role resolution error:', err);
      } finally {
        finishLoading();
      }
    });

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [updateAuth, resetIdleTimer]);

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signUp = (email, password) => supabase.auth.signUp({ email, password });
  const signOut = async () => {
    roleResolvedForRef.current = null;
    updateAuth(null, 'VIEWER');
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err.message);
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
