import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import { authService, isOwnerAdminEmail } from '../services/authService';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isAdmin } = useAppSelector((state) => state.auth);
  const [verifying, setVerifying] = useState(true);
  const [serverVerified, setServerVerified] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAdminSecurity() {
      if (!isAuthenticated || !user) {
        if (mounted) {
          setServerVerified(false);
          setVerifying(false);
        }
        return;
      }

      if (!isAdmin || !isOwnerAdminEmail(user.email)) {
        if (mounted) {
          setServerVerified(false);
          setVerifying(false);
        }
        return;
      }

      const valid = await authService.verifyAdminSession();
      if (mounted) {
        if (!valid) {
          setServerVerified(false);
        } else {
          setServerVerified(true);
        }
        setVerifying(false);
      }
    }

    checkAdminSecurity();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, isAdmin, user, location.pathname]);

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cute-cream dark:bg-cute-cream-dark p-6 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-cute-pink/60 flex items-center justify-center text-xl animate-pulse">
          🔒
        </div>
        <p className="text-xs font-bold text-cute-brown dark:text-cute-cream">
          Đang kiểm tra quyền Quản trị viên (Admin)...
        </p>
      </div>
    );
  }

  // Chưa đăng nhập -> chuyển tới trang Đăng nhập để kiểm tra tài khoản
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location, adminRequired: true }} replace />;
  }

  // Đã đăng nhập nhưng KHÔNG phải tài khoản Admin chính chủ Nguyễn Công Hậu -> Chặn truy cập (403)
  if (!isAdmin || !serverVerified || !isOwnerAdminEmail(user.email)) {
    const handleSwitchAccount = async () => {
      await authService.logout();
      dispatch(logout());
      navigate('/login', { state: { from: location, adminRequired: true } });
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-cute-cream dark:bg-cute-cream-dark p-4">
        <div className="max-w-md w-full cute-card p-6 sm:p-8 text-center space-y-5 shadow-cute-lg">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-cute-brown dark:text-cute-cream">
              Từ Chối Truy Cập Cổng Admin
            </h1>
            <p className="text-xs text-cute-brown-light dark:text-cute-muted leading-relaxed">
              Tài khoản <strong>{user.email}</strong> không có quyền Quản trị viên. Chỉ duy nhất tài khoản chính chủ của{' '}
              <strong>Nguyễn Công Hậu</strong> mới được phép truy cập vào khu vực quản lý `/admin/*`.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-cute-border-light bg-white text-cute-brown text-xs font-bold hover:bg-cute-cream transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về trang chủ</span>
            </Link>
            <button
              onClick={handleSwitchAccount}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Đổi sang tài khoản Admin</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
