import { Category, Product } from '../../types/product';
import { Order } from '../../types/order';
import { ShopSettings } from '../../types/settings';

export const initialCategories: Category[] = [
  {
    id: 'cat-bowls',
    name: 'Bát Ăn Cho Chó Mèo',
    slug: 'bat-an-cho-cho',
    description: 'Bát ăn chống gù 15° kèm đế khoang chứa nước chống kiến, bát inox tháo rời tiện lợi',
    icon: 'UtensilsCrossed',
    display_order: 1,
  },
  {
    id: 'cat-keychains',
    name: 'Móc Khóa 3D',
    slug: 'moc-khoa-3d',
    description: 'Móc khóa thú cưng in hình 3D theo giống chó mèo siêu đáng yêu',
    icon: 'KeyRound',
    display_order: 2,
  },
  {
    id: 'cat-personalized',
    name: 'Phụ Kiện Cá Nhân Hóa',
    slug: 'phu-kien-ca-nhan-hoa',
    description: 'Bảng tên dạ quang, giá đỡ bát và phụ kiện thiết kế riêng cho bé cưng',
    icon: 'Sparkles',
    display_order: 3,
  },
];

export const initialProducts: Product[] = [
  {
    id: 'prod-bowl-anti-hump-ant',
    category_id: 'cat-bowls',
    name: 'Bát Ăn Chống Gù – Chống Kiến Cho Chó Mèo (Cá Nhân Hóa Tên Bé & Icon)',
    slug: 'bat-an-chong-gu-chong-kien-cho-cho-meo',
    description: '🐾 BÁT ĂN CHỐNG GÙ – CHỐNG KIẾN CHO CHÓ MÈO | CÚN CƯNG\n🌸 Thiết kế nghiêng 15° chống gù bảo vệ cột sống cổ (size S | M | L)\n🌸 5 size S | M | L | XL | XXL phù hợp mọi giống thú cưng\n🌸 Đế chống kiến thông minh với khoang chứa nước bao quanh\n🌸 Lòng bát Inox 304 cao cấp dễ tháo rời vệ sinh\n🌸 Làm từ chất liệu nhựa PETG sinh học an toàn thực phẩm\n🎨 Cá nhân hóa theo yêu cầu: Chọn 2 màu (thân bát & đế), in tên thú cưng nổi, ngày sinh và tối đa 2 icon ngộ nghĩnh!',
    price: 199000,
    stock_quantity: 65,
    is_featured: true,
    is_active: true,
    specifications: {
      'Chất liệu thân & đế': 'Nhựa sinh học Food-safe PETG cao cấp, chịu lực tốt, an toàn cho cún cưng',
      'Lòng bát': 'Bát Inox SUS 304 sáng bóng, tháo rời vệ sinh dễ dàng trong 5 giây',
      'Đế chống kiến': 'Khoang chứa nước dạng hào rãnh bao quanh, ngăn chặn 100% kiến và côn trùng',
      'Độ nghiêng chống gù': 'Mặt nghiêng 15° chuẩn công thái học (áp dụng cho size S, M, L)',
      'Kích thước Size S': 'H1: 12cm - H2: 8cm - D: 18cm (Bát inox d=14cm)',
      'Kích thước Size M': 'H1: 14cm - H2: 10cm - D: 19cm (Bát inox d=14cm)',
      'Kích thước Size L': 'H1: 16cm - H2: 12cm - D: 20cm (Bát inox d=14cm)',
      'Kích thước Size XL': 'H1: 15cm - H2: 15cm - D: 22.5cm (Bát inox d=18-20cm)',
      'Kích thước Size XXL': 'H1: 17cm - H2: 17cm - D: 25cm (Bát inox d=18-20cm)',
    },
    images: [
      {
        id: 'img-main-bowl',
        product_id: 'prod-bowl-anti-hump-ant',
        image_url: '/images/bat-an-chong-gu-chong-kien.jpg',
        display_order: 1,
        is_primary: true,
      },
      {
        id: 'img-b1-2',
        product_id: 'prod-bowl-anti-hump-ant',
        image_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop',
        display_order: 2,
        is_primary: false,
      },
      {
        id: 'img-b1-3',
        product_id: 'prod-bowl-anti-hump-ant',
        image_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop',
        display_order: 3,
        is_primary: false,
      },
    ],
    variants: [
      {
        id: 'var-size-s',
        product_id: 'prod-bowl-anti-hump-ant',
        variant_name: 'Kích cỡ',
        variant_value: 'Size S (H1: 12cm - H2: 8cm - D: 18cm | Inox 14cm)',
        additional_price: 0, // 199.000₫
        stock_quantity: 30,
      },
      {
        id: 'var-size-m',
        product_id: 'prod-bowl-anti-hump-ant',
        variant_name: 'Kích cỡ',
        variant_value: 'Size M (H1: 14cm - H2: 10cm - D: 19cm | Inox 14cm)',
        additional_price: 30000, // 229.000₫
        stock_quantity: 25,
      },
      {
        id: 'var-size-l',
        product_id: 'prod-bowl-anti-hump-ant',
        variant_name: 'Kích cỡ',
        variant_value: 'Size L (H1: 16cm - H2: 12cm - D: 20cm | Inox 14cm)',
        additional_price: 60000, // 259.000₫
        stock_quantity: 20,
      },
      {
        id: 'var-size-xl',
        product_id: 'prod-bowl-anti-hump-ant',
        variant_name: 'Kích cỡ',
        variant_value: 'Size XL (H1: 15cm - H2: 15cm - D: 22.5cm | Inox 18-20cm)',
        additional_price: 101000, // 300.000₫
        stock_quantity: 15,
      },
      {
        id: 'var-size-xxl',
        product_id: 'prod-bowl-anti-hump-ant',
        variant_name: 'Kích cỡ',
        variant_value: 'Size XXL (H1: 17cm - H2: 17cm - D: 25cm | Inox 18-20cm)',
        additional_price: 151000, // 350.000₫
        stock_quantity: 10,
      },
    ],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-keychain-corgi',
    category_id: 'cat-keychains',
    name: 'Móc Khóa 3D Bé Corgi Mông Tròn In Tên',
    slug: 'moc-khoa-3d-corgi-mong-tron',
    description: 'Móc khóa 3D khắc họa bờ mông trái tim huyền thoại của bé Corgi! Phủ lớp bóng ceramic mịn mượt chống bám bẩn. Mặt sau có thể khắc tên bé hoặc số điện thoại của ba mẹ.',
    price: 89000,
    stock_quantity: 80,
    is_featured: true,
    is_active: true,
    specifications: {
      'Chất liệu': 'Resin in 3D phủ bóng chống nước',
      'Kích thước': '4.8cm x 4.2cm',
      'Khoen móc': 'Móc kim loại mạ vàng hồng không gỉ',
    },
    images: [
      {
        id: 'img-k1',
        product_id: 'prod-keychain-corgi',
        image_url: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=800&auto=format&fit=crop',
        display_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      {
        id: 'var-k1-fawn',
        product_id: 'prod-keychain-corgi',
        variant_name: 'Màu lông',
        variant_value: 'Corgi Vàng Trắng',
        additional_price: 0,
        stock_quantity: 50,
      },
      {
        id: 'var-k1-tri',
        product_id: 'prod-keychain-corgi',
        variant_name: 'Màu lông',
        variant_value: 'Corgi Tricolor (Đen Vàng Trắng)',
        additional_price: 0,
        stock_quantity: 30,
      },
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-tag-luminous',
    category_id: 'cat-personalized',
    name: 'Bảng Tên Dạ Quang Khắc SĐT + Tên Bé (Chống Lạc)',
    slug: 'bang-ten-da-quang-khac-ten-be',
    description: 'Thẻ tên gắn vòng cổ in 3D với lớp phủ huỳnh quang hấp thụ ánh sáng và phát sáng dịu êm trong đêm. Mặt trước in tên bé và hình icon cưng, mặt sau khắc 2 số điện thoại phòng khi bé ham chơi đi lạc.',
    price: 95000,
    stock_quantity: 65,
    is_featured: true,
    is_active: true,
    specifications: {
      'Chất liệu': 'Polymer dạ quang cao cấp không độc hại',
      'Kháng nước': 'Chống nước chuẩn 100% khi tắm hay dạo mưa',
      'Trọng lượng': 'Chỉ 10g không làm bé khó chịu',
    },
    images: [
      {
        id: 'img-t1',
        product_id: 'prod-tag-luminous',
        image_url: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?q=80&w=800&auto=format&fit=crop',
        display_order: 1,
        is_primary: true,
      },
    ],
    variants: [],
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const initialOrders: Order[] = [
  {
    id: 'ord-demo-001',
    order_reference: 'BD-20261112-94A21',
    customer_id: null,
    customer_name: 'Trần Mai Phương',
    customer_phone: '0912345678',
    customer_email: 'maiphuong@gmail.com',
    shipping_address: 'Số 45 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    subtotal: 199000,
    shipping_fee: 30000,
    total_amount: 229000,
    deposit_amount: 114500,
    order_status: 'processing',
    payment_status: 'partially_paid',
    notes: 'In tên cún là "Ngáo" kèm icon chân chó và chó corgi',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    items: [
      {
        id: 'item-1',
        order_id: 'ord-demo-001',
        product_id: 'prod-bowl-anti-hump-ant',
        product_name: 'Bát Ăn Chống Gù – Chống Kiến Cho Chó Mèo',
        unit_price: 199000,
        quantity: 1,
        variant_name: 'Kích cỡ',
        variant_value: 'Size S (H1: 12cm - H2: 8cm - D: 18cm | Inox 14cm)',
        image_url: '/images/bat-an-chong-gu-chong-kien.jpg',
        customization_data: {
          petName: 'Ngáo',
          bodyColor: 'Trắng Sứ (#FFFFFF)',
          baseColor: 'Xanh Cổ Vịt (#1A7B8E)',
          selectedIcons: ['🐶', '🐾'],
          petBirthday: '2024-05-15',
        },
      },
    ],
    payments: [
      {
        id: 'pay-1',
        order_id: 'ord-demo-001',
        amount: 114500,
        payment_method: 'bank_transfer',
        payment_status: 'verified',
        proof_image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=600&auto=format&fit=crop',
        verified_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
];

export const initialSettings: ShopSettings = {
  general_info: {
    shop_name: 'BolwDog Boutique',
    tagline: 'Bát ăn chống gù, chống kiến & phụ kiện in 3D cá nhân hóa gửi trọn yêu thương cho bé cưng',
    owner_name: 'Nguyễn Thanh Hà',
    phone: '0987 654 321',
    email: 'cskh@bowldog.vn',
    address: '128 Đường Hoa Hồng, Phường 2, Quận Phú Nhuận, TP. Hồ Chí Minh',
    support_hours: '08:30 - 21:00 (Thứ 2 - Chủ Nhật)',
  },
  social_links: {
    facebook: 'https://facebook.com/bowldog.petshop',
    tiktok: 'https://tiktok.com/@bowldog.cute3d',
    instagram: 'https://instagram.com/bowldog.petboutique',
  },
  bank_transfer: {
    bank_name: 'Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)',
    bank_code: 'VCB',
    account_number: '1029384756',
    account_holder: 'NGUYEN THANH HA',
    deposit_percentage: 50,
    qr_template: 'compact2',
    transfer_note_prefix: 'BD',
  },
};
