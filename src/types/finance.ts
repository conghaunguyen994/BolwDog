export type ExpenseCategory =
  | 'filament' // Tiền cuộn nhựa in (PLA/PETG/TPU...)
  | 'electricity' // Tiền điện máy in 3D & sấy nhựa
  | 'ads' // Tiền chạy quảng cáo (Facebook, TikTok, Google)
  | 'failure_spoilage' // Chi phí hao hụt / in hỏng / mẫu thử lỗi
  | 'depreciation_parts' // Khấu hao máy in, vòi phun Nozzle, linh kiện
  | 'packaging' // Hộp carton, xốp nổ, băng dính, tem nhãn
  | 'other'; // Chi phí khác

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  categoryLabel?: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  quantity?: number; // Số lượng (ví dụ: 3 cuộn nhựa)
  unitPrice?: number; // Đơn giá mỗi cuộn
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type SalesChannel = 'zalo' | 'facebook' | 'tiktok' | 'offline_direct' | 'other';

export interface ManualOrderRecord {
  id: string;
  orderReference: string;
  customerName: string;
  customerPhone: string;
  channel: SalesChannel;
  productName: string;
  quantity: number;
  totalAmount: number;
  depositAmount: number;
  paymentStatus: 'paid' | 'partially_paid' | 'pending';
  orderDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MonthlyFinancialSummary {
  monthKey: string; // YYYY-MM
  monthLabel: string; // Tháng 11/2026
  webRevenue: number; // Doanh thu từ website
  manualRevenue: number; // Doanh thu từ đơn ngoài web
  totalRevenue: number; // Tổng doanh thu
  totalExpenses: number; // Tổng chi phí
  netProfit: number; // Lợi nhuận ròng
  profitMargin: number; // % Tỷ suất lợi nhuận
  spoilageCost: number; // Chi phí hao hụt / in lỗi
  spoilageRate: number; // % Hao hụt trên doanh thu
  expensesByCategory: Record<ExpenseCategory, number>;
  orderCountWeb: number;
  orderCountManual: number;
}

export const EXPENSE_CATEGORY_CONFIG: Record<
  ExpenseCategory,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  filament: {
    label: 'Cuộn nhựa in 3D (PLA/PETG)',
    icon: '🧵',
    color: '#0284C7',
    bgColor: '#E0F2FE',
  },
  electricity: {
    label: 'Tiền điện máy in & xưởng',
    icon: '⚡',
    color: '#D97706',
    bgColor: '#FEF3C7',
  },
  ads: {
    label: 'Quảng cáo (Facebook/TikTok Ads)',
    icon: '📢',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
  },
  failure_spoilage: {
    label: 'Hao hụt & Sản phẩm in hỏng',
    icon: '💥',
    color: '#E11D48',
    bgColor: '#FFE4E6',
  },
  depreciation_parts: {
    label: 'Khấu hao máy & Thay vòi phun',
    icon: '🔧',
    color: '#475569',
    bgColor: '#F1F5F9',
  },
  packaging: {
    label: 'Hộp carton, bao bì, xốp nổ',
    icon: '📦',
    color: '#059669',
    bgColor: '#D1FAE5',
  },
  other: {
    label: 'Chi phí phát sinh khác',
    icon: '📌',
    color: '#6B7280',
    bgColor: '#F3F4F6',
  },
};

export const SALES_CHANNEL_CONFIG: Record<
  SalesChannel,
  { label: string; icon: string; badgeClass: string }
> = {
  zalo: {
    label: 'Zalo cá nhân / OA',
    icon: '💬',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  facebook: {
    label: 'Facebook Fanpage / Group',
    icon: '📘',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  tiktok: {
    label: 'TikTok Shop / Video',
    icon: '🎵',
    badgeClass: 'bg-neutral-800 text-white border-neutral-700',
  },
  offline_direct: {
    label: 'Khách quen / Mua tại xưởng',
    icon: '🏪',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  other: {
    label: 'Kênh khác',
    icon: '🌐',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
  },
};

