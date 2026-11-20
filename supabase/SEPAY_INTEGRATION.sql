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

    v_configured_key := regexp_replace(trim(coalesce(v_sepay_config->>'api_key', '')), '^Apikey\s+', '', 'i');
    IF v_configured_key = '' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Chua cau hinh SePay API Key trong Cai dat Admin'
      );
    END IF;

    IF regexp_replace(trim(coalesce(p_api_key, '')), '^Apikey\s+', '', 'i') <> v_configured_key THEN
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
