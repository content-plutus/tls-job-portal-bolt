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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 8000);

    try {
      const userPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('AbortError'));
        });
      });

      const { data: userData, error: userError } = await Promise.race([
        userPromise,
        timeoutPromise
      ]);

      if (userError) {
        console.error('Error fetching user:', userError);
        if (userError.message.includes('RLS') || userError.message.includes('policy')) {
          console.error('RLS policy may be blocking user access');
        }
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!userData) {
        console.log('No user data found for authenticated user');
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]);

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      setUser(userData);
      setProfile(profileData);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'AbortError') {
        console.warn('User data fetch timed out after 8 seconds');
        setUser(null);
        setProfile(null);
      } else {
        console.error('Error fetching user data:', error);
        setUser(null);
        setProfile(null);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [setLoading, setProfile, setUser]);

  const checkUser = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);

    try {
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('AbortError'));
        });
      });

      const { data: { session }, error: sessionError } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

      if (sessionError) {
        console.error('Error getting session:', sessionError);
        setLoading(false);
        return;
      }

      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'AbortError') {
        console.warn('Auth check timed out after 10 seconds');
      } else {
        console.error('Error checking user:', error);
      }
      setLoading(false);
    } finally {
      clearTimeout(timeoutId);
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
