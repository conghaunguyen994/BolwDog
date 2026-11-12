import { supabase } from './supabase/client';
import {
  ExpenseRecord,
  ManualOrderRecord,
  MonthlyFinancialSummary,
  ExpenseCategory,
} from '../types/finance';
import { orderService } from './orderService';

const STORAGE_EXPENSES_KEY = 'bowldog_workshop_expenses_v1';
const STORAGE_MANUAL_ORDERS_KEY = 'bowldog_manual_orders_v1';

// Dữ liệu mẫu khởi đầu ban đầu cho xưởng in 3D BolwDog
const SEED_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-seed-1',
    category: 'filament',
    title: 'Nhập 5 cuộn nhựa PETG Food-Safe Sunlu (Trắng sứ & Xanh cổ vịt)',
    amount: 1250000,
    quantity: 5,
    unitPrice: 250000,
    date: '2026-11-02',
    notes: 'Nhựa chịu nhiệt dùng in bát ăn cho cún',
    createdAt: '2026-11-02T08:30:00.000Z',
  },
  {
    id: 'exp-seed-2',
    category: 'electricity',
    title: 'Tiền điện xưởng & 3 máy in 3D chạy liên tục tháng 10',
    amount: 680000,
    date: '2026-11-05',
    notes: 'Đồng hồ điện riêng của dàn máy in Bambu Lab',
    createdAt: '2026-11-05T14:10:00.000Z',
  },
  {
    id: 'exp-seed-3',
    category: 'ads',
    title: 'Chi phí chạy quảng cáo Facebook & TikTok Ads đợt đầu tháng 11',
    amount: 1500000,
    date: '2026-11-08',
    notes: 'Chiến dịch Bát Ăn Chống Gù & Móc Khóa 3D',
    createdAt: '2026-11-08T09:00:00.000Z',
  },
  {
    id: 'exp-seed-4',
    category: 'failure_spoilage',
    title: 'Hao hụt nhựa do in lỗi mất điện & canh lại bàn in 2 bát Size XL',
    amount: 180000,
    date: '2026-11-10',
    notes: '2 bát Size XL bị cong vênh đáy (đã tái chế)',
    createdAt: '2026-11-10T16:20:00.000Z',
  },
  {
    id: 'exp-seed-5',
    category: 'packaging',
    title: '50 hộp carton nắp gài + 2 cuộn xốp nổ chống sốc',
    amount: 320000,
    date: '2026-11-04',
    notes: 'Đóng gói gửi bưu điện toàn quốc',
    createdAt: '2026-11-04T11:00:00.000Z',
  },
];

const SEED_MANUAL_ORDERS: ManualOrderRecord[] = [
  {
    id: 'mo-seed-1',
    orderReference: 'OFF-202611-01',
    customerName: 'Chị Mai Lan (Hà Nội)',
    customerPhone: '0912888999',
    channel: 'zalo',
    productName: 'Combo 2 Bát Ăn Chống Gù Size M (Tên bé: Miu & Bơ)',
    quantity: 2,
    totalAmount: 458000,
    depositAmount: 250000,
    paymentStatus: 'paid',
    orderDate: '2026-11-03',
    notes: 'Khách nhắn qua Zalo 0345553913, đã chuyển khoản đủ',
    createdAt: '2026-11-03T10:15:00.000Z',
  },
  {
    id: 'mo-seed-2',
    orderReference: 'OFF-202611-02',
    customerName: 'Anh Tuấn Corgi (Đà Nẵng)',
    customerPhone: '0983112233',
    channel: 'facebook',
    productName: '3 Móc Khóa 3D In Tên Kèm SĐT + 1 Thẻ Tên Dạ Quang',
    quantity: 4,
    totalAmount: 390000,
    depositAmount: 200000,
    paymentStatus: 'partially_paid',
    orderDate: '2026-11-07',
    notes: 'Chốt qua Fanpage, cọc 200k, còn lại ship COD',
    createdAt: '2026-11-07T15:40:00.000Z',
  },
  {
    id: 'mo-seed-3',
    orderReference: 'OFF-202611-03',
    customerName: 'Bạn Hoàng (Khách quen Quy Nhơn)',
    customerPhone: '0349887766',
    channel: 'offline_direct',
    productName: '1 Bát Ăn Chống Gù Size L (Màu Cam Đất - Tên cún Lu)',
    quantity: 1,
    totalAmount: 259000,
    depositAmount: 259000,
    paymentStatus: 'paid',
    orderDate: '2026-11-11',
    notes: 'Ghé xưởng lấy trực tiếp, tiền mặt',
    createdAt: '2026-11-11T17:00:00.000Z',
  },
];

