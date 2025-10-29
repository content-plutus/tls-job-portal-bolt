import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { User, Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, setUser, setProfile, setLoading } = useAuthStore();

  const fetchUserData = useCallback(async (userId: string) => {
    const abortController = new AbortController();
    
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 8000);

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .abortSignal(abortController.signal)
        .eq('id', userId)
        .maybeSingle();

      clearTimeout(timeoutId);

      if (userError) {
        if (userError.message?.includes('aborted')) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!userData) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .abortSignal(abortController.signal)
        .eq('user_id', userId)
        .maybeSingle();

      setUser(userData);
      setProfile(profileData);
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if ((error as Error).name === 'AbortError' || (error as Error).message?.includes('aborted')) {
        setUser(null);
        setProfile(null);
      } else {
        setUser(null);
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  }, [setLoading, setProfile, setUser]);

  const checkUser = useCallback(async () => {
    const abortController = new AbortController();
    
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 10000);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      clearTimeout(timeoutId);

      if (sessionError) {
        if (sessionError.message?.includes('aborted')) {
          setLoading(false);
          return;
        }
        setLoading(false);
        return;
      }

      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if ((error as Error).name === 'AbortError' || (error as Error).message?.includes('aborted')) {
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [fetchUserData, setLoading]);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkUser, fetchUserData, setLoading, setProfile, setUser]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
