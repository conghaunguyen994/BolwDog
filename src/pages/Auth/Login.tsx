import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, User, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAppDispatch } from '../../app/hooks';
import { setUser } from '../../features/auth/authSlice';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';

const LOGIN_ATTEMPTS_KEY = 'bowldog_login_attempts';
const LOGIN_LOCKOUT_UNTIL_KEY = 'bowldog_login_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 phút

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    const checkLockout = () => {
      const until = Number(localStorage.getItem(LOGIN_LOCKOUT_UNTIL_KEY) || '0');
      const remaining = Math.ceil((until - Date.now()) / 1000);
      if (remaining > 0) {
        setLockoutSeconds(remaining);
      } else {
        setLockoutSeconds(0);
        if (until > 0) {
          localStorage.removeItem(LOGIN_LOCKOUT_UNTIL_KEY);
          localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
        }
      }
    };

    checkLockout();
    const timer = setInterval(checkLockout, 1000);
    return () => clearInterval(timer);
  }, []);

  const recordFailedAttempt = () => {
    const current = Number(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '0') + 1;
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, String(current));
    if (current >= MAX_ATTEMPTS) {
      const until = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(LOGIN_LOCKOUT_UNTIL_KEY, String(until));
      setLockoutSeconds(Math.ceil(LOCKOUT_DURATION_MS / 1000));
    }
  };

  const clearFailedAttempts = () => {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    localStorage.removeItem(LOGIN_LOCKOUT_UNTIL_KEY);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) {
      setError(`Tài khoản đang tạm khóa bảo vệ. Vui lòng thử lại sau ${lockoutSeconds} giây.`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isRegister) {
        if (password.length < 6) {
          throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
        }
        const user = await authService.register(email, password, fullName);
        clearFailedAttempts();
        dispatch(setUser(user));
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          setSuccessMsg('Đăng ký tài khoản thành công! Vui lòng kiểm tra email (nếu cần xác nhận) hoặc đăng nhập.');
          navigate('/');
        }
      } else {
        const user = await authService.login(email, password);
        clearFailedAttempts();
        dispatch(setUser(user));
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (from.startsWith('/admin')) {
          setError('Tài khoản này không có quyền truy cập Cổng Quản Trị. Chỉ chủ tiệm Nguyễn Công Hậu mới được phép truy cập.');
        } else {
          navigate(from);
        }
      }
    } catch (err: any) {
      if (!isRegister) {
        recordFailedAttempt();
      }
      setError(err.message || 'Xác thực không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md cute-card p-6 sm:p-8 space-y-6 shadow-cute-lg">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cute-pink to-cute-lavender flex items-center justify-center mx-auto text-2xl shadow-sm">
            🐾
          </div>
          <h1 className="text-2xl font-black text-cute-brown dark:text-cute-cream font-sans">
            {isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập Hệ Thống'}
          </h1>
          <p className="text-xs text-cute-brown-light dark:text-cute-muted">
            {isRegister
              ? 'Tạo tài khoản để lưu thông tin đơn hàng của bé cưng'
              : 'Đăng nhập bảo mật dành cho khách hàng & chủ tiệm'}
          </p>
        </div>

        {lockoutSeconds > 0 && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>
              Hệ thống đã tạm khóa đăng nhập do nhập sai quá {MAX_ATTEMPTS} lần. Vui lòng đợi{' '}
              <strong>{lockoutSeconds} giây</strong> nữa để thử lại.
            </span>
          </div>
        )}

        {error && lockoutSeconds === 0 && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
                Họ và tên
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Nhập họ và tên..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-cute-border-light text-xs bg-cute-cream/40 text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
                />
                <User className="w-4 h-4 text-cute-brown-light absolute left-3 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
              Địa chỉ Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Nhập địa chỉ email của bạn..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-cute-border-light text-xs bg-cute-cream/40 text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
              />
              <Mail className="w-4 h-4 text-cute-brown-light absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-cute-border-light text-xs bg-cute-cream/40 text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
              />
              <Lock className="w-4 h-4 text-cute-brown-light absolute left-3 top-3" />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            disabled={lockoutSeconds > 0}
            className="w-full justify-center"
          >
            {isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}
          </Button>
        </form>

        {/* Toggle Register / Login */}
        <div className="text-center pt-2 border-t border-cute-border-light">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
              setSuccessMsg(null);
            }}
            className="text-xs font-bold text-cute-pink-500 hover:text-cute-pink-600"
          >
            {isRegister ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký tài khoản mới'}
          </button>
        </div>
      </div>
    </div>
  );
};
