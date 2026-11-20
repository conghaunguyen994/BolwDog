import { createClient } from '@supabase/supabase-js';
import { sendDepositConfirmedEmailsServer } from './_lib/depositEmail.js';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  stripApiKeyPrefix,
  resolveSepayServerToken,
  fetchSepayTransactions,
} from './_lib/sepayApi.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { action, apiKey, orderReference, phone } = body;

    if (action === 'verify-key') {
      const token = stripApiKeyPrefix(apiKey);
      if (!token) {
        return res.status(400).json({ ok: false, message: 'Vui lòng nhập SePay API Token để kiểm tra.' });
      }

      const sepayRes = await fetchSepayTransactions(token, 1);
      const { json } = sepayRes;

      if (!sepayRes.ok || json.status === 401 || json.error) {
        if (sepayRes.status === 401 || sepayRes.status === 403) {
          return res.status(200).json({
            ok: false,
            message: 'API Token không hợp lệ hoặc đã bị vô hiệu hóa trên SePay (401 Unauthorized).',
          });
        }
        return res.status(200).json({
          ok: false,
          message: json.error || `SePay trả về mã lỗi HTTP ${sepayRes.status}.`,
        });
      }

      const count = Array.isArray(json.transactions) ? json.transactions.length : 0;
      return res.status(200).json({
        ok: true,
        message: 'Kết nối SePay API thành công! Tài khoản ngân hàng đang sẵn sàng nhận diện giao dịch.',
        count,
      });
    }

    if (action === 'check-order') {
      if (!orderReference) {
        return res.status(400).json({ found: false, message: 'Thiếu mã đơn hàng để kiểm tra.' });
      }

      const authHeader = String(req.headers['authorization'] || '').trim();
      const supabase = createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        authHeader
          ? {
              global: {
                headers: {
                  Authorization: authHeader,
                },
              },
            }
          : undefined
      );

      // 1. Kiểm tra trạng thái hiện tại trong Database trước (nếu Webhook đã cập nhật rồi)
      if (phone) {
        const { data: statusData } = await supabase.rpc('get_order_payment_status', {
          p_order_ref: orderReference,
          p_phone: phone,
        });

        if (
          statusData &&
          statusData.found &&
          (statusData.payment_status === 'partially_paid' || statusData.payment_status === 'paid')
        ) {
          return res.status(200).json({
            found: true,
            fromDatabase: true,
            payment_status: statusData.payment_status,
            amount: Number(statusData.deposit_amount || 0),
            message: `Đã xác nhận thanh toán cho đơn ${orderReference}!`,
          });
        }
      }

      // 2. Nếu có API Token (từ Admin, Vercel env SEPAY_API_KEY, hoặc đọc qua SUPABASE_SERVICE_ROLE_KEY) -> quét trực tiếp SePay API
      const token = await resolveSepayServerToken(apiKey);

      if (!token) {
        return res.status(200).json({
          found: false,
          message: `Chưa ghi nhận giao dịch từ Webhook SePay cho đơn ${orderReference}. Nếu bạn vừa chuyển khoản, vui lòng đợi 10-30 giây để ngân hàng đồng bộ nhé!`,
        });
      }

      const sepayRes = await fetchSepayTransactions(token, 50);
      const sepayJson = sepayRes.json;

      if (!sepayRes.ok) {
        return res.status(200).json({
          found: false,
          message: `Không thể kết nối SePay (HTTP ${sepayRes.status})`,
        });
      }

      const transactions = sepayJson.transactions || [];
      const targetNormalized = String(orderReference)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');

      const matched = transactions.find((tx: any) => {
        const amountIn = Number(tx.amount_in || 0);
        const type = String(tx.transfer_type || tx.transferType || (amountIn > 0 ? 'in' : '')).toLowerCase();
        if (type !== 'in' && amountIn <= 0) return false;

        const rawContent = String(tx.transaction_content || tx.content || '').toUpperCase();
        const normalizedContent = rawContent.replace(/[^A-Z0-9]/g, '');
        return normalizedContent.includes(targetNormalized);
      });

      if (!matched) {
        return res.status(200).json({
          found: false,
          message: `Chưa tìm thấy giao dịch nào có nội dung chứa mã ${orderReference}. Vui lòng đợi 10-30 giây để ngân hàng đồng bộ nhé.`,
        });
      }

      const amount = Number(matched.amount_in || matched.transferAmount || 0);
      const gateway = matched.bank_brand_name || matched.gateway || 'MB Bank / SePay';
      const { data: rpcData, error: rpcError } = await supabase.rpc('process_sepay_webhook', {
        p_sepay_id: typeof matched.id === 'number' ? matched.id : Number(matched.id) || null,
        p_gateway: gateway,
        p_transaction_date: matched.transaction_date || matched.transactionDate || new Date().toISOString(),
        p_account_number: matched.account_number || matched.accountNumber || '',
        p_content: matched.transaction_content || matched.content || '',
        p_transfer_type: 'in',
        p_transfer_amount: amount,
        p_reference_code: matched.reference_number || matched.referenceCode || null,
        p_api_key: token,
      });

      if (rpcError) {
        return res.status(200).json({
          found: false,
          message: `Tìm thấy giao dịch ${amount.toLocaleString('vi-VN')} đ nhưng lỗi cập nhật DB: ${rpcError.message}`,
        });
      }

      const rpcResult = (rpcData || {}) as {
        success?: boolean;
        duplicate?: boolean;
        insufficient_deposit?: boolean;
        error?: string;
        message?: string;
        order_reference?: string;
        customer_name?: string;
        customer_email?: string;
        customer_phone?: string;
        transfer_amount?: number;
        payment_status?: string;
      };

      if (rpcResult.error || rpcResult.insufficient_deposit) {
        return res.status(200).json({
          found: false,
          message:
            rpcResult.message ||
            rpcResult.error ||
            `Giao dịch ${amount.toLocaleString('vi-VN')} đ chưa đủ mức tiền cọc yêu cầu.`,
        });
      }

      let emailSent = false;
      if (rpcResult.success && !rpcResult.duplicate) {
        const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
        const host = String(req.headers['x-forwarded-host'] || req.headers['host'] || '').split(',')[0].trim();
        const siteUrlHint = host ? `${proto}://${host}` : undefined;

        const emailResult = await sendDepositConfirmedEmailsServer(supabase, {
          orderReference: rpcResult.order_reference || String(orderReference),
          customerName: rpcResult.customer_name,
          customerPhone: rpcResult.customer_phone || (phone ? String(phone) : ''),
          customerEmail: rpcResult.customer_email,
          transferAmount: rpcResult.transfer_amount || amount,
          gateway,
          paymentStatus: rpcResult.payment_status,
          siteUrlHint,
        });
        emailSent = emailResult.sent;
      }

      return res.status(200).json({
        found: true,
        amount,
        gateway,
        emailSent,
        duplicate: Boolean(rpcResult.duplicate),
        result: rpcData,
        message: `Đã tìm thấy giao dịch chuyển khoản ${amount.toLocaleString('vi-VN')} đ cho đơn ${orderReference}!`,
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err: any) {
    return res.status(500).json({
      found: false,
      ok: false,
      message: err.message || 'Lỗi máy chủ khi kiểm tra SePay',
    });
  }
}
