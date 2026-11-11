import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, ShoppingBag, PackageCheck, User } from 'lucide-react';
import { useAppSelector } from '../../app/hooks';

interface MobileNavProps {
  onOpenCart: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenCart }) => {
  const location = useLocation();
  const cartItems = useAppSelector((state) => state.cart.items);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-cute-surface-dark/95 backdrop-blur-md border-t border-cute-border-light dark:border-cute-border-dark py-2 px-3 shadow-cute-lg">
      <div className="flex items-center justify-around">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
            isActive('/') ? 'text-cute-pink-500 font-bold' : 'text-cute-brown-light dark:text-cute-muted'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Trang chủ</span>
        </Link>

        <Link
          to="/products"
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
            isActive('/products') ? 'text-cute-pink-500 font-bold' : 'text-cute-brown-light dark:text-cute-muted'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Sản phẩm</span>
        </Link>

        {/* Center Cart Button */}
        <button
          onClick={onOpenCart}
          className="relative -top-3 flex flex-col items-center"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-cute-pink to-cute-peach p-3 shadow-cute-lg border-2 border-white dark:border-cute-surface-dark active:scale-95 transition-transform flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-cute-brown" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse-gentle">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-cute-brown dark:text-cute-cream mt-0.5">
            Giỏ bé
          </span>
        </button>

        <Link
          to="/track"
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
            isActive('/track') ? 'text-cute-pink-500 font-bold' : 'text-cute-brown-light dark:text-cute-muted'
          }`}
        >
          <PackageCheck className="w-5 h-5" />
          <span>Tra cứu</span>
        </Link>

        <Link
          to="/admin/dashboard"
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
            isActive('/admin') ? 'text-purple-600 font-bold' : 'text-cute-brown-light dark:text-cute-muted'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Admin</span>
        </Link>
      </div>
    </div>
  );
};

