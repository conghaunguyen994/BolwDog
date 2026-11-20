-- ====================================================================
-- BOLWDOG - TÍCH HỢP CỔNG THANH TOÁN TỰ ĐỘNG SEPAY (VIETQR TỰ ĐỘNG)
-- Hướng dẫn: Mở Supabase -> SQL Editor -> Dán toàn bộ mã này -> Bấm RUN
-- ====================================================================

-- 1. Bổ sung các cột lưu thông tin SePay vào bảng payments nếu chưa có
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_content TEXT;

-- 2. HÀM RPC XỬ LÝ THANH TOÁN SEPAY AN TOÀN (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.process_sepay_webhook(
  p_sepay_id BIGINT,
  p_gateway TEXT,
  p_transaction_date TIMESTAMPTZ,
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
  v_new_payment_status public.payment_status;
  v_new_order_status public.order_status;
  v_sepay_config JSONB;
  v_configured_key TEXT;
  v_clean_content TEXT;
  v_clean_ref TEXT;
BEGIN
  -- 1. Bỏ qua nếu không phải tiền vào hoặc số tiền <= 0
  IF lower(coalesce(p_transfer_type, '')) <> 'in' OR coalesce(p_transfer_amount, 0) <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Bo qua giao dich khong phai tien vao'
    );
  END IF;

  -- 2. Kiểm tra API Key nếu trong shop_settings có cấu hình
  SELECT setting_value->'sepay' INTO v_sepay_config
  FROM public.shop_settings
  WHERE setting_key = 'general' OR setting_key = 'sepay'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_sepay_config IS NOT NULL AND (v_sepay_config->>'enabled')::boolean = true THEN
    v_configured_key := trim(coalesce(v_sepay_config->>'api_key', ''));
    IF v_configured_key <> '' AND p_api_key IS NOT NULL AND trim(p_api_key) <> '' THEN
      IF trim(p_api_key) <> v_configured_key THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sai ma API Key xac thuc SePay');
      END IF;
    END IF;
  END IF;

  -- 3. Trích xuất mã đơn hàng từ nội dung chuyển khoản
  v_clean_content := upper(coalesce(p_content, ''));
  v_matches := regexp_matches(v_clean_content, '(BD-[0-9]{8}-[A-Z0-9]+)', 'i');

  IF v_matches IS NOT NULL AND array_length(v_matches, 1) > 0 THEN
    v_order_ref := v_matches[1];
  ELSE
    -- Thử dạng BDYYYYMMDDXXXX
    v_matches := regexp_matches(v_clean_content, '(BD[0-9]{8}[A-Z0-9]+)', 'i');
    IF v_matches IS NOT NULL AND array_length(v_matches, 1) > 0 THEN
      v_order_ref := v_matches[1];
    END IF;
  END IF;

  -- 4. Tìm đơn hàng theo order_reference
  IF v_order_ref IS NOT NULL THEN
    v_clean_ref := upper(replace(v_order_ref, '-', ''));
    SELECT * INTO v_order
    FROM public.orders
    WHERE upper(order_reference) = upper(v_order_ref)
       OR upper(replace(order_reference, '-', '')) = v_clean_ref
    LIMIT 1;
  END IF;

  -- Nếu không tìm thấy bằng regex, quét các đơn đang chờ cọc xem nội dung có chứa mã đơn không
  IF v_order.id IS NULL THEN
    SELECT * INTO v_order
    FROM public.orders
    WHERE payment_status IN ('unpaid', 'deposit_pending')
      AND (
        v_clean_content LIKE '%' || upper(order_reference) || '%'
        OR v_clean_content LIKE '%' || upper(replace(order_reference, '-', '')) || '%'
      )
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Nếu vẫn không thấy đơn nào phù hợp
  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Khong tim thay don hang phu hop voi noi dung chuyen khoan',
      'content', p_content
    );
  END IF;

  -- Kiểm tra trùng lặp giao dịch (nếu mã giao dịch sepay hoặc referenceCode đã được lưu)
  IF p_reference_code IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.payments
    WHERE order_id = v_order.id
      AND (transaction_id = p_reference_code OR transaction_id = p_sepay_id::text)
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Giao dich nay da duoc he thong xu ly truoc do',
      'order_id', v_order.id,
      'order_reference', v_order.order_reference
    );
  END IF;

  -- 5. Xác định trạng thái thanh toán
  -- Nếu chuyển đủ tổng đơn: paid
  -- Nếu chuyển >= tiền cọc (50%): partially_paid
  IF p_transfer_amount >= v_order.total_amount THEN
    v_new_payment_status := 'paid'::public.payment_status;
  ELSIF p_transfer_amount >= (v_order.deposit_amount * 0.95) THEN
    v_new_payment_status := 'partially_paid'::public.payment_status;
  ELSE
    v_new_payment_status := 'partially_paid'::public.payment_status;
  END IF;

  v_new_order_status := 'confirmed'::public.order_status;

  -- 6. Cập nhật bảng orders
  UPDATE public.orders
  SET
    payment_status = v_new_payment_status,
    order_status = v_new_order_status,
    updated_at = NOW()
  WHERE id = v_order.id;

  -- 7. Lưu bản ghi vào bảng payments
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
    'https://my.sepay.vn/transaction/' || coalesce(p_sepay_id::text, coalesce(p_reference_code, 'auto')),
    p_gateway,
    coalesce(p_reference_code, p_sepay_id::text),
    p_content,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Xac nhan thanh toan SePay thanh cong',
    'order_id', v_order.id,
    'order_reference', v_order.order_reference,
    'customer_name', v_order.customer_name,
    'customer_email', v_order.customer_email,
    'customer_phone', v_order.customer_phone,
    'transfer_amount', p_transfer_amount,
    'payment_status', v_new_payment_status,
    'order_status', v_new_order_status
  );
END;
$$;

-- Cấp quyền gọi hàm cho role anon và authenticated
GRANT EXECUTE ON FUNCTION public.process_sepay_webhook TO anon, authenticated, service_role;
