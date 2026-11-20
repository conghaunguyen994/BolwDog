import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { sepayService } from '../services/sepayService';
import { emailService } from '../services/emailService';
import { settingsService } from '../services/settingsService';
import { defaultShopSettings } from '../constants/defaultSettings';
import type { Order } from '../types/order';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sepayService - Order Reference Extraction & Parsing', () => {
  it('should extract standard order reference with prefix', () => {
    const content = 'BD BD-20261118-F4E45 coc bat cho cun';
    const ref = sepayService.extractOrderReference(content);
    expect(ref).toBe('BD-20261118-F4E45');
  });

  it('should extract order reference when user omits the first BD prefix', () => {
    const content = 'Thanh toan don hang BD-20261118-F4E45';
    const ref = sepayService.extractOrderReference(content);
    expect(ref).toBe('BD-20261118-F4E45');
  });

  it('should normalize and extract order reference without hyphens', () => {
    const content = 'BD20261118F4E45';
    const ref = sepayService.extractOrderReference(content);
    expect(ref).toBe('BD-20261118-F4E45');
  });

  it('should normalize and extract order reference when bank strips hyphens to spaces', () => {
    const content = 'MBVCB.123456.BD BD 20261118 F4E45.CT tu NGUYEN VAN A';
    const ref = sepayService.extractOrderReference(content);
    expect(ref).toBe('BD-20261118-F4E45');
  });

  it('should normalize concatenated prefix and order reference without hyphens', () => {
    const content = 'BDBD20261118F4E45';
    const ref = sepayService.extractOrderReference(content);
    expect(ref).toBe('BD-20261118-F4E45');
  });

  it('should normalize and extract order reference wrapped in bank dots', () => {
    const content = 'MBVCB.1234.BD-20261120-A1B2C.CT';
    const ref = sepayService.extractOrderReference(content);
    expect(ref).toBe('BD-20261120-A1B2C');
  });

  it('should return null when transaction content has no order reference', () => {
    const content = 'Nguyen Van A chuyen tien mua hang';
    const ref = sepayService.extractOrderReference(content);
    expect(ref).toBeNull();
  });

  it('should return null when content is empty or undefined', () => {
    expect(sepayService.extractOrderReference('')).toBeNull();
    expect(sepayService.extractOrderReference(undefined)).toBeNull();
  });

  it('should reject empty API key validation gracefully', async () => {
    const res = await sepayService.verifySepayApiKey('');
    expect(res.ok).toBe(false);
    expect(res.message).toContain('Vui lòng nhập SePay API Key');
  });

  it('should call /api/check-sepay or fallback using Bearer token header', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'text/html' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 200, transactions: [{ id: 1 }] }),
      } as Response);

    const res = await sepayService.verifySepayApiKey('Bearer TEST_TOKEN_123');
    expect(res.ok).toBe(true);
    expect(res.count).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://my.sepay.vn/userapi/transactions/list?limit=1');
    const secondCallInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect((secondCallInit.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer TEST_TOKEN_123'
    );
  });
});

function buildSampleOrder(overrides?: Partial<Order>): Order {
  return {
    id: 'order-uuid-123',
    order_reference: 'BD-20261120-TEST1',
    customer_name: 'Nguyễn Văn An',
    customer_phone: '0912345678',
    customer_email: 'khach@example.com',
    shipping_address: '123 Lê Lợi, Q.1, TP.HCM',
    subtotal: 200000,
    shipping_fee: 0,
    total_amount: 200000,
    deposit_amount: 20000,
    order_status: 'confirmed',
    payment_status: 'partially_paid',
    created_at: '2026-11-20T03:00:00.000Z',
    items: [
      {
        product_id: 'prod-1',
        product_name: 'Bát Ăn In 3D Tên Bé',
        unit_price: 200000,
        quantity: 1,
        customization_data: { petName: 'Mochi' },
      },
    ],
    ...overrides,
  };
}

