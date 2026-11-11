-- ====================================================================
-- BOLWDOG - SEED DATA FOR DEMO & PRODUCTION BOOTSTRAP
-- ====================================================================

-- 1. SEED CATEGORIES
INSERT INTO public.categories (id, name, slug, description, icon, display_order)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Bát Ăn Cho Chó', 'bat-an-cho-cho', 'Bát ăn in 3D cá nhân hóa tên bé, chống sặc và thiết kế công thái học', 'UtensilsCrossed', 1),
  ('c2222222-2222-2222-2222-222222222222', 'Móc Khóa 3D', 'moc-khoa-3d', 'Móc khóa thú cưng in hình nổi theo giống chó mèo siêu đáng yêu', 'KeyRound', 2),
  ('c3333333-3333-3333-3333-333333333333', 'Phụ Kiện Cá Nhân Hóa', 'phu-kien-ca-nhan-hoa', 'Thẻ tên bảng tên chống lạc, giá đỡ bát và phụ kiện thiết kế riêng', 'Sparkles', 3)
ON CONFLICT (slug) DO NOTHING;

-- 2. SEED PRODUCTS
INSERT INTO public.products (id, category_id, name, slug, description, price, stock_quantity, is_featured, is_active, specifications)
VALUES
  (
    'p1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'Bát Ăn Công Thái Học In Tên Bé (Dáng Tai Cún)',
    'bat-an-cong-thai-hoc-in-ten-be',
    'Bát ăn in 3D sinh học thân thiện với môi trường (Food-safe PLA+). Thiết kế nghiêng 15 độ bảo vệ cột sống cổ của bé yêu, đế vững chắc chống lật. Tùy biến khắc tên nổi và icon chân chó độc quyền.',
    285000,
    35,
    true,
    true,
    '{"material": "Nhựa sinh học Food-safe PLA+ cao cấp", "origin": "In 3D thủ công tại BolwDog Studio", "weight": "250g", "washable": "Rửa tay nước ấm (không dùng máy rửa bát nhiệt độ cao)"}'::jsonb
  ),
  (
    'p2222222-2222-2222-2222-222222222222',
    'c1111111-1111-1111-1111-111111111111',
    'Bát Chống Ăn Nhanh Hoa Cúc Pastel (In Tên Riêng)',
    'bat-chong-an-nhanh-hoa-cuc-pastel',
    'Thiết kế rãnh hoa cúc uốn lượn mềm mại giúp các bé ăn chậm hơn 5 lần, hạn chế đầy hơi và nôn trớ. Màu sắc pastel ngọt ngào kèm tên bé cưng chạm khắc nổi trên vành.',
    320000,
    28,
    true,
    true,
    '{"material": "Food-grade PETG siêu bền", "origin": "BolwDog Handmade", "capacity": "450ml hạt", "features": "Chống sặc, chống trượt, khắc tên"}'::jsonb
  ),
  (
    'p3333333-3333-3333-3333-333333333333',
    'c1111111-1111-1111-1111-111111111111',
    'Bát Ăn Đôi Kèm Bình Nước Tự Động Cute Cloud',
    'bat-an-doi-kem-binh-nuoc-cloud',
    'Bộ bát đôi hình đám mây mộng mơ, gồm một khay hạt khắc tên bé và khay nước tiếp nước tự động. Giữ khu vực ăn uống của bé luôn sạch sẽ và khô ráo.',
    390000,
    15,
    true,
    true,
    '{"material": "Chân đế 3D PLA + Lòng bát Inox 304 tháo rời", "size": "34cm x 18cm x 8cm", "water_capacity": "500ml"}'::jsonb
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
    '{"material": "Resin in 3D mịn bóng phủ men", "dimensions": "4.5cm x 4cm", "ring": "Móc kim loại mạ vàng hồng cao cấp"}'::jsonb
  ),
  (
    'p5555555-5555-5555-5555-555555555555',
    'c2222222-2222-2222-2222-222222222222',
    'Móc Khóa Chân Chó Poodle Xoăn Bông 3D',
    'moc-khoa-chan-cho-poodle-3d',
    'Móc khóa hình bàn chân cún múp míp hoặc mặt cún Poodle tai xù, phối 2 màu pastel dịu dàng. Nhỏ gọn, phối cùng chìa khóa xe hoặc balo cưng xỉu.',
    79000,
    85,
    false,
    true,
    '{"material": "PLA+ lụa óng ánh mềm mại", "dimensions": "4cm x 4cm"}'::jsonb
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
    '{"material": "Nhựa phát quang an toàn ban đêm", "waterproof": "Chống nước 100%", "weight": "Chỉ 12g siêu nhẹ cho cổ bé"}'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;

-- 3. SEED PRODUCT IMAGES
INSERT INTO public.product_images (id, product_id, image_url, display_order, is_primary)
VALUES
  ('i1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop', 1, true),
  ('i1111111-1111-1111-1111-111111111112', 'p1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop', 2, false),
  ('i2222222-2222-2222-2222-222222222221', 'p2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=800&auto=format&fit=crop', 1, true),
  ('i3333333-3333-3333-3333-333333333331', 'p3333333-3333-3333-3333-333333333331', 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=800&auto=format&fit=crop', 1, true),
  ('i4444444-4444-4444-4444-444444444441', 'p4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=800&auto=format&fit=crop', 1, true),
  ('i5555555-5555-5555-5555-555555555551', 'p5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop', 1, true),
  ('i6666666-6666-6666-6666-666666666661', 'p6666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?q=80&w=800&auto=format&fit=crop', 1, true)
ON CONFLICT (id) DO NOTHING;

-- 4. SEED PRODUCT VARIANTS
INSERT INTO public.product_variants (id, product_id, variant_name, variant_value, additional_price, stock_quantity)
VALUES
  ('v1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'Kích thước', 'Size S (Dưới 5kg - 15cm)', 0, 50),
  ('v1111111-1111-1111-1111-111111111112', 'p1111111-1111-1111-1111-111111111111', 'Kích thước', 'Size M (5kg - 12kg - 18cm)', 30000, 40),
  ('v1111111-1111-1111-1111-111111111113', 'p1111111-1111-1111-1111-111111111111', 'Kích thước', 'Size L (Trên 12kg - 22cm)', 60000, 20),
  ('v2222222-2222-2222-2222-222222222221', 'p2222222-2222-2222-2222-222222222222', 'Màu sắc', 'Hồng Pastel Dịu Ngọt', 0, 30),
  ('v2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', 'Màu sắc', 'Tím Lavender Mộng Mơ', 0, 30),
  ('v2222222-2222-2222-2222-222222222223', 'p2222222-2222-2222-2222-222222222223', 'Màu sắc', 'Kem Bơ Ấm Áp', 0, 30),
  ('v4444444-4444-4444-4444-444444444441', 'p4444444-4444-4444-4444-444444444444', 'Phối màu', 'Corgi Vàng Cam & Trắng', 0, 60),
  ('v4444444-4444-4444-4444-444444444442', 'p4444444-4444-4444-4444-444444444444', 'Phối màu', 'Corgi Đen Vàng (Tricolor)', 0, 40)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED SHOP SETTINGS (Default Configurable Info)
INSERT INTO public.shop_settings (id, setting_key, setting_value)
VALUES
  ('s1111111-1111-1111-1111-111111111111', 'general_info', '{
    "shop_name": "BolwDog Boutique",
    "tagline": "Bát ăn & phụ kiện in 3D gửi trọn tình yêu cho bé cưng",
    "owner_name": "Nguyễn Thanh Hà",
    "phone": "0987 654 321",
    "email": "cskh@bowldog.vn",
    "address": "128 Đường Hoa Hồng, Phường 2, Quận Phú Nhuận, TP. Hồ Chí Minh",
    "support_hours": "08:30 - 21:00 (Thứ 2 - Chủ Nhật)"
  }'::jsonb),
  ('s2222222-2222-2222-2222-222222222222', 'social_links', '{
    "facebook": "https://facebook.com/bowldog.petshop",
    "tiktok": "https://tiktok.com/@bowldog.cute3d",
    "instagram": "https://instagram.com/bowldog.petboutique"
  }'::jsonb),
  ('s3333333-3333-3333-3333-333333333333', 'bank_transfer', '{
    "bank_name": "Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)",
    "bank_code": "VCB",
    "account_number": "1029384756",
    "account_holder": "NGUYEN THANH HA",
    "deposit_percentage": 50,
    "qr_template": "compact2",
    "transfer_note_prefix": "BD"
  }'::jsonb)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

