import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Heart,
  ArrowRight,
  ShieldCheck,
  Star,
  Printer,
  Palette,
  Package,
  Clock,
  PhoneCall,
  Send,
} from 'lucide-react';
import { Product, Category } from '../../types/product';
import { productService } from '../../services/productService';
import { ProductCard } from '../../components/products/ProductCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prods, cats] = await Promise.all([
          productService.getProducts({ featuredOnly: true }),
          productService.getCategories(),
        ]);
        setFeaturedProducts(prods);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load home page data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-20 sm:space-y-28">
      {/* 1. Hero Banner Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 sm:pb-20">
        {/* Soft pastel ambient background blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-cute-pink/40 to-cute-peach/40 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-[350px] h-[350px] bg-cute-lavender/40 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Hero Text */}
            <div className="space-y-6 text-center lg:text-left">
              <Badge variant="pink" size="md">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span>Tiệm Đồ In 3D Thủ Công Cho Thú Cưng</span>
              </Badge>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-cute-brown dark:text-cute-cream tracking-tight leading-[1.15] font-sans">
                Những chiếc bát xinh xắn <br className="hidden sm:inline" />
                <span className="relative inline-block text-rose-500">
                  dành riêng cho bé yêu
                  <svg className="absolute left-0 -bottom-2 w-full h-3 text-cute-pink-300 -z-10" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path d="M0,15 Q50,0 100,15" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p className="text-sm sm:text-base text-cute-brown-light dark:text-cute-muted max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Được làm từ chất liệu sinh học an toàn đạt chuẩn thực phẩm (Food-safe), kết hợp công thái học bảo vệ cổ cún và khắc tên 3D nổi độc quyền mang đậm dấu ấn riêng.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to="/products">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Đón bé về nhà ngay
                  </Button>
                </Link>
                <Link to="/products?category=bat-an-cho-cho">
                  <Button variant="secondary" size="lg">
                    Xem mẫu bát in tên 🐾
                  </Button>
                </Link>
              </div>

              {/* Highlights Micro-stats */}
              <div className="pt-4 grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0 border-t border-cute-border-light dark:border-cute-border-dark">
                <div className="text-center lg:text-left">
                  <span className="block text-xl font-black text-cute-brown dark:text-cute-cream font-sans">1,500+</span>
                  <span className="text-[11px] text-cute-brown-light dark:text-cute-muted">Bé cưng hài lòng</span>
                </div>
                <div className="text-center lg:text-left">
                  <span className="block text-xl font-black text-cute-brown dark:text-cute-cream font-sans">100%</span>
                  <span className="text-[11px] text-cute-brown-light dark:text-cute-muted">Food-Safe PLA+</span>
                </div>
                <div className="text-center lg:text-left">
                  <span className="block text-xl font-black text-cute-brown dark:text-cute-cream font-sans">5.0 ★</span>
                  <span className="text-[11px] text-cute-brown-light dark:text-cute-muted">Đánh giá 5 sao</span>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card Presentation */}
            <div className="relative flex justify-center">
              <div className="relative w-full max-w-lg aspect-square">
                {/* Main Hero Showcase Image */}
                <div className="w-full h-full rounded-4xl overflow-hidden shadow-cute-lg dark:shadow-cute-dark border-4 border-white dark:border-cute-surface-dark bg-cute-pink/20">
                  <img
                    src="https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1000&auto=format&fit=crop"
                    alt="Bát ăn in 3D BolwDog"
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                  />
                </div>

                {/* Floating Decorative Badges */}
                <div className="absolute -bottom-4 -left-4 sm:bottom-4 sm:-left-6 bg-white dark:bg-cute-surface-dark p-3.5 sm:p-4 rounded-3xl shadow-cute-lg border border-cute-border-light dark:border-cute-border-dark flex items-center gap-3 animate-float">
                  <div className="w-10 h-10 rounded-2xl bg-cute-pink flex items-center justify-center text-xl">
                    🥣
                  </div>
                  <div>
                    <span className="text-xs font-bold text-cute-brown dark:text-cute-cream block">
                      Khắc Tên Bé Miễn Phí
                    </span>
                    <span className="text-[11px] text-cute-brown-light dark:text-cute-muted">
                      In 3D chữ nổi sắc nét
                    </span>
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 sm:top-4 sm:-right-4 bg-white dark:bg-cute-surface-dark px-4 py-2.5 rounded-full shadow-cute border border-cute-border-light dark:border-cute-border-dark flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span className="text-xs font-bold text-cute-brown dark:text-cute-cream">
                    Handmade with Love
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Product Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <Badge variant="peach" size="sm">
            <span>Danh mục bé xinh</span>
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-cute-brown dark:text-cute-cream">
            Khám phá bộ sưu tập đáng yêu
          </h2>
          <p className="text-xs sm:text-sm text-cute-brown-light dark:text-cute-muted">
            Mỗi danh mục mang đến sự chăm sóc ân cần nhất cho từng thói quen của bé cưng
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group p-6 rounded-3xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark shadow-sm hover:shadow-cute-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cute-pink to-cute-peach flex items-center justify-center text-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                {cat.slug === 'bat-an-cho-cho' ? '🥣' : cat.slug === 'moc-khoa-3d' ? '🔑' : '✨'}
              </div>
              <h3 className="text-lg font-bold text-cute-brown dark:text-cute-cream group-hover:text-cute-pink-500 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-cute-brown-light dark:text-cute-muted mt-2 leading-relaxed">
                {cat.description}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-cute-pink-500 group-hover:gap-2 transition-all">
                <span>Xem chi tiết</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <div>
            <Badge variant="lavender" size="sm">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>Được yêu thích nhất</span>
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-cute-brown dark:text-cute-cream mt-1">
              Sản phẩm nổi bật cho bé
            </h2>
          </div>
          <Link to="/products">
            <Button variant="soft" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Xem tất cả sản phẩm
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="cute-card aspect-[3/4] animate-pulse bg-cute-pink/20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Why Choose Us? */}
      <section className="bg-gradient-to-r from-cute-pink/30 via-cute-peach/20 to-cute-lavender/30 dark:from-cute-surface-dark dark:to-cute-cream-dark py-16 sm:py-20 border-y border-cute-border-light dark:border-cute-border-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <Badge variant="pink" size="sm">
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              <span>Cam kết chất lượng</span>
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-cute-brown dark:text-cute-cream">
              Tại sao ba mẹ tin chọn BolwDog?
            </h2>
            <p className="text-xs sm:text-sm text-cute-brown-light dark:text-cute-muted">
              Đem đến những trải nghiệm dùng bữa an toàn, thoải mái và trọn vẹn yêu thương
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-cute-surface-dark p-6 rounded-3xl border border-cute-border-light dark:border-cute-border-dark shadow-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cute-pink mx-auto flex items-center justify-center text-cute-brown">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-cute-brown dark:text-cute-cream">
                Công nghệ in 3D hiện đại
              </h3>
              <p className="text-xs text-cute-brown-light dark:text-cute-muted leading-relaxed">
                Độ chính xác từng milimet, đường bo góc mượt mà tránh trầy xước vùng cằm nhạy cảm của bé.
              </p>
            </div>

            <div className="bg-white dark:bg-cute-surface-dark p-6 rounded-3xl border border-cute-border-light dark:border-cute-border-dark shadow-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cute-peach mx-auto flex items-center justify-center text-cute-brown">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-cute-brown dark:text-cute-cream">
                Cá nhân hóa độc quyền
              </h3>
              <p className="text-xs text-cute-brown-light dark:text-cute-muted leading-relaxed">
                Khắc tên riêng của bé, phối màu pastel theo sở thích và cung cấp phụ kiện độc nhất vô nhị.
              </p>
            </div>

            <div className="bg-white dark:bg-cute-surface-dark p-6 rounded-3xl border border-cute-border-light dark:border-cute-border-dark shadow-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cute-lavender mx-auto flex items-center justify-center text-cute-brown">
                <Heart className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-base font-bold text-cute-brown dark:text-cute-cream">
                Thủ công với tình thương
              </h3>
              <p className="text-xs text-cute-brown-light dark:text-cute-muted leading-relaxed">
                Từng sản phẩm sau khi in đều được thợ mài gọt bóng bẩy và kiểm tra kỹ lưỡng trước khi đóng gói.
              </p>
            </div>

            <div className="bg-white dark:bg-cute-surface-dark p-6 rounded-3xl border border-cute-border-light dark:border-cute-border-dark shadow-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 mx-auto flex items-center justify-center text-emerald-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-cute-brown dark:text-cute-cream">
                Chất liệu an toàn Food-Safe
              </h3>
              <p className="text-xs text-cute-brown-light dark:text-cute-muted leading-relaxed">
                Nhựa sinh học hữu cơ PLA+ và PETG không mùi, không chứa BPA gây hại cho hệ tiêu hóa của cún.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How to Order Guide */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <Badge variant="cream" size="sm">
            <span>Quy trình 4 bước đơn giản</span>
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-cute-brown dark:text-cute-cream">
            Cách rước bé bát xinh về nhà
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="relative p-6 rounded-3xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark shadow-sm">
            <span className="text-3xl font-black text-cute-pink/80 dark:text-cute-pink-dark/40 absolute top-4 right-4">
              01
            </span>
            <h4 className="text-sm font-bold text-cute-brown dark:text-cute-cream mt-4">
              Chọn mẫu & kích thước
            </h4>
            <p className="text-xs text-cute-brown-light dark:text-cute-muted mt-2">
              Lựa chọn mẫu bát công thái học hoặc móc khóa phù hợp với vóc dáng của cún cưng.
            </p>
          </div>

          <div className="relative p-6 rounded-3xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark shadow-sm">
            <span className="text-3xl font-black text-cute-pink/80 dark:text-cute-pink-dark/40 absolute top-4 right-4">
              02
            </span>
            <h4 className="text-sm font-bold text-cute-brown dark:text-cute-cream mt-4">
              Điền tên & tùy biến
            </h4>
            <p className="text-xs text-cute-brown-light dark:text-cute-muted mt-2">
              Ghi tên bé, tuổi hoặc số điện thoại ba mẹ để thợ in 3D khắc nổi lên sản phẩm.
            </p>
          </div>

          <div className="relative p-6 rounded-3xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark shadow-sm">
            <span className="text-3xl font-black text-cute-pink/80 dark:text-cute-pink-dark/40 absolute top-4 right-4">
              03
            </span>
            <h4 className="text-sm font-bold text-cute-brown dark:text-cute-cream mt-4">
              Chuyển khoản cọc 50%
            </h4>
            <p className="text-xs text-cute-brown-light dark:text-cute-muted mt-2">
              Quét mã VietQR chuyển khoản cọc làm mẫu. Admin tiệm sẽ xác nhận đơn và lên máy in ngay.
            </p>
          </div>

          <div className="relative p-6 rounded-3xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark shadow-sm">
            <span className="text-3xl font-black text-cute-pink/80 dark:text-cute-pink-dark/40 absolute top-4 right-4">
              04
            </span>
            <h4 className="text-sm font-bold text-cute-brown dark:text-cute-cream mt-4">
              Giao tận tay ba mẹ
            </h4>
            <p className="text-xs text-cute-brown-light dark:text-cute-muted mt-2">
              Sản phẩm được gói hộp quà xinh xắn kèm thiệp chúc mừng gửi tới tận cửa nhà bạn.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Customer Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <Badge variant="pink" size="sm">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>Phản hồi từ ba mẹ</span>
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-cute-brown dark:text-cute-cream">
            Các bé mê tít bát mới!
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark shadow-sm space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-cute-brown dark:text-cute-cream leading-relaxed italic">
              "Bát in tên bé Bắp siêu cưng luôn ạ! Độ nghiêng vừa phải nên bé không bị sặc hạt nữa. Màu hồng pastel nhã nhặn đúng gu mình."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop"
                alt="Khách hàng"
                className="w-10 h-10 rounded-full object-cover border border-cute-pink"
              />
              <div>
                <span className="text-xs font-bold text-cute-brown dark:text-cute-cream block">Mai Anh</span>
                <span className="text-[11px] text-cute-brown-light dark:text-cute-muted">Mẹ bé Corgi (Hà Nội)</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark shadow-sm space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-cute-brown dark:text-cute-cream leading-relaxed italic">
              "Móc khóa mông Corgi khắc cả số điện thoại của mình chống lạc cho bé cưng. Đường nét in 3D mịn màng, đóng gói cẩn thận 10/10."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop"
                alt="Khách hàng"
                className="w-10 h-10 rounded-full object-cover border border-cute-pink"
              />
              <div>
                <span className="text-xs font-bold text-cute-brown dark:text-cute-cream block">Hoàng Long</span>
                <span className="text-[11px] text-cute-brown-light dark:text-cute-muted">Ba bé Poodle (TP.HCM)</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark shadow-sm space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-cute-brown dark:text-cute-cream leading-relaxed italic">
              "Shop tư vấn siêu dễ thương và nhiệt tình. Mình đặt cọc qua QR ngân hàng xong bạn admin nhắn tin xác nhận liền tay. Sẽ ủng hộ thêm!"
            </p>
            <div className="flex items-center gap-3 pt-2">
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=120&auto=format&fit=crop"
                alt="Khách hàng"
                className="w-10 h-10 rounded-full object-cover border border-cute-pink"
              />
              <div>
                <span className="text-xs font-bold text-cute-brown dark:text-cute-cream block">Bảo Trân</span>
                <span className="text-[11px] text-cute-brown-light dark:text-cute-muted">Mẹ 2 bé Mèo (Đà Nẵng)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Call To Action & Contact Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="rounded-4xl bg-gradient-to-r from-cute-pink via-cute-peach to-cute-lavender dark:from-cute-pink-dark/40 dark:to-cute-lavender-dark/40 p-8 sm:p-14 text-center relative overflow-hidden shadow-cute">
          <div className="max-w-xl mx-auto space-y-5 relative z-10">
            <span className="text-3xl">🐾</span>
            <h2 className="text-2xl sm:text-4xl font-black text-cute-brown dark:text-cute-cream font-sans">
              Tạo chiếc bát độc nhất cho bé yêu hôm nay
            </h2>
            <p className="text-xs sm:text-sm text-cute-brown dark:text-cute-cream/90 leading-relaxed font-medium">
              Chỉ mất 2 phút đặt hàng mà không cần đăng ký tài khoản. Khắc tên và chọn màu bé yêu thích ngay thôi!
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/products">
                <Button variant="primary" size="lg" className="bg-white hover:bg-cute-cream text-cute-brown shadow-md">
                  Đón bé về nhà 🐶
                </Button>
              </Link>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="lg" className="border-white/50">
                  Nhắn tin cho shop nhé ✨
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

