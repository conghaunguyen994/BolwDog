import { describe, it, expect, vi, afterEach } from 'vitest';
import { sepayService } from '../services/sepayService';

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
