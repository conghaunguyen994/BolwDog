-- ====================================================================
-- BOLWDOG - KHỞI TẠO TRỰC TIẾP TÀI KHOẢN ADMIN (KHÔNG CẦN GỬI EMAIL) & NẠP DỮ LIỆU DB
-- Hướng dẫn: Copy toàn bộ nội dung file này dán vào Supabase -> SQL Editor -> bấm RUN
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- PHẦN 1: CẬP NHẬT HÀM BẢO MẬT & TRIGGER TRÊN SUPABASE
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
BEGIN
  RETURN lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    'conghaunguyen994@gmail.com',
    'conghaunguyen994@gmail.com.vn',
    'conghaunguyen994@gmai.com',
    'haudev99@gmail.com.vn',
    'haudev99@gmail.com'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin'::public.user_role AND NOT public.is_admin() THEN
    NEW.role := 'customer'::public.user_role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE
      WHEN lower(NEW.email) IN (
        'conghaunguyen994@gmail.com',
        'conghaunguyen994@gmail.com.vn',
        'conghaunguyen994@gmai.com',
        'haudev99@gmail.com.vn',
        'haudev99@gmail.com'
      ) THEN 'admin'::public.user_role
      ELSE 'customer'::public.user_role
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PHẦN 2: TẠO TRỰC TIẾP TÀI KHOẢN ADMIN (MẬT KHẨU: Conghau@123) VÀ KÍCH HOẠT LUÔN KHÔNG CẦN QUA EMAIL
ALTER TABLE public.profiles DISABLE TRIGGER tr_protect_profile_role;

DO $$
DECLARE
  v_email TEXT;
  v_user_id UUID;
