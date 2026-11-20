import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Copy,
  Check,
  UploadCloud,
  ShieldCheck,
  ArrowRight,
  Zap,
  CheckCircle2,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Order, PaymentStatus } from '../../types/order';
import { ShopSettings } from '../../types/settings';
import { formatVND } from '../../utils/currency';
import { generateVietQrUrl } from '../../utils/qrGenerator';
import { orderService } from '../../services/orderService';
import { sepayService, playPaymentSuccessChime } from '../../services/sepayService';
import { emailService } from '../../services/emailService';
import { supabase } from '../../services/supabase/client';

interface BankTransferQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  settings: ShopSettings;
  initialPaymentMode?: 'deposit' | 'full';
  onProofUploaded?: (confirmedPaymentStatus?: PaymentStatus, paidAmount?: number) => void;
}

export const BankTransferQRModal: React.FC<BankTransferQRModalProps> = ({
  isOpen,
  onClose,
  order,
  settings,
  initialPaymentMode = 'deposit',
  onProofUploaded,
}) => {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'deposit' | 'full'>(initialPaymentMode);

  // Nếu đơn đã thanh toán đủ 100% từ trước thì hiển thị ngay màn hình thành công.
  // Nếu đơn mới đặt cọc (partially_paid) nhưng khách chủ động bấm mở QR để thanh toán nốt phần còn lại,
  // cho phép hiển thị mã QR phần còn lại và chờ chuyển sang 'paid'.
  const [isAutoPaid, setIsAutoPaid] = useState(order.payment_status === 'paid');
  const [confirmedStatus, setConfirmedStatus] = useState<PaymentStatus>(order.payment_status);
  const [confirmedAmount, setConfirmedAmount] = useState<number>(
    order.payment_status === 'paid' ? order.total_amount : order.deposit_amount
  );

  const notifiedRef = useRef(false);
  const checkingRef = useRef(false);

  const bank = settings.bank_transfer;
  const isSepayActive = settings.sepay?.enabled ?? true;
  const depositPercentage =
    order.total_amount > 0
      ? Math.round((order.deposit_amount / order.total_amount) * 100)
      : bank.deposit_percentage ?? 50;

  const isPayingRemainingAfterDeposit = order.payment_status === 'partially_paid';
  const remainingAfterDeposit = Math.max(0, order.total_amount - order.deposit_amount);

  const qrAmount = isPayingRemainingAfterDeposit
    ? remainingAfterDeposit || order.total_amount
    : paymentMode === 'full'
      ? order.total_amount
      : order.deposit_amount;

  const qrUrl = generateVietQrUrl({
    bankConfig: bank,
    amount: qrAmount,
    orderReference: order.order_reference,
  });

  const transferNote = `${bank.transfer_note_prefix || 'BD'} ${order.order_reference}`;

  useEffect(() => {
    setPaymentMode(isPayingRemainingAfterDeposit ? 'full' : initialPaymentMode);
  }, [initialPaymentMode, isPayingRemainingAfterDeposit, isOpen]);

  // Đồng bộ trạng thái khi order prop hoặc modal mở lại
  useEffect(() => {
    if (!isOpen) return;
    const alreadyFullyPaid = order.payment_status === 'paid';
    setIsAutoPaid(alreadyFullyPaid);
    setConfirmedStatus(order.payment_status);
    setConfirmedAmount(
      alreadyFullyPaid ? order.total_amount : qrAmount
    );
    notifiedRef.current = alreadyFullyPaid;
  }, [order.id, order.payment_status, isOpen]);

  // Lắng nghe biến động số dư Realtime & Tự động quét SePay mỗi 3 giây
  useEffect(() => {
    if (!isOpen || isAutoPaid || !order.id) return;

    const shouldAcceptStatus = (newStatus?: string, amount?: number): boolean => {
      if (isPayingRemainingAfterDeposit) {
        // Khi khách đang cọc rồi và mở QR để chuyển nốt 100%, chỉ báo thành công khi lên 'paid'
        return newStatus === 'paid' || Number(amount || 0) >= remainingAfterDeposit * 0.95;
      }
      if (paymentMode === 'full') {
        return newStatus === 'paid' || newStatus === 'partially_paid';
      }
      return newStatus === 'partially_paid' || newStatus === 'paid';
    };

    const markPaidSuccess = (paidInfo?: {
      status?: PaymentStatus;
      amount?: number;
      viaServerDb?: boolean;
      emailSent?: boolean;
      gateway?: string;
    }) => {
      if (notifiedRef.current) return;
      notifiedRef.current = true;

      const resolvedAmount =
        paidInfo?.amount ||
        (paidInfo?.status === 'paid' || paymentMode === 'full'
          ? order.total_amount
          : order.deposit_amount);
      const resolvedStatus: PaymentStatus =
        paidInfo?.status === 'paid' || resolvedAmount >= order.total_amount * 0.98
          ? 'paid'
          : 'partially_paid';

      setConfirmedStatus(resolvedStatus);
      setConfirmedAmount(resolvedStatus === 'paid' ? order.total_amount : resolvedAmount);
      setIsAutoPaid(true);
      playPaymentSuccessChime();
      confetti({ particleCount: 130, spread: 85, origin: { y: 0.6 } });

      if (!paidInfo?.emailSent) {
        emailService
          .notifyDepositConfirmed(
            { ...order, payment_status: resolvedStatus },
            {
              paidAmount: resolvedStatus === 'paid' ? order.total_amount : resolvedAmount,
              gateway: paidInfo?.gateway || 'MB Bank / SePay',
              skipIfServerWebhookConfigured: Boolean(paidInfo?.viaServerDb),
            }
          )
          .catch(() => {});
      }
      onProofUploaded?.(resolvedStatus, resolvedAmount);
    };

    const channel = supabase
      ? supabase
          .channel(`qr-listen-${order.id}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` },
            (payload: any) => {
              const newPaymentStatus = payload.new?.payment_status as PaymentStatus | undefined;
              if (shouldAcceptStatus(newPaymentStatus)) {
                markPaidSuccess({
                  status: newPaymentStatus,
                  amount:
                    newPaymentStatus === 'paid' ? order.total_amount : order.deposit_amount,
                  viaServerDb: true,
                });
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
        const snapshot = await sepayService.getOrderPaymentStatus(
          order.order_reference,
          order.customer_phone
        );
        if (snapshot.found && shouldAcceptStatus(snapshot.payment_status, snapshot.paid_amount)) {
          markPaidSuccess({
            status: snapshot.payment_status,
            amount:
              snapshot.payment_status === 'paid'
                ? snapshot.total_amount || order.total_amount
                : snapshot.paid_amount || snapshot.deposit_amount || order.deposit_amount,
            viaServerDb: true,
          });
          return;
        }

        // Mỗi 6 giây (tick chẵn) chủ động quét SePay API dự phòng qua /api/check-sepay
        if (tickCount % 2 === 0 && isSepayActive) {
          const sepayRes = await sepayService.checkTransactionForOrder(order);
          if (sepayRes.found && shouldAcceptStatus(sepayRes.payment_status, sepayRes.amount)) {
            markPaidSuccess({
              status: sepayRes.payment_status,
              amount: sepayRes.amount,
              emailSent: sepayRes.emailSent,
              viaServerDb: sepayRes.fromDatabase,
              gateway: sepayRes.gateway,
            });
          }
        }
      } catch {
        // Bỏ qua lỗi mạng tạm thời, tiếp tục chu kỳ tiếp theo
      } finally {
        checkingRef.current = false;
      }
    };

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
    isPayingRemainingAfterDeposit,
    remainingAfterDeposit,
    paymentMode,
    order,
    settings.sepay,
    onProofUploaded,
  ]);

  const copyToClipboard = (text: string, type: 'account' | 'note' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else if (type === 'note') {
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
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
      await orderService.submitPaymentProof(order.id, previewImage, qrAmount);
      setProofUploaded(true);
      const nextStatus: PaymentStatus =
        qrAmount >= order.total_amount * 0.98 || isPayingRemainingAfterDeposit
          ? 'paid'
          : 'partially_paid';
      onProofUploaded?.(nextStatus, qrAmount);
    } catch (e) {
      console.error('Failed to submit proof', e);
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const isFullyPaidConfirmed = confirmedStatus === 'paid';

  // Nếu SePay đã xác nhận tự động thành công -> Hiển thị màn hình chúc mừng
  if (isAutoPaid) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          isFullyPaidConfirmed
            ? '🎉 Thanh Toán Toàn Bộ 100% Đơn Hàng Thành Công!'
            : 'Thanh Toán Đặt Cọc Thành Công!'
        }
        maxWidth="md"
      >
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto text-3xl animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs mb-2">
              <Zap className="w-3.5 h-3.5 fill-emerald-600" />
              {isFullyPaidConfirmed
                ? 'ĐÃ THANH TOÁN ĐỦ 100% — CHỈ CHỜ NHẬN ĐƠN (0đ COD)'
                : 'Đã Nhận Chuyển Khoản Tự Động Qua SePay'}
            </span>
            <h4 className="text-lg font-black text-cute-brown dark:text-cute-cream">
              Cảm ơn ba mẹ <span className="text-rose-500 font-extrabold">{order.customer_name}</span>!
            </h4>
            {isFullyPaidConfirmed ? (
              <p className="text-xs text-cute-brown-light dark:text-cute-muted mt-1 leading-relaxed">
                Hệ thống SePay đã tự động xác nhận thanh toán đủ 100% (
                <strong className="text-emerald-700">{formatVND(order.total_amount)}</strong>) cho đơn hàng{' '}
                <strong>{order.order_reference}</strong>. Đơn hàng của ba mẹ đã hoàn tất thanh toán toàn bộ — khi giao tới nơi ba mẹ{' '}
                <strong className="text-rose-500">không cần thanh toán thêm (0 ₫ COD)</strong>, chỉ chờ nhận đơn tại nhà!
              </p>
            ) : (
              <p className="text-xs text-cute-brown-light dark:text-cute-muted mt-1 leading-relaxed">
                Hệ thống SePay đã tự động xác nhận số tiền cọc{' '}
                <strong>{formatVND(confirmedAmount || order.deposit_amount)}</strong> cho đơn hàng{' '}
                <strong>{order.order_reference}</strong>. Số tiền còn lại khi nhận hàng (COD):{' '}
                <strong>{formatVND(Math.max(0, order.total_amount - (confirmedAmount || order.deposit_amount)))}</strong>.
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-xs text-purple-900 dark:text-purple-200 text-left space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>🎨 Bước tiếp theo của xưởng BolwDog:</span>
            </p>
            <p className="text-[11px] opacity-90 leading-relaxed">
              Nghệ nhân xưởng đang dựng file 3D cho bé. Ngay khi dựng xong, xưởng sẽ gửi ảnh Demo 3D vào trang Tra Cứu và Email để ba mẹ duyệt và bấm <strong>&ldquo;Chốt In&rdquo;</strong> rồi giao thẳng về nhà cho bé nhé!
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isPayingRemainingAfterDeposit
          ? 'Chuyển Khoản Thanh Toán Nốt 100% Đơn Hàng'
          : paymentMode === 'full'
            ? 'Chuyển Khoản Đủ 100% Toàn Bộ Đơn (Không Thu COD)'
            : 'Chuyển Khoản Đặt Cọc Yêu Thương'
      }
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Bộ chọn chế độ chuyển khoản: Đặt cọc vs Thanh toán 100% toàn bộ */}
        {!isPayingRemainingAfterDeposit && order.deposit_amount < order.total_amount && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-1.5 rounded-2xl bg-cute-cream dark:bg-cute-cream-dark border border-cute-border-light dark:border-cute-border-dark">
            <button
              type="button"
              onClick={() => setPaymentMode('deposit')}
              className={`p-3 rounded-xl text-left transition-all border flex items-center justify-between ${
                paymentMode === 'deposit'
                  ? 'bg-white dark:bg-cute-surface-dark border-rose-400 shadow-sm ring-1 ring-rose-300'
                  : 'border-transparent opacity-75 hover:opacity-100'
              }`}
            >
              <div>
                <span className="text-xs font-black text-cute-brown dark:text-cute-cream flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-rose-500" />
                  <span>Đặt cọc làm mẫu ({depositPercentage}%)</span>
                </span>
                <span className="text-[10px] text-cute-brown-light dark:text-cute-muted block mt-0.5">
                  Còn lại {formatVND(Math.max(0, order.total_amount - order.deposit_amount))} trả COD
                </span>
              </div>
              <span className="text-sm font-black text-rose-500">
                {formatVND(order.deposit_amount)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('full')}
              className={`p-3 rounded-xl text-left transition-all border flex items-center justify-between ${
                paymentMode === 'full'
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-500 shadow-sm ring-1 ring-emerald-400'
                  : 'border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chuyển đủ 100% toàn bộ</span>
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-0.5">
                  Thanh toán xong chỉ chờ nhận đơn (0đ COD)
                </span>
              </div>
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                {formatVND(order.total_amount)}
              </span>
            </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-cute-brown-light dark:text-cute-muted block">Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-cute-brown dark:text-cute-cream text-xs sm:text-sm">
                  {bank.bank_name}
                </span>
              </div>

              <div>
                <span className="text-cute-brown-light dark:text-cute-muted block">Chủ tài khoản:</span>
                <span className="font-bold text-cute-brown dark:text-cute-cream text-xs sm:text-sm uppercase">
                  {bank.account_holder}
                </span>
              </div>
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

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-cute-surface-dark border-2 border-rose-200 dark:border-rose-800">
              <div>
                <span className="text-[10px] text-cute-brown-light dark:text-cute-muted block">
                  {isPayingRemainingAfterDeposit
                    ? 'Số tiền còn lại để hoàn tất 100% đơn:'
                    : paymentMode === 'full'
                      ? 'Số tiền thanh toán đủ 100% toàn bộ đơn (0đ COD):'
                      : `Số tiền đặt cọc làm mẫu (${depositPercentage}%):`}
                </span>
                <span
                  className={`text-lg font-black font-sans ${
                    paymentMode === 'full' || isPayingRemainingAfterDeposit
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-500'
                  }`}
                >
                  {formatVND(qrAmount)}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(String(qrAmount), 'amount')}
                className="flex items-center gap-1 text-[11px] font-semibold text-cute-pink-500 bg-cute-pink/20 hover:bg-cute-pink/40 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAmount ? 'Đã chép' : 'Chép số tiền'}</span>
              </button>
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
