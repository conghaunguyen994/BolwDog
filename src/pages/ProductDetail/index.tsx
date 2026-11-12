import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Truck,
  Sparkles,
  Plus,
  Minus,
  Check,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
} from 'lucide-react';
import { Product, ProductVariant } from '../../types/product';
import { PetCustomization } from '../../types/order';
import { productService } from '../../services/productService';
import { formatVND } from '../../utils/currency';
import { enforceRateLimit, sanitizeObject } from '../../utils/securityGuard';
import { useAppDispatch } from '../../app/hooks';
import { addToCart } from '../../features/cart/cartSlice';
import { CustomizationForm } from '../../components/products/CustomizationForm';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [quantity, setQuantity] = useState<number>(1);
  const [customization, setCustomization] = useState<PetCustomization>({
    petName: 'Ngáo',
    bodyColor: 'Trắng Sứ',
    bodyColorHex: '#FFFFFF',
    baseColor: 'Xanh Cổ Vịt (Mẫu Ngáo)',
    baseColorHex: '#1A7B8E',
    selectedIcons: ['🐶', '🐾'],
    petBirthday: '',
    customNotes: '',
    customText: '',
  });
  const [addedToast, setAddedToast] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // States cho chế độ Xem Full Ảnh (Lightbox) & Lướt ảnh
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const galleryImages = React.useMemo(() => {
    if (!product) return [];
    const urls = product.images
      .map((img) => img.image_url)
      .filter((u) => Boolean(u && u.trim()));
    if (urls.length > 0) {
      return Array.from(new Set(urls));
    }
    return [
      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop',
    ];
  }, [product]);

  const currentImageIndex = React.useMemo(() => {
    const idx = galleryImages.indexOf(selectedImage);
    return idx >= 0 ? idx : 0;
  }, [galleryImages, selectedImage]);

  const handlePrevImage = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (galleryImages.length <= 1) return;
      setIsZoomed(false);
      const prevIdx =
        (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
      setSelectedImage(galleryImages[prevIdx]);
    },
    [currentImageIndex, galleryImages]
  );

  const handleNextImage = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (galleryImages.length <= 1) return;
      setIsZoomed(false);
      const nextIdx = (currentImageIndex + 1) % galleryImages.length;
      setSelectedImage(galleryImages[nextIdx]);
    },
    [currentImageIndex, galleryImages]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 45) {
      if (deltaX < 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    setTouchStartX(null);
  };

  // Điều hướng bằng bàn phím khi đang mở Lightbox xem full ảnh
  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setIsZoomed(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLightboxOpen, handlePrevImage, handleNextImage]);

  useEffect(() => {
    async function fetchDetail() {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await productService.getProductBySlug(slug);
        setProduct(data);
        if (data) {
          const mainImg =
            data.images.find((img) => img.is_primary)?.image_url ||
            data.images[0]?.image_url ||
            'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop';
          setSelectedImage(mainImg);
          if (data.variants && data.variants.length > 0) {
            setSelectedVariant(data.variants[0]);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-cute-pink-300 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-cute-brown-light">Đang mở trang chi tiết bé yêu...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-4xl">🐾</div>
        <h2 className="text-xl font-bold text-cute-brown dark:text-cute-cream">
          Không tìm thấy thông tin sản phẩm
        </h2>
        <Link to="/products">
          <Button variant="primary" size="md">
            Quay lại cửa hàng
          </Button>
        </Link>
      </div>
    );
  }

  const unitPrice = product.price + (selectedVariant ? selectedVariant.additional_price : 0);
  const totalPrice = unitPrice * quantity;
  const isOutOfStock = product.stock_quantity <= 0;

  const activeBaseHex = customization.baseColorHex || '#1A7B8E';
  const activeBodyHex = customization.bodyColorHex || '#FFFFFF';
  const activeAccentHex =
    activeBaseHex.toLowerCase() === '#ffffff'
      ? activeBodyHex.toLowerCase() === '#ffffff'
        ? '#1A7B8E'
        : activeBodyHex
      : activeBaseHex;

  const handleAddToCart = (): boolean => {
    if (isOutOfStock) return false;
    try {
      setActionError(null);
      enforceRateLimit('add_to_cart');
      const cleanCustom = sanitizeObject(customization);
      dispatch(
        addToCart({
          product,
          variant: selectedVariant,
          quantity: Math.min(20, Math.max(1, quantity)),
          customization: cleanCustom,
        })
      );
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 2500);
      return true;
    } catch (err: any) {
      setActionError(err.message || 'Thao tác quá nhanh, vui lòng đợi một chút nhé!');
      return false;
    }
  };

  const handleBuyNow = () => {
    if (handleAddToCart()) {
      navigate('/checkout');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-cute-brown-light dark:text-cute-muted">
        <Link to="/" className="hover:text-cute-pink-500">Trang chủ</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-cute-pink-500">Sản phẩm</Link>
        <span>/</span>
        <span className="text-cute-brown dark:text-cute-cream font-bold truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">

        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div
            onClick={() => {
              setIsZoomed(false);
              setIsLightboxOpen(true);
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              borderColor: `${activeAccentHex}80`,
              boxShadow: `0 12px 32px -8px ${activeAccentHex}35`,
            }}
            className="group aspect-square w-full rounded-4xl overflow-hidden bg-[#FDF9F3] dark:bg-cute-surface-dark border-2 relative transition-all duration-300 cursor-zoom-in select-none flex items-center justify-center"
          >
            <img
              src={selectedImage}
              alt={product.name}
              className={`w-full h-full ${fitMode === 'contain' ? 'object-contain p-1 sm:p-2' : 'object-cover'
                } transition-all duration-300 group-hover:scale-[1.02]`}
            />

            {product.is_featured && (
              <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <Badge variant="pink" size="md">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span>Nổi bật nhất</span>
                </Badge>
              </div>
            )}

            {/* Nút chuyển đổi hiển thị Vừa khung (Full ảnh) / Tràn viền */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'));
              }}
              className="absolute top-4 right-4 z-10 px-2.5 py-1.5 rounded-full bg-white/90 dark:bg-black/60 hover:bg-white text-cute-brown dark:text-white text-[11px] font-bold shadow-md flex items-center gap-1 transition-all"
              title="Đổi chế độ hiển thị ảnh"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{fitMode === 'contain' ? 'Đang hiện trọn ảnh' : 'Đang tràn khung'}</span>
            </button>

            {/* Nút mũi tên Trái / Phải để lướt xem ảnh khác */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="Ảnh trước"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-black/65 hover:bg-white text-cute-brown dark:text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Ảnh tiếp theo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-black/65 hover:bg-white text-cute-brown dark:text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Thanh điều khiển dưới ảnh: Bộ đếm số ảnh + Nút bấm xem Full màn hình */}
            <div className="absolute bottom-3 inset-x-3 z-10 flex items-center justify-between pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold">
                Ảnh {currentImageIndex + 1} / {galleryImages.length}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-sm text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md group-hover:bg-rose-500 transition-colors">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Bấm xem full ảnh</span>
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={`${imgUrl}-${idx}`}
                  type="button"
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all bg-[#FDF9F3] ${selectedImage === imgUrl
                    ? 'border-cute-pink-400 ring-2 ring-cute-pink-200 scale-105'
                    : 'border-cute-border-light dark:border-cute-border-dark opacity-70 hover:opacity-100'
                    }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Góc chụp ${idx + 1}`}
                    className="w-full h-full object-contain p-0.5"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Buy Info & Live Customization */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {product.category?.name && (
                <Badge variant="lavender" size="sm">
                  {product.category.name}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>5.0</span>
                <span className="text-cute-brown-light dark:text-cute-muted">(28 đánh giá)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-cute-brown dark:text-cute-cream font-sans">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-2xl sm:text-3xl font-black text-rose-500 font-sans">
                {formatVND(unitPrice)}
              </span>
              <span className="text-xs text-cute-brown-light dark:text-cute-muted font-medium">
                {isOutOfStock ? '(Bé đang tạm hết hàng)' : `(Còn ${product.stock_quantity} bé trong xưởng)`}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-cute-brown-light dark:text-cute-muted leading-relaxed">
            {product.description}
          </p>

          {/* Variants Selector */}
          {product.variants.length > 0 && (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-cute-brown dark:text-cute-cream block">
                {product.variants[0].variant_name}:
              </label>
              <div className="flex flex-col gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const finalSizePrice = product.price + v.additional_price;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      style={
                        isSelected
                          ? {
                            borderColor: activeAccentHex,
                            backgroundColor: `${activeAccentHex}18`,
                            boxShadow: `0 0 0 2px ${activeAccentHex}40`,
                          }
                          : undefined
                      }
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border flex items-center justify-between text-left ${isSelected
                        ? 'text-cute-brown dark:text-cute-cream shadow-sm'
                        : 'bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream border-cute-border-light hover:bg-cute-cream'
                        }`}
                    >
                      <span className="truncate pr-2">{v.variant_value}</span>
                      <span
                        style={isSelected ? { color: activeAccentHex } : undefined}
                        className="text-rose-500 font-extrabold text-xs whitespace-nowrap transition-colors"
                      >
                        {formatVND(finalSizePrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customization Form */}
          <CustomizationForm
            categoryId={product.category_id}
            categorySlug={product.category?.slug}
            productName={product.name}
            customization={customization}
            onChange={setCustomization}
          />

          {/* Quantity & Buy Buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-cute-brown dark:text-cute-cream">Số lượng:</span>
              <div
                style={{ borderColor: `${activeAccentHex}66` }}
                className="flex items-center gap-2 bg-white dark:bg-cute-surface-dark rounded-full border-2 px-3 py-1 transition-colors"
              >
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 hover:text-cute-pink-500"
                  aria-label="Giảm"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-bold px-2 text-cute-brown dark:text-cute-cream">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 hover:text-cute-pink-500"
                  aria-label="Tăng"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-xs text-cute-brown-light dark:text-cute-muted">
                Thành tiền:{' '}
                <strong style={{ color: activeAccentHex }} className="text-sm transition-colors">
                  {formatVND(totalPrice)}
                </strong>
              </span>
            </div>

            {actionError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                ⚠️ {actionError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                style={{
                  backgroundColor: `${activeBodyHex}`,
                  borderColor: activeAccentHex,
                  color: activeBodyHex.toLowerCase() === '#ffffff' ? activeAccentHex : '#3B251B',
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border-2 font-extrabold text-sm shadow-cute hover:scale-[1.01] active:scale-95 transition-all duration-300 disabled:opacity-50"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Thêm bé vào giỏ</span>
              </button>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                style={{
                  backgroundColor: activeAccentHex,
                  borderColor: activeAccentHex,
                  color: '#FFFFFF',
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border-2 font-extrabold text-sm shadow-cute-lg hover:opacity-95 hover:scale-[1.01] active:scale-95 transition-all duration-300 disabled:opacity-50"
              >
                <Heart className="w-5 h-5 fill-white/30" />
                <span>Đón bé về nhà</span>
              </button>
            </div>

            {/* Success Toast Banner */}
            {addedToast && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Đã thêm bé vào giỏ yêu thương thành công!</span>
                </div>
                <Link to="/checkout" className="font-bold underline">
                  Xem giỏ hàng
                </Link>
              </div>
            )}

            {/* Banner Zalo Hỗ Trợ Riêng Cho Từng Sản Phẩm */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-sky-50 dark:from-cute-surface-dark dark:to-cute-cream-dark/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0068FF] text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                  Z
                </div>
                <div>
                  <span className="font-bold text-cute-brown dark:text-cute-cream block">
                    Cần tư vấn phối màu riêng theo bé?
                  </span>
                  <span className="text-[11px] text-cute-brown-light dark:text-cute-muted">
                    Zalo nghệ nhân: <strong>0345.553.913</strong>
                  </span>
                </div>
              </div>
              <a
                href="https://zalo.me/0345553913"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#0068FF] hover:bg-[#0052cc] text-white font-extrabold text-[11px] shadow-sm hover:scale-105 active:scale-95 transition-all flex-shrink-0"
              >
                Nhắn Zalo ngay
              </a>
            </div>
          </div>

          {/* Assurance info */}
          <div className="pt-4 border-t border-cute-border-light dark:border-cute-border-dark grid grid-cols-2 gap-4 text-xs text-cute-brown-light dark:text-cute-muted">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Chất liệu Food-Safe an toàn 100%</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-cute-pink-500 flex-shrink-0" />
              <span>Giao hàng toàn quốc tận tay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Specifications Table */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="cute-card p-6 sm:p-8 space-y-4">
          <h3 className="text-lg font-bold text-cute-brown dark:text-cute-cream flex items-center gap-2">
            <span>🐾</span> Thông số kỹ thuật & Hướng dẫn sử dụng
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {Object.entries(product.specifications).map(([key, val]) => (
              <div
                key={key}
                className="p-3 rounded-2xl bg-cute-cream/50 dark:bg-cute-cream-dark/50 border border-cute-border-light dark:border-cute-border-dark flex justify-between gap-4"
              >
                <span className="font-semibold text-cute-brown dark:text-cute-cream capitalize">
                  {key === 'material' ? 'Chất liệu' : key === 'origin' ? 'Xuất xứ' : key === 'washable' ? 'Vệ sinh' : key === 'weight' ? 'Trọng lượng' : key}:
                </span>
                <span className="text-cute-brown-light dark:text-cute-muted text-right font-medium">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          LIGHTBOX XEM FULL ẢNH TOÀN MÀN HÌNH & LƯỚT CHUYỂN ẢNH
      ===================================================================== */}
      {isLightboxOpen && (
        <div
          onClick={() => {
            setIsLightboxOpen(false);
            setIsZoomed(false);
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in duration-200 select-none"
        >
          {/* Thanh điều khiển phía trên */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl flex items-center justify-between gap-3 text-white z-20"
          >
            <div className="flex items-center gap-2.5 truncate">
              <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-extrabold">
                {currentImageIndex + 1} / {galleryImages.length}
              </span>
              <span className="text-xs sm:text-sm font-bold truncate opacity-90">
                {product.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsZoomed((z) => !z)}
                className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {isZoomed ? (
                  <>
                    <ZoomOut className="w-4 h-4" />
                    <span>Thu nhỏ (1x)</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-4 h-4" />
                    <span>Phóng đại (2x)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setIsZoomed(false);
                }}
                className="px-3.5 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold flex items-center gap-1 shadow-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Đóng</span>
              </button>
            </div>
          </div>

          {/* Khu vực hiển thị ảnh Full & Nút lướt Trái / Phải */}
          <div className="relative flex-1 w-full max-w-6xl flex items-center justify-center overflow-auto my-2">
            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={handlePrevImage}
                aria-label="Ảnh trước"
                className="fixed sm:absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white text-white hover:text-cute-brown shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed((z) => !z);
              }}
              className={`transition-transform duration-300 flex items-center justify-center ${isZoomed ? 'scale-150 sm:scale-[1.85] cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                }`}
            >
              <img
                src={selectedImage}
                alt={product.name}
                className="max-w-[94vw] sm:max-w-[85vw] max-h-[75vh] sm:max-h-[80vh] object-contain rounded-2xl shadow-2xl bg-[#FDF9F3]"
              />
            </div>

            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={handleNextImage}
                aria-label="Ảnh tiếp theo"
                className="fixed sm:absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white text-white hover:text-cute-brown shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Dải Thumbnails bên dưới Lightbox để chọn ảnh nhanh */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl flex flex-col items-center gap-2 z-20"
          >
            {galleryImages.length > 1 && (
              <div className="flex items-center justify-center gap-2.5 overflow-x-auto max-w-full py-1 px-2">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={`lb-${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => {
                      setIsZoomed(false);
                      setSelectedImage(imgUrl);
                    }}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all bg-[#FDF9F3] ${selectedImage === imgUrl
                      ? 'border-rose-400 ring-2 ring-rose-300 scale-105 opacity-100'
                      : 'border-white/30 opacity-60 hover:opacity-100'
                      }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Ảnh thu nhỏ ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] text-white/70 text-center">
              💡 Mẹo: Bấm vào ảnh để phóng to/thu nhỏ • Vuốt ngang hoặc bấm phím mũi tên ⬅️ ➡️ để lướt xem ảnh khác
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