BEGIN
  -- Tự động kích hoạt mọi tài khoản đã đăng ký trước đó nhưng bị kẹt chờ xác thực email
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
  WHERE email_confirmed_at IS NULL;

  -- Tạo / Cập nhật tài khoản Admin chính chủ với mật khẩu: Conghau@123
  FOREACH v_email IN ARRAY ARRAY[
    'conghaunguyen994@gmail.com',
    'conghaunguyen994@gmail.com.vn',
    'haudev99@gmail.com.vn',
    'haudev99@gmail.com'
  ]
  LOOP
    SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = v_email LIMIT 1;

    IF v_user_id IS NULL THEN
      v_user_id := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        v_email,
        extensions.crypt('Conghau@123', extensions.gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Nguyễn Công Hậu"}'::jsonb,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
      );

      INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_user_id,
        v_user_id::text,
        jsonb_build_object(
          'sub', v_user_id::text,
          'email', v_email,
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        NOW(),
        NOW(),
        NOW()
      );
    ELSE
      UPDATE auth.users
      SET encrypted_password = extensions.crypt('Conghau@123', extensions.gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
          confirmation_token = COALESCE(confirmation_token, ''),
          email_change = COALESCE(email_change, ''),
          email_change_token_new = COALESCE(email_change_token_new, ''),
          recovery_token = COALESCE(recovery_token, ''),
          updated_at = NOW()
      WHERE id = v_user_id;
    END IF;

    INSERT INTO public.profiles (id, full_name, role)
    VALUES (v_user_id, 'Nguyễn Công Hậu', 'admin'::public.user_role)
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin'::public.user_role,
        full_name = 'Nguyễn Công Hậu';
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE TRIGGER tr_protect_profile_role;

-- PHẦN 3: NẠP DỮ LIỆU DANH MỤC, SẢN PHẨM, BIẾN THỂ & CẤU HÌNH TIỆM VÀO DATABASE THẬT
INSERT INTO public.categories (id, name, slug, description, icon, display_order)
VALUES
  ('a1111111-1111-4111-8111-111111111111', 'Bát Ăn Cho Chó Mèo', 'bat-an-cho-cho', 'Bát ăn chống gù 15° kèm đế khoang chứa nước chống kiến, bát inox tháo rời tiện lợi', 'UtensilsCrossed', 1),
  ('a2222222-2222-4222-8222-222222222222', 'Móc Khóa 3D', 'moc-khoa-3d', 'Móc khóa thú cưng in hình nổi theo giống chó mèo siêu đáng yêu', 'KeyRound', 2),
  ('a3333333-3333-4333-8333-333333333333', 'Phụ Kiện Cá Nhân Hóa', 'phu-kien-ca-nhan-hoa', 'Thẻ tên bảng tên chống lạc, giá đỡ bát và phụ kiện thiết kế riêng', 'Sparkles', 3)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO public.products (id, category_id, name, slug, description, price, stock_quantity, is_featured, is_active, specifications)
VALUES
  (
    'b1111111-1111-4111-8111-111111111111',
    'a1111111-1111-4111-8111-111111111111',
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
    'b4444444-4444-4444-8444-444444444444',
    'a2222222-2222-4222-8222-222222222222',
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
    'b6666666-6666-4666-8666-666666666666',
    'a3333333-3333-4333-8333-333333333333',
    'Bảng Tên Dạ Quang Khắc SĐT + Tên Bé (Chống Lạc)',
    'bang-ten-da-quang-khac-ten-be',
    'Thẻ tên gắn vòng cổ in 3D phát sáng dịu trong bóng tối, giúp nhận diện bé khi đi dạo ban đêm. Khắc rõ tên mặt trước và 2 số điện thoại mặt sau.',
    95000,
    70,
    true,
    true,
    '{"Chất liệu": "Nhựa phát quang an toàn ban đêm", "Kháng nước": "Chống nước 100%", "Trọng lượng": "Chỉ 12g siêu nhẹ cho cổ bé"}'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  specifications = EXCLUDED.specifications;

INSERT INTO public.product_images (id, product_id, image_url, display_order, is_primary)
VALUES
  ('c1111111-1111-4111-8111-111111111111', 'b1111111-1111-4111-8111-111111111111', '/images/bat-an-chong-gu-chong-kien.jpg', 1, true),
  ('c1111111-1111-4111-8111-111111111112', 'b1111111-1111-4111-8111-111111111111', 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop', 2, false),
  ('c4444444-4444-4444-8444-444444444441', 'b4444444-4444-4444-8444-444444444444', 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=800&auto=format&fit=crop', 1, true),
  ('c6666666-6666-4666-8666-666666666661', 'b6666666-6666-4666-8666-666666666666', 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?q=80&w=800&auto=format&fit=crop', 1, true)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url;

INSERT INTO public.product_variants (id, product_id, variant_name, variant_value, additional_price, stock_quantity)
VALUES
  ('d1111111-1111-4111-8111-111111111111', 'b1111111-1111-4111-8111-111111111111', 'Kích cỡ', 'Size S (H1: 12cm - H2: 8cm - D: 18cm | Inox 14cm)', 0, 50),
  ('d1111111-1111-4111-8111-111111111112', 'b1111111-1111-4111-8111-111111111111', 'Kích cỡ', 'Size M (H1: 14cm - H2: 10cm - D: 19cm | Inox 14cm)', 30000, 40),
  ('d1111111-1111-4111-8111-111111111113', 'b1111111-1111-4111-8111-111111111111', 'Kích cỡ', 'Size L (H1: 16cm - H2: 12cm - D: 20cm | Inox 14cm)', 60000, 30),
  ('d1111111-1111-4111-8111-111111111114', 'b1111111-1111-4111-8111-111111111111', 'Kích cỡ', 'Size XL (H1: 15cm - H2: 15cm - D: 22.5cm | Inox 18-20cm)', 101000, 20),
  ('d1111111-1111-4111-8111-111111111115', 'b1111111-1111-4111-8111-111111111111', 'Kích cỡ', 'Size XXL (H1: 17cm - H2: 17cm - D: 25cm | Inox 18-20cm)', 151000, 15)
ON CONFLICT (id) DO UPDATE SET
  variant_value = EXCLUDED.variant_value,
  additional_price = EXCLUDED.additional_price;

INSERT INTO public.shop_settings (id, setting_key, setting_value)
VALUES
  ('e1111111-1111-4111-8111-111111111111', 'general_info', '{
    "shop_name": "BolwDog Boutique",
    "tagline": "Bát ăn chống gù, chống kiến & phụ kiện in 3D cá nhân hóa gửi trọn yêu thương cho bé cưng",
    "owner_name": "Nguyễn Công Hậu",
    "phone": "0345553913",
    "email": "conghaunguyen994@gmail.com.vn",
    "address": "200 Phường Quy Nhơn Nam , Thành Phố Quy Nhơn , Tỉnh Gia Lai",
    "support_hours": "08:30 - 21:00 (Thứ 2 - Chủ Nhật)"
  }'::jsonb),
  ('e2222222-2222-4222-8222-222222222222', 'social_links', '{
    "facebook": "https://facebook.com/bowldog.petshop",
    "tiktok": "https://tiktok.com/@bowldog.cute3d",
    "instagram": "https://instagram.com/bowldog.petboutique"
  }'::jsonb),
  ('e3333333-3333-4333-8333-333333333333', 'bank_transfer', '{
    "bank_name": "Ngân hàng TMCP Đầu Tư Và Phát Triển Việt Nam (BIDV)",
    "bank_code": "BIDV",
    "account_number": "5801769728",
    "account_holder": "NGUYEN CONG HAU",
    "deposit_percentage": 50,
    "qr_template": "compact2",
    "transfer_note_prefix": "BD"
  }'::jsonb)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;
