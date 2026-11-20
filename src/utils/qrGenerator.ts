import { BankTransferConfig } from '../types/settings';

/**
 * KHÓA CỨNG TÀI KHOẢN NGÂN HÀNG CHÍNH CHỦ (IMMUTABLE ALLOWLIST)
 * Chống tuyệt đối tấn công sửa Database / MITM / XSS thay thế STK hoặc ảnh QR giả mạo.
 * Nếu chủ tiệm cần đổi STK trong tương lai, bắt buộc cập nhật trực tiếp tại đây và deploy lại.
 */
export const VERIFIED_OFFICIAL_BANK = Object.freeze({
  bank_code: 'MB',
  bank_name: 'Ngân hàng TMCP Quân Đội (MB Bank)',
  account_number: '0345553913',
  account_holder: 'NGUYEN CONG HAU',
  qr_template: 'compact2',
});

const ALLOWED_QR_TEMPLATES = new Set(['compact', 'compact2', 'qr_only', 'print']);

/**
 * Chuẩn hóa & khóa chặt thông tin ngân hàng thụ hưởng về đúng tài khoản chính chủ.
 * Tuyệt đối loại bỏ `qr_custom_image` để không ai có thể chèn ảnh QR lạ từ bên ngoài.
 */
export function getVerifiedBankConfig(bankConfig?: Partial<BankTransferConfig> | null): BankTransferConfig {
  const safeDeposit =
    typeof bankConfig?.deposit_percentage === 'number' && Number.isFinite(bankConfig.deposit_percentage)
      ? Math.min(100, Math.max(0, bankConfig.deposit_percentage))
      : 50;

  const rawTemplate = String(bankConfig?.qr_template || VERIFIED_OFFICIAL_BANK.qr_template).trim();
  const safeTemplate = ALLOWED_QR_TEMPLATES.has(rawTemplate)
    ? rawTemplate
    : VERIFIED_OFFICIAL_BANK.qr_template;

  const rawPrefix = String(bankConfig?.transfer_note_prefix || 'BD')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8);

  return Object.freeze({
    bank_name: VERIFIED_OFFICIAL_BANK.bank_name,
    bank_code: VERIFIED_OFFICIAL_BANK.bank_code,
    account_number: VERIFIED_OFFICIAL_BANK.account_number,
    account_holder: VERIFIED_OFFICIAL_BANK.account_holder,
    deposit_percentage: safeDeposit,
    qr_template: safeTemplate,
    transfer_note_prefix: rawPrefix || 'BD',
    qr_custom_image: undefined,
  });
}

/**
 * Kiểm tra một URL ảnh QR có đúng là URL VietQR chính chủ của Bâu Shop hay không.
 */
export function isTrustedVietQrUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const expectedPrefix = `https://img.vietqr.io/image/${VERIFIED_OFFICIAL_BANK.bank_code}-${VERIFIED_OFFICIAL_BANK.account_number}-`;
  return url.startsWith(expectedPrefix);
}

export function generateVietQrUrl(params: {
  bankConfig: BankTransferConfig;
  amount: number;
  orderReference: string;
}): string {
  const { bankConfig, amount, orderReference } = params;
  const verifiedBank = getVerifiedBankConfig(bankConfig);

  const bankCode = encodeURIComponent(verifiedBank.bank_code);
  const accountNo = encodeURIComponent(verifiedBank.account_number);
  const template = encodeURIComponent(verifiedBank.qr_template);
  const safeAmount = Math.max(0, Math.round(Number(amount) || 0));
  const safeRef = String(orderReference || '')
    .replace(/[^A-Za-z0-9\-_ ]/g, '')
    .trim();
  const transferNote = encodeURIComponent(`${verifiedBank.transfer_note_prefix} ${safeRef}`);
  const accountName = encodeURIComponent(verifiedBank.account_holder);

  const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-${template}.png?amount=${safeAmount}&addInfo=${transferNote}&accountName=${accountName}`;

  if (!isTrustedVietQrUrl(qrUrl)) {
    throw new Error('Phát hiện URL mã QR không khớp với tài khoản chính chủ.');
  }

  return qrUrl;
}
