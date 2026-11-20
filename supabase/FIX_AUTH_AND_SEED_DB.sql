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
    'haudev99@gmail.com.vn',
    'haudev99@gmail.com'
  );
END;
$$;

-- Bổ sung các cột phục vụ tính năng Chặn User Phá Hoại nếu chưa có
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

-- Policy cho phép Admin xem & cập nhật trạng thái is_blocked của profiles
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
CREATE POLICY "Admin can manage all profiles" ON public.profiles
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.role := OLD.role;
      NEW.is_blocked := OLD.is_blocked;
      NEW.blocked_reason := OLD.blocked_reason;
      NEW.blocked_at := OLD.blocked_at;
    ELSIF TG_OP = 'INSERT' THEN
      IF NEW.role = 'admin'::public.user_role THEN
        NEW.role := 'customer'::public.user_role;
      END IF;
      NEW.is_blocked := FALSE;
      NEW.blocked_reason := NULL;
      NEW.blocked_at := NULL;
    END IF;
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
    'BÁT ĂN CHỐNG GÙ – CHỐNG KIẾN CHO CHÓ MÈO | BÂU SHOP',
    'bat-an-chong-gu-chong-kien-cho-cho-meo',
    'BÁT ĂN CHỐNG GÙ – CHỐNG KIẾN CHO CHÓ MÈO | BÂU SHOP
🌸 Thiết kế nghiêng 15° chống gù ( size S | M | L)
🌸 5 size S | M | L | XL | XXL
🌸 Đế chống kiến với khoang chứa nước
🌸 Bát inox  dễ vệ sinh 
🌸 Được làm từ chất liệu nhựa PETG  an toàn
🎨 BÁT ĂN CÁ NHÂN HÓA THEO YÊU CẦU:
✨ 2 màu tùy chọn (Màu ở trên & Màu ở dưới)
✨ Tên thú cưng in nổi
✨ Tối đa 2 icon
✨ Ngày sinh khi in lên bát
📏 KÍCH THƯỚC:
Bát inox đường kính 14cm 
• S : H1: 12 cm - H2: 8cm - D: 18cm -> 199K
• M: H1: 14cm - H2: 10cm - D: 19cm -> 229K
• L: H1: 16cm - H2: 12cm - D: 20cm -> 259K
Bát inox đường kính 18-20cm 
• XL: H1: 15 cm - H2: 15cm - D: 22,5cm -> 300K
• XXL: H1: 17cm - H2: 17cm - D: 25cm -> 350K',
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

-- Xóa triệt để các biến thể kích thước bị trùng lặp trên bảng product_variants
DELETE FROM public.product_variants
WHERE id NOT IN (
  SELECT DISTINCT ON (product_id, lower(variant_name), lower(variant_value)) id
  FROM public.product_variants
  ORDER BY product_id, lower(variant_name), lower(variant_value), created_at ASC
);

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
    "shop_name": "BÂU SHOP",
    "tagline": "Bát ăn chống gù – chống kiến cho chó mèo | Bâu Shop",
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
    "bank_name": "Ngân hàng TMCP Quân Đội (MB Bank)",
    "bank_code": "MB",
    "account_number": "0345553913",
    "account_holder": "NGUYEN CONG HAU",
    "deposit_percentage": 50,
    "qr_template": "compact2",
    "transfer_note_prefix": "BD"
  }'::jsonb)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(public.shop_settings.setting_value, '{bank_name}', '"Ngân hàng TMCP Quân Đội (MB Bank)"'),
        '{bank_code}', '"MB"'
      ),
      '{account_number}', '"0345553913"'
    ),
    '{account_holder}', '"NGUYEN CONG HAU"'
  );

