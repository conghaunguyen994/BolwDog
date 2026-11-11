import React, { useEffect, useState } from 'react';
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
  ArrowLeft,
} from 'lucide-react';
import { Product, ProductVariant } from '../../types/product';
import { PetCustomization } from '../../types/order';
import { productService } from '../../services/productService';
import { formatVND } from '../../utils/currency';
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
    petName: '',
    petAge: '',
    petBirthday: '',
    customNotes: '',
    customText: '',
  });
  const [addedToast, setAddedToast] = useState(false);

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

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    dispatch(
      addToCart({
        product,
        variant: selectedVariant,
        quantity,
        customization,
      })
    );
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
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
          <div className="aspect-square w-full rounded-4xl overflow-hidden bg-white dark:bg-cute-surface-dark border-2 border-cute-border-light dark:border-cute-border-dark shadow-cute-lg relative">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {product.is_featured && (
              <div className="absolute top-4 left-4">
                <Badge variant="pink" size="md">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span>Nổi bật nhất</span>
                </Badge>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === img.image_url
                      ? 'border-cute-pink-400 ring-2 ring-cute-pink-200 scale-105'
                      : 'border-cute-border-light dark:border-cute-border-dark opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.image_url} alt="Thumbnail" className="w-full h-full object-cover" />
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
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-cute-pink text-cute-brown border-cute-pink-400 shadow-sm ring-1 ring-cute-pink-300'
                          : 'bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream border-cute-border-light hover:bg-cute-cream'
                      }`}
                    >
                      <span>{v.variant_value}</span>
                      {v.additional_price > 0 && (
                        <span className="text-rose-500 ml-1.5 font-normal">
                          (+{formatVND(v.additional_price)})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customization Form */}
          <CustomizationForm
            categoryId={product.category_id}
            customization={customization}
            onChange={setCustomization}
          />

          {/* Quantity & Buy Buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-cute-brown dark:text-cute-cream">Số lượng:</span>
              <div className="flex items-center gap-2 bg-white dark:bg-cute-surface-dark rounded-full border border-cute-border-light dark:border-cute-border-dark px-3 py-1">
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
                Thành tiền: <strong className="text-rose-500 text-sm">{formatVND(totalPrice)}</strong>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="flex-1 justify-center"
                leftIcon={<ShoppingBag className="w-5 h-5" />}
              >
                Thêm bé vào giỏ
              </Button>

              <Button
                variant="secondary"
                size="lg"
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className="flex-1 justify-center bg-cute-peach hover:bg-cute-peach-200 border-cute-peach-200"
                leftIcon={<Heart className="w-5 h-5 text-rose-500" />}
              >
                Đón bé về nhà
              </Button>
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
    </div>
  );
};

