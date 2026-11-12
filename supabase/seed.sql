-- ====================================================================
-- BOLWDOG - SEED DATA FOR DEMO & PRODUCTION BOOTSTRAP
-- ====================================================================

-- 1. SEED CATEGORIES
INSERT INTO public.categories (id, name, slug, description, icon, display_order)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Bát Ăn Cho Chó Mèo', 'bat-an-cho-cho', 'Bát ăn chống gù 15° kèm đế khoang chứa nước chống kiến, bát inox tháo rời tiện lợi', 'UtensilsCrossed', 1),
  ('c2222222-2222-2222-2222-222222222222', 'Móc Khóa 3D', 'moc-khoa-3d', 'Móc khóa thú cưng in hình nổi theo giống chó mèo siêu đáng yêu', 'KeyRound', 2),
  ('c3333333-3333-3333-3333-333333333333', 'Phụ Kiện Cá Nhân Hóa', 'phu-kien-ca-nhan-hoa', 'Thẻ tên bảng tên chống lạc, giá đỡ bát và phụ kiện thiết kế riêng', 'Sparkles', 3)
ON CONFLICT (slug) DO NOTHING;

-- 2. SEED PRODUCTS
INSERT INTO public.products (id, category_id, name, slug, description, price, stock_quantity, is_featured, is_active, specifications)
VALUES
  (
    'p1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'Bát Ăn Chống Gù – Chống Kiến Cho Chó Mèo (Cá Nhân Hóa Tên Bé & Icon)',
    'bat-an-chong-gu-chong-kien-cho-cho-meo',
    '🐾 BÁT ĂN CHỐNG GÙ – CHỐNG KIẾN CHO CHÓ MÈO | CÚN CƯNG
🌸 Thiết kế nghiêng 15° chống gù (size S | M | L)
🌸 5 size S | M | L | XL | XXL
🌸 Đế chống kiến với khoang chứa nước
🌸 Bát inox dễ vệ sinh 
🌸 Được làm từ chất liệu nhựa PETG an toàn
🎨 BÁT ĂN CÁ NHÂN HÓA THEO YÊU CẦU:
✨ 2 màu tùy chọn (Màu thân & Màu đế)
✨ Tên thú cưng in nổi
✨ Ngày sinh của thú cưng
✨ Tối đa 2 icon ngộ nghĩnh',
    199000,
    65,
    true,
    true,
    '{
      "Chất liệu thân & đế": "Nhựa PETG sinh học an toàn thực phẩm (Food-safe), chịu va đập tốt",
      "Lòng bát": "Bát Inox SUS 304 cao cấp, chống rỉ sét, tháo rời rửa sạch trong 5 giây",
      "Đế chống kiến": "Khoang chứa nước dạng rãnh bao quanh, ngăn 100% kiến và côn trùng",
      "Công thái học": "Mặt nghiêng 15 độ khoa học giúp bé ăn không gập cổ, giảm nguy cơ gù lưng và trào ngược dạ dày",
      "Kích thước Size S": "H1: 12cm - H2: 8cm - D: 18cm (Bát inox d=14cm) -> 199K",
      "Kích thước Size M": "H1: 14cm - H2: 10cm - D: 19cm (Bát inox d=14cm) -> 229K",
      "Kích thước Size L": "H1: 16cm - H2: 12cm - D: 20cm (Bát inox d=14cm) -> 259K",
      "Kích thước Size XL": "H1: 15cm - H2: 15cm - D: 22.5cm (Bát inox d=18-20cm) -> 300K",
      "Kích thước Size XXL": "H1: 17cm - H2: 17cm - D: 25cm (Bát inox d=18-20cm) -> 350K"
    }'::jsonb
  ),
  (
    'p4444444-4444-4444-4444-444444444444',
    'c2222222-2222-2222-2222-222222222222',
    'Móc Khóa 3D Bé Corgi Mông Tròn In Tên',
    'moc-khoa-3d-corgi-mong-tron',
    'Móc khóa 3D đúc hình bé Corgi mông tròn lắc lư siêu đáng yêu! Mặt sau khắc tên bé hoặc số điện thoại của ba mẹ chống thất lạc.',
    89000,
    120,
    true,
    true,
    '{"Chất liệu": "Resin in 3D mịn bóng phủ men", "Kích thước": "4.5cm x 4cm", "Móc khoen": "Móc kim loại mạ vàng hồng cao cấp"}'::jsonb
  ),
  (
    'p6666666-6666-6666-6666-666666666666',
    'c3333333-3333-3333-3333-333333333333',
    'Bảng Tên Dạ Quang Khắc SĐT + Tên Bé (Chống Lạc)',
    'bang-ten-da-quang-khac-ten-be',
    'Thẻ tên gắn vòng cổ in 3D phát sáng dịu trong bóng tối, giúp nhận diện bé khi đi dạo ban đêm. Khắc rõ tên mặt trước và 2 số điện thoại mặt sau.',
    95000,
    70,
    true,
    true,
    '{"Chất liệu": "Nhựa phát quang an toàn ban đêm", "Kháng nước": "Chống nước 100%", "Trọng lượng": "Chỉ 12g siêu nhẹ cho cổ bé"}'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;

-- 3. SEED PRODUCT IMAGES
INSERT INTO public.product_images (id, product_id, image_url, display_order, is_primary)
VALUES
  ('i1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', '/images/bat-an-chong-gu-chong-kien.jpg', 1, true),
  ('i1111111-1111-1111-1111-111111111112', 'p1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop', 2, false),
  ('i4444444-4444-4444-4444-444444444441', 'p4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=800&auto=format&fit=crop', 1, true),
  ('i6666666-6666-6666-6666-666666666661', 'p6666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?q=80&w=800&auto=format&fit=crop', 1, true)
ON CONFLICT (id) DO NOTHING;

-- 4. SEED PRODUCT VARIANTS (5 SIZES S, M, L, XL, XXL)
INSERT INTO public.product_variants (id, product_id, variant_name, variant_value, additional_price, stock_quantity)
VALUES
  ('v1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'Kích cỡ', 'Size S (H1: 12cm - H2: 8cm - D: 18cm | Inox 14cm)', 0, 50),
  ('v1111111-1111-1111-1111-111111111112', 'p1111111-1111-1111-1111-111111111111', 'Kích cỡ', 'Size M (H1: 14cm - H2: 10cm - D: 19cm | Inox 14cm)', 30000, 40),
  ('v1111111-1111-1111-1111-111111111113', 'p1111111-1111-1111-1111-111111111111', 'Kích cỡ', 'Size L (H1: 16cm - H2: 12cm - D: 20cm | Inox 14cm)', 60000, 30),
  ('v1111111-1111-1111-1111-111111111114', 'p1111111-1111-1111-1111-111111111111', 'Kích cỡ', 'Size XL (H1: 15cm - H2: 15cm - D: 22.5cm | Inox 18-20cm)', 101000, 20),
  ('v1111111-1111-1111-1111-111111111115', 'p1111111-1111-1111-1111-111111111111', 'Kích cỡ', 'Size XXL (H1: 17cm - H2: 17cm - D: 25cm | Inox 18-20cm)', 151000, 15)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED SHOP SETTINGS (Default Configurable Info)
INSERT INTO public.shop_settings (id, setting_key, setting_value)
VALUES
  ('s1111111-1111-1111-1111-111111111111', 'general_info', '{
    "shop_name": "BolwDog Boutique",
    "tagline": "Bát ăn chống gù, chống kiến & phụ kiện in 3D cá nhân hóa gửi trọn yêu thương cho bé cưng",
    "owner_name": "Nguyễn Công Hậu",
    "phone": "0345553913",
    "email": "conghaunguyen994@gmail.com.vn",
    "address": "200 Phường Quy Nhơn Nam , Thành Phố Quy Nhơn , Tỉnh Gia Lai",
    "support_hours": "08:30 - 21:00 (Thứ 2 - Chủ Nhật)"
  }'::jsonb),
  ('s2222222-2222-2222-2222-222222222222', 'social_links', '{
    "facebook": "https://facebook.com/bowldog.petshop",
    "tiktok": "https://tiktok.com/@bowldog.cute3d",
    "instagram": "https://instagram.com/bowldog.petboutique"
  }'::jsonb),
  ('s3333333-3333-3333-3333-333333333333', 'bank_transfer', '{
    "bank_name": "Ngân hàng TMCP Đầu  Tư Và Phát Triển Việt Nam (BIDV)",
    "bank_code": "BIDV",
    "account_number": "5801769728",
    "account_holder": "NGUYEN CONG HAU",
    "deposit_percentage": 50,
    "qr_template": "compact2",
    "transfer_note_prefix": "BD"
  }'::jsonb)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- 6. ĐẢM BẢO CHỈ DUY NHẤT CHỦ TIỆM NGUYỄN CÔNG HẬU CÓ QUYỀN ADMIN TRONG BẢNG PROFILES
ALTER TABLE public.profiles DISABLE TRIGGER tr_protect_profile_role;

UPDATE public.profiles p
SET role = CASE
  WHEN lower(u.email) IN ('conghaunguyen994@gmail.com', 'conghaunguyen994@gmail.com.vn') THEN 'admin'::user_role
  ELSE 'customer'::user_role
END
FROM auth.users u
WHERE p.id = u.id;

ALTER TABLE public.profiles ENABLE TRIGGER tr_protect_profile_role;

