-- ====================================================================
-- BOLWDOG - TÍCH HỢP CỔNG THANH TOÁN TỰ ĐỘNG SEPAY (VIETQR TỰ ĐỘNG)
-- Hướng dẫn: Mở Supabase -> SQL Editor -> Dán toàn bộ mã này -> Bấm RUN
-- ====================================================================

-- 1. Bổ sung các cột lưu thông tin SePay vào bảng payments nếu chưa có
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_content TEXT;

-- 2. Bảo vệ cấu hình SePay (chứa API Key) trong shop_settings khỏi người dùng ẩn danh
DO $$
BEGIN
  IF to_regprocedure('public.is_admin()') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Shop settings viewable by everyone" ON public.shop_settings;
    CREATE POLICY "Shop settings viewable by everyone"
    ON public.shop_settings FOR SELECT
    USING (
      public.is_admin() OR
      setting_key NOT IN ('workshop_expenses', 'manual_orders', 'financial_reports', 'admin_notes', 'sepay')
    );
  END IF;
END $$;

-- 3. Xóa toàn bộ phiên bản cũ của hàm (nếu có) trước khi tạo lại để tránh xung đột overload
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

-- 4. HÀM RPC XỬ LÝ THANH TOÁN SEPAY AN TOÀN (SECURITY DEFINER)
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
  -- Tự động khớp đúng kiểu cột trên bảng orders (payment_status_type / order_status_type / text)
  v_new_payment_status public.orders.payment_status%TYPE;
  v_new_order_status public.orders.order_status%TYPE;
  v_sepay_config JSONB;
  v_configured_key TEXT;
  v_clean_content TEXT;
  v_alnum_content TEXT;
  v_clean_ref TEXT;
  v_is_admin BOOLEAN := FALSE;
  v_existing_paid NUMERIC := 0;
  v_total_paid NUMERIC := 0;
  v_ref_clean TEXT := nullif(trim(coalesce(p_reference_code, '')), '');
  v_tx_id TEXT;
