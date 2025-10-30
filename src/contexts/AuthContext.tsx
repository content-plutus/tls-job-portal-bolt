import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import type { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { User, Profile, SubscriptionTier, UserRole } from '../types';

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
const FALLBACK_TOAST_ID = 'auth-fallback-warning';
const RETRY_TOAST_ID = 'auth-fetch-retry';

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  'free',
  'silver',
  'gold',
  'platinum',
  'basic_3m',
  'professional_6m',
  'premium_12m',
];

function isValidSubscriptionTier(value: unknown): value is SubscriptionTier {
  return SUBSCRIPTION_TIERS.includes(value as SubscriptionTier);
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

function mapSessionUserToAppUser(sessionUser: SupabaseAuthUser): User {
  const metadata = (sessionUser.user_metadata || {}) as Record<string, unknown>;
  const firstName = pickString(metadata.first_name, metadata.given_name, metadata.full_name);
  const lastName = pickString(metadata.last_name, metadata.family_name);
  const phone = pickString(metadata.phone, metadata.phone_number);
  const emailFromMetadata = pickString(metadata.email);
  const roleCandidate = pickString(metadata.role) as UserRole | null;
  const subscriptionCandidate = metadata.subscription_tier ?? metadata.tier;
  const subscription_tier = isValidSubscriptionTier(subscriptionCandidate) ? subscriptionCandidate : 'free';
  const subscription_start = pickString(metadata.subscription_start);
  const subscription_end = pickString(metadata.subscription_end);
  const stripe_customer_id = pickString(metadata.stripe_customer_id);
  const is_active = typeof metadata.is_active === 'boolean' ? metadata.is_active : true;

  return {
    id: sessionUser.id,
    email: sessionUser.email ?? emailFromMetadata ?? '',
    first_name: firstName,
    last_name: lastName,
    phone,
    role: roleCandidate === 'admin' ? 'admin' : 'job_seeker',
    subscription_tier,
    subscription_start,
    subscription_end,
    stripe_customer_id,
    is_verified: Boolean(sessionUser.email_confirmed_at),
    is_active,
    created_at: sessionUser.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

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
  const {
    user,
    profile,
    loading,
    setUser,
    setProfile,
    setLoading,
    setFallbackActive,
    setStaleSince,
  } = useAuthStore();

  const fetchUserDataRef = useRef<((userId: string, attempt?: number) => Promise<void>) | null>(null);
  const fallbackRetryRef = useRef<number | null>(null);

  const getCurrentSession = useCallback(async (): Promise<Session | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session ?? null;
    } catch (error) {
      console.error('Error fetching Supabase session:', error);
      return null;
    }
  }, []);

  const ensureValidSession = useCallback(async () => {
    const session = await getCurrentSession();
    return Boolean(session?.user);
  }, [getCurrentSession]);

  const scheduleFallbackRetry = useCallback((userId: string) => {
    if (fallbackRetryRef.current !== null) {
      window.clearTimeout(fallbackRetryRef.current);
    }

    fallbackRetryRef.current = window.setTimeout(() => {
      const retryFn = fetchUserDataRef.current;
      if (retryFn) {
        retryFn(userId, 0);
      }
    }, 5000);
  }, []);

  const applySessionFallback = useCallback(
    async (userId: string, reason: 'timeout' | 'error' | 'missing') => {
      const session = await getCurrentSession();
      const sessionUser = session?.user;

      if (!sessionUser) {
        setFallbackActive(false);
        setStaleSince(null);
        toast.dismiss(FALLBACK_TOAST_ID);
        return false;
      }

      const fallbackUser = mapSessionUserToAppUser(sessionUser);
      setUser(fallbackUser);
      setProfile(null);
      setFallbackActive(true);
      setStaleSince(new Date().toISOString());

      const messageMap: Record<typeof reason, string> = {
        timeout: 'Connection timed out while fetching your account. Showing cached data.',
        error: 'We hit a temporary error loading your account. Showing cached data.',
        missing: 'Your account data is still provisioning. Showing cached data.',
      };

      toast.warn(messageMap[reason], { toastId: FALLBACK_TOAST_ID });
      const retryTarget = userId || sessionUser.id;
      if (retryTarget) {
        scheduleFallbackRetry(retryTarget);
      }
      return true;
    },
    [getCurrentSession, scheduleFallbackRetry, setFallbackActive, setProfile, setStaleSince, setUser]
  );

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

        const fallbackUsed = await applySessionFallback(userId, 'error');
        if (!fallbackUsed) {
          setUser(null);
          setProfile(null);
        }
        return;
      }

      if (!userData) {
        const fallbackUsed = await applySessionFallback(userId, 'missing');
        if (!fallbackUsed) {
          setUser(null);
          setProfile(null);
        }
        return;
      }

      setUser(userData);
      setFallbackActive(false);
      setStaleSince(null);
      toast.dismiss(FALLBACK_TOAST_ID);
      toast.dismiss(RETRY_TOAST_ID);
      if (fallbackRetryRef.current !== null) {
        window.clearTimeout(fallbackRetryRef.current);
        fallbackRetryRef.current = null;
      }

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
            toast.warn('Network is slow. Retrying account sync…', { toastId: RETRY_TOAST_ID });
          }
          await delay(FETCH_RETRY_DELAYS[attempt] ?? FETCH_RETRY_DELAYS[FETCH_RETRY_DELAYS.length - 1]);
          await fetchUserData(userId, attempt + 1);
          return;
        }

        console.warn('User data fetch timed out after retries. Keeping existing session state.');
        const fallbackUsed = await applySessionFallback(userId, 'timeout');
        if (!fallbackUsed) {
          const hasSession = await ensureValidSession();
          if (!hasSession) {
            setUser(null);
            setProfile(null);
          }
        }
      } else {
        console.error('Error fetching user data:', error);
        const fallbackUsed = await applySessionFallback(userId, 'error');
        if (!fallbackUsed) {
          const hasSession = await ensureValidSession();
          if (!hasSession) {
            setUser(null);
            setProfile(null);
          }
        }
      }
    } finally {
      if (isInitialAttempt) {
        setLoading(false);
      }
    }
  }, [applySessionFallback, ensureValidSession, setFallbackActive, setLoading, setProfile, setStaleSince, setUser]);

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
        const session = await getCurrentSession();
        if (session?.user) {
          await applySessionFallback(session.user.id, 'timeout');
        }
      } else {
        console.error('Error checking user:', error);
        const session = await getCurrentSession();
        if (session?.user) {
          await applySessionFallback(session.user.id, 'error');
        }
      }
      if (isInitialAttempt) {
        setLoading(false);
      }
    }
  }, [applySessionFallback, fetchUserData, getCurrentSession, setLoading]);

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

  useEffect(() => {
    fetchUserDataRef.current = fetchUserData;
    return () => {
      fetchUserDataRef.current = null;
    };
  }, [fetchUserData]);

  useEffect(() => {
    return () => {
      if (fallbackRetryRef.current !== null) {
        window.clearTimeout(fallbackRetryRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const handleOnline = () => {
      if (fetchUserDataRef.current) {
        fetchUserDataRef.current(user.id, 0);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [user?.id]);

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
