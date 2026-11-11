import { supabase, isSupabaseConfigured } from './supabase/client';
import { Product, Category } from '../types/product';
import { initialProducts, initialCategories } from './mock/mockData';

const MOCK_PRODUCTS_KEY = 'bowldog_mock_products';
const MOCK_CATEGORIES_KEY = 'bowldog_mock_categories';

function getStoredMockProducts(): Product[] {
  const data = localStorage.getItem(MOCK_PRODUCTS_KEY);
  if (!data) {
    localStorage.setItem(MOCK_PRODUCTS_KEY, JSON.stringify(initialProducts));
    return initialProducts;
  }
  try {
    return JSON.parse(data);
  } catch {
    return initialProducts;
  }
}

function saveMockProducts(products: Product[]) {
  localStorage.setItem(MOCK_PRODUCTS_KEY, JSON.stringify(products));
}

function getStoredMockCategories(): Category[] {
  const data = localStorage.getItem(MOCK_CATEGORIES_KEY);
  if (!data) {
    localStorage.setItem(MOCK_CATEGORIES_KEY, JSON.stringify(initialCategories));
    return initialCategories;
  }
  try {
    return JSON.parse(data);
  } catch {
    return initialCategories;
  }
}

export const productService = {
  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    return getStoredMockCategories();
  },

  async getProducts(params?: {
    categoryId?: string;
    search?: string;
    featuredOnly?: boolean;
    activeOnly?: boolean;
    sortBy?: 'newest' | 'price_asc' | 'price_desc';
  }): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          images:product_images(*),
          variants:product_variants(*)
        `);

      if (params?.activeOnly !== false) {
        query = query.eq('is_active', true);
      }
      if (params?.featuredOnly) {
        query = query.eq('is_featured', true);
      }
      if (params?.categoryId && params.categoryId !== 'all') {
        query = query.eq('category_id', params.categoryId);
      }
      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`);
      }

      if (params?.sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (params?.sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    // Mock store mode
    let list = [...getStoredMockProducts()];
    if (params?.activeOnly !== false) {
      list = list.filter((p) => p.is_active);
    }
    if (params?.featuredOnly) {
      list = list.filter((p) => p.is_featured);
    }
    if (params?.categoryId && params.categoryId !== 'all') {
      list = list.filter((p) => p.category_id === params.categoryId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (params?.sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (params?.sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const cats = getStoredMockCategories();
    return list.map((p) => ({
      ...p,
      category: cats.find((c) => c.id === p.category_id),
    }));
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          images:product_images(*),
          variants:product_variants(*)
        `)
        .eq('slug', slug)
        .single();
      if (error) return null;
      return data;
    }

    const prods = getStoredMockProducts();
    const prod = prods.find((p) => p.slug === slug);
    if (!prod) return null;
    const cats = getStoredMockCategories();
    return {
      ...prod,
      category: cats.find((c) => c.id === prod.category_id),
    };
  },

  async saveProduct(product: Partial<Product>): Promise<Product> {
    if (isSupabaseConfigured && supabase) {
      if (product.id) {
        const { data, error } = await supabase
          .from('products')
          .update({
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: product.price,
            stock_quantity: product.stock_quantity,
            is_featured: product.is_featured,
            is_active: product.is_active,
            category_id: product.category_id,
            specifications: product.specifications,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert({
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: product.price,
            stock_quantity: product.stock_quantity,
            is_featured: product.is_featured,
            is_active: product.is_active,
            category_id: product.category_id,
            specifications: product.specifications,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }

    // Mock store
    const prods = getStoredMockProducts();
    if (product.id) {
      const index = prods.findIndex((p) => p.id === product.id);
      if (index === -1) throw new Error('Không tìm thấy sản phẩm');
      const updated = { ...prods[index], ...product, updated_at: new Date().toISOString() } as Product;
      prods[index] = updated;
      saveMockProducts(prods);
      return updated;
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        category_id: product.category_id || 'cat-bowls',
        name: product.name || 'Sản phẩm mới',
        slug: product.slug || `san-pham-${Date.now()}`,
        description: product.description || '',
        price: product.price || 100000,
        stock_quantity: product.stock_quantity || 10,
        is_featured: product.is_featured || false,
        is_active: product.is_active ?? true,
        specifications: product.specifications || {},
        images: product.images || [
          {
            id: `img-${Date.now()}`,
            product_id: `prod-${Date.now()}`,
            image_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop',
            display_order: 1,
            is_primary: true,
          },
        ],
        variants: product.variants || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      prods.unshift(newProd);
      saveMockProducts(prods);
      return newProd;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const prods = getStoredMockProducts();
    saveMockProducts(prods.filter((p) => p.id !== id));
  },
};

