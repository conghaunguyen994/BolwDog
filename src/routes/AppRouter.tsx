import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { setUser } from '../features/auth/authSlice';
import { authService } from '../services/authService';

// Layouts
import { MainLayout } from '../components/layout/MainLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AdminRoute } from './AdminRoute';

// Customer Pages (Eager load Home for speed, lazy load others)
import { HomePage } from '../pages/Home';
const ProductsPage = lazy(() => import('../pages/Products').then(m => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('../pages/ProductDetail').then(m => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('../pages/Cart').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('../pages/Checkout').then(m => ({ default: m.CheckoutPage })));
const OrderTrackingPage = lazy(() => import('../pages/OrderTracking').then(m => ({ default: m.OrderTrackingPage })));
const LoginPage = lazy(() => import('../pages/Auth/Login').then(m => ({ default: m.LoginPage })));

// Admin Pages (Lazy loaded for performance & security isolation)
const AdminDashboard = lazy(() => import('../pages/Admin/Dashboard').then(m => ({ default: m.AdminDashboard })));
const AdminOrders = lazy(() => import('../pages/Admin/Orders').then(m => ({ default: m.AdminOrders })));
const AdminProducts = lazy(() => import('../pages/Admin/Products').then(m => ({ default: m.AdminProducts })));
const AdminFinances = lazy(() => import('../pages/Admin/Finances').then(m => ({ default: m.AdminFinances })));
const AdminUsers = lazy(() => import('../pages/Admin/Users').then(m => ({ default: m.AdminUsers })));
const AdminSettings = lazy(() => import('../pages/Admin/Settings').then(m => ({ default: m.AdminSettings })));

const CutePageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
    <div className="w-14 h-14 rounded-full bg-cute-pink/60 dark:bg-cute-pink-dark/30 border-2 border-cute-pink flex items-center justify-center text-2xl animate-bounce-gentle">
      🐾
    </div>
    <span className="text-xs font-bold text-cute-brown-light dark:text-cute-muted animate-pulse">
      Đang tải trang bé xinh...
    </span>
  </div>
);

export const AppRouter: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check initial user from Supabase or mock session
    authService.getInitialUser().then((user) => {
      if (user) dispatch(setUser(user));
    });
  }, [dispatch]);

  return (
    <Suspense fallback={<CutePageLoader />}>
      <Routes>
        {/* Customer / Public Routes wrapped in MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/track" element={<OrderTrackingPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Admin Portal Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="finances" element={<AdminFinances />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
