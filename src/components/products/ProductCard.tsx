import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Sparkles, Heart } from 'lucide-react';
import { Product } from '../../types/product';
import { formatVND } from '../../utils/currency';
import { useAppDispatch } from '../../app/hooks';
import { addToCart } from '../../features/cart/cartSlice';
import { Badge } from '../common/Badge';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const primaryImage =
    product.images.find((img) => img.is_primary)?.image_url ||
    product.images[0]?.image_url ||
    'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop';

  const isOutOfStock = product.stock_quantity <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If product has variants or needs customization, take user to detail page
    if (product.variants.length > 0 || product.category_id === 'cat-bowls') {
      navigate(`/product/${product.slug}`);
      return;
    }

    dispatch(
      addToCart({
        product,
        variant: undefined,
        quantity: 1,
        customization: {},
      })
    );
  };

  return (
    <div className="group relative cute-card overflow-hidden hover:shadow-cute-lg dark:hover:shadow-cute-dark transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Image Box */}
        <div className="relative aspect-square w-full overflow-hidden bg-cute-peach/20 dark:bg-cute-surface-dark">
          <Link to={`/product/${product.slug}`}>
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </Link>

          {/* Floating Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.is_featured && (
              <Badge variant="pink" size="sm">
                <Sparkles className="w-3 h-3 text-rose-500" />
                <span>Nổi bật</span>
              </Badge>
            )}
            {product.category?.name && (
              <Badge variant="cream" size="sm">
                {product.category.name}
              </Badge>
            )}
          </div>

          {/* Stock Tag if Out of Stock */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/70 dark:bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-cute-brown/80 text-white text-xs px-3 py-1.5 rounded-full font-bold">
                Bé đang tạm hết hàng
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-2">
          {/* Rating */}
          <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="text-cute-brown dark:text-cute-cream font-bold">5.0</span>
            <span className="text-cute-brown-light dark:text-cute-muted text-[11px]">(30+ ba mẹ khen)</span>
          </div>

          {/* Title */}
          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="text-sm sm:text-base font-bold text-cute-brown dark:text-cute-cream line-clamp-2 group-hover:text-cute-pink-500 transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Short description */}
          <p className="text-xs text-cute-brown-light dark:text-cute-muted line-clamp-2">
            {product.description}
          </p>
        </div>
      </div>

      {/* Footer / Price & Add */}
      <div className="p-4 sm:p-5 pt-0 flex items-center justify-between border-t border-cute-border-light/40 dark:border-cute-border-dark/40 mt-3">
        <div>
          <span className="text-[10px] text-cute-brown-light dark:text-cute-muted block">Giá yêu thương</span>
          <span className="text-base sm:text-lg font-black text-rose-500 font-sans">
            {formatVND(product.price)}
          </span>
        </div>

        <button
          onClick={handleQuickAdd}
          disabled={isOutOfStock}
          aria-label="Thêm bé vào giỏ"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-cute-pink/80 hover:bg-cute-pink-200 text-cute-brown text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-cute-brown" />
          <span className="hidden xs:inline">Thêm bé vào giỏ</span>
        </button>
      </div>
    </div>
  );
};

