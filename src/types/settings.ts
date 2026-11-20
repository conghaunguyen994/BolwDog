export interface GeneralShopInfo {
  shop_name: string;
  tagline: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  support_hours: string;
  logo_url?: string;
}

export interface SocialLinks {
  facebook: string;
  tiktok: string;
  instagram: string;
}

export interface BankTransferConfig {
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_holder: string;
  deposit_percentage: number;
  qr_template: string;
  qr_custom_image?: string;
  transfer_note_prefix: string;
}

export interface EmailNotificationConfig {
  enabled: boolean;
  admin_email: string;
  admin_backup_email?: string;
  /** Tên miền website chính thức (ví dụ: https://bowlshop.vercel.app) để gắn link vào Email */
  production_site_url?: string;
  notify_on_new_order: boolean;
  notify_on_demo_sent: boolean;
  notify_on_demo_review: boolean;
  notify_on_status_change: boolean;
}

export interface BlockedClientRule {
  id: string;
  type: 'email' | 'phone' | 'ip_or_fingerprint';
  value: string;
  reason: string;
  blocked_at: string;
}

export interface SePayConfig {
  enabled: boolean;
  /** Số tài khoản ngân hàng liên kết với SePay (ví dụ: 0345553913) */
  account_number?: string;
  /** Tiền tố cú pháp nội dung chuyển khoản (mặc định BD) */
  pattern_prefix?: string;
  /** Tự động chuyển đơn sang Đã duyệt khi nhận đủ tiền cọc */
  auto_confirm_order: boolean;
}

export interface ShopSettings {
  general_info: GeneralShopInfo;
  social_links: SocialLinks;
  bank_transfer: BankTransferConfig;
  email_notifications?: EmailNotificationConfig;
  blocked_rules?: BlockedClientRule[];
  sepay?: SePayConfig;
}
