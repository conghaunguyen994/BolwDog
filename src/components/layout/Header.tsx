import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, ShieldCheck, Heart, PackageCheck, Menu, X } from 'lucide-react';
import { useAppSelector } from '../../app/hooks';
import { ThemeToggle } from '../common/ThemeToggle';
import { Badge } from '../common/Badge';

interface HeaderProps {
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart }) => {
  const navigate = useNavigate();
  const cartItems = useAppSelector((state) => state.cart.items);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const auth = useAppSelector((state) => state.auth);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchInput.trim())}`);
      setSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-cute-cream-dark/85 backdrop-blur-md border-b border-cute-border-light dark:border-cute-border-dark transition-colors duration-200">
      {/* Top Cute Announcement Bar */}
      <div className="bg-gradient-to-r from-cute-pink/40 via-cute-peach/40 to-cute-lavender/40 dark:from-cute-pink-dark/20 dark:to-cute-lavender-dark/20 py-1.5 px-4 text-center text-xs font-semibold text-cute-brown dark:text-cute-cream flex items-center justify-center gap-2">
        <Heart className="w-3.5 h-3.5 text-cute-pink-400 fill-cute-pink-400 animate-pulse-gentle" />
        <span>Tiệm in 3D sinh học thân thiện với bé yêu & miễn phí khắc tên theo yêu cầu!</span>
        <span className="hidden sm:inline-block">🐾</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cute-pink to-cute-lavender flex items-center justify-center shadow-cute group-hover:scale-105 transition-transform duration-300">
              <span className="text-2xl select-none">🐾</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight text-cute-brown dark:text-cute-cream font-sans">
                  Bolw<span className="text-cute-pink-400">Dog</span>
                </span>
                <span className="text-xs bg-cute-peach/70 dark:bg-cute-peach-dark px-1.5 py-0.5 rounded-full font-bold text-cute-brown dark:text-cute-cream">
                  Studio
                </span>
              </div>
              <p className="text-[11px] text-cute-brown-light dark:text-cute-muted font-medium tracking-wide">
                Bát ăn & phụ kiện 3D cho bé cưng
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7">
            <Link
              to="/"
              className="text-sm font-semibold text-cute-brown dark:text-cute-cream hover:text-cute-pink-400 dark:hover:text-cute-pink-200 transition-colors"
            >
              Trang chủ
            </Link>
            <Link
              to="/products"
              className="text-sm font-semibold text-cute-brown dark:text-cute-cream hover:text-cute-pink-400 dark:hover:text-cute-pink-200 transition-colors"
            >
              Tất cả sản phẩm
            </Link>
            <Link
              to="/products?category=bat-an-cho-cho"
              className="text-sm font-semibold text-cute-brown dark:text-cute-cream hover:text-cute-pink-400 dark:hover:text-cute-pink-200 transition-colors"
            >
              Bát ăn in tên
            </Link>
            <Link
              to="/products?category=moc-khoa-3d"
              className="text-sm font-semibold text-cute-brown dark:text-cute-cream hover:text-cute-pink-400 dark:hover:text-cute-pink-200 transition-colors"
            >
              Móc khóa 3D
            </Link>
            <Link
              to="/track"
              className="text-sm font-semibold text-cute-brown dark:text-cute-cream hover:text-cute-pink-400 dark:hover:text-cute-pink-200 transition-colors flex items-center gap-1"
            >
              <PackageCheck className="w-4 h-4 text-cute-pink-400" />
              <span>Tra cứu đơn</span>
            </Link>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Button & Popover */}
            <div className="relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Tìm kiếm sản phẩm"
                className="p-2.5 rounded-full bg-cute-cream dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark text-cute-brown dark:text-cute-cream hover:bg-cute-pink/40 transition-colors shadow-sm"
              >
                <Search className="w-5 h-5" />
              </button>

              {searchOpen && (
                <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark rounded-2xl p-3 shadow-cute-lg z-50 animate-in fade-in zoom-in-95">
                  <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tìm bát ăn, móc khóa, bảng tên..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-cute-border-light dark:border-cute-border-dark bg-cute-cream dark:bg-cute-cream-dark dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-cute-pink hover:bg-cute-pink-200 text-cute-brown font-semibold rounded-xl text-xs"
                    >
                      Tìm
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Dark / Light Toggle */}
            <ThemeToggle />

            {/* Shopping Cart Button ("Giỏ nhà bé") */}
            <button
              onClick={onOpenCart}
              aria-label="Giỏ nhà bé"
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-full bg-cute-pink/70 hover:bg-cute-pink dark:bg-cute-pink-dark/40 dark:hover:bg-cute-pink-dark/60 text-cute-brown dark:text-cute-cream border border-cute-pink-300/60 shadow-cute hover:shadow-cute-lg transition-all duration-200 active:scale-95 group"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-cute-brown dark:text-cute-cream group-hover:-rotate-6 transition-transform" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-pulse-gentle">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-bold tracking-tight">
                Giỏ nhà bé
              </span>
            </button>

            {/* Admin Portal Shortcut (chỉ hiển thị khi chủ tiệm đã đăng nhập xác thực Admin) */}
            {auth.isAdmin && (
              <Link
                to="/admin/dashboard"
                title="Khu vực Quản trị"
                className="hidden lg:flex items-center gap-1.5 text-xs px-3 py-2 rounded-full bg-cute-lavender/60 hover:bg-cute-lavender dark:bg-cute-lavender-dark text-cute-brown dark:text-cute-cream border border-cute-lavender font-semibold transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                <span>Quản trị</span>
              </Link>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-full bg-cute-cream dark:bg-cute-surface-dark border border-cute-border-light text-cute-brown dark:text-cute-cream"
              aria-label="Mở menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-cute-surface-dark border-b border-cute-border-light dark:border-cute-border-dark px-6 py-5 shadow-cute space-y-4 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-3 font-semibold text-cute-brown dark:text-cute-cream">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 hover:text-cute-pink-400"
            >
              🐾 Trang chủ
            </Link>
            <Link
              to="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 hover:text-cute-pink-400"
            >
              ✨ Tất cả sản phẩm
            </Link>
            <Link
              to="/products?category=bat-an-cho-cho"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 hover:text-cute-pink-400"
            >
              🥣 Bát ăn cho cún (In tên)
            </Link>
            <Link
              to="/products?category=moc-khoa-3d"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 hover:text-cute-pink-400"
            >
              🔑 Móc khóa 3D mông cún
            </Link>
            <Link
              to="/products?category=phu-kien-ca-nhan-hoa"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 hover:text-cute-pink-400"
            >
              🏷️ Thẻ tên dạ quang chống lạc
            </Link>
            <Link
              to="/track"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 hover:text-cute-pink-400 flex items-center gap-2"
            >
              <PackageCheck className="w-4 h-4 text-cute-pink-400" />
              <span>Tra cứu đơn yêu thương</span>
            </Link>
            {auth.isAdmin && (
              <div className="pt-2 border-t border-cute-border-light dark:border-cute-border-dark">
                <Link
                  to="/admin/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1.5 flex items-center gap-2 text-purple-600 dark:text-purple-300"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Cổng Quản trị Xưởng</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

