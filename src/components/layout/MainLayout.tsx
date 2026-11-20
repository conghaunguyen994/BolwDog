import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Flame, Clock, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  setDepositPercentage,
  setFreeshipVoucherConfig,
  setSaleCampaign,
} from '../../features/cart/cartSlice';
import { settingsService } from '../../services/settingsService';
import { getSaleCountdown, getSaleStatus, isSaleActive } from '../../utils/sale';
import { getLocalBlockedStatus } from '../../utils/securityGuard';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { CartDrawer } from '../cart/CartDrawer';
import { FloatingHotline } from '../common/FloatingHotline';
import { BlockedScreen } from '../common/BlockedScreen';

export const MainLayout: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const saleCampaign = useAppSelector((state) => state.cart.saleCampaign);
  const prevStatusRef = useRef<string>('disabled');
  const localBlocked = getLocalBlockedStatus();

  useEffect(() => {
    let mounted = true;
    const syncShopSettings = async () => {
      try {
        const s = await settingsService.getSettings();
        if (!mounted) return;
        if (s.bank_transfer && typeof s.bank_transfer.deposit_percentage === 'number') {
          dispatch(setDepositPercentage(s.bank_transfer.deposit_percentage));
        }
        dispatch(setSaleCampaign(s.sale_campaign || null));
        dispatch(setFreeshipVoucherConfig(s.freeship_voucher || null));
      } catch {
        // Ignore transient network errors
      }
    };

    syncShopSettings();
    const pollTimer = setInterval(syncShopSettings, 45000);
    const onFocus = () => syncShopSettings();
    window.addEventListener('focus', onFocus);

    return () => {
      mounted = false;
      clearInterval(pollTimer);
      window.removeEventListener('focus', onFocus);
    };
  }, [dispatch]);

  // Đồng hồ đếm ngược 1 giây khi có cấu hình Sale đang bật
  useEffect(() => {
    if (!saleCampaign?.enabled) return;
    const tick = setInterval(() => {
      const current = new Date();
      setNow(current);
      const status = getSaleStatus(saleCampaign, current);
      if (status !== prevStatusRef.current) {
        prevStatusRef.current = status;
        // Tự động tính lại giá giỏ hàng ngay thời khắc Sale bắt đầu hoặc kết thúc
        dispatch(setSaleCampaign(saleCampaign));
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [saleCampaign, dispatch]);

  // Nếu người dùng đang bị Admin chặn (và không phải Admin)
  const isBlocked = !auth.isAdmin && (auth.isBlocked || localBlocked.isBlocked);
  const reason = auth.blockedReason || localBlocked.reason;

  if (isBlocked) {
    return <BlockedScreen reason={reason} />;
  }

  const saleActive = isSaleActive(saleCampaign, now);
  const countdown = saleActive ? getSaleCountdown(saleCampaign?.end_at, now) : null;

  return (
    <div className="flex flex-col min-h-screen bg-cute-cream dark:bg-cute-cream-dark text-cute-brown dark:text-cute-cream font-sans transition-colors duration-200">
      {/* Thanh Banner Đếm Ngược Flash Sale Tự Động */}
      {saleActive && saleCampaign && (
        <div className="bg-gradient-to-r from-rose-600 via-pink-500 to-amber-500 text-white px-3 py-2 shadow-md relative z-40">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs">
            <div className="inline-flex items-center gap-1.5 font-black tracking-wide">
              <Flame className="w-4 h-4 text-amber-200 fill-amber-200 animate-pulse" />
              <span>{saleCampaign.title || 'FLASH SALE YÊU THƯƠNG'}</span>
              <span className="px-2 py-0.5 rounded-full bg-white text-rose-600 font-black text-[11px] shadow-sm">
                GIẢM {saleCampaign.discount_percentage}%
              </span>
            </div>

            {saleCampaign.banner_message && (
              <span className="hidden md:inline text-white/95 font-medium">
                • {saleCampaign.banner_message}
              </span>
            )}

            {countdown && !countdown.expired && countdown.shortLabel && (
              <div className="inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-200" />
                <span>Kết thúc sau:</span>
                <span className="font-mono text-amber-200 font-black">{countdown.shortLabel}</span>
              </div>
            )}

            <Link
              to="/products"
              className="inline-flex items-center gap-1 underline font-extrabold hover:text-amber-100 text-[11px]"
            >
              <Sparkles className="w-3 h-3" />
              <span>Săn ngay</span>
            </Link>
          </div>
        </div>
      )}

      <Header onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <MobileNav onOpenCart={() => setIsCartOpen(true)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Nút Hotline / Zalo nổi bật trôi theo màn hình */}
      <FloatingHotline phone="0345553913" zaloPhone="0345553913" />
    </div>
  );
};
