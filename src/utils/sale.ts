import { SaleCampaignConfig } from '../types/settings';

export type SaleStatus = 'disabled' | 'upcoming' | 'active' | 'expired';

/**
 * Chuẩn hóa phần trăm giảm giá hợp lệ (0 - 90%)
 */
export function normalizeDiscountPercentage(pct?: number | null): number {
  const numeric = Number(pct);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.min(90, Math.max(0, Math.round(numeric)));
}

/**
 * Xác định trạng thái hiện tại của chương trình Sale theo thời gian thực
 */
export function getSaleStatus(
  sale?: SaleCampaignConfig | null,
  now: Date = new Date()
): SaleStatus {
  if (!sale || !sale.enabled) return 'disabled';
  const pct = normalizeDiscountPercentage(sale.discount_percentage);
  if (pct <= 0) return 'disabled';

  const nowMs = now.getTime();

  if (sale.start_at) {
    const startMs = new Date(sale.start_at).getTime();
    if (Number.isFinite(startMs) && nowMs < startMs) {
      return 'upcoming';
    }
  }

  if (sale.end_at) {
    const endMs = new Date(sale.end_at).getTime();
    if (Number.isFinite(endMs) && nowMs > endMs) {
      return 'expired';
    }
  }

  return 'active';
}

/**
 * Kiểm tra chương trình Sale có đang trong thời gian hiệu lực hay không
 */
export function isSaleActive(
  sale?: SaleCampaignConfig | null,
  now: Date = new Date()
): boolean {
  return getSaleStatus(sale, now) === 'active';
}

/**
 * Kiểm tra một sản phẩm cụ thể có thuộc diện giảm giá trong khung giờ hiện tại không
 */
export function isProductEligibleForSale(
  productId: string | undefined,
  sale?: SaleCampaignConfig | null,
  now: Date = new Date()
): boolean {
  if (!isSaleActive(sale, now)) return false;
  if (!sale) return false;

  if (sale.apply_scope === 'selected_products') {
    if (!productId || !Array.isArray(sale.product_ids) || sale.product_ids.length === 0) {
      return false;
    }
    return sale.product_ids.includes(productId);
  }

  return true;
}

/**
 * Lấy phần trăm giảm giá áp dụng cho một sản phẩm (trả về 0 nếu không được giảm)
 */
export function getProductDiscountPercentage(
  productId: string | undefined,
  sale?: SaleCampaignConfig | null,
  now: Date = new Date()
): number {
  if (!isProductEligibleForSale(productId, sale, now)) return 0;
  return normalizeDiscountPercentage(sale?.discount_percentage);
}

/**
 * Tính giá sau giảm (làm tròn đồng nhất với công thức ROUND trên PostgreSQL)
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  discountPercentage: number
): number {
  const safeOriginal = Math.max(0, Number(originalPrice) || 0);
  const pct = normalizeDiscountPercentage(discountPercentage);
  if (pct <= 0) return safeOriginal;
  return Math.max(0, Math.round((safeOriginal * (100 - pct)) / 100));
}

/**
 * Chuyển chuỗi ISO / Date sang định dạng `YYYY-MM-DDTHH:mm` theo giờ địa phương để hiển thị trong `<input type="datetime-local" />`
 */
export function toDatetimeLocalInput(isoOrDate?: string | null): string {
  if (!isoOrDate) return '';
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Chuyển giá trị từ `<input type="datetime-local" />` sang chuỗi ISO chuẩn có múi giờ
 */
export function fromDatetimeLocalInput(localValue: string): string {
  if (!localValue) return '';
  const d = new Date(localValue);
  if (Number.isNaN(d.getTime())) return localValue;
  return d.toISOString();
}

/**
 * Định dạng ngày giờ hiển thị tiếng Việt thân thiện (ví dụ: "14:00 - 20/11/2026")
 */
export function formatSaleDateTimeVN(isoString?: string | null): string {
  if (!isoString) return 'Không giới hạn';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return 'Không xác định';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ngày ${pad(d.getDate())}/${pad(
    d.getMonth() + 1
  )}/${d.getFullYear()}`;
}

/**
 * Tính thời gian đếm ngược đến một mốc thời gian (ví dụ `end_at` hoặc `start_at`)
 */
export function getSaleCountdown(
  targetIso?: string | null,
  now: Date = new Date()
): {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  shortLabel: string;
} {
  if (!targetIso) {
    return { expired: false, days: 0, hours: 0, minutes: 0, seconds: 0, shortLabel: '' };
  }
  const targetMs = new Date(targetIso).getTime();
  if (!Number.isFinite(targetMs)) {
    return { expired: false, days: 0, hours: 0, minutes: 0, seconds: 0, shortLabel: '' };
  }

  const diffMs = targetMs - now.getTime();
  if (diffMs <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, shortLabel: 'Đã kết thúc' };
  }

  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  const shortLabel =
    days > 0
      ? `${days} ngày ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return { expired: false, days, hours, minutes, seconds, shortLabel };
}
