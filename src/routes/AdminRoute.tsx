import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import { authService, isOwnerAdminEmail } from '../services/authService';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isAdmin } = useAppSelector((state) => state.auth);
  const [verifying, setVerifying] = useState(true);
  const [serverVerified, setServerVerified] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAdminSecurity() {
      if (!isAuthenticated || !isAdmin || !user || !isOwnerAdminEmail(user.email)) {
        if (mounted) {
          setServerVerified(false);
          setVerifying(false);
        }
        return;
      }

      const valid = await authService.verifyAdminSession();
      if (mounted) {
        if (!valid) {
          dispatch(logout());
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
  }, [isAuthenticated, isAdmin, user, location.pathname, dispatch]);

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cute-cream dark:bg-cute-cream-dark p-6 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-cute-pink/60 flex items-center justify-center text-xl animate-pulse">
          🔒
        </div>
        <p className="text-xs font-bold text-cute-brown dark:text-cute-cream">
          Đang xác thực bảo mật quyền Quản trị viên...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin || !serverVerified || !isOwnerAdminEmail(user?.email)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
