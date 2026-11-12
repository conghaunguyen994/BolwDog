import { supabase, isSupabaseConfigured } from './supabase/client';
import { UserProfile } from '../features/auth/authSlice';

// Danh sách email chủ tiệm duy nhất được phép truy cập quyền Quản trị viên (Admin)
const ALLOWED_ADMIN_EMAILS = [
  'conghaunguyen994@gmail.com',
  'conghaunguyen994@gmail.com.vn',
  'conghaunguyen994@gmai.com',
];

export function isOwnerAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ALLOWED_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export const authService = {
  /**
   * Kiểm tra phiên đăng nhập hiện tại trực tiếp với máy chủ xác thực Supabase (JWT verification).
   */
  async getInitialUser(): Promise<UserProfile | null> {
    localStorage.removeItem('bowldog_mock_auth_user');

    if (!isSupabaseConfigured || !supabase) {
      return null;
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const isVerifiedAdmin = isOwnerAdminEmail(user.email);

      return {
        id: user.id,
        email: user.email || '',
        fullName:
          profile?.full_name ||
          user.user_metadata?.full_name ||
          (isVerifiedAdmin ? 'Nguyễn Công Hậu' : 'Khách Yêu'),
        phone: profile?.phone,
        role: isVerifiedAdmin ? 'admin' : 'customer',
      };
    } catch {
      return null;
    }
  },

  /**
   * Xác thực lại phiên Admin trực tiếp với Supabase Server trước khi cho phép vào trang /admin/*
   */
  async verifyAdminSession(): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      return false;
    }
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user || !isOwnerAdminEmail(user.email)) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Đăng nhập bằng tài khoản thực trên Supabase Auth
   */
  async login(email: string, pass: string): Promise<UserProfile> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Hệ thống xác thực bảo mật chưa kết nối máy chủ.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: pass,
    });

    if (error) {
      throw new Error('Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
    }
    if (!data.user) {
      throw new Error('Không thể xác thực tài khoản.');
    }

    const isVerifiedAdmin = isOwnerAdminEmail(data.user.email);
    const fullName =
      data.user.user_metadata?.full_name ||
      (isVerifiedAdmin ? 'Nguyễn Công Hậu' : 'Khách Yêu');

    // Đồng bộ hồ sơ vào bảng profiles trên DB nếu chưa có
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!profile) {
      await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: fullName,
          role: isVerifiedAdmin ? 'admin' : 'customer',
        })
        .select()
        .maybeSingle();
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      fullName: profile?.full_name || fullName,
      phone: profile?.phone,
      role: isVerifiedAdmin ? 'admin' : 'customer',
    };
  },

  /**
   * Đăng ký tài khoản trên Supabase Auth
   */
  async register(
    email: string,
    pass: string,
    fullName: string,
    phone?: string
  ): Promise<{ profile: UserProfile; hasSession: boolean }> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Hệ thống đăng ký chưa kết nối máy chủ.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: pass,
      options: {
        data: {
          full_name: fullName,
          phone,
        },
      },
    });

    if (error) {
      if (error.message.includes('Database error saving new user')) {
        throw new Error(
          'Lỗi Trigger cơ sở dữ liệu khi tạo tài khoản mới. Vui lòng chạy đoạn mã SQL sửa lỗi Trigger trong Supabase SQL Editor (xem hướng dẫn hoặc file supabase/FIX_AUTH_AND_SEED_DB.sql).'
        );
      }
      throw new Error(error.message || 'Không thể đăng ký tài khoản');
    }
    if (!data.user) throw new Error('Không thể đăng ký tài khoản');

    const isVerifiedAdmin = isOwnerAdminEmail(data.user.email);

    if (data.session) {
      await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: fullName,
          phone,
          role: isVerifiedAdmin ? 'admin' : 'customer',
        })
        .select()
        .maybeSingle();
    }

    return {
      profile: {
        id: data.user.id,
        email: data.user.email || '',
        fullName,
        phone,
        role: isVerifiedAdmin ? 'admin' : 'customer',
      },
      hasSession: Boolean(data.session),
    };
  },

  async logout(): Promise<void> {
    localStorage.removeItem('bowldog_mock_auth_user');
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
  },
};
