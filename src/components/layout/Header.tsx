import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  ShieldCheck,
  Heart,
  PackageCheck,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  ChevronDown,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import { authService } from '../../services/authService';
import { productService } from '../../services/productService';
import { Category } from '../../types/product';
import { ThemeToggle } from '../common/ThemeToggle';

function getCategoryEmoji(slug: string, name: string): string {
  const s = `${slug} ${name}`.toLowerCase();
  if (s.includes('bat-an') || s.includes('bát')) return '🥣';
  if (s.includes('moc-khoa') || s.includes('móc khóa')) return '🔑';
  if (s.includes('phu-kien') || s.includes('thẻ tên')) return '🏷️';
  if (s.includes('decor') || s.includes('trang trí')) return '🪴';
  if (s.includes('qua-tang') || s.includes('quà')) return '🎁';
  return '✨';
}

interface HeaderProps {
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const auth = useAppSelector((state) => state.auth);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(true);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    productService
      .getCategories()
      .then((cats) => setCategories(cats || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isCategoryMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(event.target as Node)
      ) {
        setIsCategoryMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsCategoryMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isCategoryMenuOpen]);

  const handleLogout = async () => {
    await authService.logout();
    dispatch(logout());
    setIsMobileMenuOpen(false);
    navigate('/');
  };

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
      <div className="bg-gradient-to-r from-cute-pink/40 via-cute-peach/40 to-cute-lavender/40 dark:from-cute-pink-dark/20 dark:to-cute-lavender-dark/20 py-1.5 px-3 sm:px-4 text-center text-[11px] sm:text-xs font-semibold text-cute-brown dark:text-cute-cream flex items-center justify-between sm:justify-center gap-2">
        <div className="flex items-center gap-1.5 truncate">
          <Heart className="w-3.5 h-3.5 text-cute-pink-400 fill-cute-pink-400 animate-pulse-gentle flex-shrink-0" />
          <span className="truncate">
            Ú òa Shop — Đồ in 3D nhựa PLA an toàn tuyệt đối, đa dạng quà tặng & phụ kiện cá nhân hóa!
          </span>
          <span className="hidden sm:inline-block">🐾</span>
        </div>

