import { Product } from '../types/product';

/**
 * Tính số lượng sản phẩm đã bán hiển thị nhất quán cho từng sản phẩm
 * (ưu tiên sold_count nếu cấu hình trong DB, mặc định sinh số cố định theo slug/id để không bị nhảy số).
 */
export function getProductSoldCount(product?: Partial<Product> | null): number {
  if (!product) return 320;

  if (typeof product.sold_count === 'number' && Number.isFinite(product.sold_count) && product.sold_count > 0) {
    return Math.floor(product.sold_count);
  }

  const slug = (product.slug || '').toLowerCase();
  if (slug.includes('bat-an-chong-gu')) {
    return 1286;
  }

  const seedStr = product.id || product.slug || product.name || 'u-oa-shop';
  let hash = 0;
  for (let i = 0; i < seedStr.length; i += 1) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) % 100000;
  }
  return 240 + (hash % 480);
}

/**
 * Định dạng gọn kiểu sàn TMĐT (vd: 1.286 -> "1,3k+", 468 -> "468").
 */
export function formatSoldCountCompact(count: number): string {
  if (count >= 1000) {
    const k = (count / 1000).toFixed(1).replace(/\.0$/, '').replace('.', ',');
    return `${k}k+`;
  }
  return count.toLocaleString('vi-VN');
}

/**
 * Định dạng số đầy đủ có dấu chấm ngăn cách hàng nghìn (vd: "1.286").
 */
export function formatSoldCountExact(count: number): string {
  return count.toLocaleString('vi-VN');
}
