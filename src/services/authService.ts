import { supabase, isSupabaseConfigured } from './supabase/client';
import { UserProfile } from '../features/auth/authSlice';

const MOCK_CURRENT_USER_KEY = 'bowldog_mock_auth_user';

export const authService = {
  async getInitialUser(): Promise<UserProfile | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      // Query profile role
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      return {
        id: session.user.id,
        email: session.user.email || '',
        fullName: profile?.full_name || session.user.user_metadata?.full_name || 'Khách Yêu',
        phone: profile?.phone,
        role: profile?.role || 'customer',
      };
    }

    const saved = localStorage.getItem(MOCK_CURRENT_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  },

  async login(email: string, pass: string): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) throw error;
      if (!data.user) throw new Error('Không thể đăng nhập');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return {
        id: data.user.id,
        email: data.user.email || '',
        fullName: profile?.full_name || data.user.user_metadata?.full_name || 'Khách Yêu',
        phone: profile?.phone,
        role: profile?.role || 'customer',
      };
    }

    // Mock Login: recognize admin credentials or default customer
    const isAdmin = email.toLowerCase().includes('admin') || pass === 'admin123';
    const profile: UserProfile = {
      id: isAdmin ? 'mock-admin-001' : `mock-user-${Date.now()}`,
      email,
      fullName: isAdmin ? 'Admin Cún Xinh' : 'Ba Mẹ Bé Cưng',
      role: isAdmin ? 'admin' : 'customer',
    };
    localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(profile));
    return profile;
  },

  async register(email: string, pass: string, fullName: string, phone?: string): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('Không thể đăng ký tài khoản');

      return {
        id: data.user.id,
        email: data.user.email || '',
        fullName,
        phone,
        role: 'customer',
      };
    }

    const profile: UserProfile = {
      id: `mock-user-${Date.now()}`,
      email,
      fullName,
      phone,
      role: 'customer',
    };
    localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(profile));
    return profile;
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(MOCK_CURRENT_USER_KEY);
  },
};

