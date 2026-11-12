import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  Store,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import { authService } from '../../services/authService';
import { ThemeToggle } from '../common/ThemeToggle';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { CartDrawer } from '../cart/CartDrawer';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const navLinks = [
    { to: '/admin/dashboard', label: 'Tổng quan xưởng', shortLabel: 'Tổng quan', icon: LayoutDashboard },
    { to: '/admin/orders', label: 'Quản lý đơn hàng', shortLabel: 'Đơn hàng', icon: ShoppingBag },
    { to: '/admin/products', label: 'Quản lý sản phẩm', shortLabel: 'Sản phẩm', icon: Package },
    { to: '/admin/settings', label: 'Cài đặt tiệm & Ngân hàng', shortLabel: 'Cài đặt', icon: Settings },
  ];

  const handleLogout = async () => {
    await authService.logout();
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cute-cream dark:bg-cute-cream-dark text-cute-brown dark:text-cute-cream flex flex-col transition-colors">
      {/* Giữ nguyên Header trên cả Mobile & Desktop khi Admin đăng nhập */}
      <Header onOpenCart={() => setIsCartOpen(true)} />

      {/* Thanh điều hướng nhanh dành cho điện thoại (Mobile Admin Sub-bar) */}
      <div className="md:hidden bg-white dark:bg-cute-surface-dark border-b border-cute-border-light dark:border-cute-border-dark px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cute-pink text-cute-brown shadow-sm ring-1 ring-cute-pink-300'
                    : 'bg-cute-cream/60 dark:bg-cute-cream-dark/40 text-cute-brown-light dark:text-cute-muted'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 bg-white dark:bg-cute-surface-dark border-r border-cute-border-light dark:border-cute-border-dark p-5 flex-col justify-between shadow-sm">
          <div className="space-y-6">
            {/* Admin Header */}
            <div className="flex items-center justify-between pb-4 border-b border-cute-border-light dark:border-cute-border-dark">
              <Link to="/admin/dashboard" className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-200 to-cute-pink flex items-center justify-center text-xl shadow-sm">
                  🐾
                </div>
                <div>
                  <span className="text-base font-extrabold text-cute-brown dark:text-cute-cream block">
                    Admin BolwDog
                  </span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Cổng quản trị
                  </span>
                </div>
              </Link>
              <ThemeToggle />
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1.5 text-xs font-bold">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-cute-pink text-cute-brown shadow-sm ring-1 ring-cute-pink-300'
                        : 'text-cute-brown-light dark:text-cute-muted hover:bg-cute-cream dark:hover:bg-cute-cream-dark/40 hover:text-cute-brown'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Actions */}
          <div className="pt-6 border-t border-cute-border-light dark:border-cute-border-dark space-y-2">
            <Link
              to="/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-cute-brown dark:text-cute-cream hover:bg-cute-pink/20 transition-colors"
            >
              <Store className="w-4 h-4 text-cute-pink-500" />
              <span>Về xem trang chủ tiệm</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Thoát cổng quản trị</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 lg:p-10 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Giữ nguyên Footer & MobileNav ở cuối trang */}
      <Footer />
      <MobileNav onOpenCart={() => setIsCartOpen(true)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

