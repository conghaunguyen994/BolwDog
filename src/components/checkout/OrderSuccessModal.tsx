import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { QrCode, Copy, PackageCheck, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Order } from '../../types/order';
import { formatVND } from '../../utils/currency';

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onOpenQR: (mode?: 'deposit' | 'full') => void;
  initialPaymentMode?: 'deposit' | 'full';
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  isOpen,
  onClose,
  order,
  onOpenQR,
  initialPaymentMode = 'deposit',
}) => {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#F8DDE5', '#EAE3F8', '#F9E6D7', '#DF7B9A'],
      });
    }
  }, [isOpen]);

  const copyOrderRef = () => {
    navigator.clipboard.writeText(order.order_reference);
    alert(`Đã chép mã đơn hàng: ${order.order_reference}`);
  };

  const depositPercentage =
    order.total_amount > 0 ? Math.round((order.deposit_amount / order.total_amount) * 100) : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đơn Hàng Yêu Thương Đã Được Gửi!" maxWidth="md">
      <div className="text-center space-y-4 py-2">
        {/* Animated Celebration Icon */}
        <div className="w-16 h-16 rounded-full bg-cute-pink/50 dark:bg-cute-pink-dark/30 flex items-center justify-center mx-auto text-3xl animate-bounce-gentle">
          🐶
        </div>

        <div>
          <h4 className="text-lg font-bold text-cute-brown dark:text-cute-cream">
            Cảm ơn ba mẹ <span className="text-rose-500 font-extrabold">{order.customer_name}</span>!
          </h4>
          <p className="text-xs text-cute-brown-light dark:text-cute-muted mt-1">
            Đơn hàng đã được lưu trên hệ thống của Ú òa Shop.
          </p>
        </div>

        {/* Order Reference Box */}
        <div className="p-3.5 rounded-2xl bg-cute-cream dark:bg-cute-cream-dark border border-cute-border-light dark:border-cute-border-dark flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] text-cute-brown-light dark:text-cute-muted block uppercase font-bold tracking-wider">
              Mã đơn hàng:
            </span>
            <span className="text-sm font-extrabold text-cute-brown dark:text-cute-cream tracking-wide">
              {order.order_reference}
            </span>
          </div>
          <button
            onClick={copyOrderRef}
            className="p-2 rounded-xl bg-white dark:bg-cute-surface-dark border border-cute-border-light text-cute-brown hover:text-cute-pink-500 transition-colors"
            title="Sao chép mã"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Financial Summary */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 text-left space-y-1.5 border border-amber-200/60">
          <div className="flex justify-between">
            <span>Tổng giá trị đơn (100%):</span>
            <span className="font-black text-emerald-700 dark:text-emerald-300">
              {formatVND(order.total_amount)}
            </span>
          </div>
          <div className="flex justify-between font-bold text-rose-600 dark:text-rose-300">
            <span>Hoặc cọc trước làm mẫu ({depositPercentage}%):</span>
            <span>{formatVND(order.deposit_amount)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {initialPaymentMode === 'full' ? (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={() => onOpenQR('full')}
                className="w-full justify-center"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Mở QR Thanh Toán Đủ 100% ({formatVND(order.total_amount)})
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenQR('deposit')}
                className="w-full justify-center"
                leftIcon={<QrCode className="w-4 h-4" />}
              >
                Hoặc chỉ chuyển cọc {depositPercentage}% ({formatVND(order.deposit_amount)})
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={() => onOpenQR('deposit')}
                className="w-full justify-center"
                leftIcon={<QrCode className="w-4 h-4" />}
              >
                Mở QR Chuyển Khoản Cọc {depositPercentage}% ({formatVND(order.deposit_amount)})
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenQR('full')}
                className="w-full justify-center border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                leftIcon={<Sparkles className="w-4 h-4 text-emerald-600" />}
              >
                Hoặc Chuyển Khoản Đủ 100% ({formatVND(order.total_amount)}) — Không thu COD
              </Button>
            </>
          )}

          <Button
            variant="soft"
            size="sm"
            onClick={onClose}
            className="w-full justify-center"
            leftIcon={<PackageCheck className="w-4 h-4" />}
          >
            Xem trang theo dõi đơn hàng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
