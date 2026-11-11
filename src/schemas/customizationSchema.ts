import { z } from 'zod';

export const petCustomizationSchema = z.object({
  petName: z
    .string()
    .max(30, 'Tên bé tối đa 30 ký tự để in lên sản phẩm vừa đẹp nhất')
    .optional(),
  petAge: z
    .string()
    .max(20, 'Tuổi của bé tối đa 20 ký tự')
    .optional(),
  petBirthday: z
    .string()
    .optional(),
  petPhotoUrl: z
    .string()
    .optional(),
  customNotes: z
    .string()
    .max(300, 'Ghi chú tối đa 300 ký tự')
    .optional(),
  keychainColor: z
    .string()
    .optional(),
  keychainDesign: z
    .string()
    .optional(),
  customText: z
    .string()
    .max(20, 'Nội dung khắc tối đa 20 ký tự')
    .optional(),
  phoneOnTag: z
    .string()
    .optional(),
});

