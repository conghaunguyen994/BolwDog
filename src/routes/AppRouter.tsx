import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { setUser } from '../features/auth/authSlice';
import { authService } from '../services/authService';

// Layouts
import { MainLayout } from '../components/layout/MainLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AdminRoute } from './AdminRoute';

// Customer Pages
import { HomePage } from '../pages/Home';
import { ProductsPage } from '../pages/Products';
import { ProductDetailPage } from '../pages/ProductDetail';
import { CartPage } from '../pages/Cart';
import { CheckoutPage } from '../pages/Checkout';
import { OrderTrackingPage } from '../pages/OrderTracking';
import { LoginPage } from '../pages/Auth/Login';

// Admin Pages
import { AdminDashboard } from '../pages/Admin/Dashboard';
import { AdminOrders } from '../pages/Admin/Orders';
import { AdminProducts } from '../pages/Admin/Products';
import { AdminSettings } from '../pages/Admin/Settings';

export const AppRouter: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check initial user from Supabase or mock session
    authService.getInitialUser().then((user) => {
      if (user) dispatch(setUser(user));
    });
  }, [dispatch]);

  return (
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
        <Route path="products" element={<AdminProducts />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

