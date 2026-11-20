import { supabase } from './supabase/client';
import { Product, Category } from '../types/product';

export const BOWL_VARIANTS = [
  {
    id: 'd1111111-1111-4111-8111-111111111111',
    product_id: 'b1111111-1111-4111-8111-111111111111',
    variant_name: 'Kích cỡ',
    variant_value: 'Size S : H1: 12 cm - H2: 8cm - D: 18cm (Bát inox Ø14cm)',
    additional_price: 0,
    stock_quantity: 50,
  },
  {
    id: 'd1111111-1111-4111-8111-111111111112',
    product_id: 'b1111111-1111-4111-8111-111111111111',
    variant_name: 'Kích cỡ',
    variant_value: 'Size M: H1: 14cm - H2: 10cm - D: 19cm (Bát inox Ø14cm)',
    additional_price: 30000,
    stock_quantity: 40,
  },
  {
    id: 'd1111111-1111-4111-8111-111111111113',
    product_id: 'b1111111-1111-4111-8111-111111111111',
    variant_name: 'Kích cỡ',
    variant_value: 'Size L: H1: 16cm - H2: 12cm - D: 20cm (Bát inox Ø14cm)',
    additional_price: 60000,
    stock_quantity: 30,
  },
  {
    id: 'd1111111-1111-4111-8111-111111111114',
    product_id: 'b1111111-1111-4111-8111-111111111111',
    variant_name: 'Kích cỡ',
    variant_value: 'Size XL: H1: 15 cm - H2: 15cm - D: 22,5cm (Bát inox Ø18-20cm)',
    additional_price: 101000,
    stock_quantity: 20,
  },
  {
    id: 'd1111111-1111-4111-8111-111111111115',
    product_id: 'b1111111-1111-4111-8111-111111111111',
    variant_name: 'Kích cỡ',
    variant_value: 'Size XXL: H1: 17cm - H2: 17cm - D: 25cm (Bát inox Ø18-20cm)',
    additional_price: 151000,
    stock_quantity: 15,
  },
];

