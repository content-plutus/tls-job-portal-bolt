import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const AUTH_CLIENT_DIAGNOSTICS = import.meta.env.VITE_ENABLE_AUTH_DIAGNOSTICS === 'true';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const isBrowser = typeof window !== 'undefined';

type SupabaseAuthOptions = NonNullable<Parameters<typeof createClient>[2]>['auth'];

const authOptions: SupabaseAuthOptions = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: 'pkce',
};

if (isBrowser) {
  authOptions.storage = window.localStorage;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: authOptions,
});

if (AUTH_CLIENT_DIAGNOSTICS && isBrowser) {
  supabase.auth.onAuthStateChange((event, session) => {
    // eslint-disable-next-line no-console
    console.info('[AuthDiag] auth event', event, {
      hasSession: Boolean(session?.access_token),
      userId: session?.user?.id,
      expiresAt: session?.expires_at,
    });
  });
}
