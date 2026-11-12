import { supabase as clientSupabase, isSupabaseConfigured } from '../services/supabase/client';

export const supabase = clientSupabase;
export { isSupabaseConfigured };