export const financeService = {
  // =========================================================================
  // 1. QUẢN LÝ CHI PHÍ IN 3D (EXPENSES)
  // =========================================================================
  async getExpenses(): Promise<ExpenseRecord[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('shop_settings')
          .select('setting_value')
          .eq('setting_key', 'workshop_expenses')
          .single();

        if (!error && data?.setting_value && Array.isArray(data.setting_value)) {
          localStorage.setItem(STORAGE_EXPENSES_KEY, JSON.stringify(data.setting_value));
          return data.setting_value;
        }
      }
    } catch (e) {
      console.warn('Lấy chi phí từ Supabase không thành công, dùng bộ nhớ cục bộ:', e);
    }

    // Fallback qua localStorage
    const saved = localStorage.getItem(STORAGE_EXPENSES_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Lỗi đọc localStorage chi phí:', e);
      }
    }

    // Khởi tạo mặc định
    localStorage.setItem(STORAGE_EXPENSES_KEY, JSON.stringify(SEED_EXPENSES));
    // Cố gắng đồng bộ lên Supabase nếu có kết nối
    this.syncExpensesToDb(SEED_EXPENSES).catch(() => {});
    return SEED_EXPENSES;
  },

  async syncExpensesToDb(expenses: ExpenseRecord[]): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.from('shop_settings').upsert(
        {
          setting_key: 'workshop_expenses',
          setting_value: expenses,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'setting_key' }
      );
    } catch (err) {
      console.warn('Lỗi đồng bộ chi phí lên Supabase:', err);
    }
  },

  async saveExpense(
    payload: Omit<ExpenseRecord, 'id' | 'createdAt'>,
    id?: string
  ): Promise<ExpenseRecord> {
    const list = await this.getExpenses();
    const nowIso = new Date().toISOString();

    let record: ExpenseRecord;
    if (id) {
      const idx = list.findIndex((x) => x.id === id);
      if (idx >= 0) {
        record = {
          ...list[idx],
          ...payload,
          updatedAt: nowIso,
        };
        list[idx] = record;
      } else {
        record = {
          id: `exp-${Date.now()}`,
          ...payload,
          createdAt: nowIso,
        };
        list.unshift(record);
      }
    } else {
      record = {
        id: `exp-${Date.now()}`,
        ...payload,
        createdAt: nowIso,
      };
      list.unshift(record);
    }

    localStorage.setItem(STORAGE_EXPENSES_KEY, JSON.stringify(list));
    await this.syncExpensesToDb(list);
    return record;
  },

  async deleteExpense(id: string): Promise<void> {
    const list = await this.getExpenses();
    const nextList = list.filter((x) => x.id !== id);
    localStorage.setItem(STORAGE_EXPENSES_KEY, JSON.stringify(nextList));
    await this.syncExpensesToDb(nextList);
  },

  // =========================================================================
  // 2. QUẢN LÝ ĐƠN HÀNG NGOÀI WEB (MANUAL / OFFLINE ORDERS)
  // =========================================================================
  async getManualOrders(): Promise<ManualOrderRecord[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('shop_settings')
          .select('setting_value')
          .eq('setting_key', 'manual_orders')
          .single();

        if (!error && data?.setting_value && Array.isArray(data.setting_value)) {
          localStorage.setItem(STORAGE_MANUAL_ORDERS_KEY, JSON.stringify(data.setting_value));
          return data.setting_value;
        }
      }
    } catch (e) {
      console.warn('Lấy đơn ngoài web từ Supabase không thành công, dùng bộ nhớ cục bộ:', e);
    }

    const saved = localStorage.getItem(STORAGE_MANUAL_ORDERS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Lỗi đọc localStorage đơn ngoài web:', e);
      }
    }

    localStorage.setItem(STORAGE_MANUAL_ORDERS_KEY, JSON.stringify(SEED_MANUAL_ORDERS));
    this.syncManualOrdersToDb(SEED_MANUAL_ORDERS).catch(() => {});
    return SEED_MANUAL_ORDERS;
  },

  async syncManualOrdersToDb(orders: ManualOrderRecord[]): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.from('shop_settings').upsert(
        {
          setting_key: 'manual_orders',
          setting_value: orders,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'setting_key' }
      );
    } catch (err) {
      console.warn('Lỗi đồng bộ đơn ngoài web lên Supabase:', err);
    }
  },

  async saveManualOrder(
    payload: Omit<ManualOrderRecord, 'id' | 'createdAt'>,
    id?: string
  ): Promise<ManualOrderRecord> {
    const list = await this.getManualOrders();
    const nowIso = new Date().toISOString();

    let record: ManualOrderRecord;
    if (id) {
      const idx = list.findIndex((x) => x.id === id);
      if (idx >= 0) {
        record = {
          ...list[idx],
          ...payload,
          updatedAt: nowIso,
        };
        list[idx] = record;
      } else {
        record = {
          id: `mo-${Date.now()}`,
          ...payload,
          createdAt: nowIso,
        };
        list.unshift(record);
      }
    } else {
      record = {
        id: `mo-${Date.now()}`,
        ...payload,
        createdAt: nowIso,
      };
      list.unshift(record);
    }

    localStorage.setItem(STORAGE_MANUAL_ORDERS_KEY, JSON.stringify(list));
    await this.syncManualOrdersToDb(list);
    return record;
  },

  async deleteManualOrder(id: string): Promise<void> {
    const list = await this.getManualOrders();
    const nextList = list.filter((x) => x.id !== id);
    localStorage.setItem(STORAGE_MANUAL_ORDERS_KEY, JSON.stringify(nextList));
    await this.syncManualOrdersToDb(nextList);
  },

  // =========================================================================
  // 3. TÍNH TOÁN BÁO CÁO TÀI CHÍNH THÁNG & BIỂU ĐỒ (P&L SUMMARY)
  // =========================================================================
  async getMonthlySummary(monthKey: string): Promise<MonthlyFinancialSummary> {
    // monthKey: "YYYY-MM", ví dụ "2026-11"
    const [webOrders, manualOrders, expenses] = await Promise.all([
      orderService.getAllOrders().catch(() => []),
      this.getManualOrders(),
      this.getExpenses(),
    ]);

    // Lọc theo tháng
    const filteredWeb = webOrders.filter((o) => {
      const dateStr = o.created_at ? o.created_at.substring(0, 7) : '';
      return dateStr === monthKey && o.order_status !== 'cancelled';
    });

    const filteredManual = manualOrders.filter((mo) => {
      const dateStr = mo.orderDate ? mo.orderDate.substring(0, 7) : '';
      return dateStr === monthKey;
    });

    const filteredExpenses = expenses.filter((e) => {
      const dateStr = e.date ? e.date.substring(0, 7) : '';
      return dateStr === monthKey;
    });

    // Doanh thu Web: Tổng tiền các đơn không bị hủy
    const webRevenue = filteredWeb.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Doanh thu Đơn ngoài web
    const manualRevenue = filteredManual.reduce((sum, mo) => sum + (mo.totalAmount || 0), 0);

    const totalRevenue = webRevenue + manualRevenue;

    // Chi phí theo danh mục
    const expensesByCategory: Record<ExpenseCategory, number> = {
      filament: 0,
      electricity: 0,
      ads: 0,
      failure_spoilage: 0,
      depreciation_parts: 0,
      packaging: 0,
      other: 0,
    };

    filteredExpenses.forEach((e) => {
      if (e.category in expensesByCategory) {
        expensesByCategory[e.category] += e.amount || 0;
      } else {
        expensesByCategory.other += e.amount || 0;
      }
    });

    const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const spoilageCost = expensesByCategory.failure_spoilage;
    const spoilageRate = totalRevenue > 0 ? (spoilageCost / totalRevenue) * 100 : 0;

    const [year, month] = monthKey.split('-');
    const monthLabel = `Tháng ${month}/${year}`;

    return {
      monthKey,
      monthLabel,
      webRevenue,
      manualRevenue,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: Math.round(profitMargin * 10) / 10,
      spoilageCost,
      spoilageRate: Math.round(spoilageRate * 10) / 10,
      expensesByCategory,
      orderCountWeb: filteredWeb.length,
      orderCountManual: filteredManual.length,
    };
  },

  // Lấy lịch sử 6 tháng gần nhất để vẽ biểu đồ so sánh cột/đường
  async getMultiMonthHistory(numMonths = 6): Promise<MonthlyFinancialSummary[]> {
    const list: MonthlyFinancialSummary[] = [];
    const now = new Date();

    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const mKey = `${year}-${month}`;
      const summary = await this.getMonthlySummary(mKey);
      list.push(summary);
    }

    return list;
  },
};

