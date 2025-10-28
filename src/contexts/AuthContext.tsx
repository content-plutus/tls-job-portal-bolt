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
    const fetchTimeout = setTimeout(() => {
      console.warn('User data fetch timed out after 8 seconds');
      setUser(null);
      setProfile(null);
      setLoading(false);
    }, 8000);

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

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

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      setUser(userData);
      setProfile(profileData);
    } catch (error: unknown) {
      console.error('Error fetching user data:', error);
      setUser(null);
      setProfile(null);
    } finally {
      clearTimeout(fetchTimeout);
      setLoading(false);
    }
  }, [setLoading, setProfile, setUser]);

  const checkUser = useCallback(async () => {
    const checkTimeout = setTimeout(() => {
      console.warn('Auth check timed out after 10 seconds');
      setLoading(false);
    }, 10000);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error getting session:', sessionError);
        clearTimeout(checkTimeout);
        setLoading(false);
        return;
      }

      if (session?.user) {
        await fetchUserData(session.user.id);
        clearTimeout(checkTimeout);
      } else {
        clearTimeout(checkTimeout);
        setLoading(false);
      }
    } catch (error: unknown) {
      console.error('Error checking user:', error);
      clearTimeout(checkTimeout);
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
