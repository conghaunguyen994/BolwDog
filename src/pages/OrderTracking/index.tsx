import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  PackageCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Printer,
  QrCode,
  ShieldAlert,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { settingsService } from '../../services/settingsService';
import { Order, OrderStatus } from '../../types/order';
import { ShopSettings } from '../../types/settings';
import { defaultShopSettings as initialSettings } from '../../constants/defaultSettings';
import { formatVND } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import {
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getOrderStatusBadgeClass,
  getPaymentStatusBadgeClass,
} from '../../utils/statusLabels';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { BankTransferQRModal } from '../../components/checkout/BankTransferQRModal';

export const OrderTrackingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';
  const initialPhone = searchParams.get('phone') || '';

  const [orderRef, setOrderRef] = useState(initialRef);
  const [phone, setPhone] = useState(initialPhone);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ShopSettings>(initialSettings);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialRef && initialPhone) {
      handleLookup(initialRef, initialPhone);
    }
  }, [initialRef, initialPhone]);

  const handleLookup = async (refInput?: string, phoneInput?: string) => {
    const r = (refInput || orderRef).trim();
    const p = (phoneInput || phone).trim();
    if (!r || !p) {
      setError('Vui lòng nhập cả mã đơn hàng và số điện thoại đặt hàng.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const found = await orderService.getOrderByReferenceAndPhone(r, p);
      if (!found) {
        setError('Không tìm thấy đơn hàng phù hợp với thông tin đã nhập.');
        setOrder(null);
      } else {
        setOrder(found);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tra cứu đơn hàng.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'confirmed':
        return 1;
      case 'processing':
        return 2;
      case 'shipping':
        return 3;
      case 'completed':
        return 4;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const steps = [
    { label: 'Chờ xác nhận', desc: 'Đơn đang chờ đối soát cọc' },
    { label: 'Đã nhận cọc', desc: 'Admin đã duyệt khoản cọc' },
    { label: 'Đang in 3D', desc: 'Nghệ nhân đang in & khắc tên' },
    { label: 'Đang giao hàng', desc: 'Shipper đang trên đường giao' },
    { label: 'Hoàn tất', desc: 'Bé đã nhận bát xinh' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Title */}
      <div className="text-center max-w-lg mx-auto space-y-2">
        <Badge variant="pink" size="sm">
          <PackageCheck className="w-3.5 h-3.5 text-rose-500" />
          <span>Theo dõi đơn yêu thương</span>
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-black text-cute-brown dark:text-cute-cream font-sans">
          Tra cứu tiến độ in 3D & vận chuyển
        </h1>
        <p className="text-xs sm:text-sm text-cute-brown-light dark:text-cute-muted">
          Nhập mã đơn hàng và số điện thoại ba mẹ đã đăng ký để kiểm tra trạng thái
        </p>
      </div>

      {/* Lookup Form */}
      <div className="cute-card p-6 sm:p-7 shadow-cute space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
              Mã đơn hàng (Ví dụ: BD-20261111-94A21)
            </label>
            <input
              type="text"
              placeholder="BD-..."
              value={orderRef}
              onChange={(e) => setOrderRef(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-cute-cream/40 dark:bg-cute-cream-dark/40 text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
              Số điện thoại đặt hàng
            </label>
            <input
              type="tel"
              placeholder="0987654321"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-cute-cream/40 dark:bg-cute-cream-dark/40 text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-center pt-1">
          <Button
            variant="primary"
            size="md"
            onClick={() => handleLookup()}
            isLoading={loading}
            leftIcon={<Search className="w-4 h-4" />}
          >
            Tra cứu đơn ngay
          </Button>
        </div>
      </div>

      {/* Order Results View */}
      {order && (
        <div className="cute-card p-6 sm:p-8 space-y-8 animate-in fade-in duration-300">
          {/* Header reference */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-cute-border-light dark:border-cute-border-dark">
            <div>
              <span className="text-xs text-cute-brown-light dark:text-cute-muted">Mã đơn hàng:</span>
              <h2 className="text-xl sm:text-2xl font-black text-cute-brown dark:text-cute-cream">
                {order.order_reference}
              </h2>
              <span className="text-xs text-cute-brown-light dark:text-cute-muted">
                Đặt lúc: {formatDate(order.created_at)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${getOrderStatusBadgeClass(order.order_status)}`}>
                Trạng thái: <strong>{getOrderStatusLabel(order.order_status)}</strong>
              </span>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${getPaymentStatusBadgeClass(order.payment_status)}`}>
                Thanh toán: <strong>{getPaymentStatusLabel(order.payment_status)}</strong>
              </span>
            </div>
          </div>

          {/* Progress Timeline */}
          {order.order_status !== 'cancelled' ? (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-cute-brown dark:text-cute-cream">
                Tiến độ thực hiện:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {steps.map((step, idx) => {
                  const currentIdx = getStatusStepIndex(order.order_status);
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div
                      key={step.label}
                      className={`p-3 rounded-2xl border text-center space-y-1 transition-all ${
                        isCurrent
                          ? 'bg-cute-pink/40 border-cute-pink-400 shadow-sm ring-1 ring-cute-pink-300'
                          : isDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-900 dark:text-emerald-300'
                          : 'bg-cute-cream/30 dark:bg-cute-cream-dark/30 border-cute-border-light opacity-60'
                      }`}
                    >
                      <span className="text-xs font-black block">
                        {isDone ? '✓ ' : `${idx + 1}. `}
                        {step.label}
                      </span>
                      <span className="text-[10px] text-cute-brown-light dark:text-cute-muted block leading-tight">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Đơn hàng này đã bị hủy. Ba mẹ vui lòng liên hệ hotline shop nếu cần hỗ trợ.</span>
            </div>
          )}

          {/* Payment QR notice if unpaid or pending */}
          {order.payment_status === 'deposit_pending' && (
            <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5">
                <span className="font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Bé đang đợi xác nhận chuyển khoản đặt cọc
                </span>
                <p className="opacity-80">
                  Số tiền cọc làm mẫu: <strong>{formatVND(order.deposit_amount)}</strong>. Quét lại mã QR để thanh toán.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsQRModalOpen(true)}
                leftIcon={<QrCode className="w-4 h-4" />}
              >
                Mở mã QR Chuyển Khoản
              </Button>
            </div>
          )}

          {/* Customer & Delivery Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-cute-cream/40 dark:bg-cute-cream-dark/40 border border-cute-border-light space-y-1">
              <span className="font-bold text-cute-brown dark:text-cute-cream block">Người nhận hàng:</span>
              <p>{order.customer_name} • {order.customer_phone}</p>
              <p className="text-cute-brown-light dark:text-cute-muted">Địa chỉ: {order.shipping_address}</p>
            </div>

            <div className="p-4 rounded-2xl bg-cute-cream/40 dark:bg-cute-cream-dark/40 border border-cute-border-light space-y-1">
              <span className="font-bold text-cute-brown dark:text-cute-cream block">Ghi chú đơn hàng:</span>
              <p className="italic text-cute-brown-light dark:text-cute-muted">
                {order.notes || 'Không có ghi chú thêm'}
              </p>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-cute-brown dark:text-cute-cream">
              Sản phẩm in 3D theo yêu cầu:
            </h4>
            <div className="space-y-2">
              {order.items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white dark:bg-cute-surface-dark border border-cute-border-light flex items-center justify-between text-xs"
                >
                  <div>
                    <h5 className="font-bold text-cute-brown dark:text-cute-cream">
                      {it.product_name}
                    </h5>
                    {(it.customization_data?.petName || it.customization_data?.customText) && (
                      <span className="text-[11px] text-cute-pink-500 font-semibold block">
                        ✨ In tên bé: {it.customization_data?.petName || it.customization_data?.customText}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-cute-brown dark:text-cute-cream">
                    {it.quantity} x {formatVND(it.unit_price)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-3 text-sm font-black text-rose-500 border-t border-cute-border-light dark:border-cute-border-dark">
              <span>Tổng thanh toán:</span>
              <span>{formatVND(order.total_amount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal if needed */}
      {order && (
        <BankTransferQRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          order={order}
          settings={settings}
        />
      )}
    </div>
  );
};