BEGIN
  -- 1. Bỏ qua nếu không phải tiền vào hoặc số tiền <= 0
  IF lower(coalesce(p_transfer_type, '')) <> 'in' OR coalesce(p_transfer_amount, 0) <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Bo qua giao dich khong phai tien vao'
    );
  END IF;

  -- Kiểm tra quyền Admin (an toàn ngay cả khi không gọi qua JWT Admin)
  BEGIN
    v_is_admin := public.is_admin();
  EXCEPTION WHEN OTHERS THEN
    v_is_admin := FALSE;
  END;

  -- 2. Đọc cấu hình SePay từ shop_settings (hỗ trợ cả key 'sepay' độc lập lẫn lồng trong 'general')
  SELECT CASE
           WHEN setting_key = 'sepay' THEN setting_value
           ELSE setting_value->'sepay'
         END
  INTO v_sepay_config
  FROM public.shop_settings
  WHERE setting_key IN ('sepay', 'general')
  ORDER BY (setting_key = 'sepay') DESC, updated_at DESC
  LIMIT 1;

  IF NOT v_is_admin THEN
    IF v_sepay_config IS NULL OR coalesce((v_sepay_config->>'enabled')::boolean, false) = false THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Cong thanh toan SePay chua duoc bat trong Cai dat Admin'
      );
    END IF;

    v_configured_key := regexp_replace(trim(coalesce(v_sepay_config->>'api_key', '')), '^(Bearer|Apikey)\s+', '', 'i');
    IF v_configured_key = '' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Chua cau hinh SePay API Key trong Cai dat Admin'
      );
    END IF;

    IF regexp_replace(trim(coalesce(p_api_key, '')), '^(Bearer|Apikey)\s+', '', 'i') <> v_configured_key THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Sai ma API Key xac thuc SePay'
      );
    END IF;
  END IF;

  -- 3. Trích xuất mã đơn hàng từ nội dung chuyển khoản (hỗ trợ cả khi ngân hàng xóa dấu gạch ngang)
  v_clean_content := upper(coalesce(p_content, ''));
  v_alnum_content := regexp_replace(v_clean_content, '[^A-Z0-9]', '', 'g');

  v_matches := regexp_matches(v_clean_content, 'BD[\s\-_.]*([0-9]{8})[\s\-_.]*([A-Z0-9]{4,8})', 'i');
  IF v_matches IS NOT NULL AND array_length(v_matches, 1) >= 2 THEN
    v_order_ref := 'BD-' || v_matches[1] || '-' || upper(v_matches[2]);
  END IF;

  -- 4. Tìm đơn hàng theo order_reference (so khớp cả dạng chuẩn lẫn dạng bỏ ký tự đặc biệt)
  IF v_order_ref IS NOT NULL THEN
    v_clean_ref := regexp_replace(upper(v_order_ref), '[^A-Z0-9]', '', 'g');
    SELECT * INTO v_order
    FROM public.orders
    WHERE upper(order_reference) = upper(v_order_ref)
       OR regexp_replace(upper(order_reference), '[^A-Z0-9]', '', 'g') = v_clean_ref
    LIMIT 1;
  END IF;

  -- Dự phòng: quét các đơn chưa thanh toán đủ nếu nội dung có chứa mã đơn
  IF v_order.id IS NULL THEN
    SELECT * INTO v_order
    FROM public.orders
    WHERE payment_status::text IN ('unpaid', 'deposit_pending', 'partially_paid')
      AND v_alnum_content LIKE '%' || regexp_replace(upper(order_reference), '[^A-Z0-9]', '', 'g') || '%'
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Nếu vẫn không thấy đơn nào phù hợp (ví dụ giao dịch cá nhân không liên quan đơn hàng)
  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Khong tim thay don hang phu hop voi noi dung chuyen khoan',
      'content', p_content
    );
  END IF;

  -- 5. Chống ghi nhận trùng lặp giao dịch khi SePay gọi lại webhook hoặc quét lại
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

  -- 6. Tính tổng tiền đã nhận cho đơn hàng này (hỗ trợ cọc trước rồi thanh toán nốt phần còn lại)
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
    -- Chuyển thiếu tiền cọc: ghi nhận giao dịch vào payments nhưng chưa duyệt cọc đơn
    v_new_payment_status := v_order.payment_status;
    v_new_order_status := v_order.order_status;
  END IF;

  -- 7. Cập nhật bảng orders
  UPDATE public.orders
  SET
    payment_status = v_new_payment_status,
    order_status = v_new_order_status,
    updated_at = NOW()
  WHERE id = v_order.id;

  -- 8. Lưu bản ghi vào bảng payments
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

GRANT EXECUTE ON FUNCTION public.process_sepay_webhook(BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT) TO anon, authenticated, service_role;

-- 5. HÀM RPC KIỂM TRA TRẠNG THÁI THANH TOÁN CHO KHÁCH VÃNG LAI (AN TOÀN THEO MÃ ĐƠN + SĐT)
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

-- 6. CHUYỂN CẤU HÌNH NGÂN HÀNG SANG MB BANK (0345553913 - NGUYEN CONG HAU)
-- Lưu ý: Chỉ cập nhật tên ngân hàng, mã MB, STK, chủ TK — GIỮ NGUYÊN % đặt cọc Admin đã cấu hình!
INSERT INTO public.shop_settings (setting_key, setting_value)
VALUES (
  'bank_transfer',
  '{
    "bank_name": "Ngân hàng TMCP Quân Đội (MB Bank)",
    "bank_code": "MB",
    "account_number": "0345553913",
    "account_holder": "NGUYEN CONG HAU",
    "deposit_percentage": 50,
    "qr_template": "compact2",
    "transfer_note_prefix": "BD"
  }'::jsonb
)
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
  ),
  updated_at = NOW();

UPDATE public.shop_settings
SET
  setting_value = jsonb_set(setting_value, '{account_number}', '"0345553913"'),
  updated_at = NOW()
WHERE setting_key = 'sepay'
  AND (coalesce(setting_value->>'account_number', '') = '' OR setting_value->>'account_number' = '5801769728');

-- 7. CẬP NHẬT HÀM TẠO ĐƠN HÀNG create_secure_order ĐỂ TÍNH ĐÚNG % TIỀN CỌC CẤU HÌNH TRONG ADMIN (10%, 20%, 50%...)
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

  -- Đọc chính xác % đặt cọc từ shop_settings (Admin Cài Đặt Tiệm)
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
