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
  /** URL Google Apps Script hoặc Webhook gửi email 2 chiều (Admin ⇄ Khách hàng) */
  webhook_url?: string;
  /** Cấu hình EmailJS (Tùy chọn) */
  emailjs_service_id?: string;
  emailjs_template_id?: string;
  emailjs_public_key?: string;
  notify_on_new_order: boolean;
  notify_on_demo_sent: boolean;
  notify_on_demo_review: boolean;
  notify_on_status_change: boolean;
}

export interface ShopSettings {
  general_info: GeneralShopInfo;
  social_links: SocialLinks;
  bank_transfer: BankTransferConfig;
  email_notifications?: EmailNotificationConfig;
}

