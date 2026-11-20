import { describe, it, expect, beforeEach, vi } from 'vitest';

const seededOrders = [
  {
    id: 'order-1',
    order_reference: 'BD-20261120-198D9',
    customer_name: 'Khách A',
    customer_phone: '0338481344',
    masked_phone: '033****344',
    order_status: 'confirmed',
    payment_status: 'partially_paid',
    total_amount: 229000,
    deposit_amount: 22900,
    items: [],
    payments: [],
    created_at: '2026-11-20T08:48:51.000Z',
  },
  {
    id: 'order-2',
    order_reference: 'BD-20261120-52F0E',
    customer_name: 'Khách B',
    customer_phone: '0356669315',
    masked_phone: '035****315',
    order_status: 'pending',
    payment_status: 'deposit_pending',
    total_amount: 199000,
    deposit_amount: 19900,
    items: [],
    payments: [],
    created_at: '2026-11-20T09:00:00.000Z',
  },
];

vi.mock('../services/supabase/client', () => ({
  isSupabaseConfigured: true,
  supabase: {
    rpc: vi.fn(async (fnName: string, args: any) => {
      if (fnName === 'get_guest_order') {
        const cleanRef = (args.p_order_ref || '').trim().toUpperCase();
        const cleanPhone = (args.p_phone || '').replace(/\D/g, '').slice(-9);
        if (!cleanRef && !cleanPhone) return { data: null, error: null };

        // Mô phỏng chính xác RPC get_guest_order trên Supabase:
        // - Khớp chính xác order_reference (nếu có) và 9 số cuối SĐT (nếu có)
        // - Trả về customer_phone đã che dạng 033****344
        const found = seededOrders
          .filter((o) => {
            const refOk = !cleanRef || o.order_reference.toUpperCase() === cleanRef;
            const phoneOk =
              !cleanPhone || o.customer_phone.replace(/\D/g, '').slice(-9) === cleanPhone;
            return refOk && phoneOk;
          })
          .map(({ masked_phone, ...rest }) => ({
            ...rest,
            customer_phone: masked_phone,
          }));

        if (found.length === 0) return { data: null, error: null };
        return { data: found.length === 1 ? found[0] : found, error: null };
      }
      return { data: null, error: null };
    }),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      then: (resolve: any) => resolve({ data: [], error: null }),
    })),
  },
}));

import { orderService } from '../services/orderService';

describe('Order Lookup (1 trong 2 hoặc cả 2 với SĐT che từ get_guest_order)', () => {
  let fakeNow = new Date('2026-11-20T10:00:00Z').getTime();

  beforeEach(() => {
    localStorage.clear();
    fakeNow += 60_000;
    vi.spyOn(Date, 'now').mockImplementation(() => fakeNow);
  });

  it('tìm thấy đơn khi chỉ nhập Mã đơn hàng', async () => {
    const res = await orderService.lookupOrders('BD-20261120-198D9', '');
    expect(res).toHaveLength(1);
    expect(res[0].order_reference).toBe('BD-20261120-198D9');
  });

  it('tìm thấy đơn khi chỉ nhập Số điện thoại (dù RPC trả về SĐT che 033****344)', async () => {
    const res = await orderService.lookupOrders('', '0338481344');
    expect(res).toHaveLength(1);
    expect(res[0].order_reference).toBe('BD-20261120-198D9');
  });

  it('tìm thấy đơn khi nhập CẢ HAI Mã đơn hàng và Số điện thoại', async () => {
    const res = await orderService.lookupOrders('BD-20261120-198D9', '0338481344');
    expect(res).toHaveLength(1);
    expect(res[0].order_reference).toBe('BD-20261120-198D9');
  });

  it('tìm thấy đơn khi nhập CẢ HAI Mã đơn hàng và SĐT dạng +84', async () => {
    const res = await orderService.lookupOrders('bd-20261120-198d9', '+84 338 481 344');
    expect(res).toHaveLength(1);
    expect(res[0].order_reference).toBe('BD-20261120-198D9');
  });

  it('tìm thấy đơn khi nhập 1 phần Mã đơn hàng (5 ký tự cuối) + Số điện thoại', async () => {
    const res = await orderService.lookupOrders('198D9', '0338481344');
    expect(res).toHaveLength(1);
    expect(res[0].order_reference).toBe('BD-20261120-198D9');
  });

  it('trả về rỗng khi Mã đơn hàng và SĐT không khớp nhau', async () => {
    const res = await orderService.lookupOrders('BD-20261120-198D9', '0356669315');
    expect(res).toHaveLength(0);
  });
});
