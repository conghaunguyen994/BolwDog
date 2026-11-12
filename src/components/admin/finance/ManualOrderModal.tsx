import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, Check, User, Phone, ShoppingBag, AlertCircle } from 'lucide-react';
import { ManualOrderRecord, SalesChannel, SALES_CHANNEL_CONFIG } from '../../../types/finance';
import { formatVND } from '../../../utils/currency';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Omit<ManualOrderRecord, 'id' | 'createdAt'>, id?: string) => Promise<void>;
  initialData?: ManualOrderRecord | null;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [channel, setChannel] = useState<SalesChannel>('zalo');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partially_paid' | 'pending'>('partially_paid');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customerName);
      setCustomerPhone(initialData.customerPhone);
      setChannel(initialData.channel);
      setProductName(initialData.productName);
      setQuantity(initialData.quantity);
      setTotalAmount(initialData.totalAmount);
      setDepositAmount(initialData.depositAmount);
      setPaymentStatus(initialData.paymentStatus);
      setOrderDate(initialData.orderDate);
      setNotes(initialData.notes || '');
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setChannel('zalo');
      setProductName('');
      setQuantity(1);
      setTotalAmount(0);
      setDepositAmount(0);
      setPaymentStatus('partially_paid');
      setOrderDate(new Date().toISOString().substring(0, 10));
      setNotes('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSetQuickDeposit = (percent: number) => {
    const dep = Math.round(totalAmount * (percent / 100));
    setDepositAmount(dep);
    if (percent === 100) {
      setPaymentStatus('paid');
    } else if (percent > 0) {
      setPaymentStatus('partially_paid');
    } else {
      setPaymentStatus('pending');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Vui lòng nhập tên khách hàng');
      return;
    }
    if (!customerPhone.trim()) {
      setError('Vui lòng nhập số điện thoại khách hàng');
      return;
    }
    if (!productName.trim()) {
      setError('Vui lòng nhập tên sản phẩm hoặc chi tiết đặt làm');
      return;
    }
    if (!totalAmount || totalAmount <= 0) {
      setError('Tổng tiền đơn hàng phải lớn hơn 0 đ');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const ref =
        initialData?.orderReference ||
        `OFF-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;

      await onSave(
        {
          orderReference: ref,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          channel,
          productName: productName.trim(),
          quantity: Math.max(1, quantity),
          totalAmount: Math.round(totalAmount),
          depositAmount: Math.round(depositAmount),
          paymentStatus,
          orderDate,
          notes: notes.trim(),
        },
        initialData?.id
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể lưu đơn hàng ngoài web.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const channels = Object.keys(SALES_CHANNEL_CONFIG) as SalesChannel[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-cute-surface-dark w-full max-w-lg rounded-3xl shadow-cute-lg border border-cute-border-light dark:border-cute-border-dark overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cute-border-light dark:border-cute-border-dark bg-cute-cream/40 dark:bg-cute-cream-dark/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base shadow-sm">
              💬
            </div>
            <div>
              <h3 className="text-base font-extrabold text-cute-brown dark:text-cute-cream">
                {initialData ? 'Chỉnh Sửa Đơn Mua Ngoài Web' : 'Thêm Đơn Mua Ngoài Web (Zalo / FB / Trực Tiếp)'}
              </h3>
              <p className="text-[11px] text-cute-brown-light dark:text-cute-muted">
                Hỗ trợ nhập đơn khách nhắn tin đặt làm riêng để tính tổng doanh thu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cute-cream dark:hover:bg-cute-surface-dark text-cute-brown-light"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Kênh bán hàng */}
          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1.5">
              Kênh bán hàng *:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {channels.map((ch) => {
                const cfg = SALES_CHANNEL_CONFIG[ch];
                const isSelected = channel === ch;
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left text-xs transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 font-bold text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark hover:bg-cute-cream/50'
                    }`}
                  >
                    <span>{cfg.icon}</span>
                    <span className="truncate text-[11px]">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Khách hàng & SĐT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-cute-brown-light" />
                <span>Tên khách hàng *:</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Chị Lan Anh, Tuấn Corgi..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-cute-brown-light" />
                <span>Số điện thoại / Zalo *:</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: 0912345678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Sản phẩm & Số lượng */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-cute-brown-light" />
                <span>Sản phẩm / Yêu cầu in 3D *:</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: 2 Bát ăn chống gù Size M + In tên Bắp"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
                Số lượng:
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
              />
            </div>
          </div>

          {/* Tổng tiền & Tiền cọc */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-cute-brown dark:text-cute-cream flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tổng tiền (VNĐ) *:</span>
                </label>
                <span className="text-[11px] font-bold text-emerald-700">
                  {formatVND(totalAmount || 0)}
                </span>
              </div>
              <input
                type="number"
                required
                min="1000"
                step="1000"
                placeholder="Ví dụ: 390000"
                value={totalAmount || ''}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="w-full text-sm font-bold px-3.5 py-2.5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-cute-brown dark:text-cute-cream flex items-center gap-1">
                  <span>Tiền cọc đã nhận:</span>
                </label>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleSetQuickDeposit(50)}
                    className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickDeposit(100)}
                    className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold"
                  >
                    100%
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="Ví dụ: 200000"
                value={depositAmount || ''}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full text-sm font-bold px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
              />
            </div>
          </div>

          {/* Trạng thái thanh toán & Ngày chốt đơn */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
                Trạng thái thanh toán:
              </label>
              <select
                value={paymentStatus}
                onChange={(e: any) => setPaymentStatus(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
              >
                <option value="partially_paid">Đã cọc một phần</option>
                <option value="paid">Đã thanh toán đủ (100%)</option>
                <option value="pending">Chờ cọc / Chờ thanh toán</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cute-brown-light" />
                <span>Ngày chốt đơn:</span>
              </label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-cute-brown-light" />
              <span>Ghi chú đơn hàng:</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Đã gửi xem demo 3D qua Zalo, khách hẹn thứ 7 lấy..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cute-border-light dark:border-cute-border-dark">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-full border border-cute-border-light text-xs font-bold text-cute-brown-light hover:bg-cute-cream"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Lưu đơn ngoài web'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

