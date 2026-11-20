import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  removeFromCart,
  toggleAllSelection,
  toggleItemSelection,
  updateQuantity,
} from '../../features/cart/cartSlice';
import { formatVND } from '../../utils/currency';
import { Button } from '../common/Button';
import { FreeshipVoucherBox } from './FreeshipVoucherBox';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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

  if (!isOpen) return null;

  const selectedItems = items.filter((it) => it.selected !== false);
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  const handleCheckoutClick = () => {
    if (selectedItems.length === 0) return;
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-cute-brown/30 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-cute-surface-dark border-l border-cute-border-light dark:border-cute-border-dark shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-cute-border-light dark:border-cute-border-dark flex items-center justify-between bg-cute-cream/50 dark:bg-cute-cream-dark/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cute-pink flex items-center justify-center text-lg shadow-sm">
                🐾
              </div>
              <div>
                <h3 className="text-lg font-bold text-cute-brown dark:text-cute-cream">
                  Giỏ nhà bé
                </h3>
                <p className="text-xs text-cute-brown-light dark:text-cute-muted">
                  {items.length} món yêu thương đang đợi
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-cute-brown-light dark:text-cute-muted hover:bg-cute-pink/40 hover:text-cute-brown transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-24 h-24 rounded-full bg-cute-pink/40 dark:bg-cute-pink-dark/20 flex items-center justify-center text-4xl animate-bounce-gentle">
                  🐾
                </div>
                <div>
                  <h4 className="text-base font-bold text-cute-brown dark:text-cute-cream">
                    Giỏ đang đợi những bé xinh
                  </h4>
                  <p className="text-xs text-cute-brown-light dark:text-cute-muted mt-1 max-w-xs">
                    Ba mẹ chưa chọn được sản phẩm nào cho bé cưng. Khám phá ngay những chiếc bát in tên siêu đáng yêu nhé!
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    navigate('/products');
                  }}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Khám phá mẫu xinh
                </Button>
              </div>
            ) : (
              <>
                {/* Thanh Chọn Tất Cả */}
                <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-cute-cream/80 dark:bg-cute-cream-dark/70 border border-cute-border-light dark:border-cute-border-dark">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-bold text-cute-brown dark:text-cute-cream">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => dispatch(toggleAllSelection(e.target.checked))}
                      className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
                    />
                    <span>
                      Chọn tất cả ({selectedItems.length}/{items.length} món)
                    </span>
                  </label>
                  {selectedItems.length === 0 && (
                    <span className="text-[11px] font-semibold text-rose-500">
                      Hãy tích chọn món cần mua
                    </span>
                  )}
                </div>

                {items.map((item) => {
                  const isSelected = item.selected !== false;
                  return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border flex gap-3 transition-all ${
                    isSelected
                      ? 'bg-cute-cream/60 dark:bg-cute-cream-dark/60 border-rose-200 dark:border-rose-800/70'
                      : 'bg-cute-cream/25 dark:bg-cute-cream-dark/30 border-cute-border-light/70 dark:border-cute-border-dark opacity-65'
                  }`}
                >
                  {/* Checkbox chọn mua */}
                  <div className="flex items-start pt-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => dispatch(toggleItemSelection(item.id))}
                      aria-label={`Chọn mua ${item.product.name}`}
                      className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
                    />
                  </div>

                  {/* Thumbnail */}
                  <img
                    src={
                      item.product.images[0]?.image_url ||
                      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=200&auto=format&fit=crop'
                    }
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-xl border border-cute-pink-200/50 flex-shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-cute-brown dark:text-cute-cream truncate">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => dispatch(removeFromCart(item.id))}
                          className="text-cute-brown-light hover:text-rose-500 p-1 transition-colors"
                          title="Xóa món này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.selectedVariant && (
                        <p className="text-[11px] text-cute-pink-500 dark:text-cute-pink-300 font-medium">
                          {item.selectedVariant.variant_name}: {item.selectedVariant.variant_value}
                        </p>
                      )}

                      {/* Customization Details snippet */}
                      {(item.customization.petName || item.customization.customText || item.customization.phoneOnTag) && (
                        <div className="mt-1 bg-white dark:bg-cute-surface-dark px-2 py-1 rounded-xl border border-cute-border-light dark:border-cute-border-dark text-[11px] text-cute-brown dark:text-cute-cream space-y-0.5">
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
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5 bg-white dark:bg-cute-surface-dark rounded-full border border-cute-border-light dark:border-cute-border-dark px-2 py-0.5">
                        <button
                          onClick={() =>
                            dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))
                          }
                          className="p-1 hover:text-cute-pink-500 transition-colors"
                          aria-label="Giảm"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-1.5 text-cute-brown dark:text-cute-cream">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))
                          }
                          className="p-1 hover:text-cute-pink-500 transition-colors"
                          aria-label="Tăng"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        {item.discountPercentage && item.originalUnitPrice && item.originalUnitPrice > item.unitPrice ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-cute-brown-light/70 line-through">
                              {formatVND(item.originalUnitPrice * item.quantity)}
                            </span>
                            <span className="text-xs font-bold text-rose-500">
                              {formatVND(item.unitPrice * item.quantity)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-cute-brown dark:text-cute-cream">
                            {formatVND(item.unitPrice * item.quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-cute-border-light dark:border-cute-border-dark bg-cute-cream/30 dark:bg-cute-cream-dark/30 space-y-3">
              <FreeshipVoucherBox compact />

              <div className="space-y-1.5 text-xs text-cute-brown-light dark:text-cute-muted">
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
                  <span>Phí ship ước tính:</span>
                  <span className="font-semibold text-cute-brown dark:text-cute-cream">
                    {(shippingDiscountAmount || 0) > 0 ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="line-through opacity-70">{formatVND(baseShippingFee || 30000)}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Miễn phí (Mã Freeship)</span>
                      </span>
                    ) : shippingFee === 0 ? (
                      'Miễn phí (Freeship)'
                    ) : (
                      formatVND(shippingFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-cute-border-light dark:border-cute-border-dark text-sm font-bold text-cute-brown dark:text-cute-cream">
                  <span>Tổng cộng:</span>
                  <span className="text-base text-rose-500">{formatVND(total)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl">
                  <span>Đặt cọc làm mẫu ({depositPercentage}%):</span>
                  <span className="font-bold">{formatVND(depositAmount)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleCheckoutClick}
                disabled={selectedItems.length === 0}
                className="w-full justify-center shadow-cute disabled:opacity-50 disabled:cursor-not-allowed"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {selectedItems.length > 0
                  ? `Hoàn tất đơn yêu thương (${selectedItems.length} món)`
                  : 'Chọn ít nhất 1 món để đặt hàng'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

