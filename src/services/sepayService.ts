import { supabase } from './supabase/client';
import { Order, PaymentStatus, OrderStatus } from '../types/order';
import { emailService, markDepositEmailDispatched } from './emailService';

export interface SePayCheckResult {
  found: boolean;
  message: string;
  amount?: number;
  payment_status?: PaymentStatus;
  emailSent?: boolean;
  fromDatabase?: boolean;
  serverEmailConfigured?: boolean;
  gateway?: string;
}

export interface OrderPaymentStatusSnapshot {
  found: boolean;
  sepay_enabled?: boolean;
  order_id?: string;
  order_reference?: string;
  payment_status?: PaymentStatus;
  order_status?: OrderStatus;
  deposit_amount?: number;
  total_amount?: number;
  paid_amount?: number;
}

/**
 * Phát âm thanh báo nhận tiền cọc thành công (nhẹ nhàng, an toàn mọi trình duyệt)
 */
export function playPaymentSuccessChime(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(523.25, now, 0.16); // C5
    playTone(659.25, now + 0.12, 0.22); // E5
    playTone(783.99, now + 0.24, 0.32); // G5
  } catch {
    // Bỏ qua nếu trình duyệt chặn autoplay audio
  }
}

export const sepayService = {
  /**
   * Trích xuất mã đơn hàng từ nội dung chuyển khoản của khách.
   * Hỗ trợ nhiều định dạng (kể cả khi app ngân hàng xóa dấu `-` thành khoảng trắng hoặc viết liền):
   * - BD BD-20261118-F4E45
   * - BD-20261118-F4E45
   * - BD 20261118 F4E45
   * - BD20261118F4E45
   */
  extractOrderReference(content?: string): string | null {
    if (!content) return null;
    const clean = content.trim();

    const match = clean.match(/BD[\s\-_.]*(\d{8})[\s\-_.]*([A-Za-z0-9]{4,8})/i);
    if (match) {
      return `BD-${match[1]}-${match[2].toUpperCase()}`;
    }

    return null;
  },

  /**
   * Kiểm tra trạng thái thanh toán mới nhất của đơn hàng (hoạt động cho cả khách vãng lai qua RPC)
   */
  async getOrderPaymentStatus(
    orderRef: string,
    phone: string
  ): Promise<OrderPaymentStatusSnapshot> {
    if (!supabase || !orderRef || !phone) {
      return { found: false };
    }

    try {
      const { data, error } = await supabase.rpc('get_order_payment_status', {
        p_order_ref: orderRef,
        p_phone: phone,
      });

      if (error || !data) {
        return { found: false };
      }

      return data as OrderPaymentStatusSnapshot;
    } catch {
      return { found: false };
    }
  },

  /**
   * Kiểm tra kết nối SePay API trên Serverless Backend (.env `SEPAY_API_KEY`).
   * Trình duyệt KHÔNG giữ hoặc gửi bất kỳ API Key nào.
   */
  async verifySepayConnection(): Promise<{
    ok: boolean;
    configured?: boolean;
    message: string;
    count?: number;
  }> {
    try {
      const apiRes = await fetch('/api/check-sepay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-key' }),
      });
      const contentType = apiRes.headers.get('content-type') || '';
      if (apiRes.ok && contentType.includes('application/json')) {
        return await apiRes.json();
      }
      return {
        ok: false,
        message:
          'Không gọi được /api/check-sepay (nếu đang chạy local `vite dev`, hãy dùng `vercel dev` hoặc kiểm tra sau khi deploy lên Vercel).',
      };
    } catch (err: any) {
      return {
        ok: false,
        message: err?.message || 'Lỗi kết nối tới máy chủ kiểm tra SePay (/api/check-sepay).',
      };
    }
  },

  /**
   * Đối soát thanh toán cho 1 đơn hàng hoàn toàn qua Backend (.env):
   * 1) Kiểm tra ngay trạng thái trong DB (nếu Webhook SePay vừa cập nhật)
   * 2) Gọi `/api/check-sepay` để server dùng `SEPAY_API_KEY` từ `.env` đối soát an toàn
   */
  async checkTransactionForOrder(order: Order): Promise<SePayCheckResult> {
    const dbStatus = await this.getOrderPaymentStatus(order.order_reference, order.customer_phone);
    if (
      dbStatus.found &&
      (dbStatus.payment_status === 'partially_paid' || dbStatus.payment_status === 'paid')
    ) {
      const effectiveAmount =
        dbStatus.payment_status === 'paid'
          ? dbStatus.paid_amount || dbStatus.total_amount || order.total_amount
          : dbStatus.paid_amount || dbStatus.deposit_amount || order.deposit_amount;
      return {
        found: true,
        fromDatabase: true,
        payment_status: dbStatus.payment_status,
        amount: effectiveAmount,
        message:
          dbStatus.payment_status === 'paid'
            ? `Hệ thống SePay đã xác nhận thanh toán đủ 100% cho đơn ${order.order_reference}!`
            : `Hệ thống SePay đã xác nhận nhận cọc cho đơn ${order.order_reference}!`,
      };
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
      }

      const apiRes = await fetch('/api/check-sepay', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'check-order',
          orderReference: order.order_reference,
          phone: order.customer_phone,
        }),
      });

      const contentType = apiRes.headers.get('content-type') || '';
      if (apiRes.ok && contentType.includes('application/json')) {
        const apiJson = await apiRes.json();
        if (apiJson?.found) {
          const detectedStatus: PaymentStatus =
            apiJson.payment_status ||
            apiJson.result?.payment_status ||
            (Number(apiJson.amount || 0) >= order.total_amount * 0.98 ? 'paid' : 'partially_paid');
          apiJson.payment_status = detectedStatus;
          if (apiJson.emailSent) {
            markDepositEmailDispatched(order.id || order.order_reference);
          } else if (!apiJson.fromDatabase) {
            const mailRes = await emailService
              .notifyDepositConfirmed(
                { ...order, payment_status: detectedStatus },
                {
                  paidAmount: apiJson.amount || order.deposit_amount,
                  gateway: apiJson.gateway || 'MB Bank / SePay',
                  skipIfServerWebhookConfigured: Boolean(
                    apiJson.serverEmailConfigured || apiJson.duplicate || apiJson.result?.duplicate
                  ),
                }
              )
              .catch(() => ({ sent: false }));
            apiJson.emailSent = mailRes.sent;
          }
        }
        return apiJson;
      }
    } catch {
      // Fallback below when serverless `/api/check-sepay` is unavailable (e.g. local vite dev)
    }

    return {
      found: false,
      message: `Chưa ghi nhận giao dịch từ Webhook SePay cho đơn ${order.order_reference}. Nếu ba mẹ vừa chuyển khoản, vui lòng đợi 10-30 giây rồi thử lại nhé!`,
    };
  },
};
