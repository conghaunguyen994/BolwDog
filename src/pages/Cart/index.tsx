import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  removeFromCart,
  toggleAllSelection,
  toggleItemSelection,
  updateQuantity,
  clearCart,
} from '../../features/cart/cartSlice';
import { formatVND } from '../../utils/currency';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { FreeshipVoucherBox } from '../../components/cart/FreeshipVoucherBox';
import { ShopPolicyModal } from '../../components/common/ShopPolicyModal';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const {
    items,
    originalSubtotal,
    discountAmount,
    subtotal,
    baseShippingFee,
    shippingDiscountAmount,
    shippingFee,
    total,
    depositAmount,
    depositPercentage,
  } = useAppSelector((state) => state.cart);

  const selectedItems = items.filter((it) => it.selected !== false);
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-cute-pink/40 dark:bg-cute-pink-dark/20 flex items-center justify-center text-4xl mx-auto animate-bounce-gentle">
          🐾
        </div>
        <div>
          <h2 className="text-2xl font-black text-cute-brown dark:text-cute-cream font-sans">
            Giỏ đang đợi những bé xinh
          </h2>
          <p className="text-xs sm:text-sm text-cute-brown-light dark:text-cute-muted mt-2 max-w-sm mx-auto">
            Chưa có sản phẩm nào trong giỏ của ba mẹ. Hãy xem những chiếc bát và móc khóa in tên xinh xắn nhé!
          </p>
        </div>
        <Link to="/products">
          <Button variant="primary" size="lg" leftIcon={<Sparkles className="w-4 h-4" />}>
            Khám phá bộ sưu tập ngay
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="pink" size="sm">
            <span>Đơn hàng chờ gửi</span>
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-cute-brown dark:text-cute-cream font-sans mt-1">
            Giỏ nhà bé ({items.length} món)
          </h1>
        </div>
        <button
          onClick={() => dispatch(clearCart())}
          className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 p-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa sạch giỏ</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Item List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Thanh chọn tất cả */}
          <div className="cute-card px-4 py-3 flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs sm:text-sm font-bold text-cute-brown dark:text-cute-cream">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => dispatch(toggleAllSelection(e.target.checked))}
                className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
              />
              <span>
                Chọn tất cả ({selectedItems.length}/{items.length} sản phẩm)
              </span>
            </label>
            {selectedItems.length === 0 && (
              <span className="text-xs font-semibold text-rose-500">
                Vui lòng tích chọn ít nhất 1 sản phẩm để mua
              </span>
            )}
          </div>

          {items.map((item) => {
            const isSelected = item.selected !== false;
            return (
            <div
              key={item.id}
              className={`cute-card p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-all ${
                isSelected ? 'ring-1 ring-rose-200 dark:ring-rose-800/60' : 'opacity-65'
              }`}
            >
              <div className="flex items-center gap-3.5 sm:gap-4">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => dispatch(toggleItemSelection(item.id))}
                  aria-label={`Chọn mua ${item.product.name}`}
                  className="w-4 h-4 rounded accent-rose-500 cursor-pointer flex-shrink-0"
                />
                <img
                  src={
                    item.product.images[0]?.image_url ||
                    'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=200&auto=format&fit=crop'
                  }
                  alt={item.product.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border border-cute-pink flex-shrink-0"
                />
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-cute-brown dark:text-cute-cream">
                    {item.product.name}
                  </h3>
                  {item.selectedVariant && (
                    <p className="text-xs text-cute-pink-500 font-semibold">
                      {item.selectedVariant.variant_name}: {item.selectedVariant.variant_value}
                    </p>
                  )}
                  {(item.customization.petName || item.customization.customText || item.customization.phoneOnTag) && (
                    <div className="text-[11px] bg-cute-cream dark:bg-cute-surface-dark px-3 py-1.5 rounded-xl border border-cute-border-light block font-medium space-y-0.5">
                      <div>
                        ✨ In tên: <strong>
                          {item.customization.selectedIcons?.[0]} {item.customization.petName || item.customization.customText} {item.customization.selectedIcons?.[1]}
                        </strong>
                      </div>
                      {item.customization.phoneOnTag && (
                        <div className="text-[10px] text-cute-brown-light dark:text-cute-muted">
                          📞 SĐT khắc: {item.customization.phoneOnTag}
                        </div>
                      )}
                      {item.customization.keychainDesign && (
                        <div className="text-[10px] text-cute-brown-light dark:text-cute-muted">
                          🔑 Kiểu móc: {item.customization.keychainDesign}
                        </div>
                      )}
                      {item.customization.tagShape && (
                        <div className="text-[10px] text-cute-brown-light dark:text-cute-muted">
                          🏷️ Dáng thẻ: {item.customization.tagShape}
                        </div>
                      )}
                      {(item.customization.bodyColor || item.customization.baseColor) && (
                        <div className="text-[10px] text-cute-brown-light dark:text-cute-muted">
                          🎨 Thân: {item.customization.bodyColor} • Đế: {item.customization.baseColor}
                        </div>
                      )}
                      {item.customization.petBirthday && (
                        <div className="text-[10px] text-cute-brown-light dark:text-cute-muted">
                          🎂 Sinh nhật: {item.customization.petBirthday}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-rose-500">
                      Đơn giá: {formatVND(item.unitPrice)}
                    </p>
                    {item.discountPercentage && item.originalUnitPrice && item.originalUnitPrice > item.unitPrice ? (
                      <>
                        <span className="text-[11px] text-cute-brown-light/70 line-through">
                          {formatVND(item.originalUnitPrice)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                          -{item.discountPercentage}%
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Quantity Controls & Row Total */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-cute-border-light dark:border-cute-border-dark">
                <div className="flex items-center gap-2 bg-cute-cream dark:bg-cute-cream-dark rounded-full border border-cute-border-light dark:border-cute-border-dark px-2.5 py-1">
                  <button
                    onClick={() =>
                      dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))
                    }
                    className="p-1 hover:text-cute-pink-500"
                    aria-label="Giảm"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold px-2 text-cute-brown dark:text-cute-cream">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))
                    }
                    className="p-1 hover:text-cute-pink-500"
                    aria-label="Tăng"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-cute-brown dark:text-cute-cream">
                    {formatVND(item.unitPrice * item.quantity)}
                  </span>
                  <button
                    onClick={() => dispatch(removeFromCart(item.id))}
                    className="text-cute-brown-light hover:text-rose-500 p-1"
                    title="Xóa món này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          <div className="cute-card p-6 space-y-4 sticky top-28">
            <h3 className="text-lg font-bold text-cute-brown dark:text-cute-cream pb-3 border-b border-cute-border-light dark:border-cute-border-dark">
              Tóm tắt đơn hàng
            </h3>

            <FreeshipVoucherBox />

            <div className="space-y-2 text-xs text-cute-brown-light dark:text-cute-muted">
              {discountAmount && discountAmount > 0 ? (
                <>
                  <div className="flex justify-between">
                    <span>Tạm tính (Giá gốc):</span>
                    <span className="line-through">{formatVND(originalSubtotal || subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Khuyến mãi Sale:</span>
                    <span>-{formatVND(discountAmount)}</span>
                  </div>
                </>
              ) : null}
              <div className="flex justify-between">
                <span>Tiền hàng:</span>
                <span className="font-semibold text-cute-brown dark:text-cute-cream">{formatVND(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span className="font-semibold text-cute-brown dark:text-cute-cream">
                  {(shippingDiscountAmount || 0) > 0 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="line-through opacity-70">{formatVND(baseShippingFee || 30000)}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Miễn phí (Mã Freeship)</span>
                    </span>
                  ) : shippingFee === 0 ? (
                    'Miễn phí'
                  ) : (
                    formatVND(shippingFee)
                  )}
                </span>
              </div>
              <div className="pt-2 border-t border-cute-border-light dark:border-cute-border-dark flex justify-between text-base font-extrabold text-cute-brown dark:text-cute-cream">
                <span>Tổng cộng:</span>
                <span className="text-rose-500">{formatVND(total)}</span>
              </div>
            </div>

            {/* Deposit / Full Payment Notification */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex justify-between font-bold">
                <span>Cọc làm mẫu ({depositPercentage}%):</span>
                <span className="text-rose-600 dark:text-rose-300 font-extrabold">{formatVND(depositAmount)}</span>
              </div>
              <p className="text-[11px] opacity-85">
                Ba mẹ có thể chọn <strong>đặt cọc {depositPercentage}%</strong> (trả COD phần còn lại) hoặc <strong>chuyển khoản đủ 100%</strong> ({formatVND(total)}) để chỉ chờ nhận đơn tại nhà!
              </p>
            </div>

            {/* Bảo hành & Chính sách shop */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] space-y-1.5">
              <p className="font-bold text-emerald-900 dark:text-emerald-200 flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Đổi mới 1:1 miễn phí trong 7 ngày nếu lỗi kỹ thuật hoặc vận chuyển.</span>
              </p>
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(true)}
                className="text-rose-600 dark:text-rose-300 font-extrabold underline hover:text-rose-700"
              >
                Xem chi tiết Chính sách của Shop →
              </button>
            </div>

            <Button
              variant="primary"
              size="lg"
              disabled={selectedItems.length === 0}
              onClick={() => selectedItems.length > 0 && navigate('/checkout')}
              className="w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {selectedItems.length > 0
                ? `Hoàn tất đơn yêu thương (${selectedItems.length} món)`
                : 'Chọn ít nhất 1 sản phẩm để mua'}
            </Button>
          </div>
        </div>
      </div>

      <ShopPolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
      />
    </div>
  );
};

