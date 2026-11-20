import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { sepayService } from '../services/sepayService';
import { emailService } from '../services/emailService';
import { settingsService, sanitizeSettingEntry } from '../services/settingsService';
import { defaultShopSettings } from '../constants/defaultSettings';
import type { Order } from '../types/order';
import { stripApiKeyPrefix, verifyWebhookTransactionWithSepayApi } from '../../api/_lib/sepayApi';

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

  it('should check SePay status via /api/check-sepay without sending any client API key', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true, configured: true, count: 1, message: 'Server OK' }),
    } as Response);

    const res = await sepayService.verifySepayConnection();
    expect(res.ok).toBe(true);
    expect(res.count).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/check-sepay');
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({ action: 'verify-key' });
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
  it('should dispatch deposit confirmation emails simultaneously via /api/send-email', async () => {
    vi.spyOn(settingsService, 'getSettings').mockResolvedValue({
      ...defaultShopSettings,
      email_notifications: {
        ...defaultShopSettings.email_notifications!,
        enabled: true,
        admin_email: 'admin@bolwdog.vn',
        admin_backup_email: 'backup@bolwdog.vn',
        production_site_url: 'https://bowlshop.vercel.app',
      },
    });

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true, channel: 'webhook' }),
    } as Response);

    const res = await emailService.notifyDepositConfirmed(buildSampleOrder(), {
      paidAmount: 20000,
      gateway: 'MB Bank',
    });

    expect(res.sent).toBe(true);
    expect(res.adminSent).toBe(true);
    expect(res.customerSent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/send-email');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/send-email');

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
      },
    });

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true, channel: 'webhook' }),
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
      },
    });

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true, channel: 'webhook' }),
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

  it('should skip DB-poll client fallback when server .env email provider is configured, and fall back to FormSubmit when absent', async () => {
    vi.spyOn(settingsService, 'getSettings').mockResolvedValue({
      ...defaultShopSettings,
      email_notifications: {
        ...defaultShopSettings.email_notifications!,
        enabled: true,
        admin_email: 'admin@bolwdog.vn',
      },
    });

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      const bodyStr = init?.body ? String(init.body) : '';
      if (String(url) === '/api/send-email' && bodyStr.includes('"action":"status"')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ ok: true, hasServerProvider: true }),
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ ok: true }),
      } as Response;
    });

    const skippedRes = await emailService.notifyDepositConfirmed(
      buildSampleOrder({ id: 'order-webhook-skip' }),
      { skipIfServerWebhookConfigured: true }
    );
    expect(skippedRes.sent).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url, init) => {
      const bodyStr = init?.body ? String(init.body) : '';
      if (String(url) === '/api/send-email') {
        if (bodyStr.includes('"action":"status"')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ ok: true, hasServerProvider: false }),
          } as Response;
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ ok: false, reason: 'no_server_provider' }),
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: 'true' }),
      } as Response;
    });

    const fallbackRes = await emailService.notifyDepositConfirmed(
      buildSampleOrder({ id: 'order-formsubmit-fallback' }),
      { skipIfServerWebhookConfigured: true }
    );
    expect(fallbackRes.sent).toBe(true);
    const formSubmitCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).startsWith('https://formsubmit.co/ajax/')
    );
    expect(formSubmitCalls).toHaveLength(2);
  });
});

describe('api/_lib/sepayApi - Webhook Auth & Transaction Verification', () => {
  it('should strip Apikey or Bearer prefix cleanly', () => {
    expect(stripApiKeyPrefix('Apikey ABC_123 ')).toBe('ABC_123');
    expect(stripApiKeyPrefix('Bearer xyz789')).toBe('xyz789');
    expect(stripApiKeyPrefix('RAW_KEY')).toBe('RAW_KEY');
    expect(stripApiKeyPrefix(undefined)).toBe('');
  });

  it('should verify matching genuine SePay transaction by id and transferAmount', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          transactions: [
            {
              id: '101020099',
              amount_in: '22900.00',
              reference_number: 'FT26324692209912',
              transaction_content: 'BD BD202611207BCF6- Ma GD ACSP/ p6927718',
            },
          ],
        }),
    } as Response);

    const verified = await verifyWebhookTransactionWithSepayApi('SERVER_TOKEN', {
      id: 101020099,
      referenceCode: 'FT26324692209912',
      transferAmount: 22900,
    });
    expect(verified).toBe(true);
  });

  it('should reject forged webhook payload with mismatched amount or unknown id', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          transactions: [
            {
              id: '101020099',
              amount_in: '22900.00',
              reference_number: 'FT26324692209912',
            },
          ],
        }),
    } as Response);

    const forged = await verifyWebhookTransactionWithSepayApi('SERVER_TOKEN', {
      id: 101020099,
      referenceCode: 'FT26324692209912',
      transferAmount: 999999,
    });
    expect(forged).toBe(false);
  });

  it('should strip legacy DB API keys and email secrets from shop_settings records', () => {
    const cleanSepay = sanitizeSettingEntry('sepay', {
      enabled: true,
      api_key: 'SECRET_KEY',
      account_number: '0345553913',
    });
    expect(cleanSepay.hadSecrets).toBe(true);
    expect(cleanSepay.clean.api_key).toBeUndefined();
    expect(cleanSepay.clean.account_number).toBe('0345553913');

    const cleanEmail = sanitizeSettingEntry('email_notifications', {
      enabled: true,
      admin_email: 'admin@example.com',
      webhook_url: 'https://script.google.com/macros/s/secret/exec',
      emailjs_service_id: 'svc',
      emailjs_template_id: 'tpl',
      emailjs_public_key: 'pub',
      emailjs_private_key: 'priv',
    });
    expect(cleanEmail.hadSecrets).toBe(true);
    expect(cleanEmail.clean.webhook_url).toBeUndefined();
    expect(cleanEmail.clean.emailjs_public_key).toBeUndefined();
    expect(cleanEmail.clean.admin_email).toBe('admin@example.com');
  });
});