describe('emailService.notifyDepositConfirmed - Simultaneous Admin & Customer Email', () => {
  it('should send deposit confirmation emails simultaneously to both Admin and Customer', async () => {
    vi.spyOn(settingsService, 'getSettings').mockResolvedValue({
      ...defaultShopSettings,
      email_notifications: {
        ...defaultShopSettings.email_notifications!,
        enabled: true,
        admin_email: 'admin@bolwdog.vn',
        admin_backup_email: 'backup@bolwdog.vn',
        webhook_url: 'https://script.google.com/macros/s/fake-webhook/exec',
        production_site_url: 'https://bowlshop.vercel.app',
      },
    });

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response);

    const res = await emailService.notifyDepositConfirmed(buildSampleOrder(), {
      paidAmount: 20000,
      gateway: 'MB Bank',
    });

    expect(res.sent).toBe(true);
    expect(res.adminSent).toBe(true);
    expect(res.customerSent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const bodies = fetchMock.mock.calls.map((c) => JSON.parse(String((c[1] as RequestInit).body)));
    const adminCall = bodies.find((b) => b.to === 'admin@bolwdog.vn');
    const custCall = bodies.find((b) => b.to === 'khach@example.com');

    expect(adminCall).toBeDefined();
    expect(adminCall.cc).toBe('backup@bolwdog.vn');
    expect(adminCall.eventType).toBe('deposit_confirmed');
    expect(adminCall.subject).toContain('BD-20261120-TEST1');
    expect(adminCall.htmlBody).toContain('https://bowlshop.vercel.app/admin/orders');

    expect(custCall).toBeDefined();
    expect(custCall.eventType).toBe('deposit_confirmed');
    expect(custCall.subject).toContain('BD-20261120-TEST1');
    expect(custCall.htmlBody).toContain('https://bowlshop.vercel.app/track?ref=BD-20261120-TEST1');
  });

  it('should still email Admin even when customer_email is missing', async () => {
    vi.spyOn(settingsService, 'getSettings').mockResolvedValue({
      ...defaultShopSettings,
      email_notifications: {
        ...defaultShopSettings.email_notifications!,
        enabled: true,
        admin_email: 'admin@bolwdog.vn',
        admin_backup_email: '',
        webhook_url: 'https://script.google.com/macros/s/fake-webhook/exec',
      },
    });

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const res = await emailService.notifyDepositConfirmed(
      buildSampleOrder({ id: 'order-no-email', customer_email: '' }),
      { paidAmount: 20000 }
    );

    expect(res.sent).toBe(true);
    expect(res.adminSent).toBe(true);
    expect(res.customerSent).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should deduplicate repeat triggers for the same order unless force is true', async () => {
    vi.spyOn(settingsService, 'getSettings').mockResolvedValue({
      ...defaultShopSettings,
      email_notifications: {
        ...defaultShopSettings.email_notifications!,
        enabled: true,
        admin_email: 'admin@bolwdog.vn',
        webhook_url: 'https://script.google.com/macros/s/fake-webhook/exec',
      },
    });

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const order = buildSampleOrder({ id: 'order-dedupe-1' });
    const first = await emailService.notifyDepositConfirmed(order);
    const second = await emailService.notifyDepositConfirmed(order);
    const forced = await emailService.notifyDepositConfirmed(order, { force: true });

    expect(first.sent).toBe(true);
    expect(second.sent).toBe(false);
    expect(forced.sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('should skip DB-poll client fallback when server webhook_url is configured, and send when absent', async () => {
    const getSettingsSpy = vi.spyOn(settingsService, 'getSettings').mockResolvedValue({
      ...defaultShopSettings,
      email_notifications: {
        ...defaultShopSettings.email_notifications!,
        enabled: true,
        admin_email: 'admin@bolwdog.vn',
        webhook_url: 'https://script.google.com/macros/s/fake-webhook/exec',
      },
    });

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: 'true' }),
    } as Response);

    const skippedRes = await emailService.notifyDepositConfirmed(
      buildSampleOrder({ id: 'order-webhook-skip' }),
      { skipIfServerWebhookConfigured: true }
    );
    expect(skippedRes.sent).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();

    // Without webhook_url (FormSubmit relay mode), DB-poll transition must still send via browser
    getSettingsSpy.mockResolvedValue({
      ...defaultShopSettings,
      email_notifications: {
        ...defaultShopSettings.email_notifications!,
        enabled: true,
        admin_email: 'admin@bolwdog.vn',
        webhook_url: '',
        emailjs_service_id: '',
        emailjs_template_id: '',
        emailjs_public_key: '',
      },
    });

    const fallbackRes = await emailService.notifyDepositConfirmed(
      buildSampleOrder({ id: 'order-formsubmit-fallback' }),
      { skipIfServerWebhookConfigured: true }
    );
    expect(fallbackRes.sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('https://formsubmit.co/ajax/');
  });
});
