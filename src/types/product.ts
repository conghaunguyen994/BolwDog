export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string; // e.g. "Kích thước", "Màu sắc", "Kiểu dáng"
  variant_value: string; // e.g. "Size S", "Pastel Pink"
  additional_price: number;
  stock_quantity: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

export interface ProductSpecifications {
  material?: string;
  origin?: string;
  dimensions?: string;
  weight?: string;
  capacity?: string;
  washable?: string;
  features?: string;
  [key: string]: string | undefined;
}

export interface Product {
  id: string;
  category_id: string;
  category?: Category;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock_quantity: number;
  is_featured: boolean;
  is_active: boolean;
  specifications: ProductSpecifications;
  images: ProductImage[];
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
}

