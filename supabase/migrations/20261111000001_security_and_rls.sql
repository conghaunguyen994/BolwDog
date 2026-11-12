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
    'conghaunguyen994@gmai.com'
  );
END;
$$;

-- Trigger to prevent regular users from escalating their own role
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
        'conghaunguyen994@gmai.com'
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
CREATE POLICY "Payments insertable by anyone"
ON public.payments FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Payments verifiable by admin only" ON public.payments;
CREATE POLICY "Payments verifiable by admin only"
ON public.payments FOR UPDATE
USING (public.is_admin());

-- 10. SHOP SETTINGS POLICIES
DROP POLICY IF EXISTS "Shop settings viewable by everyone" ON public.shop_settings;
CREATE POLICY "Shop settings viewable by everyone"
ON public.shop_settings FOR SELECT
USING (true);

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
BEGIN
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
-- 12. SECURE RPC: LOOKUP GUEST ORDER BY REFERENCE AND PHONE
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_guest_order(
  p_order_ref TEXT,
  p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', o.id,
    'order_reference', o.order_reference,
    'customer_name', o.customer_name,
    'customer_phone', o.customer_phone,
    'shipping_address', o.shipping_address,
    'subtotal', o.subtotal,
    'shipping_fee', o.shipping_fee,
    'total_amount', o.total_amount,
    'deposit_amount', o.deposit_amount,
    'order_status', o.order_status,
    'payment_status', o.payment_status,
    'created_at', o.created_at,
    'items', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'product_name', oi.product_name,
          'unit_price', oi.unit_price,
          'quantity', oi.quantity,
          'customization_data', oi.customization_data
        )
      )
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    ), '[]'::jsonb)
  ) INTO v_order
  FROM public.orders o
  WHERE upper(o.order_reference) = upper(p_order_ref)
    AND right(regexp_replace(o.customer_phone, '\D', '', 'g'), 9) = right(regexp_replace(p_phone, '\D', '', 'g'), 9);

  RETURN v_order;
END;
$$;
