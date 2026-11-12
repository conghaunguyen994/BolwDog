import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  PackageCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldAlert,
  Sparkles,
  Edit3,
  ZoomIn,
  X,
  Mail,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { settingsService } from '../../services/settingsService';
import { DemoReviewStatus, Order, OrderStatus } from '../../types/order';
import { ShopSettings } from '../../types/settings';
import { defaultShopSettings as initialSettings } from '../../constants/defaultSettings';
import { formatVND } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import {
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getOrderStatusBadgeClass,
  getPaymentStatusBadgeClass,
  getOrderDemoPreview,
  getDemoReviewStatusLabel,
  getDemoReviewBadgeClass,
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ShopSettings>(initialSettings);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // States cho tính năng Khách xem Demo 3D & Chốt In
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [customerFeedback, setCustomerFeedback] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSavedNotice, setEmailSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setEmailInput(order?.customer_email || '');
    setEmailSavedNotice(null);
  }, [order?.id, order?.customer_email]);

  useEffect(() => {
    settingsService.getSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialRef || initialPhone) {
      handleLookup(initialRef, initialPhone);
    }
  }, [initialRef, initialPhone]);

  const handleLookup = async (refInput?: string, phoneInput?: string) => {
    const r = (refInput !== undefined ? refInput : orderRef).trim();
    const p = (phoneInput !== undefined ? phoneInput : phone).trim();
    if (!r && !p) {
      setError('Vui lòng nhập Mã đơn hàng hoặc Số điện thoại đặt hàng (chỉ cần 1 trong 2).');
      return;
    }

    setLoading(true);
    setError(null);
    setReviewMessage(null);
    setShowRevisionForm(false);
    try {
      const foundList = await orderService.lookupOrders(r, p);
      if (!foundList || foundList.length === 0) {
        setError('Không tìm thấy đơn hàng phù hợp với thông tin đã nhập.');
        setOrders([]);
        setOrder(null);
      } else {
        setOrders(foundList);
        setOrder(foundList[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tra cứu đơn hàng.');
      setOrders([]);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDemoReview = async (status: DemoReviewStatus) => {
    if (!order) return;
    if (status === 'revision_requested' && !customerFeedback.trim()) {
      setReviewMessage('⚠️ Ba mẹ vui lòng nhập chi tiết điểm muốn chỉnh sửa trên mẫu 3D nhé!');
      return;
    }

    setReviewLoading(true);
    setReviewMessage(null);
    try {
      const updatedDemo = await orderService.submitCustomerDemoReview(order, {
        status,
        customerFeedback: customerFeedback.trim() || undefined,
      });

      const updatedItems = order.items.map((it, idx) =>
        idx === 0
          ? {
              ...it,
              customization_data: {
                ...(it.customization_data || {}),
                demoPreview: updatedDemo,
              },
            }
          : it
      );
      const nextOrder: Order = { ...order, items: updatedItems };
      setOrder(nextOrder);
      setOrders((prev) => prev.map((o) => (o.id === nextOrder.id ? nextOrder : o)));
      setShowRevisionForm(false);

      if (status === 'approved') {
        setReviewMessage(
          '🎉 Cảm ơn ba mẹ đã chốt mẫu 3D! Xưởng đã nhận được thông báo qua Email và sẽ tiến hành bấm máy in 3D cho bé ngay.'
        );
      } else {
        setReviewMessage(
          '✍️ Đã gửi yêu cầu chỉnh sửa mẫu 3D tới Email của xưởng! Nghệ nhân sẽ điều chỉnh lại file 3D và cập nhật bản demo mới tại đây nhé.'
        );
      }
    } catch (err: any) {
      setReviewMessage(`❌ ${err.message || 'Không thể gửi phản hồi duyệt mẫu.'}`);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSaveCustomerEmail = async () => {
    if (!order) return;
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailSavedNotice('⚠️ Vui lòng nhập địa chỉ Email hợp lệ (ví dụ: bame@gmail.com).');
      return;
    }

    setEmailSaving(true);
    setEmailSavedNotice(null);
    try {
      await orderService.updateOrderCustomerEmail(order.id, cleanEmail);
      const nextOrder: Order = { ...order, customer_email: cleanEmail };
      setOrder(nextOrder);
      setOrders((prev) => prev.map((o) => (o.id === nextOrder.id ? nextOrder : o)));
      setEmailSavedNotice('✅ Đã lưu Email! Khi xưởng gửi Demo 3D hoặc cập nhật đơn, hệ thống sẽ báo ngay về Email này.');
    } catch (err: any) {
      setEmailSavedNotice(`❌ ${err.message || 'Không thể lưu Email.'}`);
    } finally {
      setEmailSaving(false);
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
          Chỉ cần nhập <strong>Mã đơn hàng</strong> hoặc <strong>Số điện thoại đặt hàng</strong> (1 trong 2) để kiểm tra trạng thái
        </p>
      </div>

      {/* Lookup Form */}
      <div className="cute-card p-6 sm:p-7 shadow-cute space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
              Mã đơn hàng <span className="font-normal text-cute-brown-light">(Hoặc nhập SĐT bên cạnh)</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: BD-20261112-2DEAF"
              value={orderRef}
              onChange={(e) => setOrderRef(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-cute-cream/40 dark:bg-cute-cream-dark/40 text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
              Số điện thoại đặt hàng <span className="font-normal text-cute-brown-light">(Hoặc nhập Mã đơn)</span>
            </label>
            <input
              type="tel"
              placeholder="Ví dụ: 0987654321"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
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

      {/* Nếu tìm theo SĐT có nhiều hơn 1 đơn hàng, cho phép chọn xem từng đơn */}
      {orders.length > 1 && (
        <div className="cute-card p-4 space-y-2.5">
          <span className="text-xs font-bold text-cute-brown dark:text-cute-cream block">
            Tìm thấy {orders.length} đơn hàng phù hợp (chọn đơn để xem chi tiết):
          </span>
          <div className="flex flex-wrap gap-2">
            {orders.map((item) => {
              const active = order?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOrder(item)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all ${
                    active
                      ? 'bg-cute-pink-400 text-white border-cute-pink-500 shadow-sm'
                      : 'bg-cute-cream/50 text-cute-brown border-cute-border-light hover:border-cute-pink-300'
                  }`}
                >
                  {item.order_reference} • {formatVND(item.total_amount)}
                </button>
              );
            })}
          </div>
        </div>
      )}

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

          {/* =================================================================
              KHU VỰC KHÁCH HÀNG XEM TRƯỚC BẢN DEMO FILE 3D & CHỐT IN
          ================================================================= */}
          {(() => {
            const demoPreview = getOrderDemoPreview(order);
            if (!demoPreview) {
              return (
                <div className="p-4 sm:p-5 rounded-3xl bg-purple-50/70 dark:bg-cute-surface-dark border border-purple-200 dark:border-purple-800 flex items-center gap-3 text-xs text-cute-brown dark:text-cute-cream">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0 text-lg">
                    🎨
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-black block text-purple-900 dark:text-purple-200">
                      Bản Demo File 3D đang được nghệ nhân thiết kế
                    </span>
                    <p className="text-[11px] text-cute-brown-light dark:text-cute-muted">
                      Sau khi dựng xong file 3D theo tên & màu sắc của bé, xưởng sẽ gửi hình Demo 3D tại đây để ba mẹ xem trước và bấm <strong>&ldquo;Chốt In&rdquo;</strong> nhé!
                    </p>
                  </div>
                </div>
              );
            }

            const gallery =
              demoPreview.images && demoPreview.images.length > 0
                ? demoPreview.images
                : [demoPreview.imageUrl];

            return (
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-50 via-cute-pink/30 to-sky-50 dark:from-cute-surface-dark dark:to-cute-cream-dark border-2 border-purple-300 dark:border-purple-700 space-y-5 shadow-cute">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-200/80">
                  <div className="space-y-0.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                      <Sparkles className="w-4 h-4" />
                      Bản Demo File 3D Trước Khi In
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-cute-brown dark:text-cute-cream">
                      Ba mẹ kiểm tra mẫu thiết kế 3D & xác nhận chốt in cho bé nhé!
                    </h3>
                  </div>
                  <span
                    className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold ${getDemoReviewBadgeClass(
                      demoPreview.status
                    )}`}
                  >
                    {getDemoReviewStatusLabel(demoPreview.status)}
                  </span>
                </div>

                {/* Lời nhắn từ Admin / Nghệ nhân */}
                {demoPreview.adminNote && (
                  <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-cute-surface-dark border border-purple-200 text-xs space-y-1">
                    <span className="font-bold text-purple-800 dark:text-purple-300 block">
                      💬 Lời nhắn từ Xưởng In 3D BolwDog:
                    </span>
                    <p className="text-cute-brown dark:text-cute-cream leading-relaxed">
                      &ldquo;{demoPreview.adminNote}&rdquo;
                    </p>
                    <span className="text-[10px] text-cute-brown-light block">
                      Cập nhật lúc: {formatDate(demoPreview.sentAt)}
                    </span>
                  </div>
                )}

                {/* Hình ảnh bản dựng 3D (Bấm vào để phóng to) */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-cute-brown dark:text-cute-cream block">
                    📸 Hình ảnh mô phỏng file 3D (Bấm vào ảnh để phóng to xem chi tiết):
                  </span>
                  <div
                    className={`grid gap-3 ${
                      gallery.length === 1
                        ? 'grid-cols-1 max-w-xl mx-auto'
                        : 'grid-cols-1 sm:grid-cols-2'
                    }`}
                  >
                    {gallery.map((imgSrc, i) => (
                      <div
                        key={i}
                        onClick={() => setZoomImage(imgSrc)}
                        className="group relative cursor-pointer rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white aspect-video flex items-center justify-center"
                      >
                        <img
                          src={imgSrc}
                          alt={`Bản Demo 3D góc ${i + 1}`}
                          className="w-full h-full object-contain bg-neutral-900/5 group-hover:scale-[1.02] transition-transform duration-200"
                        />
                        <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/65 text-white text-[10px] font-bold flex items-center gap-1">
                          <ZoomIn className="w-3 h-3" />
                          <span>Phóng to góc {i + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {reviewMessage && (
                  <div className="p-3.5 rounded-2xl bg-white border border-purple-300 text-xs font-bold text-purple-900 shadow-sm">
                    {reviewMessage}
                  </div>
                )}

                {/* Trạng thái & Nút bấm Duyệt Chốt In hoặc Yêu cầu chỉnh sửa */}
                {demoPreview.status === 'approved' ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="font-black text-sm flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="w-5 h-5" />
                        Ba mẹ đã xác nhận CHỐT IN bản thiết kế 3D này!
                      </span>
                      <p className="text-[11px] opacity-85">
                        Xưởng đang tiến hành đưa file vào máy in 3D cho bé yêu.
                        {demoPreview.reviewedAt ? ` (Chốt lúc: ${formatDate(demoPreview.reviewedAt)})` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRevisionForm(!showRevisionForm)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold text-[11px] hover:bg-emerald-100 transition-colors self-start sm:self-auto"
                    >
                      Gửi thêm ghi chú cho xưởng
                    </button>
                  </div>
                ) : demoPreview.status === 'revision_requested' ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-2">
                    <span className="font-black flex items-center gap-1.5 text-amber-800">
                      <Edit3 className="w-4 h-4" />
                      Ba mẹ đã gửi yêu cầu chỉnh sửa file 3D:
                    </span>
                    <p className="p-2.5 rounded-xl bg-white border border-amber-200 font-semibold text-cute-brown">
                      &ldquo;{demoPreview.customerFeedback}&rdquo;
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-amber-800">
                        Nghệ nhân đang sửa lại file 3D và sẽ cập nhật ảnh mới tại đây. Hoặc nếu ba mẹ đổi ý muốn chốt luôn mẫu hiện tại:
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSubmitDemoReview('approved')}
                        isLoading={reviewLoading}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Chốt In Mẫu Hiện Tại Luôn
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        disabled={reviewLoading}
                        onClick={() => handleSubmitDemoReview('approved')}
                        className="flex-1 py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>✅ Ưng Ý 100% – Xác Nhận Chốt In Ngay!</span>
                      </button>

                      <button
                        type="button"
                        disabled={reviewLoading}
                        onClick={() => setShowRevisionForm(!showRevisionForm)}
                        className="py-3.5 px-5 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>✏️ Yêu Cầu Chỉnh Sửa Thêm</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Form nhập nội dung muốn chỉnh sửa file 3D */}
                {showRevisionForm && (
                  <div className="p-4 rounded-2xl bg-white border border-rose-200 space-y-3 animate-in fade-in duration-200">
                    <label className="block text-xs font-bold text-cute-brown">
                      Ba mẹ muốn xưởng điều chỉnh chi tiết nào trên file 3D? (Ví dụ: đổi cỡ chữ, đổi vị trí icon, sửa lại tên bé...)
                    </label>
                    <textarea
                      rows={3}
                      value={customerFeedback}
                      onChange={(e) => setCustomerFeedback(e.target.value)}
                      placeholder="Nhập yêu cầu chỉnh sửa của ba mẹ..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-cute-border-light bg-cute-cream/30 text-xs text-cute-brown focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRevisionForm(false)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-cute-brown-light hover:bg-gray-100"
                      >
                        Hủy
                      </button>
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={reviewLoading}
                        onClick={() => handleSubmitDemoReview('revision_requested')}
                      >
                        Gửi Yêu Cầu Chỉnh Sửa Cho Xưởng
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Đăng ký / Cập nhật Email nhận thông báo Demo 3D & tiến độ đơn */}
          <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-cute-surface-dark border border-sky-200 dark:border-sky-800 space-y-2.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-black text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-sky-600" />
                  Nhận thông báo qua Email khi có Bản Demo 3D & tiến độ in
                </span>
                <p className="text-[11px] text-cute-brown-light dark:text-cute-muted">
                  Nhập hoặc cập nhật Email của ba mẹ để xưởng gửi thông báo tự động ngay khi dựng xong mẫu 3D.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Nhập Email nhận thông báo (ví dụ: bame@gmail.com)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-sky-200 bg-white text-xs text-cute-brown focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
              <Button
                variant="outline"
                size="sm"
                isLoading={emailSaving}
                onClick={handleSaveCustomerEmail}
                leftIcon={<Mail className="w-3.5 h-3.5" />}
              >
                {order.customer_email ? 'Cập nhật Email' : 'Lưu Email nhận thông báo'}
              </Button>
            </div>
            {emailSavedNotice && (
              <p className="text-[11px] font-bold text-sky-900 dark:text-sky-200">
                {emailSavedNotice}
              </p>
            )}
          </div>

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

      {/* Lightbox phóng to ảnh Demo 3D */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute -top-10 right-0 px-3 py-1.5 rounded-full bg-white text-cute-brown font-bold text-xs flex items-center gap-1 shadow-md"
            >
              <X className="w-4 h-4" />
              <span>Đóng</span>
            </button>
            <img
              src={zoomImage}
              alt="Phóng to bản Demo 3D"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

