import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'technician' | 'user';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);

  const checkDevMode = () => {
    const devAuth = localStorage.getItem('dev-auth');
    if (devAuth) {
      try {
        const devData = JSON.parse(devAuth);
        // Check if dev session is recent (within 24 hours)
        if (Date.now() - devData.timestamp < 24 * 60 * 60 * 1000) {
          setIsDevMode(true);
          setUserRole(devData.user.role as UserRole);
          setUser(devData.user as any); // Mock user object (UI only)
          console.log('Development mode active:', devData.user);
          return true;
        } else {
          localStorage.removeItem('dev-auth');
        }
      } catch (error) {
        console.error('Error parsing dev auth:', error);
        localStorage.removeItem('dev-auth');
      }
    }
    return false;
  };

  // In dev mode, optionally perform a real Supabase sign-in so RLS works.
  // Credentials are read from env for local-only use (do not commit).
  const ensureDevSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return; // already signed in
      const devEmail = import.meta.env.VITE_DEV_EMAIL as string | undefined;
      const devPassword = import.meta.env.VITE_DEV_PASSWORD as string | undefined;
      if (devEmail && devPassword) {
        await supabase.auth.signInWithPassword({ email: devEmail, password: devPassword });
      } else {
        // No credentials provided; rely on real login screen
        console.warn('Dev mode active but VITE_DEV_EMAIL/VITE_DEV_PASSWORD not set. Use the auth screen to sign in.');
      }
    } catch (err) {
      console.error('ensureDevSession error:', err);
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_role', { _user_id: userId });
      if (!error && data) {
        setUserRole(data);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Check for development mode FIRST
    if (checkDevMode()) {
      // Attempt to create a real Supabase session in dev so RLS-protected calls work
      ensureDevSession().finally(() => {
        if (mounted) setLoading(false);
      });
      return () => { mounted = false; };
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        // Only synchronous updates in callback to prevent deadlock
        setSession(session);
        setUser(session?.user ?? null);

        // Defer async operations with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            if (mounted) {
              fetchUserRole(session.user.id).finally(() => {
                if (mounted) setLoading(false);
              });
            }
          }, 0);
        } else {
          setUserRole(null);
          if (mounted) setLoading(false);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserRole(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (isDevMode) {
      localStorage.removeItem('dev-auth');
      setIsDevMode(false);
      setUser(null);
      setUserRole(null);
      window.location.href = '/auth';
    } else {
      await supabase.auth.signOut();
      setUserRole(null);
    }
  };

  return {
    user,
    session,
    userRole,
    loading,
    signOut,
    isAuthenticated: !!user || isDevMode,
    isAdmin: userRole === 'admin',
    isTechnician: userRole === 'technician'
  };
};