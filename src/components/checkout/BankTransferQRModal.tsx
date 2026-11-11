import React, { useState } from 'react';
import { Copy, Check, UploadCloud, AlertCircle, ShieldCheck, Heart } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Order } from '../../types/order';
import { ShopSettings } from '../../types/settings';
import { formatVND } from '../../utils/currency';
import { generateVietQrUrl } from '../../utils/qrGenerator';
import { orderService } from '../../services/orderService';

interface BankTransferQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  settings: ShopSettings;
}

export const BankTransferQRModal: React.FC<BankTransferQRModalProps> = ({
  isOpen,
  onClose,
  order,
  settings,
}) => {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const bank = settings.bank_transfer;
  const qrUrl = generateVietQrUrl({
    bankConfig: bank,
    amount: order.deposit_amount,
    orderReference: order.order_reference,
  });

  const transferNote = `${bank.transfer_note_prefix || 'BD'} ${order.order_reference}`;

  const copyToClipboard = (text: string, type: 'account' | 'note') => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else {
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2000);
    }
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
    }
  };

  const handleSubmitProof = async () => {
    if (!previewImage) return;
    setIsSubmittingProof(true);
    try {
      await orderService.submitPaymentProof(order.id, previewImage, order.deposit_amount);
      setProofUploaded(true);
    } catch (e) {
      console.error('Failed to submit proof', e);
    } finally {
      setIsSubmittingProof(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chuyển Khoản Đặt Cọc Yêu Thương" maxWidth="lg">
      <div className="space-y-5">
        
        {/* Security / Anti-fake warning alert */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex gap-2.5 items-start">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Lưu ý bảo mật:</strong> Đơn hàng sẽ ở trạng thái <em>"Chờ xác nhận đặt cọc"</em> cho tới khi quản trị viên của BolwDog đối soát sao kê ngân hàng. Không tự động chuyển trạng thái đơn hàng khi chưa được duyệt thủ công.
          </p>
        </div>

        {/* QR Code and Bank Details Grid */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-3xl bg-cute-cream/60 dark:bg-cute-cream-dark/60 border border-cute-border-light dark:border-cute-border-dark">
          {/* QR Display */}
          <div className="flex flex-col items-center">
            <div className="p-2.5 bg-white rounded-2xl shadow-cute border border-cute-pink/50">
              <img
                src={qrUrl}
                alt="VietQR Mã Chuyển Khoản"
                className="w-44 h-44 object-contain rounded-xl"
              />
            </div>
            <span className="text-[11px] text-cute-brown-light dark:text-cute-muted mt-2 font-medium">
              Quét bằng ứng dụng ngân hàng bất kỳ
            </span>
          </div>

          {/* Bank Text Information */}
          <div className="flex-1 w-full space-y-2.5 text-xs">
            <div>
              <span className="text-cute-brown-light dark:text-cute-muted block">Ngân hàng thụ hưởng:</span>
              <span className="font-bold text-cute-brown dark:text-cute-cream text-sm">
                {bank.bank_name}
              </span>
            </div>

            <div>
              <span className="text-cute-brown-light dark:text-cute-muted block">Chủ tài khoản:</span>
              <span className="font-bold text-cute-brown dark:text-cute-cream text-sm uppercase">
                {bank.account_holder}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark">
              <div>
                <span className="text-[10px] text-cute-brown-light dark:text-cute-muted block">Số tài khoản:</span>
                <span className="font-extrabold text-sm text-cute-brown dark:text-cute-cream tracking-wider">
                  {bank.account_number}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(bank.account_number, 'account')}
                className="flex items-center gap-1 text-[11px] font-semibold text-cute-pink-500 bg-cute-pink/20 hover:bg-cute-pink/40 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAccount ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark">
              <div>
                <span className="text-[10px] text-cute-brown-light dark:text-cute-muted block">Nội dung chuyển khoản (bắt buộc):</span>
                <span className="font-extrabold text-xs text-rose-500 tracking-wider">
                  {transferNote}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(transferNote, 'note')}
                className="flex items-center gap-1 text-[11px] font-semibold text-cute-pink-500 bg-cute-pink/20 hover:bg-cute-pink/40 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {copiedNote ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNote ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            <div className="pt-1">
              <span className="text-cute-brown-light dark:text-cute-muted block">Số tiền cọc làm mẫu (50%):</span>
              <span className="text-lg font-black text-rose-500 font-sans">
                {formatVND(order.deposit_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Upload Proof Slip */}
        <div className="p-4 rounded-2xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-cute-brown dark:text-cute-cream flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-cute-pink-400" />
              <span>Tải ảnh biên lai / sao kê chuyển tiền (để shop duyệt nhanh hơn)</span>
            </h5>
          </div>

          {!proofUploaded ? (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cute-cream dark:bg-cute-cream-dark border border-cute-border-light text-xs font-semibold text-cute-brown dark:text-cute-cream hover:bg-cute-pink/30 transition-colors">
                <span>Chọn ảnh hóa đơn</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProofChange}
                  className="hidden"
                />
              </label>

              {previewImage && (
                <div className="flex items-center gap-3">
                  <img
                    src={previewImage}
                    alt="Proof Preview"
                    className="w-12 h-12 object-cover rounded-xl border border-cute-pink"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitProof}
                    isLoading={isSubmittingProof}
                  >
                    Gửi ảnh biên lai
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Đã nhận hình ảnh biên lai của bạn! Shop sẽ kiểm tra và xác nhận đơn hàng sớm nhất.</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <Button variant="secondary" size="md" onClick={onClose}>
            Đã hoàn tất chuyển khoản
          </Button>
        </div>
      </div>
    </Modal>
  );
};

