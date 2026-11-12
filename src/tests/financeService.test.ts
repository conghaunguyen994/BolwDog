import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSettingsStore: Record<string, any> = {};

vi.mock('../services/supabase/client', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn((col: string, val: any) => ({
          single: vi.fn(async () => {
            if (mockSettingsStore[val]) {
              return { data: { setting_value: mockSettingsStore[val] }, error: null };
            }
            return { data: null, error: { message: 'Not found' } };
          }),
        })),
      })),
      upsert: vi.fn(async (payload: any) => {
        if (payload?.setting_key) {
          mockSettingsStore[payload.setting_key] = payload.setting_value;
        }
        return { data: null, error: null };
      }),
    })),
  },
}));

vi.mock('../services/orderService', () => ({
  orderService: {
    getAllOrders: vi.fn(async () => [
      {
        id: 'ord-mock-1',
        order_reference: 'BD-20261112-0001',
        total_amount: 398000,
        deposit_amount: 199000,
        order_status: 'confirmed',
        created_at: '2026-11-05T10:00:00.000Z',
      },
      {
        id: 'ord-mock-2',
        order_reference: 'BD-20261112-0002',
        total_amount: 558000,
        deposit_amount: 279000,
        order_status: 'delivered',
        created_at: '2026-11-08T12:00:00.000Z',
      },
    ]),
  },
}));

import { financeService } from '../services/financeService';

describe('Finance & P&L Service Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    for (const k of Object.keys(mockSettingsStore)) {
      delete mockSettingsStore[k];
    }
  });

  it('should initialize default seed expenses and manual orders', async () => {
    const expenses = await financeService.getExpenses();
    const manualOrders = await financeService.getManualOrders();

    expect(expenses.length).toBeGreaterThan(0);
    expect(manualOrders.length).toBeGreaterThan(0);

    // Kiểm tra có đủ các danh mục chi phí in 3D
    const categories = expenses.map((e) => e.category);
    expect(categories).toContain('filament');
    expect(categories).toContain('electricity');
    expect(categories).toContain('ads');
  });

  it('should save a new expense record correctly', async () => {
    const newExp = await financeService.saveExpense({
      category: 'filament',
      categoryLabel: 'Cuộn nhựa in 3D (PLA/PETG)',
      title: 'Mua 3 cuộn nhựa PETG màu Hồng Pastel',
      amount: 750000,
      quantity: 3,
      unitPrice: 250000,
      date: '2026-11-12',
      notes: 'In bát cho mèo',
    });

    expect(newExp.id).toBeDefined();
    expect(newExp.amount).toBe(750000);

    const allExpenses = await financeService.getExpenses();
    const found = allExpenses.find((e) => e.id === newExp.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe('Mua 3 cuộn nhựa PETG màu Hồng Pastel');
  });

  it('should save a new manual order correctly', async () => {
    const newOrder = await financeService.saveManualOrder({
      orderReference: 'OFF-202611-TEST',
      customerName: 'Chị Thảo (Zalo)',
      customerPhone: '0934567890',
      channel: 'zalo',
      productName: 'Combo 2 Bát Size M in tên Miu',
      quantity: 2,
      totalAmount: 458000,
      depositAmount: 229000,
      paymentStatus: 'partially_paid',
      orderDate: '2026-11-12',
      notes: 'Khách cọc trước 50%',
    });

    expect(newOrder.id).toBeDefined();
    expect(newOrder.totalAmount).toBe(458000);

    const allOrders = await financeService.getManualOrders();
    const found = allOrders.find((o) => o.id === newOrder.id);
    expect(found).toBeDefined();
    expect(found?.customerName).toBe('Chị Thảo (Zalo)');
  });

  it('should calculate monthly P&L and spoilage metrics properly', async () => {
    const summary = await financeService.getMonthlySummary('2026-11');

    expect(summary.monthKey).toBe('2026-11');
    expect(summary.totalRevenue).toBe(summary.webRevenue + summary.manualRevenue);
    expect(summary.netProfit).toBe(summary.totalRevenue - summary.totalExpenses);
    expect(summary.expensesByCategory).toBeDefined();
    expect(typeof summary.profitMargin).toBe('number');
    expect(typeof summary.spoilageCost).toBe('number');
  });

  it('should generate 6-month history list for visual charts', async () => {
    const history = await financeService.getMultiMonthHistory(6);
    expect(history.length).toBe(6);
    expect(history[history.length - 1].monthKey).toBe('2026-11');
  });
});
