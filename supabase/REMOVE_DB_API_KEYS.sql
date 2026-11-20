-- ====================================================================
-- BOLWDOG - XÓA TOÀN BỘ API KEY ĐÃ LƯU TRONG DATABASE & CHUYỂN SANG .ENV
-- Hướng dẫn: Mở Supabase -> SQL Editor -> Dán toàn bộ file này -> Bấm RUN
-- ====================================================================

-- 1. Xóa sạch SePay api_key khỏi bảng shop_settings (cả key 'sepay' lẫn nếu từng lồng trong 'general')
UPDATE public.shop_settings
SET
  setting_value = setting_value - 'api_key',
  updated_at = NOW()
WHERE setting_key = 'sepay'
  AND setting_value ? 'api_key';

UPDATE public.shop_settings
SET
  setting_value = jsonb_set(
    setting_value,
    '{sepay}',
    COALESCE((setting_value->'sepay') - 'api_key', '{}'::jsonb)
  ),
  updated_at = NOW()
WHERE setting_key = 'general'
  AND jsonb_typeof(setting_value->'sepay') = 'object'
  AND (setting_value->'sepay') ? 'api_key';

-- 2. Xóa sạch Webhook URL & EmailJS keys khỏi setting 'email_notifications' (và chuẩn hóa production_site_url nếu bị gõ nhầm)
UPDATE public.shop_settings
SET
  setting_value = jsonb_set(
    setting_value
      - 'webhook_url'
      - 'emailjs_service_id'
      - 'emailjs_template_id'
      - 'emailjs_public_key'
      - 'emailjs_private_key',
    '{production_site_url}',
    '"https://bowlshop.vercel.app"'::jsonb
  ),
  updated_at = NOW()
WHERE setting_key = 'email_notifications';

-- 3. Cập nhật hàm process_sepay_webhook để KHÔNG đọc bất kỳ API key nào từ Database nữa;
-- chỉ cho phép Backend Server (SUPABASE_SERVICE_ROLE_KEY trong .env) hoặc Admin thực thi.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT format('public.%I(%s)', p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid)) AS fn_sig
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'process_sepay_webhook'
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
  -- 1. Chỉ Backend Server (dùng SUPABASE_SERVICE_ROLE_KEY từ .env) hoặc Admin mới được ghi nhận giao dịch
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

  -- 2. Bỏ qua nếu không phải tiền vào hoặc số tiền <= 0
  IF lower(coalesce(p_transfer_type, '')) <> 'in' OR coalesce(p_transfer_amount, 0) <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Bo qua giao dich khong phai tien vao'
    );
  END IF;

  -- 3. Kiểm tra công tắc bật/tắt SePay (chỉ giữ trạng thái không nhạy cảm trong DB)
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
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cong thanh toan SePay dang tat trong Cai dat Admin'
    );
  END IF;

  -- 4. Trích xuất mã đơn hàng từ nội dung chuyển khoản (hỗ trợ cả khi ngân hàng xóa dấu gạch ngang)
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

  -- 5. Chống ghi nhận trùng lặp giao dịch
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

  -- 6. Cộng dồn tiền nhận và cập nhật trạng thái đơn
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

-- Khóa quyền EXECUTE với anon/public để không ai có thể gọi trực tiếp RPC này từ trình duyệt
REVOKE ALL ON FUNCTION public.process_sepay_webhook(BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_sepay_webhook(BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT) TO authenticated, service_role;
