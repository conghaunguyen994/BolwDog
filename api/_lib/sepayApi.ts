import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function stripApiKeyPrefix(raw?: unknown): string {
  return String(raw || '')
    .trim()
    .replace(/^(Bearer|Apikey)\s+/i, '');
}

export function getSupabaseUrl(): string {
  return String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
}

export function getSupabaseAnonKey(): string {
  return String(
    process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      ''
  ).trim();
}

export function getSupabaseServiceRoleKey(): string {
  return String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
}

/**
 * Tạo Supabase Client trên server chỉ dùng biến môi trường `.env`
 * (ưu tiên SUPABASE_SERVICE_ROLE_KEY để thực thi RPC nội bộ an toàn sau khi server đã xác thực).
 */
export function createServerSupabaseClient(options?: {
  preferServiceRole?: boolean;
  authHeader?: string;
}): SupabaseClient {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();
  const anonKey = getSupabaseAnonKey();
  const key = options?.preferServiceRole && serviceKey ? serviceKey : anonKey;

  if (!url || !key) {
    throw new Error(
      'Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY trong .env.'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(options?.authHeader && !(options?.preferServiceRole && serviceKey)
      ? {
          global: {
            headers: { Authorization: options.authHeader },
          },
        }
      : {}),
  });
}

/**
 * Đọc SePay API Token nghiêm ngặt từ biến môi trường `.env` (`SEPAY_API_KEY`).
 * Không đọc hoặc lưu API Key trong cơ sở dữ liệu hay trình duyệt.
 */
export function getServerSepayApiKey(): string {
  return stripApiKeyPrefix(process.env.SEPAY_API_KEY);
}

/**
 * Đọc secret dùng để xác thực header `Authorization: Apikey ...` của Webhook SePay.
 * Mặc định sử dụng `SEPAY_WEBHOOK_SECRET` (nếu có) hoặc `SEPAY_API_KEY`.
 */
export function getServerSepayWebhookSecret(): string {
  return stripApiKeyPrefix(process.env.SEPAY_WEBHOOK_SECRET) || getServerSepayApiKey();
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
