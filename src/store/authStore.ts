import { create } from 'zustand';
import { User, Profile } from '../types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  fallbackActive: boolean;
  staleSince: string | null;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setFallbackActive: (active: boolean) => void;
  setStaleSince: (iso: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  fallbackActive: false,
  staleSince: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setFallbackActive: (active) => set({ fallbackActive: active }),
  setStaleSince: (iso) => set({ staleSince: iso }),
  logout: () => set({ user: null, profile: null, fallbackActive: false, staleSince: null }),
}));
