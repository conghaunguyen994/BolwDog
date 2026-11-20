-- ====================================================================
-- BOLWDOG - TÍNH NĂNG SALE GIẢM GIÁ THEO KHUNG GIỜ & MÃ FREESHIP (bowlfreeship)
-- 1. Tự động áp dụng % giảm giá trong hàm tạo đơn create_secure_order
--    khi thời gian đặt hàng nằm trong khoảng start_at -> end_at do Admin cấu hình
-- 2. Tự động miễn phí vận chuyển (shipping_fee = 0) khi khách nhập đúng mã
--    freeship (mặc định: bowlfreeship) VÀ Admin đang BẬT hiệu lực mã trong Cài Đặt
-- ====================================================================

DROP FUNCTION IF EXISTS public.create_secure_order(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.create_secure_order(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT,
  p_shipping_address TEXT,
  p_notes TEXT,
  p_items JSONB,
  p_freeship_code TEXT DEFAULT NULL
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
  v_unit_price NUMERIC := 0;
  v_deposit_setting JSONB;
  v_sale_setting JSONB;
  v_freeship_setting JSONB;
  v_sale_active BOOLEAN := FALSE;
  v_sale_pct NUMERIC := 0;
  v_sale_scope TEXT := 'all';
  v_sale_product_ids JSONB := '[]'::jsonb;
  v_item_eligible BOOLEAN := FALSE;
  v_phone_digits TEXT := right(regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g'), 9);
  v_recent_phone_count INT := 0;
  v_pending_phone_count INT := 0;
  v_global_burst_count INT := 0;
  v_status_pending public.orders.order_status%TYPE := 'pending';
  v_status_deposit_pending public.orders.payment_status%TYPE := 'deposit_pending';
BEGIN
  -- 1. Chống XSS / Script Injection ngay tại tầng Database
  IF coalesce(p_customer_name, '') ~* '(<script|javascript:|onerror=|onload=|<iframe|<svg|<object|eval\(|document\.cookie)'
     OR coalesce(p_shipping_address, '') ~* '(<script|javascript:|onerror=|onload=|<iframe|<svg|<object|eval\(|document\.cookie)'
     OR coalesce(p_notes, '') ~* '(<script|javascript:|onerror=|onload=|<iframe|<svg|<object|eval\(|document\.cookie)'
     OR coalesce(p_freeship_code, '') ~* '(<script|javascript:|onerror=|onload=|<iframe|<svg|<object|eval\(|document\.cookie)'
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
    AND o.order_status::text = 'pending'
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

  SELECT setting_value INTO v_deposit_setting FROM public.shop_settings WHERE setting_key = 'bank_transfer' LIMIT 1;
  IF v_deposit_setting IS NOT NULL AND nullif(trim(coalesce(v_deposit_setting->>'deposit_percentage', '')), '') IS NOT NULL THEN
    v_deposit_percent := GREATEST(0, LEAST(100, (v_deposit_setting->>'deposit_percentage')::NUMERIC)) / 100.0;
  END IF;

  -- Kiểm tra cấu hình chương trình Sale giảm giá theo khung giờ (sale_campaign)
  SELECT setting_value INTO v_sale_setting FROM public.shop_settings WHERE setting_key = 'sale_campaign' LIMIT 1;
  IF v_sale_setting IS NOT NULL AND coalesce((v_sale_setting->>'enabled')::boolean, false) = true THEN
    v_sale_pct := GREATEST(0, LEAST(90, coalesce(nullif(trim(v_sale_setting->>'discount_percentage'), '')::numeric, 0)));
    IF v_sale_pct > 0 THEN
      v_sale_active := TRUE;
      IF nullif(trim(coalesce(v_sale_setting->>'start_at', '')), '') IS NOT NULL THEN
        BEGIN
          IF NOW() < (v_sale_setting->>'start_at')::timestamptz THEN
            v_sale_active := FALSE;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      END IF;
      IF v_sale_active AND nullif(trim(coalesce(v_sale_setting->>'end_at', '')), '') IS NOT NULL THEN
        BEGIN
          IF NOW() > (v_sale_setting->>'end_at')::timestamptz THEN
            v_sale_active := FALSE;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      END IF;
      v_sale_scope := coalesce(v_sale_setting->>'apply_scope', 'all');
      IF jsonb_typeof(v_sale_setting->'product_ids') = 'array' THEN
        v_sale_product_ids := v_sale_setting->'product_ids';
      END IF;
    END IF;
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

    v_unit_price := v_prod_price + COALESCE(v_var_price, 0);
    IF v_sale_active THEN
      v_item_eligible := TRUE;
      IF v_sale_scope = 'selected_products' THEN
        v_item_eligible := v_sale_product_ids @> to_jsonb((v_item->>'product_id')::text);
      END IF;
      IF v_item_eligible THEN
        v_unit_price := ROUND((v_unit_price * (100 - v_sale_pct)) / 100.0);
      END IF;
    END IF;

    v_subtotal := v_subtotal + (v_unit_price * (v_item->>'quantity')::INT);
  END LOOP;

  -- Tính phí vận chuyển (miễn phí khi đơn >= 500k HOẶC khi khách nhập đúng mã freeship đang được Admin BẬT)
  IF v_subtotal >= 500000 THEN
    v_shipping_fee := 0;
  ELSE
    v_shipping_fee := 30000;
    IF nullif(trim(coalesce(p_freeship_code, '')), '') IS NOT NULL THEN
      SELECT setting_value INTO v_freeship_setting FROM public.shop_settings WHERE setting_key = 'freeship_voucher' LIMIT 1;
      IF v_freeship_setting IS NOT NULL
         AND coalesce((v_freeship_setting->>'enabled')::boolean, false) = true
         AND lower(trim(coalesce(p_freeship_code, ''))) = lower(trim(coalesce(nullif(v_freeship_setting->>'code', ''), 'bowlfreeship')))
      THEN
        v_shipping_fee := 0;
      END IF;
    END IF;
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

    v_unit_price := v_prod_price + COALESCE(v_var_price, 0);
    IF v_sale_active THEN
      v_item_eligible := TRUE;
      IF v_sale_scope = 'selected_products' THEN
        v_item_eligible := v_sale_product_ids @> to_jsonb((v_item->>'product_id')::text);
      END IF;
      IF v_item_eligible THEN
        v_unit_price := ROUND((v_unit_price * (100 - v_sale_pct)) / 100.0);
      END IF;
    END IF;

    INSERT INTO public.order_items (
      order_id, product_id, product_name, unit_price, quantity, customization_data
    ) VALUES (
      v_order_id, (v_item->>'product_id')::UUID, v_prod_name,
      v_unit_price,
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
