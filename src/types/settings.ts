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

export interface ShopSettings {
  general_info: GeneralShopInfo;
  social_links: SocialLinks;
  bank_transfer: BankTransferConfig;
}

