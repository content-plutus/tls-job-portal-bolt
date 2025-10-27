import React, { createContext, useContext, useEffect } from 'react';
import { supabase, hasSupabaseConfig } from '../lib/supabase';
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
    if (!hasSupabaseConfig) {
      console.warn('⚠️ Running in demo mode - Supabase not configured');
      setLoading(false);
      return;
    }

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth Event] ${event} at ${new Date().toISOString()}`, {
        hasSession: !!session,
        userId: session?.user?.id
      });
      
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
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }

    const checkTimeout = setTimeout(() => {
      console.warn('Auth check timed out after 45 seconds');
      setLoading(false);
    }, 45000);

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
      } else {
        setLoading(false);
      }
      clearTimeout(checkTimeout);
    } catch (error) {
      console.error('Error checking user:', error);
      clearTimeout(checkTimeout);
      setLoading(false);
    }
  }

  async function fetchUserData(userId: string, retryCount = 0) {
    const maxRetries = 2;
    const fetchTimeout = setTimeout(() => {
      console.warn('User data fetch timed out after 45 seconds');
      setUser(null);
      setProfile(null);
      setLoading(false);
    }, 45000);

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user:', userError);
        
        if ((userError.code === 'PGRST301' || userError.message.includes('JWT')) && retryCount < maxRetries) {
          console.warn(`JWT error detected; attempting token refresh (attempt ${retryCount + 1}/${maxRetries})...`);
          
          try {
            const { error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('Token refresh failed:', refreshError);
              await supabase.auth.signOut({ scope: 'local' });
              clearTimeout(fetchTimeout);
              setUser(null);
              setProfile(null);
              setLoading(false);
              return;
            }
            
            console.log('Token refreshed successfully, retrying user fetch...');
            clearTimeout(fetchTimeout);
            return fetchUserData(userId, retryCount + 1);
          } catch (refreshErr) {
            console.error('Error during token refresh:', refreshErr);
            await supabase.auth.signOut({ scope: 'local' });
            clearTimeout(fetchTimeout);
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }
        }
        
        if (userError.code === 'PGRST301' || userError.message.includes('JWT')) {
          console.warn('JWT error persists after retries; signing out');
          try { await supabase.auth.signOut({ scope: 'local' }); } catch (e) { console.warn('Local signOut failed', e); }
        }
        
        clearTimeout(fetchTimeout);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!userData) {
        console.warn('User row not found after auth; may need manual creation');
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
      setProfile(profileData || null);
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
