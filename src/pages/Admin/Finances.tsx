import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Zap,
  Megaphone,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  ExpenseRecord,
  ManualOrderRecord,
  MonthlyFinancialSummary,
  ExpenseCategory,
  SalesChannel,
  EXPENSE_CATEGORY_CONFIG,
  SALES_CHANNEL_CONFIG,
} from '../../types/finance';
import { financeService } from '../../services/financeService';
import { formatVND } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { FinancialChart } from '../../components/admin/finance/FinancialChart';
import { ExpenseBreakdownChart } from '../../components/admin/finance/ExpenseBreakdownChart';
import { ExpenseModal } from '../../components/admin/finance/ExpenseModal';
import { ManualOrderModal } from '../../components/admin/finance/ManualOrderModal';
import { Badge } from '../../components/common/Badge';

export const AdminFinances: React.FC = () => {
  // Current month default: "2026-11"
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey);
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'manual_orders'>('overview');

  const [loading, setLoading] = useState(true);
  const [historySummaries, setHistorySummaries] = useState<MonthlyFinancialSummary[]>([]);
  const [currentSummary, setCurrentSummary] = useState<MonthlyFinancialSummary | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [manualOrders, setManualOrders] = useState<ManualOrderRecord[]>([]);

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ManualOrderRecord | null>(null);

  // Filters for Expense Tab
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCatFilter, setExpenseCatFilter] = useState<string>('all');

  // Filters for Manual Order Tab
  const [orderSearch, setOrderSearch] = useState('');
  const [orderChannelFilter, setOrderChannelFilter] = useState<string>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Load Data
  const loadAllFinanceData = async (mKey: string) => {
    try {
      setLoading(true);
      const [history, summary, expList, ordList] = await Promise.all([
        financeService.getMultiMonthHistory(6),
        financeService.getMonthlySummary(mKey),
        financeService.getExpenses(),
        financeService.getManualOrders(),
      ]);

      setHistorySummaries(history);
      setCurrentSummary(summary);
      setExpenses(expList);
      setManualOrders(ordList);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu tài chính:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllFinanceData(selectedMonthKey);
  }, [selectedMonthKey]);

  // Handle Save Expense
  const handleSaveExpense = async (
    payload: Omit<ExpenseRecord, 'id' | 'createdAt'>,
    id?: string
  ) => {
    await financeService.saveExpense(payload, id);
    await loadAllFinanceData(selectedMonthKey);
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khoản chi này không?')) {
      await financeService.deleteExpense(id);
      await loadAllFinanceData(selectedMonthKey);
    }
  };

  // Handle Save Manual Order
  const handleSaveManualOrder = async (
    payload: Omit<ManualOrderRecord, 'id' | 'createdAt'>,
    id?: string
  ) => {
    await financeService.saveManualOrder(payload, id);
    await loadAllFinanceData(selectedMonthKey);
  };

  // Handle Delete Manual Order
  const handleDeleteManualOrder = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa đơn mua ngoài web này không?')) {
      await financeService.deleteManualOrder(id);
      await loadAllFinanceData(selectedMonthKey);
    }
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchMonth = e.date?.startsWith(selectedMonthKey);
      const matchSearch =
        !expenseSearch.trim() ||
        e.title.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(expenseSearch.toLowerCase()));
      const matchCat = expenseCatFilter === 'all' || e.category === expenseCatFilter;
      return matchMonth && matchSearch && matchCat;
    });
  }, [expenses, selectedMonthKey, expenseSearch, expenseCatFilter]);

  // Filtered Manual Orders
  const filteredManualOrders = useMemo(() => {
    return manualOrders.filter((mo) => {
      const matchMonth = mo.orderDate?.startsWith(selectedMonthKey);
      const matchSearch =
        !orderSearch.trim() ||
        mo.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        mo.customerPhone.includes(orderSearch) ||
        mo.productName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        mo.orderReference.toLowerCase().includes(orderSearch.toLowerCase());
      const matchChannel = orderChannelFilter === 'all' || mo.channel === orderChannelFilter;
      const matchStatus = orderStatusFilter === 'all' || mo.paymentStatus === orderStatusFilter;
      return matchMonth && matchSearch && matchChannel && matchStatus;
    });
  }, [manualOrders, selectedMonthKey, orderSearch, orderChannelFilter, orderStatusFilter]);

  // Month list for dropdown
  const monthOptions = useMemo(() => {
    const opts = [];
    const baseDate = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      opts.push({ key: `${y}-${m}`, label: `Tháng ${m}/${y}` });
    }
    return opts;
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 pb-20">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-cute-border-light dark:border-cute-border-dark">
        <div>
          <Badge variant="pink" size="sm">
            <DollarSign className="w-3.5 h-3.5 text-rose-600" />
            <span>Khu Vực Quản Lý Tài Chính & Lợi Nhuận Xưởng</span>
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-cute-brown dark:text-cute-cream font-sans mt-1">
            Tài Chính, Chi Phí In 3D & Đơn Ngoài Web
          </h1>
          <p className="text-xs text-cute-brown-light dark:text-cute-muted">
            Tính toán chi phí nhựa in, tiền điện, quảng cáo, tỷ lệ hao hụt và doanh thu tổng hợp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-cute-surface-dark px-3 py-1.5 rounded-2xl border border-cute-border-light dark:border-cute-border-dark shadow-sm">
            <Calendar className="w-4 h-4 text-purple-600" />
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="text-xs font-bold bg-transparent text-cute-brown dark:text-cute-cream focus:outline-none cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Add Expense */}
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Khoản Chi</span>
          </button>

          {/* Quick Add Manual Order */}
          <button
            onClick={() => {
              setEditingOrder(null);
              setIsOrderModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Đơn Ngoài Web</span>
          </button>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Revenue */}
        <div className="cute-card p-5 space-y-2 border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 to-white dark:from-cute-surface-dark dark:to-cute-surface-dark">
          <div className="flex items-center justify-between text-cute-brown-light">
            <span className="text-xs font-bold">Tổng Doanh Thu</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {formatVND(currentSummary?.totalRevenue || 0)}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-cute-brown-light dark:text-cute-muted pt-1 border-t border-emerald-100 dark:border-emerald-900/30">
            <span>Web: <strong>{formatVND(currentSummary?.webRevenue || 0)}</strong></span>
            <span>•</span>
            <span>Ngoài web: <strong>{formatVND(currentSummary?.manualRevenue || 0)}</strong></span>
          </div>
        </div>

        {/* KPI 2: Total Expenses */}
        <div className="cute-card p-5 space-y-2 border-rose-200 dark:border-rose-900/50 bg-gradient-to-br from-rose-50/50 to-white dark:from-cute-surface-dark dark:to-cute-surface-dark">
          <div className="flex items-center justify-between text-cute-brown-light">
            <span className="text-xs font-bold">Tổng Chi Phí Vận Hành</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            {formatVND(currentSummary?.totalExpenses || 0)}
          </div>
          <div className="text-[10px] text-cute-brown-light dark:text-cute-muted pt-1 border-t border-rose-100 dark:border-rose-900/30">
            Gồm: Nhựa in, tiền điện, quảng cáo, bao bì...
          </div>
        </div>

        {/* KPI 3: Net Profit & Margin */}
        <div className="cute-card p-5 space-y-2 border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/50 to-white dark:from-cute-surface-dark dark:to-cute-surface-dark">
          <div className="flex items-center justify-between text-cute-brown-light">
            <span className="text-xs font-bold">Lợi Nhuận Ròng (Thực tế)</span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-black ${
              (currentSummary?.netProfit || 0) >= 0
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-rose-600'
            }`}
          >
            {formatVND(currentSummary?.netProfit || 0)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-cute-brown-light dark:text-cute-muted pt-1 border-t border-indigo-100 dark:border-indigo-900/30">
            <span>Tỷ suất lợi nhuận:</span>
            <strong
              className={`font-bold ${
                (currentSummary?.profitMargin || 0) >= 0 ? 'text-indigo-600' : 'text-rose-600'
              }`}
            >
              {currentSummary?.profitMargin || 0}%
            </strong>
          </div>
        </div>

        {/* KPI 4: Spoilage & Failure Rate */}
        <div className="cute-card p-5 space-y-2 border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/50 to-white dark:from-cute-surface-dark dark:to-cute-surface-dark">
          <div className="flex items-center justify-between text-cute-brown-light">
            <span className="text-xs font-bold">Hao Hụt & In Hỏng 3D</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {formatVND(currentSummary?.spoilageCost || 0)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-cute-brown-light dark:text-cute-muted pt-1 border-t border-amber-100 dark:border-amber-900/30">
            <span>Tỷ lệ hao hụt / Doanh thu:</span>
            <strong
              className={`font-bold ${
                (currentSummary?.spoilageRate || 0) > 8 ? 'text-rose-600' : 'text-amber-700'
              }`}
            >
              {currentSummary?.spoilageRate || 0}% {((currentSummary?.spoilageRate || 0) <= 8) && '✓ Chuẩn'}
            </strong>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-cute-border-light dark:border-cute-border-dark overflow-x-auto no-scrollbar pt-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs font-extrabold transition-all border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-700 dark:text-purple-300 bg-white dark:bg-cute-surface-dark'
              : 'border-transparent text-cute-brown-light hover:text-cute-brown'
          }`}
        >
          <span>📊 Báo Cáo P&L & Biểu Đồ</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs font-extrabold transition-all border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'border-rose-500 text-rose-700 dark:text-rose-300 bg-white dark:bg-cute-surface-dark'
              : 'border-transparent text-cute-brown-light hover:text-cute-brown'
          }`}
        >
          <span>💸 Chi Phí In 3D & Hao Hụt ({filteredExpenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('manual_orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs font-extrabold transition-all border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'manual_orders'
              ? 'border-blue-600 text-blue-700 dark:text-blue-300 bg-white dark:bg-cute-surface-dark'
              : 'border-transparent text-cute-brown-light hover:text-cute-brown'
          }`}
        >
          <span>💬 Đơn Mua Ngoài Web (Zalo/FB) ({filteredManualOrders.length})</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: TỔNG QUAN, BIỂU ĐỒ & BÁO CÁO P&L
      ===================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Section 1: Visual Monthly Chart */}
          <div className="cute-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-cute-brown dark:text-cute-cream flex items-center gap-2">
                  <span>📈</span> Biểu Đồ Doanh Thu vs Chi Phí vs Lợi Nhuận Qua Các Tháng
                </h3>
                <p className="text-xs text-cute-brown-light dark:text-cute-muted">
                  So sánh trực quan sức khỏe dòng tiền xưởng in 3D qua 6 tháng gần nhất
                </p>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                Đang xem: {currentSummary?.monthLabel}
              </span>
            </div>

            <FinancialChart
              data={historySummaries}
              selectedMonthKey={selectedMonthKey}
              onSelectMonth={(mKey) => setSelectedMonthKey(mKey)}
            />
          </div>

          {/* Section 2: Expense Breakdown */}
          <div className="cute-card p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-extrabold text-cute-brown dark:text-cute-cream flex items-center gap-2">
              <span>🧵</span> Cơ Cấu Chi Phí In 3D & Vận Hành ({currentSummary?.monthLabel})
            </h3>
            <p className="text-xs text-cute-brown-light dark:text-cute-muted">
              Phân bổ tỷ trọng chi phí nhựa in, tiền điện, quảng cáo, và hao hụt
            </p>

            <ExpenseBreakdownChart
              expensesByCategory={currentSummary?.expensesByCategory || ({} as any)}
              totalExpenses={currentSummary?.totalExpenses || 0}
            />
          </div>

          {/* Section 3: Summary P&L Statement Table */}
          <div className="cute-card p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-extrabold text-cute-brown dark:text-cute-cream flex items-center gap-2">
              <span>📑</span> Báo Cáo Kết Quả Kinh Doanh Tóm Tắt ({currentSummary?.monthLabel})
            </h3>

            <div className="border border-cute-border-light dark:border-cute-border-dark rounded-2xl overflow-hidden divide-y divide-cute-border-light dark:divide-cute-border-dark text-xs">
              {/* Row: Web Revenue */}
              <div className="p-3.5 flex justify-between bg-white dark:bg-cute-surface-dark">
                <span className="font-semibold text-cute-brown dark:text-cute-cream">
                  1. Doanh thu bán hàng qua Website ({currentSummary?.orderCountWeb || 0} đơn)
                </span>
                <span className="font-bold text-emerald-600">
                  {formatVND(currentSummary?.webRevenue || 0)}
                </span>
              </div>

              {/* Row: Manual Revenue */}
              <div className="p-3.5 flex justify-between bg-white dark:bg-cute-surface-dark">
                <span className="font-semibold text-cute-brown dark:text-cute-cream">
                  2. Doanh thu đơn ngoài web (Zalo, FB, Trực tiếp - {currentSummary?.orderCountManual || 0} đơn)
                </span>
                <span className="font-bold text-emerald-600">
                  {formatVND(currentSummary?.manualRevenue || 0)}
                </span>
              </div>

              {/* Row: Total Revenue */}
              <div className="p-3.5 flex justify-between bg-emerald-50/60 dark:bg-emerald-950/20 font-black">
                <span className="text-emerald-900 dark:text-emerald-200">
                  👉 TỔNG DOANH THU THUẦN (1 + 2)
                </span>
                <span className="text-emerald-700 dark:text-emerald-300 text-sm">
                  {formatVND(currentSummary?.totalRevenue || 0)}
                </span>
              </div>

              {/* Row: Filament */}
              <div className="p-3.5 flex justify-between bg-white dark:bg-cute-surface-dark pl-6">
                <span className="text-cute-brown-light dark:text-cute-muted">
                  - Tiền cuộn nhựa in 3D (PLA / PETG)
                </span>
                <span className="font-semibold text-rose-500">
                  {formatVND(currentSummary?.expensesByCategory.filament || 0)}
                </span>
              </div>

              {/* Row: Electricity */}
              <div className="p-3.5 flex justify-between bg-white dark:bg-cute-surface-dark pl-6">
                <span className="text-cute-brown-light dark:text-cute-muted">
                  - Tiền điện dàn máy in & sấy nhựa
                </span>
                <span className="font-semibold text-rose-500">
                  {formatVND(currentSummary?.expensesByCategory.electricity || 0)}
                </span>
              </div>

              {/* Row: Ads */}
              <div className="p-3.5 flex justify-between bg-white dark:bg-cute-surface-dark pl-6">
                <span className="text-cute-brown-light dark:text-cute-muted">
                  - Chi phí quảng cáo (Facebook/TikTok Ads)
                </span>
                <span className="font-semibold text-rose-500">
                  {formatVND(currentSummary?.expensesByCategory.ads || 0)}
                </span>
              </div>

              {/* Row: Spoilage */}
              <div className="p-3.5 flex justify-between bg-white dark:bg-cute-surface-dark pl-6">
                <span className="text-cute-brown-light dark:text-cute-muted">
                  - Chi phí hao hụt & in hỏng, thử nghiệm
                </span>
                <span className="font-semibold text-rose-500">
                  {formatVND(currentSummary?.expensesByCategory.failure_spoilage || 0)}
                </span>
              </div>

              {/* Row: Packaging & Other */}
              <div className="p-3.5 flex justify-between bg-white dark:bg-cute-surface-dark pl-6">
                <span className="text-cute-brown-light dark:text-cute-muted">
                  - Bao bì, khấu hao máy & chi phí khác
                </span>
                <span className="font-semibold text-rose-500">
                  {formatVND(
                    (currentSummary?.expensesByCategory.packaging || 0) +
                      (currentSummary?.expensesByCategory.depreciation_parts || 0) +
                      (currentSummary?.expensesByCategory.other || 0)
                  )}
                </span>
              </div>

              {/* Row: Total Expenses */}
              <div className="p-3.5 flex justify-between bg-rose-50/60 dark:bg-rose-950/20 font-black">
                <span className="text-rose-900 dark:text-rose-200">
                  👉 TỔNG CHI PHÍ VẬN HÀNH
                </span>
                <span className="text-rose-700 dark:text-rose-300 text-sm">
                  {formatVND(currentSummary?.totalExpenses || 0)}
                </span>
              </div>

              {/* Row: Net Profit */}
              <div className="p-4 flex justify-between bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-950/40 dark:to-indigo-950/40 font-black text-sm">
                <span className="text-purple-950 dark:text-purple-200">
                  💎 LỢI NHUẬN RÒNG THỰC TẾ
                </span>
                <span className="text-purple-800 dark:text-purple-300 text-base">
                  {formatVND(currentSummary?.netProfit || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: QUẢN LÝ CHI PHÍ IN 3D & HAO HỤT
      ===================================================================== */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-cute-brown-light absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm khoản chi..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
                />
              </div>

              {/* Category Filter */}
              <select
                value={expenseCatFilter}
                onChange={(e) => setExpenseCatFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
              >
                <option value="all">Tất cả loại chi phí</option>
                {Object.keys(EXPENSE_CATEGORY_CONFIG).map((cat) => (
                  <option key={cat} value={cat}>
                    {EXPENSE_CATEGORY_CONFIG[cat as ExpenseCategory].label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm khoản chi</span>
            </button>
          </div>

          {/* Expenses Table */}
          <div className="cute-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cute-cream dark:bg-cute-cream-dark/30 text-cute-brown-light dark:text-cute-muted font-bold border-b border-cute-border-light dark:border-cute-border-dark">
                  <tr>
                    <th className="py-3 px-4">Ngày</th>
                    <th className="py-3 px-4">Hạng mục</th>
                    <th className="py-3 px-4">Nội dung khoản chi</th>
                    <th className="py-3 px-4">Số lượng x Đơn giá</th>
                    <th className="py-3 px-4 text-right">Số tiền</th>
                    <th className="py-3 px-4">Ghi chú</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cute-border-light dark:divide-cute-border-dark">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-cute-brown-light">
                        Không có khoản chi nào trong tháng này.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => {
                      const cfg = EXPENSE_CATEGORY_CONFIG[exp.category];
                      return (
                        <tr
                          key={exp.id}
                          className="hover:bg-cute-cream/30 dark:hover:bg-cute-cream-dark/10 transition-colors"
                        >
                          <td className="py-3 px-4 whitespace-nowrap text-cute-brown-light">
                            {formatDate(exp.date)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
                              className="px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1"
                            >
                              <span>{cfg.icon}</span>
                              <span>{cfg.label}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-cute-brown dark:text-cute-cream max-w-xs truncate">
                            {exp.title}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-cute-brown-light">
                            {exp.quantity && exp.unitPrice ? (
                              <span>
                                {exp.quantity} x {formatVND(exp.unitPrice)}
                              </span>
                            ) : exp.quantity ? (
                              <span>{exp.quantity} cái/cuộn</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-extrabold text-rose-600 dark:text-rose-400">
                            {formatVND(exp.amount)}
                          </td>
                          <td className="py-3 px-4 text-cute-brown-light max-w-xs truncate">
                            {exp.notes || '—'}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingExpense(exp);
                                  setIsExpenseModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-cute-cream text-cute-brown-light hover:text-cute-brown"
                                title="Chỉnh sửa"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="p-4 bg-cute-cream/40 dark:bg-cute-cream-dark/20 border-t border-cute-border-light dark:border-cute-border-dark flex items-center justify-between text-xs">
              <span className="text-cute-brown-light">
                Tổng cộng {filteredExpenses.length} khoản chi trong tháng:
              </span>
              <span className="text-sm font-black text-rose-600">
                {formatVND(filteredExpenses.reduce((s, e) => s + e.amount, 0))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: ĐƠN MUA NGOÀI WEB (ZALO, FACEBOOK, TIKTOK, TRỰC TIẾP)
      ===================================================================== */}
      {activeTab === 'manual_orders' && (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-cute-brown-light absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên khách, SĐT, mã đơn..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
                />
              </div>

              {/* Channel Filter */}
              <select
                value={orderChannelFilter}
                onChange={(e) => setOrderChannelFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
              >
                <option value="all">Tất cả kênh</option>
                {Object.keys(SALES_CHANNEL_CONFIG).map((ch) => (
                  <option key={ch} value={ch}>
                    {SALES_CHANNEL_CONFIG[ch as SalesChannel].label}
                  </option>
                ))}
              </select>

              {/* Payment Status Filter */}
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-2xl border border-cute-border-light dark:border-cute-border-dark bg-white dark:bg-cute-surface-dark text-cute-brown dark:text-cute-cream focus:outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="paid">Đã thanh toán đủ (100%)</option>
                <option value="partially_paid">Đã cọc</option>
                <option value="pending">Chờ thanh toán</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingOrder(null);
                setIsOrderModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm đơn ngoài web</span>
            </button>
          </div>

          {/* Orders Table */}
          <div className="cute-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cute-cream dark:bg-cute-cream-dark/30 text-cute-brown-light dark:text-cute-muted font-bold border-b border-cute-border-light dark:border-cute-border-dark">
                  <tr>
                    <th className="py-3 px-4">Mã đơn</th>
                    <th className="py-3 px-4">Ngày</th>
                    <th className="py-3 px-4">Khách hàng & SĐT</th>
                    <th className="py-3 px-4">Kênh bán</th>
                    <th className="py-3 px-4">Sản phẩm / Số lượng</th>
                    <th className="py-3 px-4 text-right">Tổng tiền</th>
                    <th className="py-3 px-4 text-right">Đã cọc</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cute-border-light dark:divide-cute-border-dark">
                  {filteredManualOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-cute-brown-light">
                        Không có đơn ngoài web nào trong tháng này.
                      </td>
                    </tr>
                  ) : (
                    filteredManualOrders.map((ord) => {
                      const cfg = SALES_CHANNEL_CONFIG[ord.channel];
                      return (
                        <tr
                          key={ord.id}
                          className="hover:bg-cute-cream/30 dark:hover:bg-cute-cream-dark/10 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-cute-brown dark:text-cute-cream whitespace-nowrap">
                            {ord.orderReference}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-cute-brown-light">
                            {formatDate(ord.orderDate)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-cute-brown dark:text-cute-cream block">
                              {ord.customerName}
                            </span>
                            <a
                              href={`tel:${ord.customerPhone}`}
                              className="text-[11px] text-blue-600 hover:underline block"
                            >
                              📞 {ord.customerPhone}
                            </a>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${cfg.badgeClass}`}
                            >
                              <span>{cfg.icon}</span>
                              <span>{cfg.label}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <span className="font-medium text-cute-brown dark:text-cute-cream block truncate">
                              {ord.productName}
                            </span>
                            <span className="text-[10px] text-cute-brown-light">
                              SL: {ord.quantity}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-black text-emerald-600 dark:text-emerald-400">
                            {formatVND(ord.totalAmount)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-blue-600">
                            {formatVND(ord.depositAmount)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {ord.paymentStatus === 'paid' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Đã thu đủ (100%)
                              </span>
                            ) : ord.paymentStatus === 'partially_paid' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                Đã cọc
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Chờ cọc
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingOrder(ord);
                                  setIsOrderModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-cute-cream text-cute-brown-light hover:text-cute-brown"
                                title="Chỉnh sửa"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteManualOrder(ord.id)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="p-4 bg-cute-cream/40 dark:bg-cute-cream-dark/20 border-t border-cute-border-light dark:border-cute-border-dark flex items-center justify-between text-xs">
              <span className="text-cute-brown-light">
                Tổng cộng {filteredManualOrders.length} đơn ngoài web:
              </span>
              <div className="flex items-center gap-4">
                <span>
                  Tiền cọc:{' '}
                  <strong className="text-blue-600">
                    {formatVND(filteredManualOrders.reduce((s, o) => s + o.depositAmount, 0))}
                  </strong>
                </span>
                <span>
                  Tổng tiền:{' '}
                  <strong className="text-sm font-black text-emerald-600">
                    {formatVND(filteredManualOrders.reduce((s, o) => s + o.totalAmount, 0))}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        initialData={editingExpense}
      />

      {/* Manual Order Modal */}
      <ManualOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setEditingOrder(null);
        }}
        onSave={handleSaveManualOrder}
        initialData={editingOrder}
      />
    </div>
  );
};

