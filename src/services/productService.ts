import { supabase } from './supabase/client';
import { Product, Category } from '../types/product';

function requireSupabase() {
  if (!supabase) {
    throw new Error('Chưa kết nối tới cơ sở dữ liệu Supabase.');
  }
  return supabase;
}

export const productService = {
  async getCategories(): Promise<Category[]> {
    const db = requireSupabase();
    // Xóa cache mock cũ nếu còn sót trong trình duyệt
    localStorage.removeItem('bowldog_mock_categories');
    localStorage.removeItem('bowldog_mock_products');

    const { data, error } = await db
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async getProducts(params?: {
    categoryId?: string;
    search?: string;
    featuredOnly?: boolean;
    activeOnly?: boolean;
    sortBy?: 'newest' | 'price_asc' | 'price_desc';
  }): Promise<Product[]> {
    const db = requireSupabase();

    let query = db
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
    if (error) throw new Error(error.message);

    return (data || []).map((p: any) => ({
      ...p,
      images: (p.images || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)),
      variants: (p.variants || []).sort((a: any, b: any) => (a.additional_price || 0) - (b.additional_price || 0)),
    }));
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const db = requireSupabase();
    const { data, error } = await db
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return null;

    return {
      ...data,
      images: (data.images || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)),
      variants: (data.variants || []).sort((a: any, b: any) => (a.additional_price || 0) - (b.additional_price || 0)),
    };
  },

  async saveProduct(product: Partial<Product>): Promise<Product> {
    const db = requireSupabase();
    let savedProductId = product.id;

    if (savedProductId) {
      const { error } = await db
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
          specifications: product.specifications || {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', savedProductId);

      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await db
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
          specifications: product.specifications || {},
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      savedProductId = data.id;
    }

    // Đồng bộ ảnh sản phẩm vào bảng product_images
    if (product.images && product.images.length > 0 && savedProductId) {
      await db.from('product_images').delete().eq('product_id', savedProductId);
      await db.from('product_images').insert(
        product.images.map((img, idx) => ({
          product_id: savedProductId,
          image_url: img.image_url,
          display_order: idx + 1,
          is_primary: idx === 0,
        }))
      );
    }

    // Đồng bộ biến thể (variants) vào bảng product_variants
    if (product.variants && savedProductId) {
      await db.from('product_variants').delete().eq('product_id', savedProductId);
      if (product.variants.length > 0) {
        await db.from('product_variants').insert(
          product.variants.map((v) => ({
            product_id: savedProductId,
            variant_name: v.variant_name || 'Kích cỡ',
            variant_value: v.variant_value,
            additional_price: Number(v.additional_price) || 0,
            stock_quantity: Number(v.stock_quantity) || 50,
          }))
        );
      }
    }

    const { data: fullProduct, error: fetchErr } = await db
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .eq('id', savedProductId)
      .single();

    if (fetchErr) throw new Error(fetchErr.message);
    return fullProduct;
  },

  async deleteProduct(id: string): Promise<void> {
    const db = requireSupabase();
    const { error } = await db.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
