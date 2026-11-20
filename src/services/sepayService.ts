import { supabase } from './supabase/client';
import { Order } from '../types/order';
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
  error?: string;
}

export const sepayService = {
  /**
   * Trích xuất mã đơn hàng từ nội dung chuyển khoản của khách.
   * Hỗ trợ các định dạng:
   * - BD BD-20261118-F4E45
   * - BD-20261118-F4E45
   * - BD20261118F4E45
   */
  extractOrderReference(content?: string): string | null {
    if (!content) return null;
    const clean = content.trim();

    // 1. Khớp chính xác định dạng chuẩn BD-YYYYMMDD-XXXX
    const standardMatch = clean.match(/BD-\d{8}-[A-Za-z0-9]{4,8}/i);
    if (standardMatch) {
      return standardMatch[0].toUpperCase();
    }

    // 2. Khớp định dạng không có dấu gạch ngang: BDYYYYMMDDXXXX
    const noDashMatch = clean.match(/BD(\d{8})([A-Za-z0-9]{4,8})/i);
    if (noDashMatch) {
      return `BD-${noDashMatch[1]}-${noDashMatch[2].toUpperCase()}`;
    }

    // 3. Khớp định dạng có khoảng trắng: BD 20261118 F4E45
    const spacedMatch = clean.match(/BD\s+(\d{8})\s+([A-Za-z0-9]{4,8})/i);
    if (spacedMatch) {
      return `BD-${spacedMatch[1]}-${spacedMatch[2].toUpperCase()}`;
    }

    return null;
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

    const { data, error } = await supabase.rpc('process_sepay_webhook', {
      p_sepay_id: typeof payload.id === 'number' ? payload.id : Number(payload.id) || null,
      p_gateway: payload.gateway || 'BankTransfer',
      p_transaction_date: payload.transactionDate || new Date().toISOString(),
      p_account_number: payload.accountNumber || '',
      p_content: payload.content || '',
      p_transfer_type: payload.transferType || 'in',
      p_transfer_amount: Number(payload.transferAmount) || 0,
      p_reference_code: payload.referenceCode || null,
      p_api_key: apiKey || null,
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

    // Nếu thành công và có thông tin khách hàng, tự động kích hoạt gửi email thông báo xác nhận cọc
    if (result && result.success && result.order_reference) {
      try {
        // Lấy thông tin đơn hàng đầy đủ để gửi email
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

          await emailService.notifyOrderStatusUpdate(fullOrder, 'confirmed');
        }
      } catch (emailErr) {
        console.warn('Không gửi được email thông báo SePay (bỏ qua):', emailErr);
      }
    }

    return result;
  },

  /**
   * Kiểm tra tính hợp lệ của SePay API Key bằng cách gọi thử API SePay
   */
  async verifySepayApiKey(apiKey: string): Promise<{ ok: boolean; message: string; count?: number }> {
    if (!apiKey || !apiKey.trim()) {
      return { ok: false, message: 'Vui lòng nhập SePay API Key để kiểm tra.' };
    }

    const token = apiKey.trim().replace(/^Apikey\s+/i, '');

    try {
      const response = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=1', {
        method: 'GET',
        headers: {
          Authorization: `Apikey ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return { ok: false, message: 'API Key không hợp lệ hoặc đã bị vô hiệu hóa trên SePay.' };
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
        message: err.message || 'Không thể kết nối tới máy chủ SePay. Vui lòng kiểm tra lại mạng hoặc CORS.',
      };
    }
  },

  /**
   * Đối soát chủ động trực tiếp từ SePay API cho 1 đơn hàng cụ thể
   * (Hữu ích khi webhook bị trễ hoặc khách vừa chuyển khoản muốn bấm nút "Kiểm tra ngay")
   */
  async checkTransactionForOrder(
    order: Order,
    sepayConfig?: SePayConfig
  ): Promise<{ found: boolean; message: string; amount?: number }> {
    if (!sepayConfig || !sepayConfig.enabled || !sepayConfig.api_key) {
      return { found: false, message: 'Tính năng SePay chưa được cấu hình hoặc chưa bật.' };
    }

    const token = sepayConfig.api_key.trim().replace(/^Apikey\s+/i, '');

    try {
      // Gọi SePay API lấy 50 giao dịch gần nhất
      const response = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=50', {
        method: 'GET',
        headers: {
          Authorization: `Apikey ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { found: false, message: `Không thể kết nối SePay (HTTP ${response.status})` };
      }

      const data = await response.json();
      const transactions = data.transactions || [];

      // Chuẩn hóa mã đơn hàng cần tìm
      const targetRef = order.order_reference.toUpperCase();
      const targetRefNoDash = targetRef.replace(/-/g, '');

      // Tìm giao dịch tiền vào có nội dung chứa mã đơn hàng
      const matched = transactions.find((tx: any) => {
        const type = (tx.transfer_type || tx.transferType || '').toLowerCase();
        const content = (tx.transaction_content || tx.content || '').toUpperCase();
        if (type !== 'in') return false;

        return content.includes(targetRef) || content.includes(targetRefNoDash);
      });

      if (matched) {
        const amount = Number(matched.amount_in || matched.transferAmount || 0);

        // Đẩy vào RPC để cập nhật Database
        await this.processPaymentViaRpc({
          id: matched.id,
          gateway: matched.bank_brand_name || matched.gateway,
          transactionDate: matched.transaction_date || matched.transactionDate,
          accountNumber: matched.account_number || matched.accountNumber,
          content: matched.transaction_content || matched.content,
          transferType: 'in',
          transferAmount: amount,
          referenceCode: matched.reference_number || matched.referenceCode,
        });

        return {
          found: true,
          message: `Đã tìm thấy giao dịch chuyển khoản ${amount.toLocaleString('vi-VN')} đ cho đơn ${order.order_reference}!`,
          amount,
        };
      }

      return {
        found: false,
        message: `Chưa tìm thấy giao dịch nào có nội dung chứa mã ${order.order_reference}. Ba mẹ vui lòng đợi 10-30 giây để ngân hàng đồng bộ nhé.`,
      };
    } catch (err: any) {
      return { found: false, message: err.message || 'Lỗi đối soát SePay' };
    }
  },
};
