import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Truck,
  XCircle,
  Eye,
  FileCheck2,
  Calendar,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus, PaymentStatus } from '../../types/order';
import { formatVND } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';

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
              <option value="pending">Chờ xác nhận (Pending)</option>
              <option value="confirmed">Đã duyệt cọc (Confirmed)</option>
              <option value="processing">Đang in 3D (Processing)</option>
              <option value="shipping">Đang giao hàng (Shipping)</option>
              <option value="completed">Đã hoàn tất (Completed)</option>
              <option value="cancelled">Đã hủy (Cancelled)</option>
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
              <option value="deposit_pending">Chờ cọc (Deposit Pending)</option>
              <option value="partially_paid">Đã nhận cọc 50% (Partially Paid)</option>
              <option value="paid">Đã thanh toán 100% (Paid)</option>
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
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-cute-cream/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-cute-brown dark:text-cute-cream whitespace-nowrap">
                      {o.order_reference}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold block text-cute-brown dark:text-cute-cream">{o.customer_name}</span>
                      <span className="text-[11px] text-cute-brown-light">{o.customer_phone}</span>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <span className="font-semibold block truncate">{o.items[0]?.product_name}</span>
                      {(o.items[0]?.customization_data?.petName || o.items[0]?.customization_data?.customText) && (
                        <span className="text-[10px] text-cute-pink-500 font-bold block truncate">
                          🐾 In tên: {o.items[0]?.customization_data?.petName || o.items[0]?.customization_data?.customText}
                        </span>
                      )}
                      {o.items.length > 1 && (
                        <span className="text-[10px] text-cute-brown-light font-medium">
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
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        o.payment_status === 'paid' || o.payment_status === 'partially_paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cute-pink/60 text-cute-brown">
                        {o.order_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-cute-brown-light whitespace-nowrap">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cute-pink/50 hover:bg-cute-pink text-cute-brown font-bold text-[11px] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem & Duyệt</span>
                      </button>
                    </td>
                  </tr>
                ))
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
                  Trạng thái hiện tại: <strong>{selectedOrder.payment_status}</strong>
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
                  <option value="pending">Chờ xác nhận (Pending)</option>
                  <option value="confirmed">Đã duyệt cọc (Confirmed)</option>
                  <option value="processing">Đang in 3D (Processing)</option>
                  <option value="shipping">Đang giao hàng (Shipping)</option>
                  <option value="completed">Đã hoàn thành (Completed)</option>
                  <option value="cancelled">Hủy đơn (Cancelled)</option>
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
                  <option value="unpaid">Chưa thanh toán (Unpaid)</option>
                  <option value="deposit_pending">Chờ cọc (Deposit Pending)</option>
                  <option value="partially_paid">Đã cọc 50% (Partially Paid)</option>
                  <option value="paid">Đã thanh toán 100% (Paid)</option>
                  <option value="refunded">Đã hoàn trả (Refunded)</option>
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
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-cute-border-light text-[10px]">
                                Thân bát: <strong className="text-cute-pink-600">{it.customization_data.bodyColor}</strong>
                              </span>
                            )}
                            {it.customization_data.baseColor && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-cute-border-light text-[10px]">
                                Khay chống kiến: <strong className="text-teal-700">{it.customization_data.baseColor}</strong>
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

