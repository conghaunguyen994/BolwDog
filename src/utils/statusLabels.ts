import { OrderStatus, PaymentStatus } from '../types/order';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã duyệt cọc',
  processing: 'Đang in 3D',
  shipping: 'Đang giao hàng',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy đơn',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Chưa thanh toán',
  deposit_pending: 'Chờ chuyển cọc',
  partially_paid: 'Đã cọc 50%',
  paid: 'Đã thanh toán đủ',
  refunded: 'Đã hoàn tiền',
};

export function getOrderStatusLabel(status: OrderStatus | string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] || status;
}

export function getPaymentStatusLabel(status: PaymentStatus | string): string {
  return PAYMENT_STATUS_LABELS[status as PaymentStatus] || status;
}

export function getOrderStatusBadgeClass(status: OrderStatus | string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'confirmed':
      return 'bg-sky-100 text-sky-800 border border-sky-200';
    case 'processing':
      return 'bg-purple-100 text-purple-800 border border-purple-200';
    case 'shipping':
      return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'cancelled':
      return 'bg-rose-100 text-rose-800 border border-rose-200';
    default:
      return 'bg-cute-pink/60 text-cute-brown';
  }
}

export function getPaymentStatusBadgeClass(status: PaymentStatus | string): string {
  switch (status) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'partially_paid':
      return 'bg-teal-100 text-teal-800 border border-teal-200';
    case 'deposit_pending':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'unpaid':
      return 'bg-gray-100 text-gray-700 border border-gray-200';
    case 'refunded':
      return 'bg-rose-100 text-rose-800 border border-rose-200';
    default:
      return 'bg-amber-100 text-amber-800';
  }
}
