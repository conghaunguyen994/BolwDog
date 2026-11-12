import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, Check, Plus, AlertCircle } from 'lucide-react';
import { ExpenseRecord, ExpenseCategory, EXPENSE_CATEGORY_CONFIG } from '../../../types/finance';
import { formatVND } from '../../../utils/currency';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>, id?: string) => Promise<void>;
  initialData?: ExpenseRecord | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [category, setCategory] = useState<ExpenseCategory>('filament');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [unitPrice, setUnitPrice] = useState<number | undefined>(undefined);
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category);
      setTitle(initialData.title);
      setAmount(initialData.amount);
      setQuantity(initialData.quantity);
      setUnitPrice(initialData.unitPrice);
      setDate(initialData.date);
      setNotes(initialData.notes || '');
    } else {
      setCategory('filament');
      setTitle('');
      setAmount(0);
      setQuantity(undefined);
      setUnitPrice(undefined);
      setDate(new Date().toISOString().substring(0, 10));
      setNotes('');
    }
    setError(null);
  }, [initialData, isOpen]);

  // Tự động tính số tiền nếu người dùng nhập số lượng & đơn giá (ví dụ mua cuộn nhựa)
  const handleQuantityOrPriceChange = (qty?: number, price?: number) => {
    setQuantity(qty);
    setUnitPrice(price);
    if (qty && price && qty > 0 && price > 0) {
      setAmount(qty * price);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên hoặc nội dung khoản chi');
      return;
    }
    if (!amount || amount <= 0) {
      setError('Số tiền chi phí phải lớn hơn 0 đ');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(
        {
          category,
          categoryLabel: EXPENSE_CATEGORY_CONFIG[category].label,
          title: title.trim(),
          amount: Math.round(amount),
          quantity,
          unitPrice,
          date,
          notes: notes.trim(),
        },
        initialData?.id
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể lưu khoản chi, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = Object.keys(EXPENSE_CATEGORY_CONFIG) as ExpenseCategory[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-cute-surface-dark w-full max-w-lg rounded-3xl shadow-cute-lg border border-cute-border-light dark:border-cute-border-dark overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cute-border-light dark:border-cute-border-dark bg-cute-cream/40 dark:bg-cute-cream-dark/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-base shadow-sm">
              💸
            </div>
            <div>
              <h3 className="text-base font-extrabold text-cute-brown dark:text-cute-cream">
                {initialData ? 'Chỉnh Sửa Khoản Chi Phí' : 'Thêm Khoản Chi Phí In 3D & Vận Hành'}
              </h3>
              <p className="text-[11px] text-cute-brown-light dark:text-cute-muted">
                Ghi nhận tiền nhựa, tiền điện, quảng cáo, hao hụt in hỏng...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cute-cream dark:hover:bg-cute-surface-dark text-cute-brown-light"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Chọn loại chi phí */}
          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1.5">
              Loại chi phí phát sinh *:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const cfg = EXPENSE_CATEGORY_CONFIG[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={
                      isSelected
                        ? {
                            borderColor: cfg.color,
                            backgroundColor: cfg.bgColor,
                          }
                        : undefined
                    }
                    className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left text-xs transition-all ${
                      isSelected
                        ? 'font-bold shadow-sm'
                        : 'border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark hover:bg-cute-cream/50'
                    }`}
                  >
                    <span className="text-base">{cfg.icon}</span>
                    <span className="truncate text-[11px]">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Tên khoản chi */}
          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
              Nội dung khoản chi *:
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Nhập 4 cuộn nhựa PETG Sunlu, Tiền điện xưởng tháng 11..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          {/* 3. Số lượng & Đơn giá (Optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
                Số lượng (Tùy chọn):
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Ví dụ: 3 (cuộn/bát)"
                value={quantity ?? ''}
                onChange={(e) =>
                  handleQuantityOrPriceChange(
                    e.target.value ? Number(e.target.value) : undefined,
                    unitPrice
                  )
                }
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1">
                Đơn giá (đ / cái):
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="Ví dụ: 250000"
                value={unitPrice ?? ''}
                onChange={(e) =>
                  handleQuantityOrPriceChange(
                    quantity,
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
              />
            </div>
          </div>

          {/* 4. Tổng số tiền */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-cute-brown dark:text-cute-cream flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-rose-500" />
                <span>Tổng số tiền chi (VNĐ) *:</span>
              </label>
              <span className="text-xs font-black text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-200">
                {formatVND(amount || 0)}
              </span>
            </div>
            <input
              type="number"
              required
              min="1000"
              step="1000"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Nhập số tiền..."
              className="w-full text-sm font-bold px-3.5 py-2.5 rounded-2xl border-2 border-rose-300 dark:border-rose-800 bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* 5. Ngày chi */}
          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cute-brown-light" />
              <span>Ngày chi tiền *:</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
            />
          </div>

          {/* 6. Ghi chú */}
          <div>
            <label className="block text-xs font-bold text-cute-brown dark:text-cute-cream mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-cute-brown-light" />
              <span>Ghi chú thêm:</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Hóa đơn điện tử, mua tại shopee..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cute-border-light dark:border-cute-border-dark">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-full border border-cute-border-light text-xs font-bold text-cute-brown-light hover:bg-cute-cream"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Lưu khoản chi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

