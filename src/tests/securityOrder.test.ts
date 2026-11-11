import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client to test local security logic deterministically without network latency
vi.mock('../services/supabase/client', () => ({
  isSupabaseConfigured: false,
  supabase: null,
}));

import { orderService } from '../services/orderService';

describe('Security & Privacy: Guest Order Isolation & Reference Randomness', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should generate unguessable order references with proper syntax', async () => {
    const order = await orderService.createOrder({
      customerName: 'Nguyễn Thanh Hà',
      customerPhone: '0987654321',
      shippingAddress: '128 Đường Hoa Hồng, TP.HCM',
      items: [
        {
          productId: 'prod-bowl-ergonomic',
          productName: 'Bát Ăn Công Thái Học',
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
          productId: 'prod-keychain-corgi',
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
  });

  it('should REJECT order lookup if phone number does not match (Defense against scraping)', async () => {
    const created = await orderService.createOrder({
      customerName: 'Khách A',
      customerPhone: '0912345678',
      shippingAddress: 'Địa chỉ bí mật',
      items: [],
    });

    // Attacker guessed or sniffed order reference but enters wrong/attacker phone
    const maliciousLookup = await orderService.getOrderByReferenceAndPhone(
      created.order_reference,
      '0988888888' // Wrong phone
    );

    expect(maliciousLookup).toBeNull();
  });
});
