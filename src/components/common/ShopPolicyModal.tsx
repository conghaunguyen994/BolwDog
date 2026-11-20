import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  RefreshCcw,
  Truck,
  CreditCard,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ShopPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShopPolicyModal: React.FC<ShopPolicyModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chính Sách & Cam Kết Chất Lượng – Ú òa Shop"
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs text-cute-brown dark:text-cute-cream max-h-[72vh] overflow-y-auto pr-1">
        {/* 1. Cam kết chất liệu nhựa PLA an toàn tuyệt đối */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
          <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>1. Chất liệu nhựa sinh học PLA an toàn tuyệt đối</span>
          </h4>
          <ul className="space-y-1 text-emerald-950/90 dark:text-emerald-200 leading-relaxed list-disc pl-5">
            <li>
              Toàn bộ sản phẩm in 3D tại shop sử dụng <strong>nhựa sinh học PLA an toàn tuyệt đối</strong> (chiết xuất từ tinh bột ngô tự nhiên, không mùi độc hại, thân thiện với thú cưng và môi trường).
            </li>
            <li>
              Hoàn thiện <strong>tỉ mỉ từng milimet, siêu nhẹ, chi tiết sắc nét &amp; đáng yêu</strong>, bo góc mềm mại an toàn cho vùng mũi và cằm nhạy cảm của bé.
            </li>
            <li>
              Lòng bát sử dụng <strong>Inox 304 cao cấp</strong> tháo rời dễ vệ sinh, không gỉ sét.
            </li>
          </ul>
        </div>

        {/* 2. Chính sách bảo hành & Đổi mới 1:1 miễn phí trong 7 ngày */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/30 border border-rose-200 dark:border-rose-800 space-y-1.5">
          <h4 className="text-sm font-black text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <RefreshCcw className="w-4 h-4 text-rose-600" />
            <span>2. Chính sách Đổi mới 1:1 miễn phí trong 7 ngày</span>
          </h4>
          <ul className="space-y-1 text-rose-950/90 dark:text-rose-200 leading-relaxed list-disc pl-5">
            <li>
              <strong>Đổi mới 1:1 hoàn toàn miễn phí trong vòng 7 ngày</strong> kể từ ngày nhận hàng nếu sản phẩm gặp <strong>lỗi kỹ thuật in 3D</strong> (sai tên, sai màu, sai kích thước so với bản Demo đã chốt) hoặc <strong>hư hỏng, nứt vỡ do quá trình vận chuyển</strong>.
            </li>
            <li>
              Shop chịu 100% chi phí vận chuyển 2 chiều khi đổi mới sản phẩm lỗi.
            </li>
            <li>
              Ba mẹ vui lòng quay video mở hộp (unbox) hoặc chụp ảnh sản phẩm lỗi gửi về Hotline/Zalo <strong>0345 553 913</strong> để được xử lý đổi mới ngay trong ngày.
            </li>
          </ul>
        </div>

        {/* 3. Chính sách đặt cọc & Thanh toán 100% */}
        <div className="p-4 rounded-2xl bg-cute-cream/70 dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark space-y-1.5">
          <h4 className="text-sm font-black text-cute-brown dark:text-cute-cream flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cute-pink-500" />
            <span>3. Chính sách Đặt cọc &amp; Thanh toán toàn bộ 100%</span>
          </h4>
          <ul className="space-y-1 text-cute-brown-light dark:text-cute-muted leading-relaxed list-disc pl-5">
            <li>
              Vì sản phẩm được <strong>in 3D cá nhân hóa riêng theo tên và ngày sinh của từng bé</strong>, ba mẹ có thể chọn:
              <br />– <strong>Đặt cọc làm mẫu</strong> qua VietQR (phần còn lại thanh toán COD khi nhận hàng).
              <br />– Hoặc <strong>Chuyển khoản thanh toán đủ 100%</strong> ngay lúc đặt hàng để hoàn tất toàn bộ (<strong>0 ₫ COD</strong> khi nhận hàng, chỉ chờ nhận đơn tại nhà).
            </li>
            <li>
              Hệ thống SePay tự động xác nhận chuyển khoản 24/7 chỉ sau 5–15 giây và gửi Email xác nhận ngay lập tức.
            </li>
          </ul>
        </div>

        {/* 4. Quy trình duyệt Demo 3D & Giao hàng */}
        <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-1.5">
          <h4 className="text-sm font-black text-purple-900 dark:text-purple-200 flex items-center gap-2">
            <Truck className="w-4 h-4 text-purple-600" />
            <span>4. Quy trình duyệt mẫu Demo 3D &amp; Vận chuyển</span>
          </h4>
          <ul className="space-y-1 text-purple-950/90 dark:text-purple-200 leading-relaxed list-disc pl-5">
            <li>
              Sau khi nhận cọc / thanh toán 100%, xưởng dựng bản mô phỏng 3D và gửi lên trang <strong>Tra cứu đơn hàng</strong> &amp; Email để ba mẹ kiểm tra, chỉnh sửa miễn phí cho đến khi ưng ý rồi mới bấm <strong>Chốt In</strong>.
            </li>
            <li>
              Thời gian in 3D &amp; đóng gói chống sốc: 1–2 ngày làm việc. Thời gian giao hàng toàn quốc: 2–4 ngày.
            </li>
            <li>
              Miễn phí vận chuyển cho đơn từ <strong>500.000 ₫</strong> trở lên hoặc khi áp dụng mã Freeship hợp lệ.
            </li>
          </ul>
        </div>

        {/* 5. Lưu ý bảo quản sản phẩm nhựa PLA */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong>Lưu ý nhỏ bảo quản:</strong> Thân bát làm từ nhựa sinh học PLA an toàn — ba mẹ nên vệ sinh bằng nước mát/ấm nhẹ (&lt; 50°C), không cho phần thân nhựa vào máy rửa chén nhiệt độ cao hoặc lò vi sóng (riêng lòng bát Inox 304 tháo rời rửa thoải mái bằng nước nóng).
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between gap-3 border-t border-cute-border-light dark:border-cute-border-dark">
          <span className="text-[11px] text-cute-brown-light dark:text-cute-muted flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Cần hỗ trợ nhanh? Zalo/Hotline: <strong>0345 553 913</strong></span>
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Đã hiểu &amp; Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
