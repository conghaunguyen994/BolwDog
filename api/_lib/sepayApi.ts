import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://mwuewkvddhjtxmfzvjyj.supabase.co';
export const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_4Ri-LJHIAOjRCU64cLaYgQ_ZwRb2wqv';

export function stripApiKeyPrefix(raw?: unknown): string {
  return String(raw || '')
    .trim()
    .replace(/^(Bearer|Apikey)\s+/i, '');
}

/**
 * Resolve SePay API Token từ request/admin, biến môi trường Vercel SEPAY_API_KEY,
 * hoặc bảng shop_settings qua SUPABASE_SERVICE_ROLE_KEY.
 */
export async function resolveSepayServerToken(providedKey?: unknown): Promise<string> {
  let token = stripApiKeyPrefix(providedKey) || stripApiKeyPrefix(process.env.SEPAY_API_KEY);

  if (!token && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const serviceClient = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { data: sepayRow } = await serviceClient
        .from('shop_settings')
        .select('setting_value')
        .eq('setting_key', 'sepay')
        .maybeSingle();
      if (sepayRow?.setting_value?.enabled && sepayRow.setting_value.api_key) {
        token = stripApiKeyPrefix(sepayRow.setting_value.api_key);
      }
    } catch {
      // Ignore fallback DB read error
    }
  }

  return token;
}

export async function fetchSepayTransactions(
  token: string,
  limit = 50
): Promise<{ ok: boolean; status: number; json: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const sepayRes = await fetch(`https://my.sepay.vn/userapi/transactions/list?limit=${limit}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    const rawText = await sepayRes.text();
    let json: any = {};
    try {
      json = JSON.parse(rawText);
    } catch {
      json = {};
    }

    return { ok: sepayRes.ok, status: sepayRes.status, json };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Xác minh một Webhook payload không kèm header Authorization bằng cách đối chiếu trực tiếp
 * giao dịch thật trên SePay User API (chống giả mạo webhook ngay cả khi SePay tắt chứng thực).
 */
export async function verifyWebhookTransactionWithSepayApi(
  token: string,
  payload: {
    id?: number | string | null;
    referenceCode?: string | null;
    transferAmount?: number | string | null;
  }
): Promise<boolean> {
  if (!token) return false;

  const expectedAmount = Number(payload.transferAmount || 0);
  if (expectedAmount <= 0) return false;

  const targetId = payload.id !== undefined && payload.id !== null ? String(payload.id).trim() : '';
  const targetRef = payload.referenceCode ? String(payload.referenceCode).trim() : '';
  if (!targetId && !targetRef) return false;

  try {
    const { ok, json } = await fetchSepayTransactions(token, 30);
    if (!ok || !Array.isArray(json?.transactions)) {
      return false;
    }

    return json.transactions.some((tx: any) => {
      const amountIn = Number(tx.amount_in || tx.transferAmount || 0);
      if (amountIn <= 0 || Math.abs(amountIn - expectedAmount) > 1) {
        return false;
      }

      const txId = tx.id !== undefined && tx.id !== null ? String(tx.id).trim() : '';
      const txRef = String(tx.reference_number || tx.referenceCode || '').trim();
      return Boolean((targetId && txId === targetId) || (targetRef && txRef === targetRef));
    });
  } catch {
    return false;
  }
}
