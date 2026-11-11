import { supabase, isSupabaseConfigured } from './supabase/client';
import { Order, OrderStatus, PaymentStatus, OrderItem, PaymentProof } from '../types/order';
import { initialOrders } from './mock/mockData';
import { settingsService } from './settingsService';

const MOCK_ORDERS_KEY = 'bowldog_mock_orders';

function getStoredMockOrders(): Order[] {
  const data = localStorage.getItem(MOCK_ORDERS_KEY);
  if (!data) {
    localStorage.setItem(MOCK_ORDERS_KEY, JSON.stringify(initialOrders));
    return initialOrders;
  }
  try {
    return JSON.parse(data);
  } catch {
    return initialOrders;
  }
}

function saveMockOrders(orders: Order[]) {
  localStorage.setItem(MOCK_ORDERS_KEY, JSON.stringify(orders));
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
    if (isSupabaseConfigured && supabase) {
      try {
        // Call secure atomic database RPC to calculate real server prices & avoid tampering
        const { data, error } = await supabase.rpc('create_secure_order', {
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

        if (!error && data) {
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
        } else {
          console.warn('Supabase create_secure_order RPC not found or returned error, falling back to local store:', error);
        }
      } catch (err) {
        console.warn('Supabase connection failed, falling back to local store:', err);
      }
    }

    // Mock store mode
    const settings = await settingsService.getSettings();
    const depositPct = (settings.bank_transfer.deposit_percentage || 50) / 100;
    const subtotal = payload.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const shippingFee = 30000;
    const totalAmount = subtotal + shippingFee;
    const depositAmount = Math.round(totalAmount * depositPct);

    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderRef = `BD-${todayStr}-${randomSuffix}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      order_reference: orderRef,
      customer_id: null,
      customer_name: payload.customerName,
      customer_phone: payload.customerPhone,
      customer_email: payload.customerEmail,
      shipping_address: payload.shippingAddress,
      subtotal,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      deposit_amount: depositAmount,
      order_status: 'pending',
      payment_status: 'deposit_pending',
      notes: payload.notes,
      created_at: new Date().toISOString(),
      items: payload.items.map((i, idx) => ({
        id: `oi-${Date.now()}-${idx}`,
        product_id: i.productId,
        product_name: i.productName,
        unit_price: i.unitPrice,
        quantity: i.quantity,
        customization_data: i.customization,
        variant_name: i.variantName,
        variant_value: i.variantValue,
        image_url: i.imageUrl,
      })),
      payments: [],
    };

    const orders = getStoredMockOrders();
    orders.unshift(newOrder);
    saveMockOrders(orders);
    return newOrder;
  },

  async getOrderByReferenceAndPhone(orderRef: string, phone: string): Promise<Order | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('get_guest_order', {
          p_order_ref: orderRef.trim(),
          p_phone: phone.trim(),
        });
        if (!error && data) return data;
      } catch (e) {
        // Fall back to local store
      }
    }

    const orders = getStoredMockOrders();
    const cleanPhone = phone.replace(/\D/g, '').slice(-9);
    const found = orders.find(
      (o) =>
        o.order_reference.toUpperCase() === orderRef.trim().toUpperCase() &&
        o.customer_phone.replace(/\D/g, '').slice(-9) === cleanPhone
    );
    return found || null;
  },

  async getAllOrders(filters?: {
    search?: string;
    orderStatus?: string;
    paymentStatus?: string;
    dateRange?: 'all' | 'today' | 'week' | 'month';
  }): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
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
      if (error) throw error;
      return data || [];
    }

    // Mock store
    let list = [...getStoredMockOrders()];

    if (filters?.orderStatus && filters.orderStatus !== 'all') {
      list = list.filter((o) => o.order_status === filters.orderStatus);
    }
    if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
      list = list.filter((o) => o.payment_status === filters.paymentStatus);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.order_reference.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q)
      );
    }
    if (filters?.dateRange === 'today') {
      const today = new Date().toDateString();
      list = list.filter((o) => new Date(o.created_at).toDateString() === today);
    }

    return list;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
      if (error) throw error;
      return;
    }

    const orders = getStoredMockOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      orders[index].order_status = status;
      orders[index].updated_at = new Date().toISOString();
      saveMockOrders(orders);
    }
  },

  async updatePaymentStatus(orderId: string, status: PaymentStatus): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('orders').update({ payment_status: status }).eq('id', orderId);
      if (error) throw error;
      return;
    }

    const orders = getStoredMockOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      orders[index].payment_status = status;
      orders[index].updated_at = new Date().toISOString();
      saveMockOrders(orders);
    }
  },

  async submitPaymentProof(orderId: string, proofImageUrl: string, amount: number): Promise<void> {
    const paymentRecord: PaymentProof = {
      id: `pay-${Date.now()}`,
      order_id: orderId,
      amount,
      payment_method: 'bank_transfer',
      payment_status: 'pending_verification',
      proof_image_url: proofImageUrl,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('payments').insert({
        order_id: orderId,
        amount,
        payment_method: 'bank_transfer',
        payment_status: 'pending_verification',
        proof_image_url: proofImageUrl,
      });
      if (error) throw error;
      return;
    }

    const orders = getStoredMockOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      if (!orders[index].payments) orders[index].payments = [];
      orders[index].payments!.push(paymentRecord);
      orders[index].payment_status = 'deposit_pending';
      saveMockOrders(orders);
    }
  },

  async verifyDeposit(orderId: string, isFullPayment = false): Promise<void> {
    const nextPaymentStatus: PaymentStatus = isFullPayment ? 'paid' : 'partially_paid';
    const nextOrderStatus: OrderStatus = 'confirmed';

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: nextPaymentStatus,
          order_status: nextOrderStatus,
        })
        .eq('id', orderId);
      if (error) throw error;
      return;
    }

    const orders = getStoredMockOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      orders[index].payment_status = nextPaymentStatus;
      orders[index].order_status = nextOrderStatus;
      if (orders[index].payments && orders[index].payments!.length > 0) {
        orders[index].payments![orders[index].payments!.length - 1].payment_status = 'verified';
        orders[index].payments![orders[index].payments!.length - 1].verified_at = new Date().toISOString();
      }
      saveMockOrders(orders);
    }
  },
};

