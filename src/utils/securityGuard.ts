/**
 * BOLWDOG SECURITY GUARD
 * Bảo vệ đa lớp chống Spam, Click liên tục, DDoS ứng dụng, XSS (Cross-Site Scripting) và CSRF (Cross-Site Request Forgery).
 */

export interface RateLimitConfig {
  /** Khoảng thời gian tối thiểu giữa 2 lần bấm liên tiếp (ms) */
  minIntervalMs: number;
  /** Số lần tối đa cho phép trong cửa sổ thời gian windowMs */
  maxRequests: number;
  /** Cửa sổ thời gian trượt (ms) */
  windowMs: number;
  /** Thông báo lỗi tiếng Việt khi vượt giới hạn */
  errorMessage?: string;
}

export const RATE_LIMIT_PRESETS: Record<string, RateLimitConfig> = {
  create_order: {
    minIntervalMs: 45_000, // Cách nhau ít nhất 45 giây giữa 2 lần đặt đơn
    maxRequests: 3, // Tối đa 3 đơn trong 15 phút
    windowMs: 15 * 60 * 1000,
    errorMessage:
      'Ba mẹ vừa gửi đơn hàng xong. Vui lòng đợi ít nhất 45 giây trước khi đặt đơn tiếp theo để tránh trùng đơn nhé!',
  },
  track_order: {
    minIntervalMs: 1_500, // Cách nhau 1.5 giây giữa 2 lần bấm tra cứu
    maxRequests: 10, // Tối đa 10 lần tra cứu / 1 phút
    windowMs: 60 * 1000,
    errorMessage:
      'Bạn đang thao tác tra cứu quá nhanh. Vui lòng đợi vài giây rồi thử lại.',
  },
  submit_payment_proof: {
    minIntervalMs: 20_000,
    maxRequests: 3,
    windowMs: 10 * 60 * 1000,
    errorMessage:
      'Bạn vừa gửi xác nhận thanh toán. Vui lòng đợi 20 giây trước khi gửi lại.',
  },
  add_to_cart: {
    minIntervalMs: 350, // Chống auto-clicker bấm liên hoàn vào giỏ hàng
    maxRequests: 25,
    windowMs: 30 * 1000,
    errorMessage:
      'Thao tác thêm vào giỏ quá nhanh, vui lòng chậm lại một chút nhé!',
  },
  auth_action: {
    minIntervalMs: 1_500,
    maxRequests: 6,
    windowMs: 3 * 60 * 1000,
    errorMessage:
      'Bạn đang gửi yêu cầu đăng nhập/đăng ký liên tục. Vui lòng đợi ít giây rồi thử lại.',
  },
  admin_mutation: {
    minIntervalMs: 600,
    maxRequests: 30,
    windowMs: 60 * 1000,
    errorMessage:
      'Thao tác cập nhật quá nhanh, vui lòng đợi hệ thống xử lý xong yêu cầu trước.',
  },
};

const RATE_LIMIT_STORAGE_PREFIX = 'bowldog_rl_';
const DUPLICATE_ORDER_KEY = 'bowldog_last_order_hash';
const CSRF_STORAGE_KEY = 'bowldog_csrf_token';

// Bộ nhớ in-memory kết hợp localStorage để chống cả spam F5
const memoryTimestamps = new Map<string, number[]>();
const activeLocks = new Set<string>();

// ============================================================================
// 1. CHỐNG XSS (CROSS-SITE SCRIPTING) & LÀM SẠCH DỮ LIỆU ĐẦU VÀO
// ============================================================================

