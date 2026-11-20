import { Product, ProductVariant } from './product';
import { PetCustomization } from './order';
import { SaleCampaignConfig } from './settings';

export interface CartItem {
  id: string; // Unique generated composite id: `${productId}-${variantId || 'novar'}-${hashCustomization}`
  product: Product;
  selectedVariant?: ProductVariant;
  quantity: number;
  /** Giá gốc chưa giảm (Base price + variant additional price) */
  originalUnitPrice?: number;
  /** Phần trăm giảm giá đang áp dụng (0 nếu không giảm) */
  discountPercentage?: number;
  /** Đơn giá thực tế sau khi áp dụng giảm giá (nếu có) */
  unitPrice: number;
  customization: PetCustomization;
}

export interface CartState {
  items: CartItem[];
  /** Tổng tiền hàng theo giá gốc trước giảm */
  originalSubtotal?: number;
  /** Tổng số tiền được giảm giá từ chương trình Sale */
  discountAmount?: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  depositAmount: number;
  depositPercentage: number;
  /** Cấu hình chương trình Sale hiện tại của shop */
  saleCampaign?: SaleCampaignConfig | null;
}