-- ====================================================================
-- 6. CẬP NHẬT HÀM TRA CỨU ĐƠN HÀNG LINH HOẠT (CHỈ CẦN NHẬP 1 TRONG 2)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_guest_order(
  p_order_ref TEXT DEFAULT '',
  p_phone TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_ref TEXT := upper(trim(coalesce(p_order_ref, '')));
  v_phone TEXT := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_is_caller_admin BOOLEAN := public.is_admin();
  v_caller_uid UUID := auth.uid();
  v_orders JSONB;
BEGIN
  IF (v_ref = '' OR length(v_ref) < 6) AND (v_phone = '' OR length(v_phone) < 9) THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT jsonb_agg(order_obj) INTO v_orders
  FROM (
    SELECT jsonb_build_object(
      'id', o.id,
      'order_reference', o.order_reference,
      'customer_name', o.customer_name,
      'customer_phone', CASE
        WHEN v_is_caller_admin OR (v_caller_uid IS NOT NULL AND o.customer_id = v_caller_uid)
          THEN o.customer_phone
        ELSE substring(o.customer_phone from 1 for 3) || '****' || right(o.customer_phone, 3)
      END,
      'customer_email', CASE
        WHEN v_is_caller_admin OR (v_caller_uid IS NOT NULL AND o.customer_id = v_caller_uid)
          THEN o.customer_email
        ELSE NULL
      END,
      'shipping_address', CASE
        WHEN v_is_caller_admin OR (v_caller_uid IS NOT NULL AND o.customer_id = v_caller_uid)
          THEN o.shipping_address
        WHEN position(',' in o.shipping_address) > 0
          THEN '*** ' || substring(o.shipping_address from position(',' in o.shipping_address))
        ELSE '*** (Đã ẩn địa chỉ cụ thể)'
      END,
      'subtotal', o.subtotal,
      'shipping_fee', o.shipping_fee,
      'total_amount', o.total_amount,
      'deposit_amount', o.deposit_amount,
      'order_status', o.order_status,
      'payment_status', o.payment_status,
      'notes', o.notes,
      'created_at', o.created_at,
      'items', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'unit_price', oi.unit_price,
            'quantity', oi.quantity,
            'customization_data', oi.customization_data
          )
        )
        FROM public.order_items oi
        WHERE oi.order_id = o.id
      ), '[]'::jsonb),
      'payments', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'order_id', p.order_id,
            'amount', p.amount,
            'payment_method', p.payment_method,
            'payment_status', p.payment_status,
            'proof_image_url', p.proof_image_url,
            'created_at', p.created_at
          )
        )
        FROM public.payments p
        WHERE p.order_id = o.id
      ), '[]'::jsonb)
    ) AS order_obj
    FROM public.orders o
    WHERE (
      (v_ref <> '' AND (upper(o.order_reference) = v_ref OR (length(v_ref) >= 8 AND upper(o.order_reference) LIKE v_ref || '%')))
      OR
      (v_phone <> '' AND length(v_phone) >= 9 AND right(regexp_replace(o.customer_phone, '\D', '', 'g'), 9) = right(v_phone, 9))
    )
    AND (
      (v_ref = '' OR v_phone = '') OR
      (
        (upper(o.order_reference) = v_ref OR upper(o.order_reference) LIKE v_ref || '%') AND
        (right(regexp_replace(o.customer_phone, '\D', '', 'g'), 9) = right(v_phone, 9))
      )
    )
    ORDER BY o.created_at DESC
    LIMIT 5
  ) sub;

  RETURN COALESCE(v_orders, '[]'::jsonb);
END;
$$;

