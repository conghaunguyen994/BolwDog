import { ShopSettings } from '../types/settings';

// Giá trị cấu hình mặc định trong lúc chờ tải từ bảng shop_settings trên Supabase DB
export const defaultShopSettings: ShopSettings = {
  general_info: {
    shop_name: 'BÂU SHOP',
    tagline: 'Bát ăn chống gù – chống kiến cho chó mèo | Bâu Shop',
    owner_name: 'Nguyễn Công Hậu',
    phone: '0345553913',
    email: 'conghaunguyen994@gmail.com.vn',
    address: '200 Phường Quy Nhơn Nam , Thành Phố Quy Nhơn , Tỉnh Gia Lai',
    support_hours: '08:30 - 21:00 (Thứ 2 - Chủ Nhật)',
  },
  social_links: {
    facebook: 'https://facebook.com/bowldog.petshop',
    tiktok: 'https://tiktok.com/@bowldog.cute3d',
    instagram: 'https://instagram.com/bowldog.petboutique',
  },
  bank_transfer: {
    bank_name: 'Ngân hàng TMCP Quân Đội (MB Bank)',
    bank_code: 'MB',
    account_number: '0345553913',
    account_holder: 'NGUYEN CONG HAU',
    deposit_percentage: 50,
    qr_template: 'compact2',
    transfer_note_prefix: 'BD',
  },
  email_notifications: {
    enabled: true,
    admin_email: 'conghaunguyen994@gmail.com.vn',
    admin_backup_email: 'conghaunguyen994@gmail.com',
    production_site_url: 'https://bolwdog.vercel.app',
    webhook_url: '',
    emailjs_service_id: '',
    emailjs_template_id: '',
    emailjs_public_key: '',
    notify_on_new_order: true,
    notify_on_demo_sent: true,
    notify_on_demo_review: true,
    notify_on_status_change: true,
  },
  blocked_rules: [],
  sepay: {
    enabled: true,
    api_key: '',
    account_number: '0345553913',
    pattern_prefix: 'BD',
    auto_confirm_order: true,
  },
};

