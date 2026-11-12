import React, { useState } from 'react';
import { MonthlyFinancialSummary } from '../../../types/finance';
import { formatVND } from '../../../utils/currency';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface FinancialChartProps {
  data: MonthlyFinancialSummary[];
  selectedMonthKey: string;
  onSelectMonth: (monthKey: string) => void;
}

export const FinancialChart: React.FC<FinancialChartProps> = ({
  data,
  selectedMonthKey,
  onSelectMonth,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-cute-brown-light">
        Chưa có đủ dữ liệu lịch sử để vẽ biểu đồ
      </div>
    );
  }

  // Tìm giá trị lớn nhất để scale chiều cao cột
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.totalRevenue, d.totalExpenses, Math.abs(d.netProfit))),
    1000000 // Tối thiểu 1 triệu để biểu đồ không bị bẹp
  );

  return (
    <div className="space-y-4">
      {/* Legend & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-bold text-cute-brown dark:text-cute-cream">
            <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block shadow-sm" />
            <span>Doanh Thu Tổng</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-cute-brown dark:text-cute-cream">
            <span className="w-3 h-3 rounded-md bg-rose-500 inline-block shadow-sm" />
            <span>Chi Phí Vận Hành</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-cute-brown dark:text-cute-cream">
            <span className="w-3 h-3 rounded-md bg-indigo-500 inline-block shadow-sm" />
            <span>Lợi Nhuận Ròng</span>
          </div>
        </div>

        <span className="text-[11px] text-cute-brown-light dark:text-cute-muted italic">
          💡 Bấm vào cột tháng để xem chi tiết tháng đó
        </span>
      </div>

      {/* Bar Chart Container */}
      <div className="relative pt-6 pb-2 px-2 bg-gradient-to-b from-white/80 to-cute-cream/30 dark:from-cute-surface-dark dark:to-cute-surface-dark/40 rounded-2xl border border-cute-border-light dark:border-cute-border-dark overflow-x-auto">
        <div className="min-w-[480px] h-64 flex items-end justify-between gap-3 sm:gap-6 px-4">
          {data.map((item, idx) => {
            const isSelected = item.monthKey === selectedMonthKey;
            const isHovered = hoveredIndex === idx;

            const revHeight = Math.max(6, (item.totalRevenue / maxVal) * 190);
            const expHeight = Math.max(6, (item.totalExpenses / maxVal) * 190);
            const profitHeight = Math.max(6, (Math.max(0, item.netProfit) / maxVal) * 190);

            return (
              <div
                key={item.monthKey}
                onClick={() => onSelectMonth(item.monthKey)}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex-1 flex flex-col items-center cursor-pointer transition-all p-2 rounded-xl group relative ${
                  isSelected
                    ? 'bg-purple-100/70 dark:bg-purple-950/40 ring-2 ring-purple-400'
                    : 'hover:bg-cute-cream/60 dark:hover:bg-cute-cream-dark/30'
                }`}
              >
                {/* Tooltip on Hover */}
                {isHovered && (
                  <div className="absolute -top-24 z-30 bg-slate-900 text-white text-[11px] p-2.5 rounded-xl shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in duration-150 border border-slate-700">
                    <p className="font-extrabold text-amber-300 pb-1 border-b border-slate-700">
                      {item.monthLabel}
                    </p>
                    <p className="text-emerald-400">
                      Thu: <strong>{formatVND(item.totalRevenue)}</strong>
                    </p>
                    <p className="text-rose-400">
                      Chi: <strong>{formatVND(item.totalExpenses)}</strong>
                    </p>
                    <p className="text-indigo-300">
                      Lãi: <strong>{formatVND(item.netProfit)}</strong> ({item.profitMargin}%)
                    </p>
                  </div>
                )}

                {/* 3 Bars Group (Revenue, Expense, Profit) */}
                <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-48">
                  {/* Revenue Bar */}
                  <div
                    style={{ height: `${revHeight}px` }}
                    className="w-3 sm:w-4 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm transition-all group-hover:brightness-110"
                    title={`Doanh thu: ${formatVND(item.totalRevenue)}`}
                  />

                  {/* Expense Bar */}
                  <div
                    style={{ height: `${expHeight}px` }}
                    className="w-3 sm:w-4 rounded-t-md bg-gradient-to-t from-rose-600 to-rose-400 shadow-sm transition-all group-hover:brightness-110"
                    title={`Chi phí: ${formatVND(item.totalExpenses)}`}
                  />

                  {/* Profit Bar */}
                  <div
                    style={{ height: `${profitHeight}px` }}
                    className={`w-3 sm:w-4 rounded-t-md shadow-sm transition-all group-hover:brightness-110 ${
                      item.netProfit >= 0
                        ? 'bg-gradient-to-t from-indigo-600 to-indigo-400'
                        : 'bg-gray-400'
                    }`}
                    title={`Lợi nhuận ròng: ${formatVND(item.netProfit)}`}
                  />
                </div>

                {/* Month Label */}
                <span
                  className={`mt-2 text-[11px] font-bold transition-colors truncate max-w-[65px] ${
                    isSelected
                      ? 'text-purple-700 dark:text-purple-300 font-extrabold underline decoration-2 underline-offset-4'
                      : 'text-cute-brown-light dark:text-cute-muted'
                  }`}
                >
                  {item.monthKey.split('-')[1]}/{item.monthKey.split('-')[0].substring(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

