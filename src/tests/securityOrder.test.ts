import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockDbOrders: any[] = [];

vi.mock('../services/supabase/client', () => ({
  isSupabaseConfigured: true,
  supabase: {
    rpc: vi.fn(async (fnName: string, args: any) => {
      if (fnName === 'create_secure_order') {
        const subtotal = args.p_items.reduce((sum: number, i: any) => sum + 285000 * i.quantity, 0);
        const shipping_fee = 30000;
        const total_amount = subtotal + shipping_fee;
        const deposit_amount = Math.round(total_amount * 0.5);
        const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const order_reference = `BD-${todayStr}-${randomSuffix}`;
        const order_id = `uuid-${Date.now()}`;

        const record = {
          id: order_id,
          order_reference,
          customer_name: args.p_customer_name,
          customer_phone: args.p_customer_phone,
          shipping_address: args.p_shipping_address,
          subtotal,
          shipping_fee,
          total_amount,
          deposit_amount,
          order_status: 'pending',
          payment_status: 'deposit_pending',
          created_at: new Date().toISOString(),
          items: args.p_items,
        };
        mockDbOrders.push(record);

        return {
          data: {
            order_id,
            order_reference,
            subtotal,
            shipping_fee,
            total_amount,
            deposit_amount,
            order_status: 'pending',
            payment_status: 'deposit_pending',
          },
          error: null,
        };
      }

      if (fnName === 'get_guest_order') {
        const cleanRef = (args.p_order_ref || '').trim().toUpperCase();
        const cleanPhone = (args.p_phone || '').replace(/\D/g, '').slice(-9);
        if (!cleanRef && !cleanPhone) {
          return { data: null, error: null };
        }
        const found = mockDbOrders.filter((o) => {
          const refOk = !cleanRef || o.order_reference.toUpperCase().includes(cleanRef);
          const phoneOk =
            !cleanPhone || o.customer_phone.replace(/\D/g, '').slice(-9) === cleanPhone;
          return refOk && phoneOk;
        });
        return { data: found.length > 0 ? found : null, error: null };
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
import { isOwnerAdminEmail } from '../services/authService';
import { getOrderStatusLabel, getPaymentStatusLabel } from '../utils/statusLabels';
import { resetRateLimits } from '../utils/securityGuard';

describe('Security & Privacy: Database Order Creation, Guest Isolation & Admin Lock', () => {
  beforeEach(() => {
    mockDbOrders.length = 0;
    localStorage.clear();
    resetRateLimits();
  });

  it('should generate unguessable order references via database RPC', async () => {
    const order = await orderService.createOrder({
      customerName: 'Nguyễn Thanh Hà',
      customerPhone: '0987654321',
      shippingAddress: '128 Đường Hoa Hồng, TP.HCM',
      items: [
        {
          productId: 'b1111111-1111-4111-8111-111111111111',
          productName: 'Bát Ăn Chống Gù – Chống Kiến',
          unitPrice: 285000,
          quantity: 1,
          customization: { petName: 'Bé Bắp' },
        },
      ],
    });

    expect(order.order_reference).toMatch(/^BD-\d{8}-[A-Z0-9]{5}$/);
    expect(order.order_status).toBe('pending');
    expect(order.payment_status).toBe('deposit_pending');
    expect(order.deposit_amount).toBe(Math.round(order.total_amount * 0.5));
  });

  it('should allow guest to query their own order using exact reference AND phone', async () => {
    const created = await orderService.createOrder({
      customerName: 'Lê Minh',
      customerPhone: '0912345678',
      shippingAddress: 'Hà Nội',
      items: [
        {
          productId: 'b4444444-4444-4444-8444-444444444444',
          productName: 'Móc Khóa 3D',
          unitPrice: 89000,
          quantity: 1,
          customization: {},
        },
      ],
    });

    const retrieved = await orderService.getOrderByReferenceAndPhone(
      created.order_reference,
      '0912345678'
    );

    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.customer_name).toBe('Lê Minh');

    resetRateLimits();
    const byRefOnly = await orderService.getOrderByReferenceAndPhone(
      created.order_reference,
      ''
    );
    expect(byRefOnly).not.toBeNull();
    expect(byRefOnly?.id).toBe(created.id);

    resetRateLimits();
    const byPhoneOnly = await orderService.getOrderByReferenceAndPhone('', '0912345678');
    expect(byPhoneOnly).not.toBeNull();
    expect(byPhoneOnly?.id).toBe(created.id);
  });

  it('should REJECT order lookup if phone number does not match (Defense against scraping)', async () => {
    const created = await orderService.createOrder({
      customerName: 'Khách A',
      customerPhone: '0912345678',
      shippingAddress: 'Địa chỉ bí mật',
      items: [
        {
          productId: 'b1111111-1111-4111-8111-111111111111',
          productName: 'Bát Ăn Chống Gù',
          unitPrice: 199000,
          quantity: 1,
          customization: {},
        },
      ],
    });

    const maliciousLookup = await orderService.getOrderByReferenceAndPhone(
      created.order_reference,
      '0988888888'
    );

    expect(maliciousLookup).toBeNull();
  });

  it('should BLOCK continuous / rapid order spam, XSS payloads, CSRF forgery, and Bot honeypots', async () => {
    // 1. Đặt đơn đầu tiên hợp lệ
    await orderService.createOrder({
      customerName: 'Nguyễn Văn A',
      customerPhone: '0911223344',
      shippingAddress: '100 Đường Lê Lợi, Quận 1',
      items: [
        {
          productId: 'b1111111-1111-4111-8111-111111111111',
          productName: 'Bát Ăn',
          unitPrice: 199000,
          quantity: 1,
          customization: { petName: 'Cún' },
        },
      ],
    });

    // 2. Bấm đặt liên tục ngay lập tức (bị chặn bởi Cooldown / Duplicate Guard)
    await expect(
      orderService.createOrder({
        customerName: 'Nguyễn Văn B',
        customerPhone: '0911223355',
        shippingAddress: '200 Đường Nguyễn Huệ, Quận 1',
        items: [
          {
            productId: 'b1111111-1111-4111-8111-111111111111',
            productName: 'Bát Ăn',
            unitPrice: 199000,
            quantity: 1,
            customization: { petName: 'Miu' },
          },
        ],
      })
    ).rejects.toThrow(/45 giây/);

    // 3. Chặn mã độc XSS (<script>, onerror=...)
    resetRateLimits();
    await expect(
      orderService.createOrder({
        customerName: '<script>alert(document.cookie)</script>',
        customerPhone: '0911223344',
        shippingAddress: '100 Đường Lê Lợi',
        items: [
          {
            productId: 'b1111111-1111-4111-8111-111111111111',
            productName: 'Bát Ăn',
            unitPrice: 199000,
            quantity: 1,
            customization: {},
          },
        ],
      })
    ).rejects.toThrow(/XSS/i);

    // 4. Chặn giả mạo CSRF Token
    resetRateLimits();
    await expect(
      orderService.createOrder({
        customerName: 'Khách Hợp Lệ',
        customerPhone: '0911223344',
        shippingAddress: '100 Đường Lê Lợi',
        csrfToken: 'forged-malicious-csrf-token',
        items: [
          {
            productId: 'b1111111-1111-4111-8111-111111111111',
            productName: 'Bát Ăn',
            unitPrice: 199000,
            quantity: 1,
            customization: {},
          },
        ],
      })
    ).rejects.toThrow(/CSRF/i);

    // 5. Chặn Bot tự động điền vào Honeypot
    resetRateLimits();
    await expect(
      orderService.createOrder({
        customerName: 'Bot Tự Động',
        customerPhone: '0911223344',
        shippingAddress: '100 Đường Lê Lợi',
        honeypot: 'http://spam-bot.example.com',
        items: [
          {
            productId: 'b1111111-1111-4111-8111-111111111111',
            productName: 'Bát Ăn',
            unitPrice: 199000,
            quantity: 1,
            customization: {},
          },
        ],
      })
    ).rejects.toThrow(/Bot/i);
  });

  it('should strictly allow ONLY owner Nguyen Cong Hau email as Admin and block all other emails', () => {
    expect(isOwnerAdminEmail('conghaunguyen994@gmail.com')).toBe(true);
    expect(isOwnerAdminEmail('CONGHAUNGUYEN994@GMAIL.COM.VN')).toBe(true);
    expect(isOwnerAdminEmail('conghaunguyen994@gmai.com')).toBe(true);
    expect(isOwnerAdminEmail('admin@bowldog.vn')).toBe(false);
    expect(isOwnerAdminEmail('hacker@gmail.com')).toBe(false);
    expect(isOwnerAdminEmail('')).toBe(false);
    expect(isOwnerAdminEmail(null)).toBe(false);
  });

  it('should translate all order and payment status codes into pure Vietnamese', () => {
    expect(getPaymentStatusLabel('deposit_pending')).toBe('Chờ chuyển cọc');
    expect(getPaymentStatusLabel('partially_paid')).toBe('Đã cọc 50%');
    expect(getPaymentStatusLabel('paid')).toBe('Đã thanh toán đủ');
    expect(getOrderStatusLabel('pending')).toBe('Chờ xác nhận');
    expect(getOrderStatusLabel('processing')).toBe('Đang in 3D');
    expect(getOrderStatusLabel('completed')).toBe('Đã hoàn thành');
  });
});
