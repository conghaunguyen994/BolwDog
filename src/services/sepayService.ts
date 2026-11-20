import { supabase } from './supabase/client';
import { Order, PaymentStatus, OrderStatus } from '../types/order';
import { SePayConfig } from '../types/settings';
import { emailService } from './emailService';

export interface SePayWebhookPayload {
  id?: number | string;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  code?: string | null;
  content?: string;
  transferType?: 'in' | 'out' | string;
  transferAmount?: number;
  accumulated?: number;
  subAccount?: string | null;
  referenceCode?: string | null;
  description?: string;
}

export interface SePayVerificationResult {
  success: boolean;
  message: string;
  order_id?: string;
  order_reference?: string;
  transfer_amount?: number;
  payment_status?: string;
  order_status?: string;
  insufficient_deposit?: boolean;
  error?: string;
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
   * Gọi RPC xử lý cập nhật giao dịch SePay vào cơ sở dữ liệu Supabase
   */
  async processPaymentViaRpc(
    payload: SePayWebhookPayload,
    apiKey?: string
  ): Promise<SePayVerificationResult> {
    if (!supabase) {
      throw new Error('Chưa kết nối tới cơ sở dữ liệu Supabase.');
    }

    const cleanKey = apiKey ? apiKey.trim().replace(/^(Bearer|Apikey)\s+/i, '') : null;

    const { data, error } = await supabase.rpc('process_sepay_webhook', {
      p_sepay_id: typeof payload.id === 'number' ? payload.id : Number(payload.id) || null,
      p_gateway: payload.gateway || 'BankTransfer',
      p_transaction_date: payload.transactionDate || new Date().toISOString(),
      p_account_number: payload.accountNumber || '',
      p_content: payload.content || '',
      p_transfer_type: payload.transferType || 'in',
      p_transfer_amount: Number(payload.transferAmount) || 0,
      p_reference_code: payload.referenceCode || null,
      p_api_key: cleanKey,
    });

    if (error) {
      console.error('Lỗi khi gọi RPC process_sepay_webhook:', error);
      return {
        success: false,
        message: error.message || 'Lỗi xử lý giao dịch trên Database.',
        error: error.message,
      };
    }

    const result = data as SePayVerificationResult;

    // Nếu thành công và đủ tiền cọc, tự động kích hoạt gửi email thông báo xác nhận đơn
    if (result && result.success && !result.insufficient_deposit && result.order_reference) {
      try {
        const { data: orderData } = await supabase
          .from('orders')
          .select('*, items:order_items(*)')
          .eq('order_reference', result.order_reference)
          .single();

        if (orderData) {
          const fullOrder: Order = {
            id: orderData.id,
            order_reference: orderData.order_reference,
            customer_name: orderData.customer_name,
            customer_phone: orderData.customer_phone,
            customer_email: orderData.customer_email,
            shipping_address: orderData.shipping_address,
            subtotal: Number(orderData.subtotal),
            shipping_fee: Number(orderData.shipping_fee),
            total_amount: Number(orderData.total_amount),
            deposit_amount: Number(orderData.deposit_amount),
            order_status: orderData.order_status,
            payment_status: orderData.payment_status,
            notes: orderData.notes,
            created_at: orderData.created_at,
            items: (orderData.items || []).map((it: any) => ({
              id: it.id,
              order_id: it.order_id,
              product_id: it.product_id,
              product_name: it.product_name,
              unit_price: Number(it.unit_price),
              quantity: it.quantity,
              customization_data: it.customization_data || {},
            })),
          };

          await emailService.notifyOrderStatusChanged(fullOrder, fullOrder.order_status || 'confirmed');
        }
      } catch (emailErr) {
        console.warn('Không gửi được email thông báo SePay (bỏ qua):', emailErr);
      }
    }

    return result;
  },