-- ====================================================================
-- 7. HÀM KHÁCH HÀNG DUYỆT BẢN DEMO 3D & CHỐT IN TRỰC TIẾP
-- ====================================================================
CREATE OR REPLACE FUNCTION public.submit_order_demo_review(
  p_order_id UUID,
  p_status TEXT,
  p_feedback TEXT DEFAULT '',
  p_order_ref TEXT DEFAULT '',
  p_phone TEXT DEFAULT ''
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_item_id UUID;
  v_custom JSONB;
  v_order_ref_clean TEXT := upper(trim(coalesce(p_order_ref, '')));
  v_phone_digits TEXT := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_is_authorized BOOLEAN := FALSE;
BEGIN
  IF p_status NOT IN ('approved', 'revision_requested') THEN
    RAISE EXCEPTION 'Trạng thái duyệt mẫu 3D không hợp lệ';
  END IF;

  IF coalesce(p_feedback, '') ~* '(<script|javascript:|onerror=|onload=|<iframe|<svg|<object|eval\(|document\.cookie)' THEN
    RAISE EXCEPTION 'Phát hiện mã lệnh không an toàn trong nội dung phản hồi (XSS bị chặn)';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = p_order_id
      AND (
        public.is_admin()
        OR (auth.uid() IS NOT NULL AND o.customer_id = auth.uid())
        OR (v_order_ref_clean <> '' AND upper(o.order_reference) = v_order_ref_clean)
        OR (length(v_phone_digits) >= 9 AND right(regexp_replace(o.customer_phone, '\D', '', 'g'), 9) = right(v_phone_digits, 9))
      )
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Không có quyền thao tác trên đơn hàng này';
  END IF;

  SELECT id, COALESCE(customization_data, '{}'::jsonb)
  INTO v_item_id, v_custom
  FROM public.order_items
  WHERE order_id = p_order_id
  ORDER BY id ASC
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.order_items
  SET customization_data = jsonb_set(
    v_custom,
    '{demoPreview}',
    COALESCE(v_custom->'demoPreview', '{}'::jsonb) || jsonb_build_object(
      'status', p_status,
      'customerFeedback', COALESCE(trim(p_feedback), ''),
      'reviewedAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    ),
    true
  )
  WHERE id = v_item_id;

  RETURN TRUE;
END;
$$;

-- ====================================================================
-- PHẦN 14: TÍCH HỢP CỔNG THANH TOÁN TỰ ĐỘNG SEPAY
-- ====================================================================
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_content TEXT;

DROP POLICY IF EXISTS "Shop settings viewable by everyone" ON public.shop_settings;
CREATE POLICY "Shop settings viewable by everyone"
ON public.shop_settings FOR SELECT
USING (
  public.is_admin() OR
  setting_key NOT IN ('workshop_expenses', 'manual_orders', 'financial_reports', 'admin_notes', 'sepay')
);

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT format('public.%I(%s)', p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid)) AS fn_sig
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('process_sepay_webhook', 'get_order_payment_status')
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.fn_sig || ';';
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.process_sepay_webhook(
  p_sepay_id BIGINT,
  p_gateway TEXT,
  p_transaction_date TEXT,
  p_account_number TEXT,
  p_content TEXT,
  p_transfer_type TEXT,
  p_transfer_amount NUMERIC,
  p_reference_code TEXT DEFAULT NULL,
  p_api_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_order_ref TEXT;
  v_matches TEXT[];
  v_new_payment_status public.orders.payment_status%TYPE;
  v_new_order_status public.orders.order_status%TYPE;
  v_sepay_config JSONB;
  v_clean_content TEXT;
  v_alnum_content TEXT;
  v_clean_ref TEXT;
  v_jwt_role TEXT := coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), auth.role(), '');
  v_is_service_role BOOLEAN := (v_jwt_role = 'service_role');
  v_is_admin BOOLEAN := FALSE;
  v_existing_paid NUMERIC := 0;
  v_total_paid NUMERIC := 0;
  v_ref_clean TEXT := nullif(trim(coalesce(p_reference_code, '')), '');
  v_tx_id TEXT;
