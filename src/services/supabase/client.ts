import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Public Supabase project endpoint & publishable anon identifier.
// Security is enforced 100% server-side via PostgreSQL Row Level Security (RLS)
// and Supabase Auth JWT verification — no secret keys are stored in .env or client code.
const DEFAULT_SUPABASE_URL = 'https://mwuewkvddhjtxmfzvjyj.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_4Ri-LJHIAOjRCU64cLaYgQ_ZwRb2wqv';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-Client-Info': 'bolwdog-web-security',
        },
      },
    })
  : null;
