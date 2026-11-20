import { ShopSettings } from '../types/settings';

// Giá trị cấu hình hiển thị mặc định (KHÔNG chứa bất kỳ API key hay secret nào — tất cả khóa bí mật nằm ở .env server)
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
    production_site_url: 'https://bowlshop.vercel.app',
    notify_on_new_order: true,
    notify_on_demo_sent: true,
    notify_on_demo_review: true,
    notify_on_status_change: true,
  },
  blocked_rules: [],
  sepay: {
    enabled: true,
    account_number: '0345553913',
    pattern_prefix: 'BD',
    auto_confirm_order: true,
  },
  sale_campaign: {
    enabled: false,
    title: '🔥 FLASH SALE YÊU THƯƠNG',
    discount_percentage: 15,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    banner_message: 'Ưu đãi đặc biệt dành cho các bé cưng — Đặt ngay kẻo lỡ!',
    apply_scope: 'all',
    product_ids: [],
  },
  freeship_voucher: {
    enabled: false,
    code: 'bowlfreeship',
    description: 'Miễn phí 100% phí vận chuyển toàn quốc khi nhập mã bowlfreeship',
  },
};
