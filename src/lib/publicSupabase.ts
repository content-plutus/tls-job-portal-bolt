import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Storage shim so this client never persists or reads any session
const noStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export const publicSupabase = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false, storage: noStorage as unknown as Storage },
  global: { headers: { apikey: anon } },
});
