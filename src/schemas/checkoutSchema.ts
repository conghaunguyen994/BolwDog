import { z } from 'zod';
import { containsXssPayload } from '../utils/securityGuard';

// Vietnamese phone validation regex: starts with 03, 05, 07, 08, 09, followed by 8 digits
const vietnamesePhoneRegex = /^(0|84)(3|5|7|8|9)[0-9]{8}$/;

export const checkoutSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Vui lòng nhập họ và tên của ba mẹ (tối thiểu 2 ký tự)')
    .max(100, 'Họ và tên không được vượt quá 100 ký tự')
    .refine((val) => !containsXssPayload(val), 'Họ và tên chứa ký tự không hợp lệ (XSS bị chặn)'),
  phoneNumber: z
    .string()
    .trim()
    .regex(vietnamesePhoneRegex, 'Số điện thoại không hợp lệ (Ví dụ: 0987654321)'),
  address: z
    .string()
    .trim()
    .min(5, 'Vui lòng nhập địa chỉ nhận hàng chi tiết để shipper giao tận tay')
    .max(255, 'Địa chỉ không được vượt quá 255 ký tự')
    .refine((val) => !containsXssPayload(val), 'Địa chỉ chứa ký tự hoặc mã lệnh không hợp lệ'),
  email: z
    .string()
    .trim()
    .email('Địa chỉ email không hợp lệ')
    .max(120, 'Email không được vượt quá 120 ký tự')
    .refine((val) => !containsXssPayload(val), 'Email chứa ký tự không hợp lệ')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(500, 'Ghi chú không được dài quá 500 ký tự')
    .refine((val) => !containsXssPayload(val), 'Ghi chú chứa mã lệnh không hợp lệ (XSS bị chặn)')
    .optional()
    .or(z.literal('')),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

