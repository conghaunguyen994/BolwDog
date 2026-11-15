-- ====================================================================
-- BOLWDOG - ROW LEVEL SECURITY (RLS) & SECURE FUNCTIONS
-- ====================================================================

-- 1. SECURE HELPER FUNCTION FOR ROLE VERIFICATION
-- Chỉ duy nhất chủ tiệm Nguyễn Công Hậu (xác thực qua JWT của Supabase Auth) mới có quyền Admin
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

-- Trigger to prevent regular users from escalating their own role or unblocking themselves
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    -- Người dùng thường KHÔNG được phép tự sửa role hoặc tự gỡ trạng thái chặn (is_blocked)
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

-- Auto-create profile on auth.users signup
-- Có SET search_path = public và EXCEPTION handler để KHÔNG BAO GIỜ gây lỗi "Database error saving new user"
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
  -- Đảm bảo tiến trình tạo tài khoản trên auth.users luôn thành công
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

-- 3. PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles are viewable by owner or admin" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner or admin"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles insertable by owner" ON public.profiles;
CREATE POLICY "Profiles insertable by owner"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles updateable by owner" ON public.profiles;
CREATE POLICY "Profiles updateable by owner"
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.is_admin());

-- 4. CATEGORIES POLICIES
DROP POLICY IF EXISTS "Categories viewable by everyone" ON public.categories;
CREATE POLICY "Categories viewable by everyone"
ON public.categories FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Categories manageable by admin only" ON public.categories;
CREATE POLICY "Categories manageable by admin only"
ON public.categories FOR ALL
USING (public.is_admin());

-- 5. PRODUCTS POLICIES
DROP POLICY IF EXISTS "Active products viewable by everyone" ON public.products;
CREATE POLICY "Active products viewable by everyone"
ON public.products FOR SELECT
USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Products manageable by admin only" ON public.products;
CREATE POLICY "Products manageable by admin only"
ON public.products FOR ALL
USING (public.is_admin());

-- 6. PRODUCT IMAGES & VARIANTS POLICIES
DROP POLICY IF EXISTS "Product images viewable by everyone" ON public.product_images;
CREATE POLICY "Product images viewable by everyone"
ON public.product_images FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Product images manageable by admin only" ON public.product_images;
CREATE POLICY "Product images manageable by admin only"
ON public.product_images FOR ALL
USING (public.is_admin());

DROP POLICY IF EXISTS "Product variants viewable by everyone" ON public.product_variants;
CREATE POLICY "Product variants viewable by everyone"
ON public.product_variants FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Product variants manageable by admin only" ON public.product_variants;
CREATE POLICY "Product variants manageable by admin only"
ON public.product_variants FOR ALL
USING (public.is_admin());

-- 7. ORDERS POLICIES
DROP POLICY IF EXISTS "Orders viewable by customer owner or admin" ON public.orders;
CREATE POLICY "Orders viewable by customer owner or admin"
ON public.orders FOR SELECT
USING (
  public.is_admin() OR
  (auth.uid() IS NOT NULL AND customer_id = auth.uid())
);

DROP POLICY IF EXISTS "Orders modifiable by admin only" ON public.orders;
CREATE POLICY "Orders modifiable by admin only"
ON public.orders FOR UPDATE
USING (public.is_admin());

-- 8. ORDER ITEMS POLICIES
DROP POLICY IF EXISTS "Order items viewable by order owner or admin" ON public.order_items;
CREATE POLICY "Order items viewable by order owner or admin"
ON public.order_items FOR SELECT
USING (
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.customer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Order items manageable by admin only" ON public.order_items;
CREATE POLICY "Order items manageable by admin only"
ON public.order_items FOR ALL
USING (public.is_admin());

-- 9. PAYMENTS POLICIES
DROP POLICY IF EXISTS "Payments viewable by order owner or admin" ON public.payments;
CREATE POLICY "Payments viewable by order owner or admin"
ON public.payments FOR SELECT
USING (
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payments.order_id
      AND o.customer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Payments insertable by anyone" ON public.payments;
DROP POLICY IF EXISTS "Payments insertable for valid orders" ON public.payments;
CREATE POLICY "Payments insertable for valid orders"
ON public.payments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payments.order_id
  )
);

