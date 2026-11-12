import { supabase } from './supabase/client';
import { Order, OrderStatus, PaymentStatus } from '../types/order';

function requireSupabase() {
  if (!supabase) {
    throw new Error('Chưa kết nối tới cơ sở dữ liệu Supabase.');
  }
  return supabase;
}

export const orderService = {
  async createOrder(payload: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shippingAddress: string;
    notes?: string;
    items: {
      productId: string;
      productName: string;
      variantId?: string;
      variantName?: string;
      variantValue?: string;
      unitPrice: number;
      quantity: number;
      customization: any;
      imageUrl?: string;
    }[];
  }): Promise<Order> {
    const db = requireSupabase();
    localStorage.removeItem('bowldog_mock_orders');

    const { data, error } = await db.rpc('create_secure_order', {
      p_customer_name: payload.customerName,
      p_customer_phone: payload.customerPhone,
      p_customer_email: payload.customerEmail || null,
      p_shipping_address: payload.shippingAddress,
      p_notes: payload.notes || null,
      p_items: payload.items.map((i) => ({
        product_id: i.productId,
        variant_id: i.variantId || null,
        quantity: i.quantity,
        customization_data: i.customization,
      })),
    });

    if (error || !data) {
      throw new Error(error?.message || 'Không thể khởi tạo đơn hàng trên cơ sở dữ liệu.');
    }

    return {
      id: data.order_id,
      order_reference: data.order_reference,
      customer_name: payload.customerName,
      customer_phone: payload.customerPhone,
      customer_email: payload.customerEmail,
      shipping_address: payload.shippingAddress,
      subtotal: data.subtotal,
      shipping_fee: data.shipping_fee,
      total_amount: data.total_amount,
      deposit_amount: data.deposit_amount,
      order_status: data.order_status,
      payment_status: data.payment_status,
      notes: payload.notes,
      created_at: new Date().toISOString(),
      items: payload.items.map((it) => ({
        product_id: it.productId,
        product_name: it.productName,
        unit_price: it.unitPrice,
        quantity: it.quantity,
        customization_data: it.customization,
        variant_name: it.variantName,
        variant_value: it.variantValue,
        image_url: it.imageUrl,
      })),
    };
  },

  async lookupOrders(orderRef?: string, phone?: string): Promise<Order[]> {
    const db = requireSupabase();
    const cleanRef = (orderRef || '').trim().toUpperCase();
    const cleanPhoneDigits = (phone || '').replace(/\D/g, '');
    const phoneLast9 =
      cleanPhoneDigits.length >= 9 ? cleanPhoneDigits.slice(-9) : cleanPhoneDigits;

    if (!cleanRef && !cleanPhoneDigits) {
      return [];
    }

    const matchesQuery = (o: Order) => {
      const refOk = !cleanRef || (o.order_reference || '').toUpperCase().includes(cleanRef);
      const orderDigits = (o.customer_phone || '').replace(/\D/g, '');
      const phoneOk =
        !cleanPhoneDigits ||
        (phoneLast9.length > 0 && orderDigits.endsWith(phoneLast9)) ||
        orderDigits.includes(cleanPhoneDigits);
      return refOk && phoneOk;
    };

    // 1. Thử gọi RPC get_guest_order (hỗ trợ cả khách vãng lai chưa đăng nhập)
    const { data: rpcData, error: rpcError } = await db.rpc('get_guest_order', {
      p_order_ref: cleanRef,
      p_phone: cleanPhoneDigits,
    });

    if (!rpcError && rpcData) {
      const list: Order[] = Array.isArray(rpcData) ? rpcData : [rpcData as Order];
      const filtered = list.filter((o) => o && o.id && matchesQuery(o));
      if (filtered.length > 0) {
        return filtered;
      }
    }

    // 2. Truy vấn trực tiếp bảng orders (dành cho chủ đơn / Admin hoặc khi tìm danh sách nhiều đơn theo SĐT)
    let query = db
      .from('orders')
      .select(
        `
        *,
        items:order_items(*),
        payments(*)
      `
      )
      .order('created_at', { ascending: false });

    if (cleanRef) {
      query = query.ilike('order_reference', `%${cleanRef}%`);
    }
    if (cleanPhoneDigits) {
      query = query.ilike('customer_phone', `%${phoneLast9}%`);
    }

    const { data: tableData, error: tableError } = await query;
    if (!tableError && tableData && tableData.length > 0) {
      return (tableData as Order[]).filter(matchesQuery);
    }

    return [];
  },

  async getOrderByReferenceAndPhone(orderRef?: string, phone?: string): Promise<Order | null> {
    const orders = await this.lookupOrders(orderRef, phone);
    return orders[0] || null;
  },

  async getAllOrders(filters?: {
    search?: string;
    orderStatus?: string;
    paymentStatus?: string;
    dateRange?: 'all' | 'today' | 'week' | 'month';
  }): Promise<Order[]> {
    const db = requireSupabase();
    localStorage.removeItem('bowldog_mock_orders');

    let query = db
      .from('orders')
      .select(`
        *,
        items:order_items(*),
        payments(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.orderStatus && filters.orderStatus !== 'all') {
      query = query.eq('order_status', filters.orderStatus);
    }
    if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
      query = query.eq('payment_status', filters.paymentStatus);
    }
    if (filters?.search) {
      query = query.or(
        `order_reference.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let list: Order[] = data || [];
    if (filters?.dateRange === 'today') {
      const today = new Date().toDateString();
      list = list.filter((o) => new Date(o.created_at).toDateString() === today);
    }

    return list;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const db = requireSupabase();
    const { error } = await db
      .from('orders')
      .update({ order_status: status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) throw new Error(error.message);
  },

  async updatePaymentStatus(orderId: string, status: PaymentStatus): Promise<void> {
    const db = requireSupabase();
    const { error } = await db
      .from('orders')
      .update({ payment_status: status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) throw new Error(error.message);
  },

  async submitPaymentProof(orderId: string, proofImageUrl: string, amount: number): Promise<void> {
    const db = requireSupabase();
    const { error } = await db.from('payments').insert({
      order_id: orderId,
      amount,
      payment_method: 'bank_transfer',
      payment_status: 'pending_verification',
      proof_image_url: proofImageUrl,
    });
    if (error) throw new Error(error.message);
  },

  async verifyDeposit(orderId: string, isFullPayment = false): Promise<void> {
    const db = requireSupabase();
    const nextPaymentStatus: PaymentStatus = isFullPayment ? 'paid' : 'partially_paid';
    const nextOrderStatus: OrderStatus = 'confirmed';

    const { error } = await db
      .from('orders')
      .update({
        payment_status: nextPaymentStatus,
        order_status: nextOrderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw new Error(error.message);
  },
};
