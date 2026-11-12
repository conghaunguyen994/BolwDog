import { supabase, isSupabaseConfigured } from './supabase/client';
import { UserProfile } from '../features/auth/authSlice';
import { setLocalBlockedStatus } from '../utils/securityGuard';

// Danh sách email chủ tiệm duy nhất được phép truy cập quyền Quản trị viên (Admin)
const ALLOWED_ADMIN_EMAILS = [
  'conghaunguyen994@gmail.com',
  'conghaunguyen994@gmail.com.vn',
  'conghaunguyen994@gmai.com',
  'haudev99@gmail.com.vn',
  'haudev99@gmail.com',
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
      const isBlocked = !isVerifiedAdmin && Boolean(profile?.is_blocked);
      const blockedReason = profile?.blocked_reason;

      // Cập nhật trạng thái block vào bộ nhớ client
      setLocalBlockedStatus(isBlocked, blockedReason);

      return {
        id: user.id,
        email: user.email || '',
        fullName:
          profile?.full_name ||
          user.user_metadata?.full_name ||
          (isVerifiedAdmin ? 'Nguyễn Công Hậu' : 'Khách Yêu'),
        phone: profile?.phone,
        role: isVerifiedAdmin ? 'admin' : 'customer',
        isBlocked,
        blockedReason,
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

    if (profile?.is_blocked && !isVerifiedAdmin) {
      setLocalBlockedStatus(true, profile.blocked_reason);
      await supabase.auth.signOut();
      throw new Error(
        profile.blocked_reason ||
          'Tài khoản của bạn đã bị Admin chặn truy cập vào website do có hành vi phá hoại.'
      );
    }

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

    setLocalBlockedStatus(false);

    return {
      id: data.user.id,
      email: data.user.email || '',
      fullName: profile?.full_name || fullName,
      phone: profile?.phone,
      role: isVerifiedAdmin ? 'admin' : 'customer',
      isBlocked: false,
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
      if (
        error.message.includes('rate limit') ||
        (error as any).code === 'over_email_send_rate_limit'
      ) {
        throw new Error(
          'Supabase đã chạm giới hạn gửi email xác nhận (tối đa 2 email/giờ ở gói miễn phí). Bạn hãy vào Supabase -> Authentication -> Providers -> Email -> TẮT mục "Confirm email", hoặc chạy file supabase/FIX_AUTH_AND_SEED_DB.sql trong SQL Editor rồi chuyển sang tab "Đăng nhập" với mật khẩu Conghau@123!'
        );
      }
      if (error.message.includes('Database error saving new user')) {
        throw new Error(
          'Lỗi Trigger cơ sở dữ liệu khi tạo tài khoản mới. Vui lòng chạy đoạn mã SQL trong file supabase/FIX_AUTH_AND_SEED_DB.sql trên Supabase SQL Editor.'
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

  /**
   * Lấy danh sách tất cả người dùng cho Admin quản lý
   */
  async getAllUsers(): Promise<any[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*, orders:orders(id, total_amount, created_at)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((p: any) => {
      const orders = p.orders || [];
      const totalSpent = orders.reduce((acc: number, o: any) => acc + (Number(o.total_amount) || 0), 0);
      return {
        id: p.id,
        email: p.email || '',
        fullName: p.full_name || 'Khách Yêu',
        phone: p.phone || '',
        role: p.role || 'customer',
        is_blocked: Boolean(p.is_blocked),
        blocked_reason: p.blocked_reason || '',
        blocked_at: p.blocked_at || '',
        created_at: p.created_at || '',
        updated_at: p.updated_at || '',
        total_orders: orders.length,
        total_spent: totalSpent,
      };
    });
  },

  /**
   * Block hoặc Bỏ Block người dùng (Chỉ Admin mới có quyền thực thi)
   */
  async setBlockUser(userId: string, isBlocked: boolean, reason?: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Chưa kết nối Supabase.');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        is_blocked: isBlocked,
        blocked_reason: isBlocked ? (reason || 'Admin đã chặn tài khoản này do có hành vi phá hoại hoặc spam.') : null,
        blocked_at: isBlocked ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(error.message || 'Không thể cập nhật trạng thái chặn người dùng.');
    }
  },
};
