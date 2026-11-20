import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Copy, Check, UploadCloud, ShieldCheck, ArrowRight, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Order } from '../../types/order';
import { ShopSettings } from '../../types/settings';
import { formatVND } from '../../utils/currency';
import { generateVietQrUrl } from '../../utils/qrGenerator';
import { orderService } from '../../services/orderService';
import { sepayService, playPaymentSuccessChime } from '../../services/sepayService';
import { supabase } from '../../services/supabase/client';

interface BankTransferQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  settings: ShopSettings;
  onProofUploaded?: () => void;
}

export const BankTransferQRModal: React.FC<BankTransferQRModalProps> = ({
  isOpen,
  onClose,
  order,
  settings,
  onProofUploaded,
}) => {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAutoPaid, setIsAutoPaid] = useState(
    order.payment_status === 'partially_paid' || order.payment_status === 'paid'
  );
  const notifiedRef = useRef(false);
  const checkingRef = useRef(false);

  const bank = settings.bank_transfer;
  const isSepayActive = settings.sepay?.enabled ?? true;
  const depositPercentage =
    order.total_amount > 0
      ? Math.round((order.deposit_amount / order.total_amount) * 100)
      : bank.deposit_percentage ?? 50;
  const qrUrl = generateVietQrUrl({
    bankConfig: bank,
    amount: order.deposit_amount,
    orderReference: order.order_reference,
  });

  const transferNote = `${bank.transfer_note_prefix || 'BD'} ${order.order_reference}`;

  // Đồng bộ trạng thái khi order prop thay đổi
  useEffect(() => {
    const alreadyPaid = order.payment_status === 'partially_paid' || order.payment_status === 'paid';
    setIsAutoPaid(alreadyPaid);
    notifiedRef.current = alreadyPaid;
  }, [order.id, order.payment_status]);

  // Lắng nghe biến động số dư Realtime & Tự động quét SePay mỗi 3 giây (không cần bấm nút)
  useEffect(() => {
    if (!isOpen || isAutoPaid || !order.id) return;

    const markPaidSuccess = () => {
      if (notifiedRef.current) return;
      notifiedRef.current = true;
      setIsAutoPaid(true);
      playPaymentSuccessChime();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      onProofUploaded?.();
    };

    const channel = supabase
      ? supabase
          .channel(`qr-listen-${order.id}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` },
            (payload: any) => {
              const newPaymentStatus = payload.new?.payment_status;
              if (newPaymentStatus === 'partially_paid' || newPaymentStatus === 'paid') {
                markPaidSuccess();
              }
            }
          )
          .subscribe()
      : null;

    let tickCount = 0;
    const runAutoCheck = async () => {
      if (checkingRef.current || notifiedRef.current) return;
      checkingRef.current = true;
      tickCount += 1;
      try {
        // Kiểm tra DB nhanh qua SECURITY DEFINER RPC
        const snapshot = await sepayService.getOrderPaymentStatus(
          order.order_reference,
          order.customer_phone
        );
        if (
          snapshot.found &&
          (snapshot.payment_status === 'partially_paid' || snapshot.payment_status === 'paid')
        ) {
          markPaidSuccess();
          return;
        }

        // Mỗi 6 giây (tick chẵn) chủ động quét SePay API dự phòng nếu webhook chưa tới
        if (tickCount % 2 === 0 && isSepayActive) {
          const sepayRes = await sepayService.checkTransactionForOrder(order, settings.sepay);
          if (sepayRes.found) {
            markPaidSuccess();
          }
        }
      } catch {
        // Bỏ qua lỗi mạng tạm thời, tiếp tục chu kỳ tiếp theo
      } finally {
        checkingRef.current = false;
      }
    };

    // Chạy kiểm tra lần đầu sau 2.5s và lặp lại mỗi 3 giây
    const firstTimeout = setTimeout(runAutoCheck, 2500);
    const interval = setInterval(runAutoCheck, 3000);

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
      checkingRef.current = false;
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [
    isOpen,
    isAutoPaid,
    isSepayActive,
    order,
    settings.sepay,
    onProofUploaded,
  ]);

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
      onProofUploaded?.();
    } catch (e) {
      console.error('Failed to submit proof', e);
    } finally {
      setIsSubmittingProof(false);
    }
  };

  // Nếu SePay đã xác nhận tự động thành công -> Hiển thị màn hình chúc mừng
  if (isAutoPaid) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Thanh Toán Cọc Thành Công!" maxWidth="md">
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto text-3xl animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs mb-2">
              <Zap className="w-3.5 h-3.5 fill-emerald-600" />
              Đã Nhận Chuyển Khoản Tự Động Qua SePay
            </span>
            <h4 className="text-lg font-black text-cute-brown dark:text-cute-cream">
              Cảm ơn ba mẹ <span className="text-rose-500 font-extrabold">{order.customer_name}</span>!
            </h4>
            <p className="text-xs text-cute-brown-light dark:text-cute-muted mt-1 leading-relaxed">
              Hệ thống SePay đã tự động xác nhận số tiền cọc <strong>{formatVND(order.deposit_amount)}</strong> cho đơn hàng <strong>{order.order_reference}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-xs text-purple-900 dark:text-purple-200 text-left space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>🎨 Bước tiếp theo của xưởng BolwDog:</span>
            </p>
            <p className="text-[11px] opacity-90 leading-relaxed">
              Nghệ nhân xưởng đang dựng file 3D cho bé. Ngay khi dựng xong, xưởng sẽ gửi ảnh Demo 3D vào trang Tra Cứu và Email để ba mẹ duyệt và bấm <strong>&ldquo;Chốt In&rdquo;</strong> nhé!
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={onClose}
              className="w-full justify-center"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Đến Trang Theo Dõi Đơn Hàng Ngay
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chuyển Khoản Đặt Cọc Yêu Thương" maxWidth="lg">
      <div className="space-y-4">
        
        {/* Banner Tự Động Nhận Diện SePay (Không cần bấm nút) */}
        {isSepayActive && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 dark:from-emerald-950/30 dark:to-sky-950/30 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-2.5">
              <span className="p-1.5 rounded-xl bg-emerald-500 text-white flex-shrink-0 animate-pulse mt-0.5 sm:mt-0">
                <Zap className="w-4 h-4" />
              </span>
              <div>
                <span className="font-black text-emerald-800 dark:text-emerald-300 block">
                  Cổng Thanh Toán Tự Động SePay 24/7 Đang Trực
                </span>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 opacity-90">
                  Quét mã QR và giữ nguyên nội dung chuyển khoản. Sau khi chuyển xong, hệ thống <strong>tự động kiểm tra và báo thành công ngay</strong> (không cần bấm nút hay chụp ảnh)!
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
              <span>Đang tự động chờ tiền vào...</span>
            </div>
          </div>
        )}

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
              <span className="text-cute-brown-light dark:text-cute-muted block">Số tiền cọc làm mẫu ({depositPercentage}%):</span>
              <span className="text-lg font-black text-rose-500 font-sans">
                {formatVND(order.deposit_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Upload Proof Slip (Dự phòng nếu chuyển từ cây ATM hoặc sai cú pháp) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark space-y-2.5">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-cute-brown dark:text-cute-cream flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-cute-pink-400" />
              <span>Dự phòng: Gửi ảnh biên lai (nếu ba mẹ chuyển nhầm cú pháp hoặc chuyển từ quầy ATM)</span>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <span className="text-[11px] text-cute-brown-light dark:text-cute-muted text-center sm:text-left">
            💡 Sau khi chuyển khoản, ba mẹ có thể theo dõi tiến độ duyệt mẫu 3D và giao hàng bất kỳ lúc nào.
          </span>
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            className="w-full sm:w-auto flex-shrink-0"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Đã hoàn tất chuyển khoản
          </Button>
        </div>
      </div>
    </Modal>
  );
};

