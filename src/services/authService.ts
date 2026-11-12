import { supabase, isSupabaseConfigured } from './supabase/client';
import { UserProfile } from '../features/auth/authSlice';

// Danh sách email chủ tiệm duy nhất được phép truy cập quyền Quản trị viên (Admin)
const ALLOWED_ADMIN_EMAILS = [
  'conghaunguyen994@gmail.com',
  'conghaunguyen994@gmail.com.vn',
];

export function isOwnerAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ALLOWED_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export const authService = {
  /**
   * Kiểm tra phiên đăng nhập hiện tại trực tiếp với máy chủ xác thực Supabase (JWT verification).
   * Tuyệt đối không tin tưởng dữ liệu lưu trong localStorage để cấp quyền Admin.
   */
  async getInitialUser(): Promise<UserProfile | null> {
    // Xóa bỏ key mock cũ nếu có để tránh bị lợi dụng qua DevTools
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
        .single();

      const isVerifiedAdmin =
        isOwnerAdminEmail(user.email) &&
        (profile?.role === 'admin' || isOwnerAdminEmail(user.email));

      return {
        id: user.id,
        email: user.email || '',
        fullName: profile?.full_name || user.user_metadata?.full_name || 'Nguyễn Công Hậu',
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      // Nếu bảng profiles đã khởi tạo và có role khác admin thì từ chối
      if (profile && profile.role !== 'admin' && !isOwnerAdminEmail(user.email)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Đăng nhập bằng tài khoản thực trên Supabase Auth (Email + Mật khẩu được mã hóa bcrypt trên server)
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    const isVerifiedAdmin = isOwnerAdminEmail(data.user.email);

    return {
      id: data.user.id,
      email: data.user.email || '',
      fullName:
        profile?.full_name ||
        data.user.user_metadata?.full_name ||
        (isVerifiedAdmin ? 'Nguyễn Công Hậu' : 'Khách Yêu'),
      phone: profile?.phone,
      role: isVerifiedAdmin ? 'admin' : 'customer',
    };
  },

  /**
   * Đăng ký tài khoản khách hàng (Mọi tài khoản đăng ký mới mặc định là customer,
   * chỉ duy nhất email chính chủ của Nguyễn Công Hậu mới được cấp quyền admin)
   */
  async register(email: string, pass: string, fullName: string, phone?: string): Promise<UserProfile> {
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

    if (error) throw new Error(error.message || 'Không thể đăng ký tài khoản');
    if (!data.user) throw new Error('Không thể đăng ký tài khoản');

    const isVerifiedAdmin = isOwnerAdminEmail(data.user.email);

    return {
      id: data.user.id,
      email: data.user.email || '',
      fullName,
      phone,
      role: isVerifiedAdmin ? 'admin' : 'customer',
    };
  },

  async logout(): Promise<void> {
    localStorage.removeItem('bowldog_mock_auth_user');
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
  },
};
