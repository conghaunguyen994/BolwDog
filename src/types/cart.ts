import { Product, ProductVariant } from './product';
import { PetCustomization } from './order';
import { FreeshipVoucherConfig, SaleCampaignConfig } from './settings';

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
  /** Có được tích chọn để thanh toán trong giỏ hàng hay không (mặc định true) */
  selected?: boolean;
}

export interface CartState {
  items: CartItem[];
  /** Tổng tiền hàng theo giá gốc trước giảm */
  originalSubtotal?: number;
  /** Tổng số tiền được giảm giá từ chương trình Sale */
  discountAmount?: number;
  subtotal: number;
  /** Phí vận chuyển gốc trước khi áp dụng mã freeship */
  baseShippingFee?: number;
  /** Số tiền phí vận chuyển được giảm nhờ mã freeship */
  shippingDiscountAmount?: number;
  shippingFee: number;
  total: number;
  depositAmount: number;
  depositPercentage: number;
  /** Cấu hình chương trình Sale hiện tại của shop */
  saleCampaign?: SaleCampaignConfig | null;
  /** Cấu hình mã miễn phí vận chuyển từ Admin */
  freeshipVoucherConfig?: FreeshipVoucherConfig | null;
  /** Mã miễn phí vận chuyển mà khách hàng đã nhập */
  appliedFreeshipCode?: string | null;
}

