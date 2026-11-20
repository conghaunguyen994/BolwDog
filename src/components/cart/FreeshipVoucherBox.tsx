import React, { useEffect, useState } from 'react';
import { Truck, Check, X, AlertCircle, Tag } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { applyFreeshipCode } from '../../features/cart/cartSlice';
import { isFreeshipCodeValid, validateFreeshipCodeAttempt } from '../../utils/sale';
import { formatVND } from '../../utils/currency';

interface FreeshipVoucherBoxProps {
  compact?: boolean;
}

export const FreeshipVoucherBox: React.FC<FreeshipVoucherBoxProps> = ({ compact = false }) => {
  const dispatch = useAppDispatch();
  const {
    appliedFreeshipCode,
    freeshipVoucherConfig,
    baseShippingFee,
    shippingDiscountAmount,
  } = useAppSelector((state) => state.cart);

  const [codeInput, setCodeInput] = useState(appliedFreeshipCode || '');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const isAppliedValid = isFreeshipCodeValid(appliedFreeshipCode, freeshipVoucherConfig);

  useEffect(() => {
    if (appliedFreeshipCode) {
      setCodeInput(appliedFreeshipCode);
    }
  }, [appliedFreeshipCode]);

  const handleApply = () => {
    const result = validateFreeshipCodeAttempt(codeInput, freeshipVoucherConfig);
    if (!result.valid) {
      dispatch(applyFreeshipCode(null));
      setFeedback({ ok: false, text: result.message });
      return;
    }

    dispatch(applyFreeshipCode(result.normalizedCode));
    setFeedback({ ok: true, text: result.message });
  };

  const handleRemove = () => {
    dispatch(applyFreeshipCode(null));
    setCodeInput('');
    setFeedback(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  return (
    <div
      className={`rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white/80 dark:bg-cute-surface-dark ${
        compact ? 'p-3 space-y-2' : 'p-3.5 space-y-2.5'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-cute-brown dark:text-cute-cream flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-rose-500" />
          <span>Mã giảm giá phí vận chuyển</span>
        </label>
        {isAppliedValid && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Freeship 100%</span>
          </span>
        )}
      </div>

      {isAppliedValid ? (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Tag className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <div className="truncate">
              <span className="font-black text-emerald-800 dark:text-emerald-300 uppercase">
                {appliedFreeshipCode}
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block">
                {(shippingDiscountAmount || 0) > 0
                  ? `Đã giảm ${formatVND(shippingDiscountAmount || baseShippingFee || 30000)} phí ship`
                  : 'Miễn phí vận chuyển 100%'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-emerald-200 text-[11px] font-bold transition-colors flex-shrink-0"
          >
            <X className="w-3 h-3" />
            <span>Gỡ mã</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value);
              if (feedback) setFeedback(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Nhập mã freeship..."
            className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-cream-dark text-xs font-bold text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-cute-pink-300"
          />
          <button
            type="button"
            onClick={handleApply}
            className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold shadow-xs transition-all active:scale-95 whitespace-nowrap"
          >
            Áp dụng
          </button>
        </div>
      )}

      {feedback && !isAppliedValid && (
        <div
          className={`flex items-start gap-1.5 text-[11px] font-semibold p-2 rounded-xl border ${
            feedback.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{feedback.text}</span>
        </div>
      )}
    </div>
  );
};