const XSS_DANGEROUS_REGEX =
  /(<\s*\/?\s*(script|iframe|object|embed|svg|style|link|meta|base|form|input|button|textarea)\b|javascript\s*:|vbscript\s*:|data\s*:\s*text\/html|on[a-z]{2,}\s*=|expression\s*\(|eval\s*\(|document\s*\.\s*cookie|window\s*\.\s*location)/i;

/**
 * Kiểm tra chuỗi có chứa mã độc XSS / HTML injection hay không
 */
export function containsXssPayload(value: unknown): boolean {
  if (typeof value !== 'string' || !value) return false;
  return XSS_DANGEROUS_REGEX.test(value);
}

/**
 * Làm sạch chuỗi văn bản người dùng nhập vào, loại bỏ hoàn toàn thẻ HTML và mã script
 */
export function sanitizeText(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return input
    // Loại bỏ ký tự điều khiển ẩn (trừ xuống dòng \n)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    // Loại bỏ toàn bộ thẻ HTML <...>
    .replace(/<[^>]*>/g, '')
    // Vô hiệu hóa các giao thức nguy hiểm
    .replace(/(javascript|vbscript|data)\s*:/gi, '')
    // Vô hiệu hóa inline event handlers (onerror=, onload=,...)
    .replace(/\bon[a-z]{2,}\s*=/gi, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Kiểm tra & làm sạch URL (chỉ cho phép http/https hoặc đường dẫn tương đối an toàn)
 */
export function sanitizeUrl(url: unknown): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (containsXssPayload(trimmed)) {
    throw new Error('Đường dẫn chứa nội dung không an toàn (XSS bị chặn).');
  }
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/')
  ) {
    return trimmed.slice(0, 1000);
  }
  throw new Error('Đường dẫn URL không hợp lệ.');
}

/**
 * Đệ quy làm sạch mọi thuộc tính chuỗi trong một Object (ví dụ: dữ liệu khắc tên 3D)
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    if (containsXssPayload(obj)) {
      throw new Error('Phát hiện mã lệnh không hợp lệ trong dữ liệu nhập vào (XSS bị chặn).');
    }
    return sanitizeText(obj, 300) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.slice(0, 20).map((item) => sanitizeObject(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj as Record<string, any>)) {
      cleaned[sanitizeText(key, 64)] = sanitizeObject(val);
    }
    return cleaned as T;
  }
  return obj;
}

// ============================================================================
// 2. CHỐNG CSRF (CROSS-SITE REQUEST FORGERY) & KIỂM TRA ORIGIN
// ============================================================================

function generateRandomHex(bytes = 32): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return (
    Math.random().toString(36).substring(2) +
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
  );
}

/**
 * Lấy hoặc khởi tạo CSRF Token cho phiên làm việc hiện tại
 */
export function getCsrfToken(): string {
  try {
    let token = sessionStorage.getItem(CSRF_STORAGE_KEY);
    if (!token || token.length < 16) {
      token = generateRandomHex(32);
      sessionStorage.setItem(CSRF_STORAGE_KEY, token);
    }
    return token;
  } catch {
    return 'fallback-csrf-session-token';
  }
}

/**
 * Xác thực CSRF Token và kiểm tra tính toàn vẹn của Origin
 */
export function assertCsrfAndSameOrigin(providedToken?: string): void {
  const sessionToken = getCsrfToken();
  if (providedToken !== undefined && providedToken !== sessionToken) {
    throw new Error('Phiên bảo mật (CSRF Token) không hợp lệ. Vui lòng tải lại trang và thử lại.');
  }

  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (!origin || origin === 'null') {
      throw new Error('Không thể xác thực nguồn gốc yêu cầu (Origin bị từ chối).');
    }
  }
}

// ============================================================================
// 3. CHỐNG SPAM, CLICK LIÊN TỤC, RATE LIMITING & CHỐNG ĐẶT TRÙNG ĐƠN
// ============================================================================

function getTimestamps(actionKey: string, windowMs: number): number[] {
  const now = Date.now();
  const storageKey = `${RATE_LIMIT_STORAGE_PREFIX}${actionKey}`;
  let list: number[] = memoryTimestamps.get(actionKey) || [];

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list = parsed.filter((t) => typeof t === 'number');
      }
    }
  } catch {
    // Ignore storage read errors
  }

  return list.filter((t) => now - t < windowMs);
}

