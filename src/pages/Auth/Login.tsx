import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, User, ShieldCheck, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { useAppDispatch } from '../../app/hooks';
import { setUser } from '../../features/auth/authSlice';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

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

  const from = (location.state as any)?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const user = await authService.register(email, password, fullName);
        dispatch(setUser(user));
        navigate('/');
      } else {
        const user = await authService.login(email, password);
        dispatch(setUser(user));
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate(from === '/admin/dashboard' ? '/' : from);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAdmin = async () => {
    setLoading(true);
    try {
      const user = await authService.login('admin@bowldog.vn', 'admin123');
      dispatch(setUser(user));
      navigate('/admin/dashboard');
    } catch (e: any) {
      setError(e.message);
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
            {isRegister ? 'Đăng Ký Tài Khoản Tiệm' : 'Đăng Nhập Quản Trị & Khách'}
          </h1>
          <p className="text-xs text-cute-brown-light dark:text-cute-muted">
            {isRegister
              ? 'Tạo tài khoản để theo dõi toàn bộ đơn hàng của bé cưng'
              : 'Đăng nhập để vào cổng quản lý xưởng hoặc tra cứu lịch sử mua'}
          </p>
        </div>

        {/* 1-Click Quick Admin Demo Button */}
        <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
            <ShieldCheck className="w-4 h-4" />
            <span>Thử nghiệm nhanh quyền Admin:</span>
          </div>
          <button
            type="button"
            onClick={handleQuickDemoAdmin}
            disabled={loading}
            className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-sm"
          >
            Đăng Nhập Nhanh Với Tư Cách Admin 🐾
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-cute-brown mb-1">Họ và tên của ba mẹ</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-cute-border-light text-xs bg-cute-cream/40 focus:outline-none"
                />
                <User className="w-4 h-4 text-cute-brown-light absolute left-3 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-cute-brown mb-1">Email</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="admin@bowldog.vn hoặc email ba mẹ"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-cute-border-light text-xs bg-cute-cream/40 focus:outline-none"
              />
              <Mail className="w-4 h-4 text-cute-brown-light absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-cute-brown mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-cute-border-light text-xs bg-cute-cream/40 focus:outline-none"
              />
              <Lock className="w-4 h-4 text-cute-brown-light absolute left-3 top-3" />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full justify-center"
          >
            {isRegister ? 'Tạo Tài Khoản Bé Cưng' : 'Đăng Nhập'}
          </Button>
        </form>

        {/* Toggle Register / Login */}
        <div className="text-center pt-2 border-t border-cute-border-light">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs font-bold text-cute-pink-500 hover:text-cute-pink-600"
          >
            {isRegister ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Tạo tài khoản mới'}
          </button>
        </div>
      </div>
    </div>
  );
};

