import { Product, ProductVariant } from './product';
import { PetCustomization } from './order';

export interface CartItem {
  id: string; // Unique generated composite id: `${productId}-${variantId || 'novar'}-${hashCustomization}`
  product: Product;
  selectedVariant?: ProductVariant;
  quantity: number;
  unitPrice: number; // Base price + variant additional price
  customization: PetCustomization;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  depositAmount: number;
}

