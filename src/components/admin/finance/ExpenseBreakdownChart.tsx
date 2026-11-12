import React from 'react';
import { ExpenseCategory, EXPENSE_CATEGORY_CONFIG } from '../../../types/finance';
import { formatVND } from '../../../utils/currency';

interface ExpenseBreakdownChartProps {
  expensesByCategory: Record<ExpenseCategory, number>;
  totalExpenses: number;
}

export const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({
  expensesByCategory,
  totalExpenses,
}) => {
  const categories = Object.keys(expensesByCategory) as ExpenseCategory[];

  if (totalExpenses === 0) {
    return (
      <div className="p-6 text-center text-xs text-cute-brown-light dark:text-cute-muted">
        Chưa có chi phí nào phát sinh trong tháng này.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Segmented Multi-Color Bar */}
      <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800 shadow-inner">
        {categories.map((cat) => {
          const amount = expensesByCategory[cat] || 0;
          if (amount <= 0) return null;
          const percent = (amount / totalExpenses) * 100;
          const cfg = EXPENSE_CATEGORY_CONFIG[cat];

          return (
            <div
              key={cat}
              style={{
                width: `${percent}%`,
                backgroundColor: cfg.color,
              }}
              title={`${cfg.label}: ${formatVND(amount)} (${percent.toFixed(1)}%)`}
              className="h-full transition-all hover:opacity-85 cursor-pointer"
            />
          );
        })}
      </div>

      {/* Grid of Categories with percentage and amounts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((cat) => {
          const amount = expensesByCategory[cat] || 0;
          const percent = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
          const cfg = EXPENSE_CATEGORY_CONFIG[cat];

          return (
            <div
              key={cat}
              className="p-3 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                >
                  {cfg.icon}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-cute-brown dark:text-cute-cream truncate block">
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-cute-brown-light dark:text-cute-muted">
                    {percent.toFixed(1)}% tổng chi
                  </span>
                </div>
              </div>

              <span
                style={{ color: cfg.color }}
                className="text-xs font-extrabold whitespace-nowrap"
              >
                {formatVND(amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

