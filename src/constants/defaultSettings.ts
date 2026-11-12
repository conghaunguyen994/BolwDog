import { ShopSettings } from '../types/settings';

// Giá trị cấu hình mặc định trong lúc chờ tải từ bảng shop_settings trên Supabase DB
export const defaultShopSettings: ShopSettings = {
  general_info: {
    shop_name: 'BolwDog Boutique',
    tagline: 'Bát ăn chống gù, chống kiến & phụ kiện in 3D cá nhân hóa gửi trọn yêu thương cho bé cưng',
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
    bank_name: 'Ngân hàng TMCP Đầu Tư Và Phát Triển Việt Nam (BIDV)',
    bank_code: 'BIDV',
    account_number: '5801769728',
    account_holder: 'NGUYEN CONG HAU',
    deposit_percentage: 50,
    qr_template: 'compact2',
    transfer_note_prefix: 'BD',
  },
};

