import React, { useEffect, useState } from 'react';
import {
  Search,
  CheckCircle2,
  Eye,
  Copy,
  Upload,
  Send,
  Sparkles,
  Trash2,
  Check,
  MessageSquareWarning,
  Printer,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus, PaymentStatus } from '../../types/order';
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
  compressImageFileToDataUrl,
} from '../../utils/statusLabels';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

const DEFAULT_DEMO_NOTE =
  'Chào ba mẹ, xưởng gửi bản dựng file 3D chiếc bát ăn của bé để ba mẹ kiểm tra tên, icon và phối màu. Ba mẹ xem ưng ý rồi bấm nút Chốt In giúp xưởng nhé!';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today'>('all');

  // Selected order for detailed review & management
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 3D Demo Preview states for Admin
  const [demoImages, setDemoImages] = useState<string[]>([]);
  const [demoUrlInput, setDemoUrlInput] = useState('');
  const [demoAdminNote, setDemoAdminNote] = useState(DEFAULT_DEMO_NOTE);
  const [demoSending, setDemoSending] = useState(false);
  const [demoFeedbackMsg, setDemoFeedbackMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    const existingDemo = getOrderDemoPreview(order);
    if (existingDemo) {
      setDemoImages(
        existingDemo.images && existingDemo.images.length > 0
          ? existingDemo.images
          : [existingDemo.imageUrl]
      );
      setDemoAdminNote(existingDemo.adminNote || DEFAULT_DEMO_NOTE);
    } else {
      setDemoImages([]);
      setDemoAdminNote(DEFAULT_DEMO_NOTE);
    }
    setDemoUrlInput('');
    setDemoFeedbackMsg(null);
    setCopiedLink(false);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAllOrders({
        search: search || undefined,
        orderStatus: orderStatusFilter !== 'all' ? orderStatusFilter : undefined,
        paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        dateRange: dateFilter,
      });
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [orderStatusFilter, paymentStatusFilter, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleVerifyDeposit = async (orderId: string) => {
    if (!window.confirm('Xác nhận bạn đã kiểm tra sao kê ngân hàng và nhận đủ tiền cọc?')) return;
    setActionLoading(true);
    try {
      await orderService.verifyDeposit(orderId, false);
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          payment_status: 'partially_paid',
          order_status: 'confirmed',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setActionLoading(true);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, order_status: newStatus });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, newPaymentStatus: PaymentStatus) => {
    setActionLoading(true);
    try {
      await orderService.updatePaymentStatus(orderId, newPaymentStatus);
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: newPaymentStatus });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadDemoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setDemoFeedbackMsg(null);
      const compressedList: string[] = [];
      for (let i = 0; i < Math.min(files.length, 4); i++) {
        const dataUrl = await compressImageFileToDataUrl(files[i]);
        compressedList.push(dataUrl);
      }
      setDemoImages((prev) => [...prev, ...compressedList].slice(0, 4));
    } catch (err: any) {
      setDemoFeedbackMsg(err.message || 'Không thể tải ảnh lên.');
    } finally {
      e.target.value = '';
    }
  };

  const handlePasteDemoImage = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          try {
            const dataUrl = await compressImageFileToDataUrl(file);
            setDemoImages((prev) => [...prev, dataUrl].slice(0, 4));
            setDemoFeedbackMsg('✨ Đã dán ảnh chụp màn hình 3D từ Clipboard!');
          } catch (err: any) {
            setDemoFeedbackMsg(err.message || 'Lỗi khi dán ảnh.');
          }
        }
      }
    }
  };

  const handleAddDemoUrl = () => {
    const url = demoUrlInput.trim();
    if (!url) return;
    setDemoImages((prev) => [...prev, url].slice(0, 4));
    setDemoUrlInput('');
  };

  const handleRemoveDemoImage = (idx: number) => {
    setDemoImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSendDemoPreview = async () => {
    if (!selectedOrder) return;
    if (demoImages.length === 0) {
      setDemoFeedbackMsg('⚠️ Vui lòng tải lên hoặc dán ít nhất 1 ảnh chụp file 3D trước khi gửi.');
      return;
    }

    setDemoSending(true);
    setDemoFeedbackMsg(null);
    try {
      const savedDemo = await orderService.sendDemo3DPreview(selectedOrder, {
        imageUrl: demoImages[0],
        images: demoImages,
        adminNote: demoAdminNote,
      });

      const updatedItems = selectedOrder.items.map((it, idx) =>
        idx === 0
          ? {
              ...it,
              customization_data: {
                ...(it.customization_data || {}),
                demoPreview: savedDemo,
              },
            }
          : it
      );

      const updatedOrder: Order = { ...selectedOrder, items: updatedItems };
      setSelectedOrder(updatedOrder);
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      setDemoFeedbackMsg(
        '✅ Đã lưu và gửi bản Demo 3D! Bạn có thể bấm nút "Copy Link Gửi Khách" bên dưới để gửi qua Zalo/Messenger cho khách xem & chốt in.'
      );
    } catch (err: any) {
      setDemoFeedbackMsg(`❌ Lỗi: ${err.message || 'Không thể gửi bản demo 3D.'}`);
    } finally {
      setDemoSending(false);
    }
  };

  const handleCopyCustomerReviewLink = () => {
    if (!selectedOrder) return;
    const reviewUrl = `${window.location.origin}/track?ref=${encodeURIComponent(
      selectedOrder.order_reference
    )}&phone=${encodeURIComponent(selectedOrder.customer_phone)}`;
    const messageToCopy = `🐾 [BolwDog Studio] Chào ${selectedOrder.customer_name}, xưởng đã thiết kế xong bản Demo 3D cho đơn ${selectedOrder.order_reference}. Ba mẹ bấm vào link sau để xem hình 3D và bấm "Chốt In" giúp xưởng nhé: ${reviewUrl}`;
    navigator.clipboard.writeText(messageToCopy).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-cute-brown dark:text-cute-cream font-sans">
          Quản Lý Đơn Hàng In 3D
        </h1>
        <p className="text-xs text-cute-brown-light dark:text-cute-muted">
          Đối soát tiền cọc ngân hàng, cập nhật tiến độ in 3D và bàn giao cho đơn vị vận chuyển
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="cute-card p-4 sm:p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm theo mã đơn (BD-...), tên khách, hoặc SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-cute-cream/40 text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
            />
            <Search className="w-4 h-4 text-cute-brown-light absolute left-3 top-3" />
          </div>
          <Button type="submit" variant="primary" size="md">
            Tìm kiếm
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
          {/* Order Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-cute-brown-light font-medium">Trạng thái:</span>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-cute-border-light bg-white dark:bg-cute-surface-dark font-semibold text-cute-brown dark:text-cute-cream focus:outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã duyệt cọc</option>
              <option value="processing">Đang in 3D</option>
              <option value="shipping">Đang giao hàng</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy đơn</option>
            </select>
          </div>

          {/* Payment Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-cute-brown-light font-medium">Thanh toán:</span>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-cute-border-light bg-white dark:bg-cute-surface-dark font-semibold text-cute-brown dark:text-cute-cream focus:outline-none"
            >
              <option value="all">Tất cả thanh toán</option>
              <option value="deposit_pending">Chờ chuyển cọc</option>
              <option value="partially_paid">Đã cọc 50%</option>
              <option value="paid">Đã thanh toán đủ</option>
              <option value="unpaid">Chưa thanh toán</option>
              <option value="refunded">Đã hoàn tiền</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-cute-brown-light font-medium">Thời gian:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-cute-border-light bg-white dark:bg-cute-surface-dark font-semibold text-cute-brown dark:text-cute-cream focus:outline-none"
            >
              <option value="all">Toàn bộ thời gian</option>
              <option value="today">Hôm nay</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="cute-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-cute-cream/60 dark:bg-cute-cream-dark/60 border-b border-cute-border-light text-cute-brown-light uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-3 font-bold">Mã đơn</th>
                <th className="py-3.5 px-3 font-bold">Khách hàng</th>
                <th className="py-3.5 px-3 font-bold">Sản phẩm & Custom</th>
                <th className="py-3.5 px-3 font-bold">Tổng tiền</th>
                <th className="py-3.5 px-3 font-bold">Cọc (50%)</th>
                <th className="py-3.5 px-3 font-bold">Thanh toán</th>
                <th className="py-3.5 px-3 font-bold">Trạng thái</th>
                <th className="py-3.5 px-3 font-bold">Ngày tạo</th>
                <th className="py-3.5 px-3 font-bold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cute-border-light/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-cute-brown-light">
                    Đang tải danh sách đơn hàng...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-cute-brown-light">
                    Không có đơn hàng nào khớp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const demoInfo = getOrderDemoPreview(o);
                  return (
                    <tr key={o.id} className="hover:bg-cute-cream/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-cute-brown dark:text-cute-cream whitespace-nowrap">
                        {o.order_reference}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold block text-cute-brown dark:text-cute-cream">{o.customer_name}</span>
                        <span className="text-[11px] text-cute-brown-light">{o.customer_phone}</span>
                      </td>
                      <td className="py-3 px-3 max-w-xs space-y-1">
                        <span className="font-semibold block truncate">{o.items[0]?.product_name}</span>
                        {(o.items[0]?.customization_data?.petName || o.items[0]?.customization_data?.customText) && (
                          <span className="text-[10px] text-cute-pink-500 font-bold block truncate">
                            🐾 In tên: {o.items[0]?.customization_data?.petName || o.items[0]?.customization_data?.customText}
                          </span>
                        )}
                        {demoInfo && (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${getDemoReviewBadgeClass(
                              demoInfo.status
                            )}`}
                          >
                            {getDemoReviewStatusLabel(demoInfo.status)}
                          </span>
                        )}
                        {o.items.length > 1 && (
                          <span className="text-[10px] text-cute-brown-light font-medium block">
                            +{o.items.length - 1} món khác
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-cute-brown dark:text-cute-cream whitespace-nowrap">
                        {formatVND(o.total_amount)}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-rose-500 whitespace-nowrap">
                        {formatVND(o.deposit_amount)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getPaymentStatusBadgeClass(o.payment_status)}`}>
                          {getPaymentStatusLabel(o.payment_status)}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getOrderStatusBadgeClass(o.order_status)}`}>
                          {getOrderStatusLabel(o.order_status)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-cute-brown-light whitespace-nowrap">
                        {formatDate(o.created_at)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => openOrderDetail(o)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cute-pink/50 hover:bg-cute-pink text-cute-brown font-bold text-[11px] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem & Gửi Demo 3D</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail & Approval Modal */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Chi Tiết Đơn Hàng ${selectedOrder.order_reference}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            
            {/* Action Bar for Admin Deposit Verification */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                  Tiền cọc cần đối soát (50%): <strong className="text-rose-600 text-sm font-extrabold">{formatVND(selectedOrder.deposit_amount)}</strong>
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-300">
                  Trạng thái thanh toán: <strong>{getPaymentStatusLabel(selectedOrder.payment_status)}</strong>
                </span>
              </div>

              {selectedOrder.payment_status === 'deposit_pending' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleVerifyDeposit(selectedOrder.id)}
                  isLoading={actionLoading}
                  leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                >
                  Xác nhận đã nhận cọc
                </Button>
              )}
            </div>

            {/* Quick Status Changers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
                  Cập nhật tiến độ đơn hàng:
                </label>
                <select
                  value={selectedOrder.order_status}
                  onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-cute-border-light bg-cute-cream font-bold text-xs"
                >
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã duyệt cọc</option>
                  <option value="processing">Đang in 3D</option>
                  <option value="shipping">Đang giao hàng</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="cancelled">Đã hủy đơn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
                  Cập nhật thanh toán:
                </label>
                <select
                  value={selectedOrder.payment_status}
                  onChange={(e) => handleUpdatePaymentStatus(selectedOrder.id, e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-cute-border-light bg-cute-cream font-bold text-xs"
                >
                  <option value="unpaid">Chưa thanh toán</option>
                  <option value="deposit_pending">Chờ chuyển cọc</option>
                  <option value="partially_paid">Đã cọc 50%</option>
                  <option value="paid">Đã thanh toán đủ</option>
                  <option value="refunded">Đã hoàn tiền</option>
                </select>
              </div>
            </div>

            {/* Customer Details */}
            <div className="p-4 rounded-2xl bg-cute-cream/40 border border-cute-border-light text-xs space-y-1">
              <span className="font-bold text-cute-brown block">Thông tin người mua:</span>
              <p><strong>Khách hàng:</strong> {selectedOrder.customer_name} • <strong>SĐT:</strong> {selectedOrder.customer_phone}</p>
              <p><strong>Địa chỉ giao:</strong> {selectedOrder.shipping_address}</p>
              {selectedOrder.customer_email && <p><strong>Email:</strong> {selectedOrder.customer_email}</p>}
              <p><strong>Ghi chú:</strong> <em className="text-cute-brown-light">{selectedOrder.notes || 'Không có ghi chú'}</em></p>
            </div>

            {/* ===============================================================
                GỬI BẢN DEMO FILE 3D CHO KHÁCH XEM TRƯỚC & CHỐT IN
            =============================================================== */}
            {(() => {
              const currentDemo = getOrderDemoPreview(selectedOrder);
              return (
                <div
                  onPaste={handlePasteDemoImage}
                  className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-50/90 via-cute-pink/25 to-sky-50/80 dark:from-cute-surface-dark dark:to-cute-cream-dark border-2 border-purple-200 dark:border-purple-800 space-y-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-purple-200/70">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <h4 className="text-xs sm:text-sm font-black text-cute-brown dark:text-cute-cream">
                        Gửi Bản Demo File 3D Cho Khách Duyệt & Chốt In
                      </h4>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getDemoReviewBadgeClass(
                        currentDemo?.status
                      )}`}
                    >
                      {getDemoReviewStatusLabel(currentDemo?.status)}
                    </span>
                  </div>

                  {/* Hiển thị kết quả phản hồi của khách nếu đã Chốt In hoặc Yêu cầu sửa */}
                  {currentDemo?.status === 'approved' && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="font-black flex items-center gap-1.5 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          Khách hàng đã XÁC NHẬN CHỐT MẪU 3D!
                        </span>
                        {currentDemo.reviewedAt && (
                          <p className="text-[11px] opacity-80">
                            Thời gian chốt: {formatDate(currentDemo.reviewedAt)}
                          </p>
                        )}
                        {currentDemo.customerFeedback && (
                          <p className="text-[11px] font-semibold">
                            Lời nhắn của khách: &ldquo;{currentDemo.customerFeedback}&rdquo;
                          </p>
                        )}
                      </div>
                      {selectedOrder.order_status !== 'processing' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'processing')}
                          isLoading={actionLoading}
                          leftIcon={<Printer className="w-3.5 h-3.5" />}
                        >
                          Chuyển sang Đang In 3D
                        </Button>
                      )}
                    </div>
                  )}

                  {currentDemo?.status === 'revision_requested' && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-xs text-rose-900 space-y-1">
                      <span className="font-black flex items-center gap-1.5 text-rose-700">
                        <MessageSquareWarning className="w-4 h-4" />
                        Khách hàng yêu cầu chỉnh sửa lại file 3D:
                      </span>
                      <p className="font-bold bg-white/80 p-2.5 rounded-xl border border-rose-200 text-rose-800">
                        &ldquo;{currentDemo.customerFeedback || 'Khách muốn điều chỉnh lại thiết kế 3D'}&rdquo;
                      </p>
                      <p className="text-[11px] text-rose-600">
                        👉 Sau khi sửa lại file 3D trên phần mềm, bạn hãy tải ảnh mới lên bên dưới và bấm &ldquo;Gửi Bản Demo 3D&rdquo; để khách duyệt lại nhé!
                      </p>
                    </div>
                  )}

                  {/* Khu vực tải ảnh chụp màn hình 3D / Dán Ctrl+V / Nhập URL */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream">
                      1. Ảnh chụp bản dựng 3D từ phần mềm (Hỗ trợ chọn ảnh từ máy, bấm <kbd className="px-1.5 py-0.5 rounded bg-white border text-[10px]">Ctrl+V</kbd> để dán ảnh chụp màn hình, hoặc dán link):
                    </label>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Chọn ảnh 3D từ máy tính</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleUploadDemoFiles}
                          className="hidden"
                        />
                      </label>

                      <div className="flex-1 flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Hoặc dán link ảnh 3D (https://...) hay bấm Ctrl+V trực tiếp..."
                          value={demoUrlInput}
                          onChange={(e) => setDemoUrlInput(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs text-cute-brown focus:outline-none focus:ring-2 focus:ring-purple-300"
                        />
                        <button
                          type="button"
                          onClick={handleAddDemoUrl}
                          className="px-3 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs whitespace-nowrap"
                        >
                          + Thêm link
                        </button>
                      </div>
                    </div>

                    {/* Danh sách ảnh Demo 3D đã chọn */}
                    {demoImages.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                        {demoImages.map((imgSrc, i) => (
                          <div
                            key={i}
                            className="relative group rounded-2xl overflow-hidden border-2 border-purple-200 bg-white aspect-video flex items-center justify-center"
                          >
                            <img
                              src={imgSrc}
                              alt={`Demo 3D góc ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveDemoImage(i)}
                              title="Xóa ảnh này"
                              className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-rose-600 text-white opacity-90 hover:opacity-100 shadow-sm"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">
                              Góc {i + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl border-2 border-dashed border-purple-200 bg-white/60 text-center text-[11px] text-cute-brown-light">
                        Chưa có ảnh Demo 3D. Hãy bấm <strong>&ldquo;Chọn ảnh 3D từ máy tính&rdquo;</strong> hoặc chụp màn hình phần mềm 3D rồi bấm <strong>Ctrl + V</strong> ngay tại đây!
                      </div>
                    )}
                  </div>

                  {/* Ghi chú của Admin gửi kèm bản Demo */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream">
                      2. Lời nhắn gửi khách hàng kèm bản Demo 3D:
                    </label>
                    <textarea
                      rows={2}
                      value={demoAdminNote}
                      onChange={(e) => setDemoAdminNote(e.target.value)}
                      placeholder="Nhập ghi chú gửi khách..."
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs text-cute-brown focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                    />
                  </div>

                  {demoFeedbackMsg && (
                    <div className="p-3 rounded-xl bg-white border border-purple-200 text-xs font-semibold text-purple-900">
                      {demoFeedbackMsg}
                    </div>
                  )}

                  {/* Nút Gửi Demo & Copy Link gửi Zalo cho khách */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSendDemoPreview}
                      isLoading={demoSending}
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                      className="flex-1 justify-center"
                    >
                      {currentDemo ? 'Cập Nhật & Gửi Lại Bản Demo 3D' : 'Gửi Bản Demo 3D Cho Khách Duyệt'}
                    </Button>

                    <button
                      type="button"
                      onClick={handleCopyCustomerReviewLink}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-purple-50 text-purple-700 border border-purple-300 font-bold text-xs transition-colors shadow-sm"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Đã copy tin nhắn + Link gửi khách!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link Gửi Zalo / Mess Cho Khách</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Detailed Items & Customization specs */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-cute-brown uppercase tracking-wider">
                Danh sách sản phẩm & Tùy biến 3D:
              </h4>
              <div className="space-y-2">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-white border border-cute-border-light text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>{it.product_name}</span>
                      <span>{it.quantity} x {formatVND(it.unit_price)}</span>
                    </div>
                    {it.variant_value && (
                      <span className="text-cute-pink-600 block">
                        Phân loại: {it.variant_value}
                      </span>
                    )}
                    {it.customization_data && Object.keys(it.customization_data).length > 0 && (
                      <div className="p-2.5 rounded-xl bg-cute-cream/80 text-[11px] space-y-1 mt-1 border border-cute-pink/40">
                        {it.customization_data.petName && (
                          <p>🐾 <strong>Tên cún in 3D:</strong> <span className="text-rose-600 font-bold">{it.customization_data.petName}</span></p>
                        )}
                        {it.customization_data.selectedIcons && it.customization_data.selectedIcons.length > 0 && (
                          <p>✨ <strong>Icon trang trí:</strong> <span className="text-base">{it.customization_data.selectedIcons.join(' ')}</span></p>
                        )}
                        {(it.customization_data.bodyColor || it.customization_data.baseColor) && (
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {it.customization_data.bodyColor && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-cute-border-light text-[10px]">
                                {it.customization_data.bodyColorHex && (
                                  <span
                                    style={{ backgroundColor: it.customization_data.bodyColorHex }}
                                    className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                                  />
                                )}
                                Thân bát: <strong className="text-cute-pink-600">{it.customization_data.bodyColor}</strong>
                              </span>
                            )}
                            {it.customization_data.baseColor && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-cute-border-light text-[10px]">
                                {it.customization_data.baseColorHex && (
                                  <span
                                    style={{ backgroundColor: it.customization_data.baseColorHex }}
                                    className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                                  />
                                )}
                                Khay & Chữ: <strong className="text-teal-700">{it.customization_data.baseColor}</strong>
                              </span>
                            )}
                          </div>
                        )}
                        {it.customization_data.petBirthday && (
                          <p>🎂 <strong>Ngày sinh thú cưng:</strong> {it.customization_data.petBirthday}</p>
                        )}
                        {it.customization_data.petAge && (
                          <p>🎈 <strong>Tuổi bé:</strong> {it.customization_data.petAge}</p>
                        )}
                        {it.customization_data.customText && (
                          <p>🔑 <strong>Khắc thẻ/móc khóa:</strong> {it.customization_data.customText}</p>
                        )}
                        {it.customization_data.customNotes && (
                          <p>📝 <strong>Ghi chú nghệ nhân:</strong> {it.customization_data.customNotes}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total Financial Summary */}
            <div className="p-3.5 rounded-2xl bg-cute-cream border border-cute-border-light flex justify-between text-xs font-bold">
              <span>Tổng đơn hàng: {formatVND(selectedOrder.total_amount)}</span>
              <span className="text-rose-600">Đã cọc: {selectedOrder.payment_status === 'partially_paid' || selectedOrder.payment_status === 'paid' ? formatVND(selectedOrder.deposit_amount) : 'Chưa nhận'}</span>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedOrder(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

