-- ====================================================================
-- BOLWDOG - HÀM RPC CHO PHÉP KHÁCH TỰ HỦY ĐƠN KHI CHƯA CHUYỂN CỌC
-- Quy tắc bảo mật:
-- 1. Phải khớp chính xác Mã đơn hàng (p_order_ref) + Số điện thoại đặt hàng (p_phone)
-- 2. CHỈ cho phép hủy khi đơn ở trạng thái chưa cọc (payment_status IN ('unpaid', 'deposit_pending'))
--    VÀ không có giao dịch chuyển khoản verified nào trong bảng payments
-- 3. Nếu đã chuyển cọc (partially_paid) hoặc đã thanh toán đủ (paid) -> TỪ CHỐI HỦY
-- 4. Khi hủy thành công -> tự động hoàn lại số lượng tồn kho (stock_quantity) cho sản phẩm
-- ====================================================================

CREATE OR REPLACE FUNCTION public.cancel_guest_order(
  p_order_ref TEXT,
  p_phone TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_phone_digits TEXT := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
  v_verified_paid NUMERIC := 0;
  v_clean_reason TEXT := left(trim(coalesce(p_reason, '')), 250);
  v_item RECORD;
  v_new_notes TEXT;
BEGIN
  IF coalesce(trim(p_order_ref), '') = '' OR length(v_phone_digits) < 9 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Thiếu mã đơn hàng hoặc số điện thoại xác thực.'
    );
  END IF;

  -- Chống XSS trong lý do hủy đơn
  IF v_clean_reason ~* '(<script|javascript:|onerror=|onload=|<iframe|<svg|<object|eval\(|document\.cookie)' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Lý do hủy đơn chứa ký tự không hợp lệ.'
    );
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE upper(order_reference) = upper(trim(p_order_ref))
    AND right(regexp_replace(customer_phone, '\D', '', 'g'), 9) = v_phone_digits
  LIMIT 1
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Không tìm thấy đơn hàng khớp với mã đơn và số điện thoại này.'
    );
  END IF;

  IF v_order.order_status::text = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', v_order.id,
      'order_reference', v_order.order_reference,
      'order_status', 'cancelled',
      'message', 'Đơn hàng này đã được hủy trước đó.'
    );
  END IF;

  -- Kiểm tra nghiêm ngặt: ĐÃ CHUYỂN CỌC / THANH TOÁN thì KHÔNG cho hủy
  SELECT COALESCE(SUM(amount), 0) INTO v_verified_paid
  FROM public.payments
  WHERE order_id = v_order.id
    AND payment_status = 'verified'
    AND amount > 0;

  IF v_order.payment_status::text IN ('partially_paid', 'paid') OR v_verified_paid > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Đơn hàng đã được chuyển cọc / thanh toán nên không thể hủy. Vui lòng liên hệ Hotline/Zalo 0345 553 913 nếu cần hỗ trợ!'
    );
  END IF;

  IF v_order.order_status::text NOT IN ('pending') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Đơn hàng đã bước sang giai đoạn xử lý nên không thể tự hủy.'
    );
  END IF;

  -- Hoàn lại số lượng tồn kho sản phẩm
  FOR v_item IN
    SELECT product_id, quantity
    FROM public.order_items
    WHERE order_id = v_order.id
  LOOP
    IF v_item.product_id IS NOT NULL AND coalesce(v_item.quantity, 0) > 0 THEN
      UPDATE public.products
      SET stock_quantity = stock_quantity + v_item.quantity
      WHERE id = v_item.product_id;
    END IF;
  END LOOP;

  v_new_notes := CASE
    WHEN v_clean_reason <> '' THEN
      trim(both E'\n' from coalesce(v_order.notes, '') || E'\n[Khách tự hủy đơn]: ' || v_clean_reason)
    ELSE
      trim(both E'\n' from coalesce(v_order.notes, '') || E'\n[Khách tự hủy đơn khi chưa chuyển cọc]')
  END;

  UPDATE public.orders
  SET
    order_status = 'cancelled',
    notes = v_new_notes,
    updated_at = NOW()
  WHERE id = v_order.id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'order_reference', v_order.order_reference,
    'order_status', 'cancelled',
    'message', 'Đã hủy đơn hàng thành công!'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_guest_order(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
