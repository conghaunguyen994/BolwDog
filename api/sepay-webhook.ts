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

    const result = data as { success?: boolean; error?: string; message?: string };

    if (result?.error) {
      return res.status(401).json({
        success: false,
        error: result.error,
      });
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
