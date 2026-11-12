export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipping' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'deposit_pending' | 'partially_paid' | 'paid' | 'refunded';
export type DemoReviewStatus = 'pending_review' | 'approved' | 'revision_requested';

export interface Demo3DPreview {
  /** Ảnh chụp màn hình / render 3D chính (DataURL nén hoặc link https) */
  imageUrl: string;
  /** Danh sách nhiều góc chụp file 3D (nếu có) */
  images?: string[];
  /** Lời nhắn của Admin gửi kèm bản demo */
  adminNote?: string;
  /** Thời điểm Admin gửi bản demo */
  sentAt: string;
  /** Trạng thái khách duyệt: chờ duyệt | đã chốt in | yêu cầu sửa lại */
  status: DemoReviewStatus;
  /** Ý kiến phản hồi / yêu cầu chỉnh sửa của khách hàng */
  customerFeedback?: string;
  /** Thời điểm khách bấm chốt in hoặc gửi yêu cầu chỉnh sửa */
  reviewedAt?: string;
}

export interface PetCustomization {
  petName?: string;
  petBirthday?: string;
  bodyColor?: string; // Màu thân bát
  bodyColorHex?: string; // Mã màu hex thân bát
  baseColor?: string; // Màu đế chống kiến & chữ in nổi
  baseColorHex?: string; // Mã màu hex đế chống kiến
  selectedIcons?: string[]; // Tối đa 2 icon: ['🐾', '🦴']
  fontStyle?: string;
  petAge?: string;
  petPhotoUrl?: string;
  customNotes?: string;
  // For keychains or accessories
  keychainColor?: string;
  keychainDesign?: string;
  customText?: string;
  phoneOnTag?: string;
  // Bản demo file 3D để khách hàng xem trước & chốt in
  demoPreview?: Demo3DPreview;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  customization_data: PetCustomization;
  variant_name?: string;
  variant_value?: string;
  image_url?: string;
}

export interface PaymentProof {
  id?: string;
  order_id: string;
  amount: number;
  payment_method: 'bank_transfer';
  payment_status: 'pending_verification' | 'verified' | 'rejected';
  proof_image_url?: string;
  verified_by?: string;
  verified_at?: string;
  created_at?: string;
}

export interface Order {
  id: string;
  order_reference: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  shipping_address: string;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  deposit_amount: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
  payments?: PaymentProof[];
}