DROP POLICY IF EXISTS "Payments verifiable by admin only" ON public.payments;
CREATE POLICY "Payments verifiable by admin only"
ON public.payments FOR UPDATE
USING (public.is_admin());

-- 10. SHOP SETTINGS POLICIES
-- Chỉ công khai các cấu hình chung (thông tin shop, ngân hàng, phí ship).
-- Các cấu hình nhạy cảm như chi phí xưởng, đơn ngoài web CHỈ Admin mới được xem.
DROP POLICY IF EXISTS "Shop settings viewable by everyone" ON public.shop_settings;
CREATE POLICY "Shop settings viewable by everyone"
ON public.shop_settings FOR SELECT
USING (
  public.is_admin() OR
  setting_key NOT IN ('workshop_expenses', 'manual_orders', 'financial_reports', 'admin_notes')
);

DROP POLICY IF EXISTS "Shop settings manageable by admin only" ON public.shop_settings;
CREATE POLICY "Shop settings manageable by admin only"
ON public.shop_settings FOR ALL
USING (public.is_admin());

-- ====================================================================
-- 11. SECURE ATOMIC RPC: CREATE ORDER (GUEST & AUTHENTICATED)
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
BEGIN
  -- 1. Chống XSS / Script Injection ngay tại tầng Database
  IF coalesce(p_customer_name, '') ~* '(<script|javascript:|onerror=|onload=|<iframe|<svg|<object|eval\(|document\.cookie)'
     OR coalesce(p_shipping_address, '') ~* '(<script|javascript:|onerror=|onload=|<iframe|<svg|<object|eval\(|document\.cookie)'
     OR coalesce(p_notes, '') ~* '(<script|javascript:|onerror=|onload=|<iframe|<svg|<object|eval\(|document\.cookie)'
     OR coalesce(p_items::text, '') ~* '(<script|javascript:|onerror=|onload=|<iframe|<svg|<object|eval\(|document\.cookie)'
  THEN
    RAISE EXCEPTION 'Phát hiện mã lệnh không an toàn trong dữ liệu đơn hàng (XSS bị chặn)';
  END IF;

  -- 2. Kiểm tra độ dài hợp lệ của các trường
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

  -- 3. Chống Spam / Đặt đơn liên tục từ cùng 1 số điện thoại (Cooldown 45 giây)
  SELECT count(*) INTO v_recent_phone_count
  FROM public.orders o
  WHERE right(regexp_replace(o.customer_phone, '\D', '', 'g'), 9) = v_phone_digits
    AND o.created_at > NOW() - INTERVAL '45 seconds';

  IF v_recent_phone_count > 0 THEN
    RAISE EXCEPTION 'Bạn vừa đặt một đơn hàng. Vui lòng đợi ít nhất 45 giây trước khi đặt đơn tiếp theo để tránh trùng đơn!';
  END IF;

  -- 4. Chống phá hoại tạo nhiều đơn ảo chờ xác nhận (Tối đa 3 đơn pending trong 15 phút)
  SELECT count(*) INTO v_pending_phone_count
  FROM public.orders o
  WHERE right(regexp_replace(o.customer_phone, '\D', '', 'g'), 9) = v_phone_digits
    AND o.order_status = 'pending'::public.order_status
    AND o.created_at > NOW() - INTERVAL '15 minutes';

  IF v_pending_phone_count >= 3 THEN
    RAISE EXCEPTION 'Số điện thoại này đang có 3 đơn hàng chờ xác nhận trong 15 phút qua. Vui lòng hoàn tất đặt cọc hoặc thử lại sau!';
  END IF;

  -- 5. Chống DDoS / Bot Flood toàn hệ thống (Tối đa 25 đơn / 1 phút)
  SELECT count(*) INTO v_global_burst_count
  FROM public.orders o
  WHERE o.created_at > NOW() - INTERVAL '1 minute';

  IF v_global_burst_count >= 25 THEN
    RAISE EXCEPTION 'Hệ thống đang nhận lượng đơn quá tải đột biến. Vui lòng thử lại sau ít giây!';
  END IF;

  SELECT setting_value INTO v_deposit_setting FROM public.shop_settings WHERE setting_key = 'bank_transfer';
  IF v_deposit_setting IS NOT NULL AND (v_deposit_setting->>'deposit_percentage') IS NOT NULL THEN
    v_deposit_percent := (v_deposit_setting->>'deposit_percentage')::NUMERIC / 100.0;
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

  v_total := v_subtotal + v_shipping_fee;
  v_deposit := ROUND(v_total * v_deposit_percent);

  INSERT INTO public.orders (
    order_reference, customer_id, customer_name, customer_phone, customer_email,
    shipping_address, subtotal, shipping_fee, total_amount, deposit_amount,
    order_status, payment_status, notes
  ) VALUES (
    v_order_ref, auth.uid(), p_customer_name, p_customer_phone, p_customer_email,
    p_shipping_address, v_subtotal, v_shipping_fee, v_total, v_deposit,
    'pending'::public.order_status, 'deposit_pending'::public.payment_status, p_notes
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

-- ====================================================================
-- 12. SECURE RPC: LOOKUP GUEST ORDER BY REFERENCE OR PHONE
-- Bảo mật chống quét dữ liệu (Data Scraping / Enumeration) & Che giấu thông tin cá nhân (PII Masking)
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
  -- 1. Xác thực tham số đầu vào tối thiểu để chống quét bừa dữ liệu
  -- Yêu cầu Mã đơn hợp lệ (ít nhất 6 ký tự) HOẶC Số điện thoại (ít nhất 9 chữ số)
  IF (v_ref = '' OR length(v_ref) < 6) AND (v_phone = '' OR length(v_phone) < 9) THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT jsonb_agg(order_obj) INTO v_orders
  FROM (
    SELECT jsonb_build_object(
      'id', o.id,
      'order_reference', o.order_reference,
      'customer_name', o.customer_name,
      -- Nếu là Admin hoặc chính chủ đã đăng nhập -> Hiển thị đủ SĐT & Địa chỉ
      -- Nếu là khách tra cứu công khai -> Che giấu bớt thông tin cá nhân để bảo vệ quyền riêng tư
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
      ), '[]'::jsonb)
    ) AS order_obj
    FROM public.orders o
    WHERE (
      -- Khớp chính xác mã đơn hàng (hoặc tiền tố chuẩn BD-...)
      (v_ref <> '' AND (upper(o.order_reference) = v_ref OR (length(v_ref) >= 8 AND upper(o.order_reference) LIKE v_ref || '%')))
      OR
      -- Khớp chính xác 9 số cuối của SĐT
      (v_phone <> '' AND length(v_phone) >= 9 AND right(regexp_replace(o.customer_phone, '\D', '', 'g'), 9) = right(v_phone, 9))
    )
    AND (
      -- Nếu cung cấp cả hai, bắt buộc phải khớp cả hai để bảo mật tuyệt đối
      (v_ref = '' OR v_phone = '') OR
      (
        (upper(o.order_reference) = v_ref OR upper(o.order_reference) LIKE v_ref || '%') AND
        (right(regexp_replace(o.customer_phone, '\D', '', 'g'), 9) = right(v_phone, 9))
      )
    )
    ORDER BY o.created_at DESC
    LIMIT 5 -- Giới hạn tối đa 5 đơn gần nhất để chống quét dữ liệu hàng loạt
  ) sub;

  RETURN COALESCE(v_orders, '[]'::jsonb);
END;
$$;

-- ====================================================================
-- 13. SECURE RPC: SUBMIT CUSTOMER DEMO REVIEW
-- Duyệt chốt in hoặc yêu cầu chỉnh sửa mẫu 3D có xác thực quyền sở hữu đơn
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

  -- Chống XSS trong phản hồi góp ý
  IF coalesce(p_feedback, '') ~* '(<script|javascript:|onerror=|onload=|<iframe|<svg|<object|eval\(|document\.cookie)' THEN
    RAISE EXCEPTION 'Phản hồi chứa mã lệnh không an toàn (XSS bị chặn)';
  END IF;

  -- Kiểm tra quyền sở hữu đơn hàng
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
