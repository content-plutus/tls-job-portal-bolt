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

async function raceWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  const controller = new AbortController();
  let timeoutId: number | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      controller.abort();
      const error = new Error(`${label} timed out after ${timeoutMs}ms`);
      error.name = 'TimeoutError';
      reject(error);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, setUser, setProfile, setLoading } = useAuthStore();

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const usersController = new AbortController();
      const usersQueryPromise = Promise.resolve(
        supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .abortSignal(usersController.signal)
          .maybeSingle()
      );

      const { data: userData, error: userError } = await raceWithTimeout(
        usersQueryPromise,
        8000,
        'Users query'
      );

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
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(userData);

      const profilesController = new AbortController();
      const profilesQueryPromise = Promise.resolve(
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .abortSignal(profilesController.signal)
          .maybeSingle()
      );

      try {
        const { data: profileData, error: profileError } = await raceWithTimeout(
          profilesQueryPromise,
          8000,
          'Profiles query'
        );

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        }

        setProfile(profileData);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'TimeoutError') {
          console.warn('Profile fetch timed out, continuing with user data only');
        } else {
          console.error('Error fetching profile:', error);
        }
        setProfile(null);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        console.warn('User data fetch timed out');
      } else {
        console.error('Error fetching user data:', error);
      }
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setProfile, setUser]);

  const checkUser = useCallback(async () => {
    try {
      const sessionPromise = Promise.resolve(supabase.auth.getSession());
      const { data: { session }, error: sessionError } = await raceWithTimeout(
        sessionPromise,
        10000,
        'Auth check'
      );

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
      if (error instanceof Error && error.name === 'TimeoutError') {
        console.warn('Auth check timed out');
      } else {
        console.error('Error checking user:', error);
      }
      setLoading(false);
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
