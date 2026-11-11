import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, QrCode, Copy, ArrowRight, PackageCheck } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Order } from '../../types/order';
import { formatVND } from '../../utils/currency';
import { useNavigate } from 'react-router-dom';

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onOpenQR: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  isOpen,
  onClose,
  order,
  onOpenQR,
}) => {
  const navigate = useNavigate();

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
            Đơn hàng đã được lưu trên hệ thống của tiệm BolwDog.
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
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 text-left space-y-1 border border-amber-200/60">
          <div className="flex justify-between">
            <span>Tổng giá trị đơn:</span>
            <span className="font-bold">{formatVND(order.total_amount)}</span>
          </div>
          <div className="flex justify-between font-bold text-rose-600 dark:text-rose-300">
            <span>Cần cọc trước (50%):</span>
            <span>{formatVND(order.deposit_amount)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={onOpenQR}
            className="w-full justify-center"
            leftIcon={<QrCode className="w-4 h-4" />}
          >
            Xem mã QR chuyển khoản đặt cọc
          </Button>

          <Button
            variant="soft"
            size="sm"
            onClick={() => {
              onClose();
              navigate(`/track?ref=${encodeURIComponent(order.order_reference)}&phone=${encodeURIComponent(order.customer_phone)}`);
            }}
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

