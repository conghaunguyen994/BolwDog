import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://mwuewkvddhjtxmfzvjyj.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_4Ri-LJHIAOjRCU64cLaYgQ_ZwRb2wqv';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, X-Api-Key'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'BolwDog SePay Webhook Integration',
      endpoint: '/api/sepay-webhook',
      timestamp: new Date().toISOString(),
      usage: 'Configure this URL in SePay Webhook settings (Method: POST)',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is accepted.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const authHeader = String(req.headers['authorization'] || req.headers['x-api-key'] || '');
    const apiKey = authHeader.replace(/^(Apikey|Bearer)\s+/i, '').trim() || String(req.query?.api_key || '').trim();

    const {
      id,
      gateway,
      transactionDate,
      accountNumber,
      content,
      transferType,
      transferAmount,
      referenceCode,
    } = body;

    if (!content || !transferAmount) {
      return res.status(200).json({
        success: true,
        matched: false,
        message: 'Bỏ qua: Dữ liệu giao dịch thiếu nội dung hoặc số tiền',
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase.rpc('process_sepay_webhook', {
      p_sepay_id: typeof id === 'number' ? id : Number(id) || null,
      p_gateway: gateway || 'BankTransfer',
      p_transaction_date: transactionDate ? String(transactionDate) : new Date().toISOString(),
      p_account_number: accountNumber || '',
      p_content: content || '',
      p_transfer_type: transferType || 'in',
      p_transfer_amount: Number(transferAmount) || 0,
      p_reference_code: referenceCode || null,
      p_api_key: apiKey || null,
    });

    if (error) {
      console.error('Supabase RPC Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    const result = data as {
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

    if (result?.error) {
      return res.status(401).json({
        success: false,
        error: result.error,
      });
    }

    // Gửi email thông báo tự động qua Google Apps Script Webhook (nếu Admin đã cấu hình webhook_url)
    if (result?.success && !result?.duplicate && !result?.insufficient_deposit && result?.order_reference) {
      try {
        const { data: emailSetting } = await supabase
          .from('shop_settings')
          .select('setting_value')
          .eq('setting_key', 'email_notifications')
          .maybeSingle();

        const emailCfg = emailSetting?.setting_value;
        if (emailCfg?.enabled && emailCfg?.webhook_url && emailCfg?.notify_on_status_change) {
          const siteUrl = (emailCfg.production_site_url || 'https://bowlshop.vercel.app').replace(/\/$/, '');
          const trackUrl = `${siteUrl}/track?ref=${encodeURIComponent(result.order_reference)}&phone=${encodeURIComponent(result.customer_phone || '')}`;
          const amountFormatted = Number(result.transfer_amount || 0).toLocaleString('vi-VN') + ' ₫';

          const sendEmailPayload = async (to: string, subject: string, htmlBody: string, textBody: string) => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 2500);
            try {
              await fetch(emailCfg.webhook_url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ to, subject, textBody, htmlBody }),
                signal: controller.signal,
              });
            } finally {
              clearTimeout(timer);
            }
          };

          const jobs: Promise<void>[] = [];
          if (emailCfg.admin_email) {
            jobs.push(
              sendEmailPayload(
                emailCfg.admin_email,
                `[BolwDog] ⚡ SePay đã nhận cọc #${result.order_reference} (${amountFormatted})`,
                `<p>Hệ thống SePay vừa tự động xác nhận chuyển khoản <strong>${amountFormatted}</strong> cho đơn hàng <strong>#${result.order_reference}</strong> (${result.customer_name || 'Khách hàng'}).</p><p><a href="${siteUrl}/admin/orders">Mở quản lý đơn hàng</a></p>`,
                `SePay đã nhận ${amountFormatted} cho đơn #${result.order_reference}.`
              )
            );
          }
          if (result.customer_email && String(result.customer_email).includes('@')) {
            jobs.push(
              sendEmailPayload(
                result.customer_email,
                `[BolwDog Studio] 🎉 Đã nhận tiền cọc đơn hàng #${result.order_reference}`,
                `<p>Chào ba mẹ <strong>${result.customer_name || ''}</strong>,</p><p>BolwDog đã tự động nhận được số tiền cọc <strong>${amountFormatted}</strong> qua chuyển khoản cho đơn hàng <strong>#${result.order_reference}</strong>.</p><p>Xưởng đang bắt tay thiết kế bản Demo 3D cho bé nhé! <a href="${trackUrl}">Theo dõi đơn hàng tại đây</a></p>`,
                `BolwDog đã nhận ${amountFormatted} cho đơn #${result.order_reference}. Theo dõi tại: ${trackUrl}`
              )
            );
          }
          await Promise.allSettled(jobs);
        }
      } catch {
        // Không làm lỗi Webhook response khi email phụ bị chậm
      }
    }

    // Luôn trả về 200 để SePay đánh dấu đã nhận webhook (kể cả chuyển khoản ngoài không thuộc đơn hàng)
    return res.status(200).json({
      success: true,
      matched: Boolean(result?.success),
      message: result?.message || 'SePay Webhook processed successfully',
      result,
    });
  } catch (err: any) {
    console.error('Webhook processing exception:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
}
