-- ====================================================================
-- BOLWDOG - KHÓA CỨNG TÀI KHOẢN NGÂN HÀNG & CHỐNG HACK ĐỔI QR / STK
-- Tạo Trigger bảo vệ cấp Database trên bảng public.shop_settings:
-- 1. Luôn khóa chặt bank_code = 'MB', account_number = '0345553913',
--    account_holder = 'NGUYEN CONG HAU'
-- 2. Tự động xóa mọi trường 'qr_custom_image' để chặn chèn ảnh QR giả mạo
-- 3. Vẫn cho phép Admin thay đổi % đặt cọc (deposit_percentage) & tiền tố nội dung
-- ====================================================================

CREATE OR REPLACE FUNCTION public.lock_official_bank_transfer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.setting_key = 'bank_transfer' AND jsonb_typeof(NEW.setting_value) = 'object' THEN
    NEW.setting_value := (NEW.setting_value - 'qr_custom_image') || jsonb_build_object(
      'bank_code', 'MB',
      'bank_name', 'Ngân hàng TMCP Quân Đội (MB Bank)',
      'account_number', '0345553913',
      'account_holder', 'NGUYEN CONG HAU'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_lock_official_bank_transfer ON public.shop_settings;
CREATE TRIGGER tr_lock_official_bank_transfer
BEFORE INSERT OR UPDATE ON public.shop_settings
FOR EACH ROW EXECUTE FUNCTION public.lock_official_bank_transfer();

-- Chuẩn hóa ngay bản ghi bank_transfer hiện tại trong Database
UPDATE public.shop_settings
SET
  setting_value = (setting_value - 'qr_custom_image') || jsonb_build_object(
    'bank_code', 'MB',
    'bank_name', 'Ngân hàng TMCP Quân Đội (MB Bank)',
    'account_number', '0345553913',
    'account_holder', 'NGUYEN CONG HAU'
  ),
  updated_at = NOW()
WHERE setting_key = 'bank_transfer';