BEGIN
  BEGIN
    v_is_admin := public.is_admin();
  EXCEPTION WHEN OTHERS THEN
    v_is_admin := FALSE;
  END;

  IF NOT v_is_service_role AND NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Chi backend server (.env SUPABASE_SERVICE_ROLE_KEY) hoac Admin moi duoc goi ham nay'
    );
  END IF;

  IF lower(coalesce(p_transfer_type, '')) <> 'in' OR coalesce(p_transfer_amount, 0) <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Bo qua giao dich khong phai tien vao');
  END IF;

  SELECT CASE
           WHEN setting_key = 'sepay' THEN setting_value
           ELSE setting_value->'sepay'
         END
  INTO v_sepay_config
  FROM public.shop_settings
  WHERE setting_key IN ('sepay', 'general')
  ORDER BY (setting_key = 'sepay') DESC, updated_at DESC
  LIMIT 1;

  IF v_sepay_config IS NOT NULL AND coalesce((v_sepay_config->>'enabled')::boolean, true) = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cong thanh toan SePay chua duoc bat');
  END IF;

  v_clean_content := upper(coalesce(p_content, ''));
  v_alnum_content := regexp_replace(v_clean_content, '[^A-Z0-9]', '', 'g');

  v_matches := regexp_matches(v_clean_content, 'BD[\s\-_.]*([0-9]{8})[\s\-_.]*([A-Z0-9]{4,8})', 'i');
  IF v_matches IS NOT NULL AND array_length(v_matches, 1) >= 2 THEN
    v_order_ref := 'BD-' || v_matches[1] || '-' || upper(v_matches[2]);
  END IF;

  IF v_order_ref IS NOT NULL THEN
    v_clean_ref := regexp_replace(upper(v_order_ref), '[^A-Z0-9]', '', 'g');
    SELECT * INTO v_order
    FROM public.orders
    WHERE upper(order_reference) = upper(v_order_ref)
       OR regexp_replace(upper(order_reference), '[^A-Z0-9]', '', 'g') = v_clean_ref
    LIMIT 1;
  END IF;

  IF v_order.id IS NULL THEN
    SELECT * INTO v_order
    FROM public.orders
    WHERE payment_status::text IN ('unpaid', 'deposit_pending', 'partially_paid')
      AND v_alnum_content LIKE '%' || regexp_replace(upper(order_reference), '[^A-Z0-9]', '', 'g') || '%'
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Khong tim thay don hang phu hop voi noi dung chuyen khoan',
      'content', p_content
    );
  END IF;

  IF (
    (v_ref_clean IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.payments WHERE order_id = v_order.id AND transaction_id = v_ref_clean
    ))
    OR (p_sepay_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.payments
      WHERE order_id = v_order.id
        AND (
          transaction_id = p_sepay_id::text
          OR proof_image_url = 'https://my.sepay.vn/transaction/' || p_sepay_id::text
        )
    ))
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'duplicate', true,
      'message', 'Giao dich nay da duoc he thong xu ly truoc do',
      'order_id', v_order.id,
      'order_reference', v_order.order_reference,
      'payment_status', v_order.payment_status::text,
      'order_status', v_order.order_status::text
    );
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_existing_paid
  FROM public.payments
  WHERE order_id = v_order.id
    AND payment_status = 'verified';

  v_total_paid := v_existing_paid + p_transfer_amount;

  IF v_total_paid >= (v_order.total_amount * 0.98) THEN
    v_new_payment_status := 'paid';
    IF v_order.order_status::text = 'pending' THEN
      v_new_order_status := 'confirmed';
    ELSE
      v_new_order_status := v_order.order_status;
    END IF;
  ELSIF v_total_paid >= (v_order.deposit_amount * 0.95) THEN
    v_new_payment_status := 'partially_paid';
    IF v_order.order_status::text = 'pending' THEN
      v_new_order_status := 'confirmed';
    ELSE
      v_new_order_status := v_order.order_status;
    END IF;
  ELSE
    v_new_payment_status := v_order.payment_status;
    v_new_order_status := v_order.order_status;
  END IF;

  UPDATE public.orders
  SET
    payment_status = v_new_payment_status,
    order_status = v_new_order_status,
    updated_at = NOW()
  WHERE id = v_order.id;

  v_tx_id := coalesce(v_ref_clean, p_sepay_id::text);
  INSERT INTO public.payments (
    order_id,
    amount,
    payment_method,
    payment_status,
    proof_image_url,
    gateway,
    transaction_id,
    transaction_content,
    verified_at
  ) VALUES (
    v_order.id,
    p_transfer_amount,
    'sepay_vietqr',
    'verified',
    'https://my.sepay.vn/transaction/' || coalesce(p_sepay_id::text, coalesce(v_ref_clean, 'auto')),
    p_gateway,
    v_tx_id,
    p_content,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', CASE
      WHEN v_new_payment_status::text IN ('partially_paid', 'paid') THEN 'Xac nhan thanh toan SePay thanh cong'
      ELSE 'Da ghi nhan giao dich nhung chua du so tien coc yeu cau'
    END,
    'insufficient_deposit', (v_new_payment_status::text NOT IN ('partially_paid', 'paid')),
    'order_id', v_order.id,
    'order_reference', v_order.order_reference,
    'customer_name', v_order.customer_name,
    'customer_email', v_order.customer_email,
    'customer_phone', v_order.customer_phone,
    'transfer_amount', p_transfer_amount,
    'total_paid', v_total_paid,
    'payment_status', v_new_payment_status::text,
    'order_status', v_new_order_status::text
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_sepay_webhook(BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_sepay_webhook(BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_order_payment_status(
  p_order_ref TEXT,
  p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_phone_digits TEXT := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
  v_sepay_enabled BOOLEAN := TRUE;
BEGIN
  IF coalesce(trim(p_order_ref), '') = '' OR length(v_phone_digits) < 9 THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT coalesce((setting_value->>'enabled')::boolean, true)
  INTO v_sepay_enabled
  FROM public.shop_settings
  WHERE setting_key = 'sepay'
  LIMIT 1;

  SELECT id, order_reference, payment_status::text AS payment_status, order_status::text AS order_status, deposit_amount, total_amount, updated_at
  INTO v_order
  FROM public.orders
  WHERE upper(order_reference) = upper(trim(p_order_ref))
    AND right(regexp_replace(customer_phone, '\D', '', 'g'), 9) = v_phone_digits
  LIMIT 1;

  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object('found', false, 'sepay_enabled', coalesce(v_sepay_enabled, true));
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'sepay_enabled', coalesce(v_sepay_enabled, true),
    'order_id', v_order.id,
    'order_reference', v_order.order_reference,
    'payment_status', v_order.payment_status,
    'order_status', v_order.order_status,
    'deposit_amount', v_order.deposit_amount,
    'total_amount', v_order.total_amount,
    'updated_at', v_order.updated_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_payment_status(TEXT, TEXT) TO anon, authenticated, service_role;

-- ====================================================================
-- PHẦN 15: CẬP NHẬT HÀM TẠO ĐƠN HÀNG create_secure_order (ĐỌC ĐÚNG % ĐẶT CỌC TỪ SHOP_SETTINGS)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.create_secure_order(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT,
  p_shipping_address TEXT,
  p_notes TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_ref TEXT;
  v_subtotal NUMERIC := 0;
  v_shipping_fee NUMERIC := 30000;
  v_deposit_percent NUMERIC := 0.50;
  v_total NUMERIC;
  v_deposit NUMERIC;
  v_item JSONB;
  v_prod_price NUMERIC;
  v_prod_name TEXT;
  v_prod_stock INT;
  v_var_price NUMERIC := 0;
  v_deposit_setting JSONB;
  v_phone_digits TEXT := right(regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g'), 9);
  v_recent_phone_count INT := 0;
  v_pending_phone_count INT := 0;
  v_global_burst_count INT := 0;
  v_status_pending public.orders.order_status%TYPE := 'pending';
  v_status_deposit_pending public.orders.payment_status%TYPE := 'deposit_pending';
BEGIN
  IF coalesce(p_customer_name, '') ~* '(<script|javascript:|onerror=|onload=|<iframe|<svg|<object|eval\(|document\.cookie)'
     OR coalesce(p_shipping_address, '') ~* '(<script|javascript:|onerror=|onload=|<iframe|<svg|<object|eval\(|document\.cookie)'
     OR coalesce(p_notes, '') ~* '(<script|javascript:|onerror=|onload=|<iframe|<svg|<object|eval\(|document\.cookie)'
     OR coalesce(p_items::text, '') ~* '(<script|javascript:|onerror=|onload=|<iframe|<svg|<object|eval\(|document\.cookie)'
  THEN
    RAISE EXCEPTION 'Phát hiện mã lệnh không an toàn trong dữ liệu đơn hàng (XSS bị chặn)';
  END IF;

  IF length(trim(coalesce(p_customer_name, ''))) < 2 OR length(p_customer_name) > 100 THEN
    RAISE EXCEPTION 'Họ và tên khách hàng không hợp lệ (2 - 100 ký tự)';
  END IF;

  IF length(v_phone_digits) < 9 THEN
    RAISE EXCEPTION 'Số điện thoại nhận hàng không hợp lệ';
  END IF;

  IF length(trim(coalesce(p_shipping_address, ''))) < 5 OR length(p_shipping_address) > 300 THEN
    RAISE EXCEPTION 'Địa chỉ giao hàng không hợp lệ (5 - 300 ký tự)';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 15 THEN
    RAISE EXCEPTION 'Giỏ hàng không hợp lệ (tối đa 15 sản phẩm mỗi đơn)';
  END IF;

  SELECT count(*) INTO v_recent_phone_count
  FROM public.orders o
  WHERE right(regexp_replace(o.customer_phone, '\D', '', 'g'), 9) = v_phone_digits
    AND o.created_at > NOW() - INTERVAL '45 seconds';

  IF v_recent_phone_count > 0 THEN
    RAISE EXCEPTION 'Bạn vừa đặt một đơn hàng. Vui lòng đợi ít nhất 45 giây trước khi đặt đơn tiếp theo để tránh trùng đơn!';
  END IF;

  SELECT count(*) INTO v_pending_phone_count
  FROM public.orders o
  WHERE right(regexp_replace(o.customer_phone, '\D', '', 'g'), 9) = v_phone_digits
    AND o.order_status::text = 'pending'
    AND o.created_at > NOW() - INTERVAL '15 minutes';

  IF v_pending_phone_count >= 3 THEN
    RAISE EXCEPTION 'Số điện thoại này đang có 3 đơn hàng chờ xác nhận trong 15 phút qua. Vui lòng hoàn tất đặt cọc hoặc thử lại sau!';
  END IF;

  SELECT count(*) INTO v_global_burst_count
  FROM public.orders o
  WHERE o.created_at > NOW() - INTERVAL '1 minute';

  IF v_global_burst_count >= 25 THEN
    RAISE EXCEPTION 'Hệ thống đang nhận lượng đơn quá tải đột biến. Vui lòng thử lại sau ít giây!';
  END IF;

  SELECT setting_value INTO v_deposit_setting FROM public.shop_settings WHERE setting_key = 'bank_transfer' LIMIT 1;
  IF v_deposit_setting IS NOT NULL AND nullif(trim(coalesce(v_deposit_setting->>'deposit_percentage', '')), '') IS NOT NULL THEN
    v_deposit_percent := GREATEST(0, LEAST(100, (v_deposit_setting->>'deposit_percentage')::NUMERIC)) / 100.0;
  END IF;

  v_order_ref := 'BD-' || to_char(NOW(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 5));

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT price, name, stock_quantity INTO v_prod_price, v_prod_name, v_prod_stock
    FROM public.products
    WHERE id = (v_item->>'product_id')::UUID AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh';
    END IF;

    IF v_prod_stock < (v_item->>'quantity')::INT THEN
      RAISE EXCEPTION 'Sản phẩm % chỉ còn % món trong kho', v_prod_name, v_prod_stock;
    END IF;

    v_var_price := 0;
    IF (v_item->>'variant_id') IS NOT NULL AND (v_item->>'variant_id') <> '' THEN
      BEGIN
        SELECT additional_price INTO v_var_price
        FROM public.product_variants
        WHERE id = (v_item->>'variant_id')::UUID;
      EXCEPTION WHEN OTHERS THEN
        v_var_price := 0;
      END;
    END IF;

    v_subtotal := v_subtotal + ((v_prod_price + COALESCE(v_var_price, 0)) * (v_item->>'quantity')::INT);
  END LOOP;

  IF v_subtotal >= 500000 THEN
    v_shipping_fee := 0;
  ELSE
    v_shipping_fee := 30000;
  END IF;

  v_total := v_subtotal + v_shipping_fee;
  v_deposit := ROUND(v_total * v_deposit_percent);

  INSERT INTO public.orders (
    order_reference, customer_id, customer_name, customer_phone, customer_email,
    shipping_address, subtotal, shipping_fee, total_amount, deposit_amount,
    order_status, payment_status, notes
  ) VALUES (
    v_order_ref, auth.uid(), p_customer_name, p_customer_phone, p_customer_email,
    p_shipping_address, v_subtotal, v_shipping_fee, v_total, v_deposit,
    v_status_pending, v_status_deposit_pending, p_notes
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT price, name INTO v_prod_price, v_prod_name
    FROM public.products WHERE id = (v_item->>'product_id')::UUID;

    v_var_price := 0;
    IF (v_item->>'variant_id') IS NOT NULL AND (v_item->>'variant_id') <> '' THEN
      BEGIN
        SELECT additional_price INTO v_var_price
        FROM public.product_variants
        WHERE id = (v_item->>'variant_id')::UUID;
      EXCEPTION WHEN OTHERS THEN
        v_var_price := 0;
      END;
    END IF;

    INSERT INTO public.order_items (
      order_id, product_id, product_name, unit_price, quantity, customization_data
    ) VALUES (
      v_order_id, (v_item->>'product_id')::UUID, v_prod_name,
      v_prod_price + COALESCE(v_var_price, 0),
      (v_item->>'quantity')::INT, COALESCE(v_item->'customization_data', '{}'::jsonb)
    );

    UPDATE public.products
    SET stock_quantity = stock_quantity - (v_item->>'quantity')::INT
    WHERE id = (v_item->>'product_id')::UUID;
  END LOOP;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_reference', v_order_ref,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'total_amount', v_total,
    'deposit_amount', v_deposit,
    'order_status', 'pending',
    'payment_status', 'deposit_pending'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_secure_order(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated, service_role;

