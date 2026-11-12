import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, Sparkles, X } from 'lucide-react';
import { Product, Category } from '../../types/product';
import { productService } from '../../services/productService';
import { ProductCard } from '../../components/products/ProductCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const currentCategory = searchParams.get('category') || 'all';
  const currentSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [maxPrice, setMaxPrice] = useState<number>(500000);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  useEffect(() => {
    setSearchQuery(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    async function fetchCats() {
      try {
        const cats = await productService.getCategories();
        setCategories(cats);
      } catch (e) {
        console.error(e);
      }
    }
    fetchCats();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      // Nếu đang lọc theo slug danh mục nhưng danh sách categories chưa tải xong thì đợi
      if (currentCategory !== 'all' && categories.length === 0) {
        return;
      }
      setLoading(true);
      try {
        const selectedCat = categories.find(
          (c) => c.slug === currentCategory || c.id === currentCategory
        );
        const data = await productService.getProducts({
          categoryId: currentCategory === 'all' ? undefined : selectedCat?.id,
          search: currentSearch || undefined,
          sortBy,
        });

        // Filter by price on client
        const filtered = data.filter((p) => p.price <= maxPrice);
        setProducts(filtered);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [currentCategory, currentSearch, sortBy, maxPrice, categories]);

  const handleCategoryChange = (slug: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (slug === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', slug);
    }
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setSearchQuery('');
    setMaxPrice(500000);
    setSortBy('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Title & Category Pills */}
      <div className="space-y-4">
        <div>
          <Badge variant="pink" size="sm">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Bộ sưu tập thủ công</span>
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-cute-brown dark:text-cute-cream mt-1 font-sans">
            Tất cả sản phẩm yêu thương
          </h1>
          <p className="text-xs sm:text-sm text-cute-brown-light dark:text-cute-muted">
            Lựa chọn những món đồ xinh xắn nhất được in 3D an toàn và cá nhân hóa riêng cho bé
          </p>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
              currentCategory === 'all'
                ? 'bg-cute-pink text-cute-brown shadow-cute border border-cute-pink-300'
                : 'bg-white dark:bg-cute-surface-dark text-cute-brown-light dark:text-cute-muted hover:bg-cute-cream border border-cute-border-light dark:border-cute-border-dark'
            }`}
          >
            🐾 Tất cả sản phẩm
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
                currentCategory === cat.slug
                  ? 'bg-cute-pink text-cute-brown shadow-cute border border-cute-pink-300'
                  : 'bg-white dark:bg-cute-surface-dark text-cute-brown-light dark:text-cute-muted hover:bg-cute-cream border border-cute-border-light dark:border-cute-border-dark'
              }`}
            >
              {cat.slug === 'bat-an-cho-cho' ? '🥣 ' : cat.slug === 'moc-khoa-3d' ? '🔑 ' : '✨ '}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Control Bar: Search, Price, Sort */}
      <div className="bg-white dark:bg-cute-surface-dark p-4 rounded-3xl border border-cute-border-light dark:border-cute-border-dark shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-cute-cream/50 dark:bg-cute-cream-dark/50 text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
          />
          <Search className="w-4 h-4 text-cute-brown-light absolute left-3 top-3" />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Price Range Quick Slider */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-cute-brown dark:text-cute-cream">
            <span className="text-cute-brown-light text-[11px]">Giá tối đa:</span>
            <input
              type="range"
              min="50000"
              max="500000"
              step="20000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-28 accent-cute-pink-400"
            />
            <span className="font-bold text-rose-500">{new Intl.NumberFormat('vi-VN').format(maxPrice)}đ</span>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-cute-brown-light" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-cute-border-light dark:border-cute-border-dark bg-cute-cream/50 dark:bg-cute-cream-dark/50 text-cute-brown dark:text-cute-cream font-semibold focus:outline-none"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá: Thấp đến cao</option>
              <option value="price_desc">Giá: Cao đến thấp</option>
            </select>
          </div>

          {(currentSearch || currentCategory !== 'all' || maxPrice < 500000) && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold p-2 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="cute-card aspect-[3/4] animate-pulse bg-cute-pink/20" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 cute-card p-8 space-y-4">
          <div className="w-20 h-20 rounded-full bg-cute-pink/40 mx-auto flex items-center justify-center text-3xl">
            🐾
          </div>
          <h3 className="text-lg font-bold text-cute-brown dark:text-cute-cream">
            Không tìm thấy sản phẩm phù hợp
          </h3>
          <p className="text-xs text-cute-brown-light dark:text-cute-muted max-w-sm mx-auto">
            Hãy thử tìm bằng từ khóa khác hoặc xóa bớt các bộ lọc đang chọn nhé ba mẹ!
          </p>
          <Button variant="primary" size="sm" onClick={clearAllFilters}>
            Xem tất cả sản phẩm
          </Button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <p className="text-center text-xs text-cute-brown-light dark:text-cute-muted mt-10">
            Đang hiển thị {products.length} sản phẩm đáng yêu cho bé
          </p>
        </div>
      )}
    </div>
  );
};

