import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Đọc URL & Anon/Publishable Key từ file môi trường .env (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY).
// KHÔNG hardcode thông tin dự án hay API key trực tiếp trong mã nguồn Git.
const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseKey = String(
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
).trim();

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
