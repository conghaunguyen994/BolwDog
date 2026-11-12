import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ShieldCheck,
  Truck,
  Heart,
  QrCode,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { clearCart } from '../../features/cart/cartSlice';
import { checkoutSchema, CheckoutFormData } from '../../schemas/checkoutSchema';
import { orderService } from '../../services/orderService';
import { settingsService } from '../../services/settingsService';
import { Order } from '../../types/order';
import { ShopSettings } from '../../types/settings';
import { defaultShopSettings as initialSettings } from '../../constants/defaultSettings';
import { formatVND } from '../../utils/currency';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { BankTransferQRModal } from '../../components/checkout/BankTransferQRModal';
import { OrderSuccessModal } from '../../components/checkout/OrderSuccessModal';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, subtotal, shippingFee, total, depositAmount } = useAppSelector(
    (state) => state.cart
  );

  const [settings, setSettings] = useState<ShopSettings>(initialSettings);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    settingsService.getSettings().then(setSettings).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      address: '',
      email: '',
      notes: '',
    },
  });

  // Redirect if cart is empty and no order is being processed
  useEffect(() => {
    if (items.length === 0 && !createdOrder) {
      navigate('/cart');
    }
  }, [items, createdOrder, navigate]);

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const order = await orderService.createOrder({
        customerName: data.fullName,
        customerPhone: data.phoneNumber,
        customerEmail: data.email || undefined,
        shippingAddress: data.address,
        notes: data.notes || undefined,
        items: items.map((it) => ({
          productId: it.product.id,
          productName: it.product.name,
          variantId: it.selectedVariant?.id,
          variantName: it.selectedVariant?.variant_name,
          variantValue: it.selectedVariant?.variant_value,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          customization: it.customization,
          imageUrl: it.product.images[0]?.image_url,
        })),
      });

      setCreatedOrder(order);
      dispatch(clearCart());
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setSubmitError(err.message || 'Có lỗi xảy ra khi tạo đơn hàng. Ba mẹ vui lòng thử lại nhé!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Title */}
      <div>
        <Badge variant="pink" size="sm">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>Đặt hàng nhanh không cần tài khoản</span>
        </Badge>
        <h1 className="text-2xl sm:text-4xl font-black text-cute-brown dark:text-cute-cream font-sans mt-1">
          Hoàn tất đơn yêu thương
        </h1>
        <p className="text-xs sm:text-sm text-cute-brown-light dark:text-cute-muted">
          Điền thông tin nhận hàng của ba mẹ để xưởng bắt đầu chuẩn bị mẫu in 3D cho bé
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Guest Delivery Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="cute-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-cute-border-light dark:border-cute-border-dark">
              <h2 className="text-base sm:text-lg font-bold text-cute-brown dark:text-cute-cream flex items-center gap-2">
                <span>📍</span> Thông tin người nhận hàng
              </h2>
              <span className="text-[11px] text-cute-pink-500 font-bold bg-cute-pink/30 px-3 py-1 rounded-full">
                Mua hàng ẩn danh (Guest Checkout)
              </span>
            </div>

            {submitError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-cute-brown dark:text-cute-cream">
                  Họ và tên ba mẹ *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  {...register('fullName')}
                  className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 ${
                    errors.fullName ? 'border-rose-400 focus:ring-rose-200' : 'border-cute-border-light dark:border-cute-border-dark focus:ring-cute-pink-300'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-[11px] text-rose-500">{errors.fullName.message}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-cute-brown dark:text-cute-cream">
                  Số điện thoại nhận hàng *
                </label>
                <input
                  type="tel"
                  placeholder="Ví dụ: 0987654321"
                  {...register('phoneNumber')}
                  className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 ${
                    errors.phoneNumber ? 'border-rose-400 focus:ring-rose-200' : 'border-cute-border-light dark:border-cute-border-dark focus:ring-cute-pink-300'
                  }`}
                />
                {errors.phoneNumber && (
                  <p className="text-[11px] text-rose-500">{errors.phoneNumber.message}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-cute-brown dark:text-cute-cream">
                Địa chỉ giao hàng chi tiết (Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP) *
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh"
                {...register('address')}
                className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 ${
                  errors.address ? 'border-rose-400 focus:ring-rose-200' : 'border-cute-border-light dark:border-cute-border-dark focus:ring-cute-pink-300'
                }`}
              />
              {errors.address && (
                <p className="text-[11px] text-rose-500">{errors.address.message}</p>
              )}
            </div>

            {/* Optional Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-cute-brown dark:text-cute-cream flex items-center justify-between">
                <span>Email nhận thông báo tiến độ đơn hàng (không bắt buộc)</span>
                <span className="text-[10px] text-cute-brown-light font-normal">Tùy chọn</span>
              </label>
              <input
                type="email"
                placeholder="Ví dụ: bame@gmail.com"
                {...register('email')}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
              />
              {errors.email && (
                <p className="text-[11px] text-rose-500">{errors.email.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-cute-brown dark:text-cute-cream">
                Ghi chú thêm cho người giao hàng hoặc cho xưởng (nếu có)
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Giao vào giờ hành chính, gọi trước khi đến 15 phút..."
                {...register('notes')}
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300 resize-none"
              />
            </div>

            {/* Submit Button inside form */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full justify-center shadow-cute"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Gửi Đơn Yêu Thương & Xem QR Chuyển Khoản
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Order Items & Payment Snapshot */}
        <div className="space-y-6">
          <div className="cute-card p-6 space-y-4">
            <h3 className="text-base font-bold text-cute-brown dark:text-cute-cream pb-3 border-b border-cute-border-light dark:border-cute-border-dark">
              Sản phẩm trong đơn ({items.length})
            </h3>

            {/* List items */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {items.map((it) => (
                <div key={it.id} className="flex gap-3 text-xs">
                  <img
                    src={
                      it.product.images[0]?.image_url ||
                      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=120&auto=format&fit=crop'
                    }
                    alt={it.product.name}
                    className="w-14 h-14 object-cover rounded-xl border border-cute-pink flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-cute-brown dark:text-cute-cream truncate">
                      {it.product.name}
                    </h4>
                    <span className="text-[11px] text-cute-brown-light dark:text-cute-muted block">
                      SL: {it.quantity} x {formatVND(it.unitPrice)}
                    </span>
                    {(it.customization.petName || it.customization.customText) && (
                      <div className="text-[10px] text-cute-pink-600 dark:text-cute-pink-300 font-semibold block space-y-0.5">
                        <span className="truncate block">
                          ✨ {it.customization.selectedIcons?.[0]} {it.customization.petName || it.customization.customText} {it.customization.selectedIcons?.[1]}
                        </span>
                        {(it.customization.bodyColor || it.customization.baseColor) && (
                          <span className="text-[9px] text-cute-brown-light dark:text-cute-muted block truncate">
                            Thân: {it.customization.bodyColor} • Đế: {it.customization.baseColor}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-cute-brown dark:text-cute-cream">
                    {formatVND(it.unitPrice * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing details */}
            <div className="pt-3 border-t border-cute-border-light dark:border-cute-border-dark space-y-1.5 text-xs text-cute-brown-light dark:text-cute-muted">
              <div className="flex justify-between">
                <span>Tiền hàng:</span>
                <span className="font-semibold text-cute-brown dark:text-cute-cream">{formatVND(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span className="font-semibold text-cute-brown dark:text-cute-cream">
                  {shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-cute-brown dark:text-cute-cream pt-2 border-t border-cute-border-light dark:border-cute-border-dark">
                <span>Tổng tiền:</span>
                <span className="text-rose-500">{formatVND(total)}</span>
              </div>
            </div>

            {/* Deposit Box */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cute-pink/40 to-cute-peach/40 dark:from-cute-surface-dark dark:to-cute-cream-dark border border-cute-pink/50 space-y-1 text-xs">
              <div className="flex items-center justify-between font-bold text-cute-brown dark:text-cute-cream">
                <span className="flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-rose-500" />
                  <span>Cọc trước qua VietQR:</span>
                </span>
                <span className="text-rose-600 dark:text-rose-300 font-extrabold text-sm">{formatVND(depositAmount)}</span>
              </div>
              <p className="text-[10px] text-cute-brown-light dark:text-cute-muted">
                Sau khi gửi đơn, mã QR chuyển khoản và thông tin tài khoản ngân hàng sẽ hiện lên để ba mẹ quét thanh toán.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Modals */}
      {createdOrder && (
        <>
          <OrderSuccessModal
            isOpen={isSuccessModalOpen}
            onClose={() => setIsSuccessModalOpen(false)}
            order={createdOrder}
            onOpenQR={() => {
              setIsSuccessModalOpen(false);
              setIsQRModalOpen(true);
            }}
          />

          <BankTransferQRModal
            isOpen={isQRModalOpen}
            onClose={() => setIsQRModalOpen(false)}
            order={createdOrder}
            settings={settings}
          />
        </>
      )}
    </div>
  );
};

