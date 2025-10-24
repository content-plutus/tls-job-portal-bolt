import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if we have real environment variables
export const hasPublicSupabaseConfig = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!hasPublicSupabaseConfig) {
  console.warn('⚠️ Public Supabase environment variables not configured. Using placeholder client.');
}

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
