import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  Package,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { Order } from '../../types/order';
import { Product } from '../../types/product';
import { formatVND } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import {
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getOrderStatusBadgeClass,
  getPaymentStatusBadgeClass,
} from '../../utils/statusLabels';
import { Badge } from '../../components/common/Badge';

export const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [ords, prods] = await Promise.all([
          orderService.getAllOrders(),
          productService.getProducts({ activeOnly: false }),
        ]);
        setOrders(ords);
        setProducts(prods);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const todayStr = new Date().toDateString();
  const ordersToday = orders.filter((o) => new Date(o.created_at).toDateString() === todayStr);
  const revenueToday = ordersToday.reduce((sum, o) => {
    if (o.payment_status === 'paid' || o.payment_status === 'partially_paid') {
      return sum + o.deposit_amount;
    }
    return sum;
  }, 0);

  const pendingOrders = orders.filter((o) => o.order_status === 'pending');
  const confirmedOrders = orders.filter((o) => o.order_status === 'confirmed');
  const lowStockProducts = products.filter((p) => p.stock_quantity < 10);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="lavender" size="sm">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Khu vực Quản trị viên</span>
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-cute-brown dark:text-cute-cream font-sans mt-1">
            Bảng Điều Khiển Xưởng In 3D BolwDog
          </h1>
          <p className="text-xs text-cute-brown-light dark:text-cute-muted">
            Theo dõi dòng tiền cọc, số lượng đơn hàng và tình trạng tồn kho nguyên liệu in 3D
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/finances"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold transition-all shadow-sm"
          >
            <span>💰 Tài chính & Chi phí 3D</span>
          </Link>

          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-cute-pink hover:bg-cute-pink-200 text-cute-brown text-xs font-bold transition-all shadow-sm"
          >
            <span>Duyệt đơn chờ cọc ({pendingOrders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Metrics 4x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Orders Today */}
        <div className="cute-card p-5 space-y-2">
          <div className="flex items-center justify-between text-cute-brown-light">
            <span className="text-xs font-bold">Đơn hôm nay</span>
            <div className="p-2 rounded-xl bg-cute-pink/40 text-rose-500">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cute-brown dark:text-cute-cream">
            {ordersToday.length}
          </div>
          <span className="text-[11px] text-cute-brown-light block">
            Tổng đơn toàn thời gian: {orders.length}
          </span>
        </div>

        {/* Metric 2: Revenue Today (Deposits) */}
        <div className="cute-card p-5 space-y-2">
          <div className="flex items-center justify-between text-cute-brown-light">
            <span className="text-xs font-bold">Tiền cọc nhận hôm nay</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-500 font-sans">
            {formatVND(revenueToday)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block">
            Đã đối soát vào tài khoản
          </span>
        </div>

        {/* Metric 3: Pending Orders */}
        <div className="cute-card p-5 space-y-2">
          <div className="flex items-center justify-between text-cute-brown-light">
            <span className="text-xs font-bold">Đơn chờ đối soát cọc</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {pendingOrders.length}
          </div>
          <span className="text-[11px] text-amber-700 font-medium block">
            Cần admin kiểm tra sao kê
          </span>
        </div>

        {/* Metric 4: Low Stock Products */}
        <div className="cute-card p-5 space-y-2">
          <div className="flex items-center justify-between text-cute-brown-light">
            <span className="text-xs font-bold">Sản phẩm sắp hết hàng</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-500">
            {lowStockProducts.length}
          </div>
          <span className="text-[11px] text-cute-brown-light block">
            Tổng {products.length} mẫu sản phẩm
          </span>
        </div>
      </div>

      {/* Recent Orders Table Snapshot */}
      <div className="cute-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cute-border-light dark:border-cute-border-dark">
          <div>
            <h3 className="text-base font-bold text-cute-brown dark:text-cute-cream">
              Đơn hàng mới nhất
            </h3>
            <p className="text-xs text-cute-brown-light dark:text-cute-muted">
              Danh sách các bé cún vừa được ba mẹ đặt đơn
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-cute-pink-500 hover:text-cute-pink-600 flex items-center gap-1"
          >
            <span>Xem tất cả đơn hàng</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-cute-border-light dark:border-cute-border-dark text-cute-brown-light uppercase text-[10px] tracking-wider">
                <th className="py-3 px-2 font-bold">Mã đơn</th>
                <th className="py-3 px-2 font-bold">Khách hàng</th>
                <th className="py-3 px-2 font-bold">Tên bé cưng</th>
                <th className="py-3 px-2 font-bold">Tiền cọc (50%)</th>
                <th className="py-3 px-2 font-bold">Thanh toán</th>
                <th className="py-3 px-2 font-bold">Trạng thái</th>
                <th className="py-3 px-2 font-bold">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cute-border-light/60 dark:divide-cute-border-dark/60">
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} className="hover:bg-cute-cream/40  transition-colors">
                  <td className="py-3 px-2 font-mono font-bold text-cute-brown dark:text-cute-cream">
                    {o.order_reference}
                  </td>
                  <td className="py-3 px-2">
                    <span className="font-bold block text-cute-brown dark:text-cute-cream">{o.customer_name}</span>
                    <span className="text-[11px] text-cute-brown-light">{o.customer_phone}</span>
                  </td>
                  <td className="py-3 px-2">
                    {o.items[0]?.customization_data?.petName || o.items[0]?.customization_data?.customText || 'Theo mẫu'}
                  </td>
                  <td className="py-3 px-2 font-bold text-rose-500">
                    {formatVND(o.deposit_amount)}
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getPaymentStatusBadgeClass(o.payment_status)}`}>
                      {getPaymentStatusLabel(o.payment_status)}
                    </span>
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getOrderStatusBadgeClass(o.order_status)}`}>
                      {getOrderStatusLabel(o.order_status)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-cute-brown-light text-[11px]">
                    {formatDate(o.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