export const DEFAULT_BOWL_PRODUCT: Product = {
  id: 'b1111111-1111-4111-8111-111111111111',
  category_id: 'a1111111-1111-4111-8111-111111111111',
  category: {
    id: 'a1111111-1111-4111-8111-111111111111',
    name: 'Bát Ăn Cho Chó Mèo',
    slug: 'bat-an-cho-cho',
    description: 'Bát ăn chống gù – chống kiến cho chó mèo | Bâu Shop',
    display_order: 1,
  },
  name: 'BÁT ĂN CHỐNG GÙ – CHỐNG KIẾN CHO CHÓ MÈO | BÂU SHOP',
  slug: 'bat-an-chong-gu-chong-kien-cho-cho-meo',
  description: `BÁT ĂN CHỐNG GÙ – CHỐNG KIẾN CHO CHÓ MÈO | BÂU SHOP
🌸 Thiết kế nghiêng 15° chống gù ( size S | M | L)
🌸 5 size S | M | L | XL | XXL
🌸 Đế chống kiến với khoang chứa nước
🌸 Bát inox dễ vệ sinh 
🌸 Được làm từ chất liệu nhựa PETG an toàn
🎨 BÁT ĂN CÁ NHÂN HÓA THEO YÊU CẦU:
✨ 2 màu tùy chọn (Màu ở trên & Màu ở dưới)
✨ Tên thú cưng in nổi
✨ Tối đa 2 icon ngộ nghĩnh
✨ Ngày sinh khi in lên bát xem demo trước khi đặt hàng
📏 KÍCH THƯỚC:
Bát inox đường kính 14cm 
• S : H1: 12 cm - H2: 8cm - D: 18cm -> 199K
• M: H1: 14cm - H2: 10cm - D: 19cm -> 229K
• L: H1: 16cm - H2: 12cm - D: 20cm -> 259K
Bát inox đường kính 18-20cm 
• XL: H1: 15 cm - H2: 15cm - D: 22,5cm -> 300K
• XXL: H1: 17cm - H2: 17cm - D: 25cm -> 350K`,
  price: 199000,
  stock_quantity: 85,
  is_featured: true,
  is_active: true,
  specifications: {
    'Chất liệu thân & đế': 'Nhựa sinh học PETG Food-safe an toàn thực phẩm, chịu lực tốt',
    'Lòng bát': 'Bát Inox 304 không gỉ cao cấp, tháo rời rửa sạch trong 3 giây',
    'Đế chống kiến': 'Khoang chứa nước dạng rãnh bao quanh đế, ngăn kiến và côn trùng 100%',
    'Công thái học': 'Nghiêng 15° chống gù lưng, bảo vệ đốt sống cổ cún khi ăn (Size S, M, L)',
    'Size S': 'H1: 12 cm - H2: 8cm - D: 18cm (Bát inox Ø14cm) -> 199K',
    'Size M': 'H1: 14cm - H2: 10cm - D: 19cm (Bát inox Ø14cm) -> 229K',
    'Size L': 'H1: 16cm - H2: 12cm - D: 20cm (Bát inox Ø14cm) -> 259K',
    'Size XL': 'H1: 15 cm - H2: 15cm - D: 22,5cm (Bát inox Ø18-20cm) -> 300K',
    'Size XXL': 'H1: 17cm - H2: 17cm - D: 25cm (Bát inox Ø18-20cm) -> 350K',
  },
  images: [
    {
      id: 'img-bowl-real-1',
      product_id: 'b1111111-1111-4111-8111-111111111111',
      image_url: '/images/bat-an-chong-gu-chong-kien.jpg',
      display_order: 1,
      is_primary: true,
    },
    {
      id: 'img-bowl-real-2',
      product_id: 'b1111111-1111-4111-8111-111111111111',
      image_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop',
      display_order: 2,
      is_primary: false,
    },
  ],
  variants: BOWL_VARIANTS,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function normalizeVietnameseText(text?: string | null): string {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesProductSearch(product: Product, rawQuery?: string | null): boolean {
  const normalizedQuery = normalizeVietnameseText(rawQuery);
  if (!normalizedQuery) return true;

  const variantText = (product.variants || [])
    .map((v) => `${v.variant_name || ''} ${v.variant_value || ''}`)
    .join(' ');
  const haystack = normalizeVietnameseText(
    [
      product.name,
      product.slug,
      product.description,
      product.category?.name,
      product.category?.slug,
      variantText,
    ]
      .filter(Boolean)
      .join(' ')
  );

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
}

function deduplicateVariants(variants: any[]): any[] {
  const seen = new Set<string>();
  const unique: any[] = [];
  for (const v of variants) {
    const key = `${v.variant_name || ''}__${v.variant_value || ''}`.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(v);
    }
  }
  return unique.sort((a: any, b: any) => (a.additional_price || 0) - (b.additional_price || 0));
}

function requireSupabase() {
  if (!supabase) {
    throw new Error('Chưa kết nối tới cơ sở dữ liệu Supabase.');
  }
  return supabase;
}

export const productService = {
  async getCategories(): Promise<Category[]> {
    try {
      const db = requireSupabase();
      localStorage.removeItem('bowldog_mock_categories');
      localStorage.removeItem('bowldog_mock_products');

      const { data, error } = await db
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      const cats = (data || []).filter((c: Category) =>
        c.slug === 'bat-an-cho-cho' || c.name.toLowerCase().includes('bát')
      );
      if (cats.length > 0) return cats;
      return [
        {
          id: 'a1111111-1111-4111-8111-111111111111',
          name: 'Bát Ăn Cho Chó Mèo',
          slug: 'bat-an-cho-cho',
          description: 'Bát ăn chống gù – chống kiến cho chó mèo | Bâu Shop',
          icon: 'UtensilsCrossed',
          display_order: 1,
        },
      ];
    } catch {
      return [
        {
          id: 'a1111111-1111-4111-8111-111111111111',
          name: 'Bát Ăn Cho Chó Mèo',
          slug: 'bat-an-cho-cho',
          description: 'Bát ăn chống gù – chống kiến cho chó mèo | Bâu Shop',
          icon: 'UtensilsCrossed',
          display_order: 1,
        },
      ];
    }
  },

  async getProducts(params?: {
    categoryId?: string;
    search?: string;
    featuredOnly?: boolean;
    activeOnly?: boolean;
    sortBy?: 'newest' | 'price_asc' | 'price_desc';
  }): Promise<Product[]> {
    try {
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

      if (params?.sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (params?.sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      let list = (data || []).map((p: any) => {
        const isBowl =
          p.slug?.includes('bat-an') ||
          p.name?.toLowerCase().includes('bát') ||
          p.category?.slug?.includes('bat-an');

        const variants =
          isBowl && (!p.variants || p.variants.length < 5)
            ? BOWL_VARIANTS
            : deduplicateVariants(p.variants || []);

        return {
          ...p,
          name: isBowl ? 'BÁT ĂN CHỐNG GÙ – CHỐNG KIẾN CHO CHÓ MÈO | BÂU SHOP' : p.name,
          images: (p.images || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)),
          variants,
        };
      });

      // Hiện tại cửa hàng chỉ bán bát cho chó mèo ăn
      const bowlsOnly = list.filter((p: Product) =>
        p.slug?.includes('bat-an') ||
        p.name?.toLowerCase().includes('bát') ||
        p.category?.slug?.includes('bat-an')
      );

      const baseProducts =
        bowlsOnly.length > 0
          ? bowlsOnly
          : list.length > 0
            ? list
            : params?.categoryId
              ? []
              : [DEFAULT_BOWL_PRODUCT];

      if (params?.search?.trim()) {
        return baseProducts.filter((p: Product) => matchesProductSearch(p, params.search));
      }

      return baseProducts;
    } catch {
      if (params?.search?.trim()) {
        return [DEFAULT_BOWL_PRODUCT].filter((p) => matchesProductSearch(p, params.search));
      }
      return [DEFAULT_BOWL_PRODUCT];
    }
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
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

      if (error || !data) {
        // Fallback to default bowl product if looking for bowl
        if (slug.includes('bat-an') || slug.includes('bowl')) {
          return DEFAULT_BOWL_PRODUCT;
        }
        return null;
      }

      const isBowl =
        data.slug?.includes('bat-an') ||
        data.name?.toLowerCase().includes('bát') ||
        data.category?.slug?.includes('bat-an');

      const variants =
        isBowl && (!data.variants || data.variants.length < 5)
          ? BOWL_VARIANTS
          : deduplicateVariants(data.variants || []);

      return {
        ...data,
        name: isBowl ? 'BÁT ĂN CHỐNG GÙ – CHỐNG KIẾN CHO CHÓ MÈO | BÂU SHOP' : data.name,
        images: (data.images || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)),
        variants,
      };
    } catch {
      if (slug.includes('bat-an') || slug.includes('bowl')) {
        return DEFAULT_BOWL_PRODUCT;
      }
      return null;
    }
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
