import { describe, it, expect } from 'vitest';
import { checkoutSchema } from '../schemas/checkoutSchema';

describe('Security & Input Validation: Checkout Schema', () => {
  it('should accept valid Vietnamese phone numbers and customer details', () => {
    const validData = {
      fullName: 'Trần Thị Mai',
      phoneNumber: '0987654321',
      address: '123 Đường Hoa Hồng, Phường 2, Quận Phú Nhuận, TP.HCM',
      email: 'khachhang@gmail.com',
      notes: 'Giao giờ hành chính',
    };

    const result = checkoutSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should accept valid order without optional email or notes', () => {
    const validData = {
      fullName: 'Lê Hoàng Nam',
      phoneNumber: '0388776655',
      address: 'Số 45 Lê Lợi, Quận 1, TP.HCM',
      email: '',
      notes: '',
    };

    const result = checkoutSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid phone numbers (fraud / garbage input)', () => {
    const invalidPhones = [
      '123456',
      '0123456789', // Invalid prefix
      '098765432', // Too short (9 digits)
      '09876543210', // Too long (11 digits)
      'abcdefghij',
      '<script>alert(1)</script>',
    ];

    invalidPhones.forEach((phone) => {
      const result = checkoutSchema.safeParse({
        fullName: 'Khách Test',
        phoneNumber: phone,
        address: 'Địa chỉ mẫu đầy đủ 123',
      });
      expect(result.success).toBe(false);
    });
  });

  it('should reject too short or empty name/address', () => {
    const invalidData = {
      fullName: 'A', // too short (< 2)
      phoneNumber: '0912345678',
      address: '12', // too short (< 5)
    };

    const result = checkoutSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject malformed email when provided', () => {
    const invalidData = {
      fullName: 'Nguyễn Văn A',
      phoneNumber: '0912345678',
      address: '123 Đường Lê Lợi, TP.HCM',
      email: 'not-an-email',
    };

    const result = checkoutSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