        {/* Nổi bật Hotline/Zalo trên Announcement Bar */}
        <a
          href="https://zalo.me/0345553913"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0068FF] text-white font-extrabold text-[10px] sm:text-[11px] shadow-sm hover:bg-[#0052cc] hover:scale-105 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>Hotline/Zalo: <strong>0345.553.913</strong></span>
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">

          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-cute-pink to-cute-lavender flex items-center justify-center shadow-cute group-hover:scale-105 transition-transform duration-300">
              <span className="text-xl sm:text-2xl select-none">🐾</span>
            </div>
            <div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-lg sm:text-2xl font-black tracking-tight text-cute-brown dark:text-cute-cream font-sans">
                  Ú òa <span className="text-rose-500">Shop</span>
                </span>
                <span className="hidden xs:inline-block text-[10px] sm:text-xs bg-cute-peach/70 dark:bg-cute-peach-dark px-1.5 py-0.5 rounded-full font-bold text-cute-brown dark:text-cute-cream">
                  In 3D Đáng Yêu
                </span>
              </div>

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

            {/* Dropdown Danh Mục Sản Phẩm (Mở khi hover hoặc click) */}
            <div
              ref={categoryMenuRef}
              className="relative"
              onMouseEnter={() => setIsCategoryMenuOpen(true)}
              onMouseLeave={() => setIsCategoryMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
                aria-expanded={isCategoryMenuOpen}
                aria-haspopup="menu"
                className={`text-sm font-semibold transition-colors flex items-center gap-1.5 py-2 ${
                  isCategoryMenuOpen
                    ? 'text-rose-500 dark:text-cute-pink-200'
                    : 'text-cute-brown dark:text-cute-cream hover:text-cute-pink-400 dark:hover:text-cute-pink-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-cute-pink-400" />
                <span>Danh mục sản phẩm</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isCategoryMenuOpen ? 'rotate-180 text-rose-500' : ''
                  }`}
                />
              </button>

              {isCategoryMenuOpen && (
                <div className="absolute left-0 top-full pt-1.5 w-80 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark rounded-3xl shadow-cute-lg p-2.5 space-y-1">
                    <Link
                      to="/products"
                      onClick={() => setIsCategoryMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-gradient-to-r from-cute-pink/35 to-cute-peach/30 hover:from-cute-pink/60 hover:to-cute-peach/50 dark:from-cute-pink-dark/30 dark:to-cute-lavender-dark/30 transition-all group"
                    >
                      <span className="w-9 h-9 rounded-xl bg-white dark:bg-cute-surface-dark flex items-center justify-center shadow-xs flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-rose-500" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-extrabold text-cute-brown dark:text-cute-cream group-hover:text-rose-600 block">
                          Tất cả sản phẩm
                        </span>
                        <span className="text-[11px] text-cute-brown-light dark:text-cute-muted block truncate">
                          Khám phá toàn bộ gian hàng Ú òa Shop
                        </span>
                      </div>
                    </Link>

                    <div className="border-t border-cute-border-light/70 dark:border-cute-border-dark my-1.5" />

                    <div className="max-h-72 overflow-y-auto space-y-1 pr-0.5">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`/products?category=${encodeURIComponent(cat.slug)}`}
                          onClick={() => setIsCategoryMenuOpen(false)}
                          className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-cute-cream dark:hover:bg-cute-cream-dark/60 transition-colors group"
                        >
                          <span className="w-9 h-9 rounded-xl bg-cute-cream dark:bg-cute-cream-dark flex items-center justify-center text-base flex-shrink-0 group-hover:scale-105 transition-transform">
                            {getCategoryEmoji(cat.slug, cat.name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-cute-brown dark:text-cute-cream group-hover:text-rose-500 block truncate">
                              {cat.name}
                            </span>
                            {cat.description && (
                              <span className="text-[11px] text-cute-brown-light dark:text-cute-muted line-clamp-1">
                                {cat.description}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/products"
              className="text-sm font-semibold text-cute-brown dark:text-cute-cream hover:text-cute-pink-400 dark:hover:text-cute-pink-200 transition-colors"
            >
              Sản phẩm
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
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Search Button & Popover */}
            <div className="relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Tìm kiếm sản phẩm"
                className="p-2 sm:p-2.5 rounded-full bg-cute-cream dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark text-cute-brown dark:text-cute-cream hover:bg-cute-pink/40 transition-colors shadow-sm"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
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
              className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-full bg-cute-pink/70 hover:bg-cute-pink dark:bg-cute-pink-dark/40 dark:hover:bg-cute-pink-dark/60 text-cute-brown dark:text-cute-cream border border-cute-pink-300/60 shadow-cute hover:shadow-cute-lg transition-all duration-200 active:scale-95 group"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-cute-brown dark:text-cute-cream group-hover:-rotate-6 transition-transform" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] sm:text-[11px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-sm animate-pulse-gentle">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-bold tracking-tight">
                Giỏ nhà bé
              </span>
            </button>

            {/* Authentication & Admin Portal Action (Visible on both Mobile & Desktop) */}
            {!auth.isAuthenticated ? (
              <Link
                to="/login"
                title="Đăng nhập tài khoản / Quản trị viên"
                className="flex items-center gap-1.5 text-xs px-2.5 sm:px-3.5 py-2 rounded-full bg-cute-lavender/70 hover:bg-cute-lavender dark:bg-cute-lavender-dark text-cute-brown dark:text-cute-cream border border-cute-lavender font-bold transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {auth.isAdmin ? (
                  <Link
                    to="/admin/dashboard"
                    title="Vào Cổng Quản Trị Xưởng"
                    className="flex items-center gap-1 text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Vào Admin</span>
                    <span className="sm:hidden">Admin</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    title="Tài khoản của bạn"
                    className="flex items-center gap-1 text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-full bg-cute-cream dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark font-semibold text-cute-brown dark:text-cute-cream"
                  >
                    <User className="w-3.5 h-3.5 text-cute-pink-500 flex-shrink-0" />
                    <span className="max-w-[65px] sm:max-w-[100px] truncate">
                      {auth.user?.fullName || 'Tài khoản'}
                    </span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-1.5 sm:p-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-full bg-cute-cream dark:bg-cute-surface-dark border border-cute-border-light text-cute-brown dark:text-cute-cream"
              aria-label="Mở menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
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

            {/* Mobile Accordion Danh mục sản phẩm */}
            <div className="rounded-2xl bg-cute-cream/60 dark:bg-cute-cream-dark/50 border border-cute-border-light dark:border-cute-border-dark overflow-hidden">
              <button
                type="button"
                onClick={() => setIsMobileCategoriesOpen((prev) => !prev)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-extrabold text-cute-brown dark:text-cute-cream"
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-rose-500" />
                  <span>Danh mục sản phẩm</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isMobileCategoriesOpen ? 'rotate-180 text-rose-500' : ''
                  }`}
                />
              </button>
              {isMobileCategoriesOpen && (
                <div className="px-3 pb-2.5 space-y-1.5 border-t border-cute-border-light/60 dark:border-cute-border-dark pt-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/products?category=${encodeURIComponent(cat.slug)}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 py-1.5 px-2 rounded-xl text-xs font-bold hover:bg-white dark:hover:bg-cute-surface-dark hover:text-rose-500 transition-colors"
                    >
                      <span>{getCategoryEmoji(cat.slug, cat.name)}</span>
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link
              to="/track"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 hover:text-cute-pink-400 flex items-center gap-2"
            >
              <PackageCheck className="w-4 h-4 text-cute-pink-400" />
              <span>Tra cứu đơn yêu thương</span>
            </Link>

            {/* Hotline & Zalo nổi bật trên Mobile Drawer */}
            <div className="pt-2 pb-1">
              <a
                href="https://zalo.me/0345553913"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#0068FF] to-[#0084FF] text-white font-bold shadow-md active:scale-95 transition-transform"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-white text-[#0068FF] flex items-center justify-center font-black text-sm">
                    Z
                  </span>
                  <div>
                    <div className="text-[10px] text-blue-100 uppercase font-bold">Tư vấn in 3D nhanh</div>
                    <div className="text-sm font-black tracking-wide">Zalo 0345.553.913</div>
                  </div>
                </div>
                <span className="text-[11px] bg-white/20 px-2.5 py-1 rounded-full font-bold">
                  Nhắn ngay
                </span>
              </a>
            </div>
            <div className="pt-2 border-t border-cute-border-light dark:border-cute-border-dark space-y-2">
              {!auth.isAuthenticated ? (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-xl bg-cute-lavender/60 flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập (Khách / Quản trị)</span>
                </Link>
              ) : (
                <>
                  {auth.isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-2 px-3 rounded-xl bg-purple-600 text-white flex items-center gap-2 font-bold"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Vào Cổng Quản Trị Admin</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full py-2 px-3 rounded-xl bg-rose-50 text-rose-600 flex items-center gap-2 font-bold text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất ({auth.user?.email})</span>
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