  /**
   * Kiểm tra tính hợp lệ của SePay API Key (ưu tiên gọi qua /api/check-sepay để tránh lỗi CORS trên trình duyệt)
   */
  async verifySepayApiKey(apiKey: string): Promise<{ ok: boolean; message: string; count?: number }> {
    if (!apiKey || !apiKey.trim()) {
      return { ok: false, message: 'Vui lòng nhập SePay API Key để kiểm tra.' };
    }

    const token = apiKey.trim().replace(/^(Bearer|Apikey)\s+/i, '');

    // 1. Thử gọi qua Vercel Serverless Proxy (hoạt động trên production / vercel dev, tránh CORS)
    try {
      const apiRes = await fetch('/api/check-sepay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-key', apiKey: token }),
      });
      const contentType = apiRes.headers.get('content-type') || '';
      if (apiRes.ok && contentType.includes('application/json')) {
        return await apiRes.json();
      }
    } catch {
      // Fall back to direct check in local Vite dev
    }

    // 2. Fallback trực tiếp (hữu ích khi chạy `npm run dev` cục bộ)
    try {
      const response = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=1', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return { ok: false, message: 'API Token không hợp lệ hoặc đã bị vô hiệu hóa trên SePay.' };
        }
        return { ok: false, message: `SePay trả về mã lỗi HTTP ${response.status}.` };
      }

      const json = await response.json();
      const count = json.transactions ? json.transactions.length : 0;
      return {
        ok: true,
        message: 'Kết nối SePay API thành công! Tài khoản ngân hàng đang sẵn sàng nhận diện giao dịch.',
        count,
      };
    } catch (err: any) {
      return {
        ok: false,
        message:
          err.message ||
          'Không thể kết nối trực tiếp từ trình duyệt (CORS). Khi deploy lên Vercel, hệ thống sẽ tự động kiểm tra qua /api/check-sepay.',
      };
    }
  },

  /**
   * Đối soát thanh toán cho 1 đơn hàng:
   * 1) Kiểm tra ngay trạng thái trong DB (nếu Webhook SePay vừa cập nhật)
   * 2) Nếu có quyền Admin / server env -> quét trực tiếp SePay API qua /api/check-sepay
   */
  async checkTransactionForOrder(
    order: Order,
    sepayConfig?: SePayConfig
  ): Promise<{ found: boolean; message: string; amount?: number }> {
    // Bước 1: Kiểm tra DB trước xem Webhook đã xác nhận chưa (hoạt động cho cả khách vãng lai)
    const dbStatus = await this.getOrderPaymentStatus(order.order_reference, order.customer_phone);
    if (
      dbStatus.found &&
      (dbStatus.payment_status === 'partially_paid' || dbStatus.payment_status === 'paid')
    ) {
      return {
        found: true,
        amount: dbStatus.deposit_amount || order.deposit_amount,
        message: `Hệ thống SePay đã xác nhận nhận cọc cho đơn ${order.order_reference}!`,
      };
    }

    const token = sepayConfig?.api_key
      ? sepayConfig.api_key.trim().replace(/^(Bearer|Apikey)\s+/i, '')
      : '';

    // Bước 2: Gọi Serverless proxy /api/check-sepay (an toàn CORS & hỗ trợ cả SEPAY_API_KEY trên server)
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
          apiKey: token || undefined,
        }),
      });

      const contentType = apiRes.headers.get('content-type') || '';
      if (apiRes.ok && contentType.includes('application/json')) {
        return await apiRes.json();
      }
    } catch {
      // Fallback below when running locally under `vite dev` without `/api` serverless routes
    }

    // Bước 3: Fallback trực tiếp (dành cho Admin khi chạy local `vite dev`)
    if (!token) {
      return {
        found: false,
        message: `Chưa ghi nhận giao dịch từ Webhook SePay cho đơn ${order.order_reference}. Nếu ba mẹ vừa chuyển khoản, vui lòng đợi 10-30 giây rồi thử lại nhé!`,
      };
    }

    try {
      const response = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=50', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { found: false, message: `Không thể kết nối SePay (HTTP ${response.status})` };
      }

      const data = await response.json();
      const transactions = data.transactions || [];
      const targetNormalized = order.order_reference.toUpperCase().replace(/[^A-Z0-9]/g, '');

      const matched = transactions.find((tx: any) => {
        const amountIn = Number(tx.amount_in || 0);
        const type = String(tx.transfer_type || tx.transferType || (amountIn > 0 ? 'in' : '')).toLowerCase();
        if (type !== 'in' && amountIn <= 0) return false;

        const content = String(tx.transaction_content || tx.content || '')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '');
        return content.includes(targetNormalized);
      });

      if (matched) {
        const amount = Number(matched.amount_in || matched.transferAmount || 0);

        const rpcRes = await this.processPaymentViaRpc(
          {
            id: matched.id,
            gateway: matched.bank_brand_name || matched.gateway,
            transactionDate: matched.transaction_date || matched.transactionDate,
            accountNumber: matched.account_number || matched.accountNumber,
            content: matched.transaction_content || matched.content,
            transferType: 'in',
            transferAmount: amount,
            referenceCode: matched.reference_number || matched.referenceCode,
          },
          token
        );

        if (!rpcRes.success) {
          return { found: false, message: rpcRes.error || rpcRes.message };
        }

        return {
          found: true,
          message: `Đã tìm thấy giao dịch chuyển khoản ${amount.toLocaleString('vi-VN')} đ cho đơn ${order.order_reference}!`,
          amount,
        };
      }

      return {
        found: false,
        message: `Chưa tìm thấy giao dịch nào có nội dung chứa mã ${order.order_reference}. Vui lòng đợi 10-30 giây để ngân hàng đồng bộ nhé.`,
      };
    } catch (err: any) {
      return { found: false, message: err.message || 'Lỗi đối soát SePay' };
    }
  },
};