function saveTimestamps(actionKey: string, list: number[]): void {
  memoryTimestamps.set(actionKey, list);
  try {
    localStorage.setItem(`${RATE_LIMIT_STORAGE_PREFIX}${actionKey}`, JSON.stringify(list));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Kiểm tra xem người dùng còn phải đợi bao nhiêu giây cooldown cho một hành động
 */
export function getRemainingCooldownSeconds(actionKey: string): number {
  const config = RATE_LIMIT_PRESETS[actionKey];
  if (!config) return 0;

  const now = Date.now();
  const recent = getTimestamps(actionKey, config.windowMs);
  if (recent.length === 0) return 0;

  const lastTime = recent[recent.length - 1];
  const sinceLast = now - lastTime;
  if (sinceLast < config.minIntervalMs) {
    return Math.ceil((config.minIntervalMs - sinceLast) / 1000);
  }

  if (recent.length >= config.maxRequests) {
    const oldestInWindow = recent[0];
    return Math.max(1, Math.ceil((config.windowMs - (now - oldestInWindow)) / 1000));
  }

  return 0;
}

/**
 * Kiểm tra và ghi nhận giới hạn tần suất (Rate Limit). Ném lỗi nếu vượt ngưỡng.
 */
export function enforceRateLimit(
  actionKey: string,
  customConfig?: Partial<RateLimitConfig>
): void {
  const base = RATE_LIMIT_PRESETS[actionKey] || {
    minIntervalMs: 1_000,
    maxRequests: 15,
    windowMs: 60_000,
  };
  const config: RateLimitConfig = { ...base, ...customConfig };
  const now = Date.now();
  const recent = getTimestamps(actionKey, config.windowMs);

  if (recent.length > 0) {
    const lastTime = recent[recent.length - 1];
    const diff = now - lastTime;
    if (diff < config.minIntervalMs) {
      const waitSec = Math.max(1, Math.ceil((config.minIntervalMs - diff) / 1000));
      throw new Error(
        config.errorMessage ||
          `Bạn đang thao tác quá nhanh. Vui lòng đợi ${waitSec} giây trước khi thử lại.`
      );
    }
  }

  if (recent.length >= config.maxRequests) {
    const waitSec = Math.max(1, Math.ceil((config.windowMs - (now - recent[0])) / 1000));
    throw new Error(
      config.errorMessage ||
        `Hệ thống tạm chặn thao tác liên tục để bảo vệ. Vui lòng thử lại sau ${waitSec} giây.`
    );
  }

  recent.push(now);
  saveTimestamps(actionKey, recent);
}

/**
 * Reset bộ đếm Rate Limit (dùng trong unit test hoặc khi cần làm mới)
 */
export function resetRateLimits(): void {
  memoryTimestamps.clear();
  activeLocks.clear();
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(RATE_LIMIT_STORAGE_PREFIX) || k === DUPLICATE_ORDER_KEY) {
        localStorage.removeItem(k);
      }
    });
  } catch {
    // Ignore
  }
}

/**
 * Khóa Mutex chống bấm đúp / chạy song song nhiều request cùng lúc (In-Flight Action Lock)
 */
export async function withActionLock<T>(
  actionKey: string,
  fn: () => Promise<T>
): Promise<T> {
  if (activeLocks.has(actionKey)) {
    throw new Error('Hệ thống đang xử lý thao tác trước đó, vui lòng không bấm liên tục.');
  }
  activeLocks.add(actionKey);
  try {
    return await fn();
  } finally {
    activeLocks.delete(actionKey);
  }
}

/**
 * Chống gửi trùng một đơn hàng giống hệt nhau trong vòng 5 phút (Idempotency / Duplicate Order Guard)
 */
export function assertNotDuplicateOrder(payloadSignature: string): void {
  try {
    const raw = localStorage.getItem(DUPLICATE_ORDER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { sig: string; ts: number };
      if (
        parsed.sig === payloadSignature &&
        Date.now() - parsed.ts < 5 * 60 * 1000
      ) {
        throw new Error(
          'Đơn hàng với thông tin này vừa được gửi thành công. Ba mẹ vui lòng kiểm tra mã đơn hoặc đợi 5 phút nếu muốn đặt thêm đơn giống hệt nhé!'
        );
      }
    }
  } catch (err: any) {
    if (err?.message?.includes('vừa được gửi thành công')) {
      throw err;
    }
  }
}

export function markOrderSubmitted(payloadSignature: string): void {
  try {
    localStorage.setItem(
      DUPLICATE_ORDER_KEY,
      JSON.stringify({ sig: payloadSignature, ts: Date.now() })
    );
  } catch {
    // Ignore
  }
}

/**
 * Kiểm tra bẫy Bot tự động (Honeypot). Nếu trường ẩn bị điền -> Chặn ngay lập tức.
 */
export function assertHumanNotBot(honeypotValue?: string): void {
  if (honeypotValue && honeypotValue.trim().length > 0) {
    throw new Error('Hệ thống chống Bot tự động đã từ chối yêu cầu này.');
  }
}
