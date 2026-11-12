-- =========================================================================
-- BOLWDOG 3D PET BOUTIQUE - QUẢN LÝ TÀI CHÍNH, CHI PHÍ IN 3D & ĐƠN NGOÀI WEB
-- Script SQL hỗ trợ lưu trữ chi phí và đơn hàng ngoài web trực tiếp trên Supabase
-- (Mặc định hệ thống đã tự động lưu qua bảng shop_settings & localStorage bảo mật)
-- =========================================================================

-- 1. Bảng quản lý chi phí xưởng in 3D (Nhựa, điện, quảng cáo, hao hụt, linh kiện...)
CREATE TABLE IF NOT EXISTS public.workshop_expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('filament', 'electricity', 'ads', 'failure_spoilage', 'depreciation_parts', 'packaging', 'other')),
  category_label TEXT,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity INTEGER,
  unit_price NUMERIC(12, 2),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng quản lý đơn hàng mua ngoài web (Zalo, Facebook, TikTok, trực tiếp...)
CREATE TABLE IF NOT EXISTS public.manual_orders (
  id TEXT PRIMARY KEY,
  order_reference TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'zalo' CHECK (channel IN ('zalo', 'facebook', 'tiktok', 'offline_direct', 'other')),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'partially_paid' CHECK (payment_status IN ('paid', 'partially_paid', 'pending')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bật RLS (Row Level Security) bảo mật
ALTER TABLE public.workshop_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_orders ENABLE ROW LEVEL SECURITY;

-- 4. Chính sách chỉ Admin mới được xem và quản lý
DROP POLICY IF EXISTS "Admin full control on workshop_expenses" ON public.workshop_expenses;
CREATE POLICY "Admin full control on workshop_expenses"
ON public.workshop_expenses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admin full control on manual_orders" ON public.manual_orders;
CREATE POLICY "Admin full control on manual_orders"
ON public.manual_orders FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

