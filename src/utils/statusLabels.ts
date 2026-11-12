import { Demo3DPreview, DemoReviewStatus, Order, OrderStatus, PaymentStatus } from '../types/order';

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

export const DEMO_REVIEW_LABELS: Record<DemoReviewStatus, string> = {
  pending_review: '⏳ Chờ khách duyệt mẫu 3D',
  approved: '✅ Khách đã chốt in 3D',
  revision_requested: '✏️ Khách yêu cầu sửa mẫu 3D',
};

export function getOrderStatusLabel(status: OrderStatus | string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] || status;
}

export function getPaymentStatusLabel(status: PaymentStatus | string): string {
  return PAYMENT_STATUS_LABELS[status as PaymentStatus] || status;
}

export function getDemoReviewStatusLabel(status?: DemoReviewStatus): string {
  if (!status) return 'Chưa gửi demo 3D';
  return DEMO_REVIEW_LABELS[status] || 'Chờ duyệt mẫu 3D';
}

export function getDemoReviewBadgeClass(status?: DemoReviewStatus): string {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    case 'revision_requested':
      return 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse';
    case 'pending_review':
      return 'bg-sky-100 text-sky-800 border border-sky-300';
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200';
  }
}

export function getOrderDemoPreview(order?: Order | null): Demo3DPreview | null {
  if (!order || !order.items || order.items.length === 0) return null;
  for (const item of order.items) {
    if (item.customization_data?.demoPreview?.imageUrl) {
      const baseDemo = { ...item.customization_data.demoPreview };

      // Kiểm tra xem có bản ghi phản hồi mới hơn từ bảng payments dự phòng không
      if (order.payments && order.payments.length > 0) {
        const reviewRecords = order.payments
          .filter((p) => p.proof_image_url?.startsWith('DEMO_REVIEW::'))
          .sort(
            (a, b) =>
              new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );

        if (reviewRecords.length > 0) {
          const latest = reviewRecords[0];
          const reviewTime = latest.created_at ? new Date(latest.created_at).getTime() : 0;
          const sentTime = baseDemo.sentAt ? new Date(baseDemo.sentAt).getTime() : 0;
          if (reviewTime >= sentTime && latest.proof_image_url) {
            const parts = latest.proof_image_url.split('::');
            const revStatus = parts[1] as DemoReviewStatus;
            const revFeedback = parts.slice(2).join('::');
            if (revStatus === 'approved' || revStatus === 'revision_requested') {
              baseDemo.status = revStatus;
              baseDemo.customerFeedback = revFeedback || baseDemo.customerFeedback;
              baseDemo.reviewedAt = latest.created_at || baseDemo.reviewedAt;
            }
          }
        }
      }

      return baseDemo;
    }
  }
  return null;
}

/**
 * Nén ảnh chụp màn hình 3D sang JPEG DataURL gọn nhẹ (~40-70KB) để lưu trực tiếp vào DB
 */
export function compressImageFileToDataUrl(file: File, maxWidth = 960, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('File ảnh không hợp lệ.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
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
