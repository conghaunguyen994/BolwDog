import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { removeFromCart, updateQuantity } from '../../features/cart/cartSlice';
import { formatVND } from '../../utils/currency';
import { Button } from '../common/Button';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, subtotal, shippingFee, total, depositAmount } = useAppSelector(
    (state) => state.cart
  );

  if (!isOpen) return null;

  const handleCheckoutClick = () => {
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
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-cute-cream/60 dark:bg-cute-cream-dark/60 border border-cute-border-light dark:border-cute-border-dark flex gap-3.5 transition-all"
                >
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
                      {(item.customization.petName || item.customization.customText) && (
                        <div className="mt-1 bg-white dark:bg-cute-surface-dark px-2 py-1 rounded-xl border border-cute-border-light dark:border-cute-border-dark text-[11px] text-cute-brown dark:text-cute-cream space-y-0.5">
                          <div>
                            ✨ In tên: <strong>
                              {item.customization.selectedIcons?.[0]} {item.customization.petName || item.customization.customText} {item.customization.selectedIcons?.[1]}
                            </strong>
                          </div>
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

                      <span className="text-xs font-bold text-cute-brown dark:text-cute-cream">
                        {formatVND(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-cute-border-light dark:border-cute-border-dark bg-cute-cream/30 dark:bg-cute-cream-dark/30 space-y-3">
              <div className="space-y-1.5 text-xs text-cute-brown-light dark:text-cute-muted">
                <div className="flex justify-between">
                  <span>Tiền hàng:</span>
                  <span className="font-semibold text-cute-brown dark:text-cute-cream">{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí ship ước tính:</span>
                  <span className="font-semibold text-cute-brown dark:text-cute-cream">
                    {shippingFee === 0 ? 'Miễn phí (Freeship)' : formatVND(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-cute-border-light dark:border-cute-border-dark text-sm font-bold text-cute-brown dark:text-cute-cream">
                  <span>Tổng cộng:</span>
                  <span className="text-base text-rose-500">{formatVND(total)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl">
                  <span>Đặt cọc làm mẫu (50%):</span>
                  <span className="font-bold">{formatVND(depositAmount)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleCheckoutClick}
                className="w-full justify-center shadow-cute"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Hoàn tất đơn yêu thương
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

