import { BankTransferConfig } from '../types/settings';

export function generateVietQrUrl(params: {
  bankConfig: BankTransferConfig;
  amount: number;
  orderReference: string;
}): string {
  const { bankConfig, amount, orderReference } = params;

  if (bankConfig.qr_custom_image) {
    return bankConfig.qr_custom_image;
  }

  const bankCode = encodeURIComponent(bankConfig.bank_code || 'VCB');
  const accountNo = encodeURIComponent(bankConfig.account_number);
  const template = bankConfig.qr_template || 'compact2';
  const transferNote = encodeURIComponent(`${bankConfig.transfer_note_prefix || 'BD'} ${orderReference}`);
  const accountName = encodeURIComponent(bankConfig.account_holder);

  return `https://img.vietqr.io/image/${bankCode}-${accountNo}-${template}.png?amount=${Math.round(amount)}&addInfo=${transferNote}&accountName=${accountName}`;
}

