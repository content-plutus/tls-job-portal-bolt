import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { User, Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FETCH_RETRY_DELAYS = [600, 1500];
const SESSION_RETRY_DELAYS = [600, 1500];
const MAX_FETCH_RETRIES = FETCH_RETRY_DELAYS.length;
const MAX_SESSION_RETRIES = SESSION_RETRY_DELAYS.length;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

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

  const ensureValidSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return Boolean(session?.user);
    } catch (error) {
      console.error('Error validating Supabase session:', error);
      return false;
    }
  }, []);

  const fetchUserData = useCallback(async (userId: string, attempt = 0): Promise<void> => {
    const isInitialAttempt = attempt === 0;
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
        return;
      }

      if (!userData) {
        setUser(null);
        setProfile(null);
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
        if (attempt < MAX_FETCH_RETRIES) {
          console.warn(`User data fetch timed out (attempt ${attempt + 1}/${MAX_FETCH_RETRIES + 1}). Retrying...`);
          if (isInitialAttempt) {
            toast.warn('Network is slow. Retrying account sync…');
          }
          await delay(FETCH_RETRY_DELAYS[attempt] ?? FETCH_RETRY_DELAYS[FETCH_RETRY_DELAYS.length - 1]);
          await fetchUserData(userId, attempt + 1);
          return;
        }

        console.warn('User data fetch timed out after retries. Keeping existing session state.');
        toast.warn('Connection timed out fetching your account. Showing cached data.');
        const hasSession = await ensureValidSession();
        if (!hasSession) {
          setUser(null);
          setProfile(null);
        }
      } else {
        console.error('Error fetching user data:', error);
        const hasSession = await ensureValidSession();
        if (!hasSession) {
          setUser(null);
          setProfile(null);
        }
      }
    } finally {
      if (isInitialAttempt) {
        setLoading(false);
      }
    }
  }, [ensureValidSession, setLoading, setProfile, setUser]);

  const checkUser = useCallback(async (attempt = 0): Promise<void> => {
    const isInitialAttempt = attempt === 0;
    try {
      const sessionPromise = Promise.resolve(supabase.auth.getSession());
      const { data: { session }, error: sessionError } = await raceWithTimeout(
        sessionPromise,
        10000,
        'Auth check'
      );

      if (sessionError) {
        console.error('Error getting session:', sessionError);
        return;
      }

      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        if (attempt < MAX_SESSION_RETRIES) {
          console.warn(`Auth check timed out (attempt ${attempt + 1}/${MAX_SESSION_RETRIES + 1}). Retrying...`);
          await delay(SESSION_RETRY_DELAYS[attempt] ?? SESSION_RETRY_DELAYS[SESSION_RETRY_DELAYS.length - 1]);
          await checkUser(attempt + 1);
          return;
        }
        console.warn('Auth check timed out after retries. Preserving existing session state.');
        toast.warn('Having trouble confirming your session. Showing cached data.');
      } else {
        console.error('Error checking user:', error);
      }
      if (isInitialAttempt) {
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
