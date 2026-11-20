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
import { formatVND } from '../../utils/currency';
import { calculateDiscountedPrice, isSaleActive, normalizeDiscountPercentage } from '../../utils/sale';
import { useAppSelector } from '../../app/hooks';
import { ProductCard } from '../../components/products/ProductCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ShopPolicyModal } from '../../components/common/ShopPolicyModal';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const saleCampaign = useAppSelector((state) => state.cart.saleCampaign);
  const saleActive = isSaleActive(saleCampaign) && saleCampaign?.apply_scope !== 'selected_products';
  const salePct = saleActive ? normalizeDiscountPercentage(saleCampaign?.discount_percentage) : 0;

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
                <span>BÂU SHOP | BÁT ĂN CHỐNG GÙ – CHỐNG KIẾN CHO CHÓ MÈO</span>
              </Badge>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-cute-brown dark:text-cute-cream tracking-tight leading-[1.15] font-sans">
                Bát Ăn Chống Gù – Chống Kiến <br className="hidden sm:inline" />
                <span className="relative inline-block text-rose-500">
                  Cá Nhân Hóa Riêng Cho Bé
                  <svg className="absolute left-0 -bottom-2 w-full h-3 text-cute-pink-300 -z-10" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path d="M0,15 Q50,0 100,15" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <div className="space-y-1.5 text-xs sm:text-sm text-cute-brown dark:text-cute-cream font-medium">
                <p>🌸 <strong>Thiết kế nghiêng 15° chống gù</strong> bảo vệ cột sống (size S | M | L)</p>
                <p>🌸 <strong>5 size chuẩn</strong>: S | M | L | XL | XXL phù hợp mọi dòng cún mèo</p>
                <p>🌸 <strong>Đế chống kiến</strong> với khoang chứa nước ngăn 100% côn trùng</p>
                <p>🌸 <strong>Lòng bát inox 304</strong> tháo rời, siêu bền, dễ vệ sinh sạch bóng</p>
                <p>🌸 Sử dụng <strong>nhựa sinh học PLA an toàn tuyệt đối</strong> — in 3D tỉ mỉ, siêu nhẹ, chi tiết đáng yêu</p>
                <p>🌸 <strong>Đổi mới 1:1 miễn phí trong 7 ngày</strong> nếu lỗi kỹ thuật hoặc vận chuyển</p>
                <p className="text-rose-500 font-bold pt-1">
                  🎨 Tùy chọn 2 màu sắc (màu thân trên & màu đế dưới) • Chữ viết tên cún • Tối đa 2 icon • Ngày sinh khi in lên bát
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to="/products/bat-an-chong-gu-chong-kien-cho-cho-meo">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Thiết kế & Xem demo ngay
                  </Button>
                </Link>
                <Link to="/products/bat-an-chong-gu-chong-kien-cho-cho-meo">
                  <Button variant="secondary" size="lg">
                    Xem 5 Size & Bảng giá 🐾
                  </Button>
                </Link>
              </div>

              {/* Highlights Micro-stats */}
              <div className="pt-4 grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0 border-t border-cute-border-light dark:border-cute-border-dark">
                <div className="text-center lg:text-left">
                  <span className="block text-xl font-black text-cute-brown dark:text-cute-cream font-sans">100% PLA</span>
                  <span className="text-[11px] text-cute-brown-light dark:text-cute-muted">An toàn tuyệt đối</span>
                </div>
                <div className="text-center lg:text-left">
                  <span className="block text-xl font-black text-rose-500 font-sans">Đổi 1:1</span>
                  <span className="text-[11px] text-cute-brown-light dark:text-cute-muted">Miễn phí 7 ngày</span>
                </div>
                <div className="text-center lg:text-left">
                  <span className="block text-xl font-black text-cute-brown dark:text-cute-cream font-sans">5.0 ★</span>
                  <span className="text-[11px] text-cute-brown-light dark:text-cute-muted">Bâu Shop uy tín</span>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card Presentation */}
            <div className="relative flex justify-center">
              <div className="relative w-full max-w-lg aspect-square">
                {/* Main Hero Showcase Image - Actual Photo */}
                <div className="w-full h-full rounded-4xl overflow-hidden shadow-cute-lg dark:shadow-cute-dark border-4 border-white dark:border-cute-surface-dark bg-cute-pink/20">
                  <img
                    src="/images/bat-an-chong-gu-chong-kien.jpg"
                    alt="Bát ăn chống gù chống kiến Bâu Shop"
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
                      Khắc Tên & Ngày Sinh Bé
                    </span>
                    <span className="text-[11px] text-cute-brown-light dark:text-cute-muted">
                      Xem demo trước khi đặt hàng
                    </span>
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 sm:top-4 sm:-right-4 bg-white dark:bg-cute-surface-dark px-4 py-2.5 rounded-full shadow-cute border border-cute-border-light dark:border-cute-border-dark flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span className="text-xs font-bold text-cute-brown dark:text-cute-cream">
                    Bâu Shop Chính Hãng
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 1.5 Quảng cáo nổi bật: Nhựa PLA an toàn tuyệt đối & Bảo hành Đổi mới 1:1 trong 7 ngày */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-4xl p-6 sm:p-8 bg-gradient-to-r from-emerald-50 via-cute-pink/35 to-amber-50 dark:from-emerald-950/40 dark:via-cute-surface-dark dark:to-amber-950/30 border-2 border-emerald-200/80 dark:border-emerald-800 shadow-cute space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black tracking-wide shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>CAM KẾT CHẤT LƯỢNG ĐỘC QUYỀN TẠI BÂU SHOP</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-cute-brown dark:text-cute-cream">
                Nhựa Sinh Học PLA An Toàn Tuyệt Đối — Tỉ Mỉ, Siêu Nhẹ, Chi Tiết Đáng Yêu 🐾
              </h2>
              <p className="text-xs sm:text-sm text-cute-brown-light dark:text-cute-muted max-w-3xl leading-relaxed">
                Mỗi sản phẩm đều được in 3D từ <strong>nhựa sinh học PLA an toàn tuyệt đối</strong> cho thú cưng, hoàn thiện <strong>tỉ mỉ từng đường nét, siêu nhẹ</strong> và nổi bật với các <strong>chi tiết đáng yêu</strong> thiết kế riêng cho bé cưng của bạn.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPolicyModalOpen(true)}
              className="self-start md:self-center px-4 py-2.5 rounded-2xl bg-white dark:bg-cute-surface-dark border-2 border-rose-300 text-rose-600 dark:text-rose-300 hover:bg-rose-50 text-xs font-black shadow-sm whitespace-nowrap transition-all"
            >
              📜 Xem Chính Sách Của Shop →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-cute-surface-dark border border-emerald-200/70 space-y-1">
              <span className="font-black text-emerald-700 dark:text-emerald-300 block">
                🌱 Nhựa PLA An Toàn Tuyệt Đối
              </span>
              <p className="text-[11px] text-cute-brown-light dark:text-cute-muted leading-relaxed">
                Nhựa sinh học thân thiện thực phẩm, không mùi độc hại, an toàn tuyệt đối cho chó mèo sử dụng hằng ngày.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-cute-surface-dark border border-cute-pink/70 space-y-1">
              <span className="font-black text-rose-600 dark:text-rose-300 block">
                ✨ Tỉ Mỉ • Siêu Nhẹ • Chi Tiết Đáng Yêu
              </span>
              <p className="text-[11px] text-cute-brown-light dark:text-cute-muted leading-relaxed">
                Công nghệ in 3D sắc nét, trọng lượng siêu nhẹ dễ di chuyển, khắc nổi tên bé &amp; icon xinh xắn độc quyền.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-cute-surface-dark border border-amber-300/80 space-y-1">
              <span className="font-black text-amber-800 dark:text-amber-300 block">
                🔄 Đổi Mới 1:1 Miễn Phí Trong 7 Ngày
              </span>
              <p className="text-[11px] text-cute-brown-light dark:text-cute-muted leading-relaxed">
                Bảo hành đổi mới 1:1 hoàn toàn miễn phí trong 7 ngày nếu phát sinh lỗi kỹ thuật hoặc hư hỏng do vận chuyển.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ShopPolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
      />

      {/* 2. 5 Sizes Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <Badge variant="peach" size="sm">
            <span>Bảng quy cách chuẩn</span>
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-cute-brown dark:text-cute-cream">
            5 Kích Cỡ Bát Ăn Cho Chó Mèo (Bâu Shop)
          </h2>
          <p className="text-xs sm:text-sm text-cute-brown-light dark:text-cute-muted">
            Đầy đủ kích thước từ cún mi-ni, mèo con đến cún trưởng thành dáng lớn
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              size: 'Size S',
              h1: '12 cm',
              h2: '8 cm',
              d: '18 cm',
              inox: 'Ø 14 cm',
              tilt: 'Nghiêng 15°',
              price: '199K',
              rawPrice: 199000,
              target: 'Bé nhỏ (< 4kg)',
            },
            {
              size: 'Size M',
              h1: '14 cm',
              h2: '10 cm',
              d: '19 cm',
              inox: 'Ø 14 cm',
              tilt: 'Nghiêng 15°',
              price: '229K',
              rawPrice: 229000,
              target: 'Bé vừa (4 - 8kg)',
            },
            {
              size: 'Size L',
              h1: '16 cm',
              h2: '12 cm',
              d: '20 cm',
              inox: 'Ø 14 cm',
              tilt: 'Nghiêng 15°',
              price: '259K',
              rawPrice: 259000,
              target: 'Bé lớn (8 - 15kg)',
            },
            {
              size: 'Size XL',
              h1: '15 cm',
              h2: '15 cm',
              d: '22,5 cm',
              inox: 'Ø 18-20 cm',
              tilt: 'Dáng phẳng',
              price: '300K',
              rawPrice: 300000,
              target: 'Bé to (15 - 25kg)',
            },
            {
              size: 'Size XXL',
              h1: '17 cm',
              h2: '17 cm',
              d: '25 cm',
              inox: 'Ø 18-20 cm',
              tilt: 'Dáng phẳng',
              price: '350K',
              rawPrice: 350000,
              target: 'Bé đại (> 25kg)',
            },
          ].map((item) => {
            const discounted = salePct > 0 ? calculateDiscountedPrice(item.rawPrice, salePct) : item.rawPrice;
            return (
              <Link
                key={item.size}
                to="/products/bat-an-chong-gu-chong-kien-cho-cho-meo"
                className="relative p-5 rounded-3xl bg-white dark:bg-cute-surface-dark border-2 border-cute-border-light dark:border-cute-border-dark shadow-sm hover:border-rose-400 hover:shadow-cute transition-all text-center flex flex-col justify-between group"
              >
                {salePct > 0 && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 text-white text-[10px] font-black shadow-sm">
                    -{salePct}%
                  </span>
                )}
                <div>
                  <span className="text-[11px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full inline-block mb-2">
                    {item.tilt}
                  </span>
                  <h3 className="text-xl font-black text-cute-brown dark:text-cute-cream group-hover:text-rose-500 transition-colors">
                    {item.size}
                  </h3>
                  <span className="text-[11px] text-cute-brown-light dark:text-cute-muted block mb-3 font-medium">
                    {item.target}
                  </span>

                  <div className="space-y-1.5 text-xs text-cute-brown-light dark:text-cute-muted border-t border-cute-border-light/60 pt-3">
                    <div className="flex justify-between">
                      <span>Chiều cao H1:</span>
                      <strong className="text-cute-brown dark:text-cute-cream">{item.h1}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Chiều cao H2:</span>
                      <strong className="text-cute-brown dark:text-cute-cream">{item.h2}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Đường kính D:</span>
                      <strong className="text-cute-brown dark:text-cute-cream">{item.d}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Bát inox:</span>
                      <strong className="text-rose-500">{item.inox}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-cute-border-light/60">
                  {salePct > 0 ? (
                    <div className="space-y-0.5">
                      <span className="text-xs text-cute-brown-light/70 dark:text-cute-muted line-through block">
                        {formatVND(item.rawPrice)}
                      </span>
                      <span className="text-lg font-black text-rose-500 block">
                        {formatVND(discounted)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-black text-rose-500 block">{item.price}</span>
                  )}
                  <span className="text-[11px] font-bold text-cute-pink-500 mt-1 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                    <span>Thiết kế ngay</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
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
              Chuyển khoản đặt cọc
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

