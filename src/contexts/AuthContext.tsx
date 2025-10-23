import React, { createContext, useContext, useEffect } from 'react';
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
  }, []);

  async function checkUser() {
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
    } catch (error) {
      console.error('Error checking user:', error);
      clearTimeout(checkTimeout);
      setLoading(false);
    }
  }

  async function fetchUserData(userId: string) {
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
        clearTimeout(fetchTimeout);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!userData) {
        console.log('No user data found for authenticated user');
        clearTimeout(fetchTimeout);
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

      clearTimeout(fetchTimeout);
      setUser(userData);
      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      clearTimeout(fetchTimeout);
      setUser(null);
      setProfile(null);
    } finally {
      clearTimeout(fetchTimeout);
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
