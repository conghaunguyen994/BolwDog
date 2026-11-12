import { supabase } from './supabase/client';
import { Demo3DPreview, DemoReviewStatus, Order, OrderStatus, PaymentStatus } from '../types/order';
import { emailService } from './emailService';
import {
  assertCsrfAndSameOrigin,
  assertHumanNotBot,
  assertNotDuplicateOrder,
  containsXssPayload,
  enforceRateLimit,
  markOrderSubmitted,
  sanitizeObject,
  sanitizeText,
  sanitizeUrl,
  withActionLock,
} from '../utils/securityGuard';

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
    honeypot?: string;
    csrfToken?: string;
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
    return withActionLock('create_order', async () => {
      // 1. Kiểm tra Bot Honeypot & CSRF / Origin
      assertHumanNotBot(payload.honeypot);
      assertCsrfAndSameOrigin(payload.csrfToken);

      // 2. Kiểm tra XSS trên toàn bộ trường văn bản
      if (
        containsXssPayload(payload.customerName) ||
        containsXssPayload(payload.customerPhone) ||
        containsXssPayload(payload.customerEmail) ||
        containsXssPayload(payload.shippingAddress) ||
        containsXssPayload(payload.notes)
      ) {
        throw new Error('Phát hiện mã lệnh hoặc ký tự không an toàn trong thông tin đơn hàng (XSS bị chặn).');
      }

      const cleanName = sanitizeText(payload.customerName, 100);
      const cleanPhone = sanitizeText(payload.customerPhone, 20).replace(/[^\d+]/g, '');
      const cleanEmail = payload.customerEmail ? sanitizeText(payload.customerEmail, 120) : undefined;
      const cleanAddress = sanitizeText(payload.shippingAddress, 255);
      const cleanNotes = payload.notes ? sanitizeText(payload.notes, 500) : undefined;

      if (!payload.items || payload.items.length === 0 || payload.items.length > 15) {
        throw new Error('Số lượng mặt hàng trong một đơn không hợp lệ (tối đa 15 sản phẩm).');
      }

      const sanitizedItems = payload.items.map((i) => {
        if (!Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 20) {
          throw new Error('Số lượng mỗi sản phẩm phải từ 1 đến 20.');
        }
        return {
          ...i,
          productName: sanitizeText(i.productName, 150),
          customization: sanitizeObject(i.customization || {}),
        };
      });

      // 3. Chống đặt trùng đơn giống hệt nhau & Rate Limiting
      const orderSignature = JSON.stringify({
        p: cleanPhone,
        a: cleanAddress,
        i: sanitizedItems.map((x) => `${x.productId}:${x.variantId || ''}:${x.quantity}`),
      });
      assertNotDuplicateOrder(orderSignature);
      enforceRateLimit('create_order');

      const db = requireSupabase();
      localStorage.removeItem('bowldog_mock_orders');

      const { data, error } = await db.rpc('create_secure_order', {
        p_customer_name: cleanName,
        p_customer_phone: cleanPhone,
        p_customer_email: cleanEmail || null,
        p_shipping_address: cleanAddress,
        p_notes: cleanNotes || null,
        p_items: sanitizedItems.map((i) => ({
          product_id: i.productId,
          variant_id: i.variantId || null,
          quantity: i.quantity,
          customization_data: i.customization,
        })),
      });

      if (error || !data) {
        throw new Error(error?.message || 'Không thể khởi tạo đơn hàng trên cơ sở dữ liệu.');
      }

      markOrderSubmitted(orderSignature);

      const createdOrder: Order = {
        id: data.order_id,
        order_reference: data.order_reference,
        customer_name: cleanName,
        customer_phone: cleanPhone,
        customer_email: cleanEmail,
        shipping_address: cleanAddress,
        subtotal: data.subtotal,
        shipping_fee: data.shipping_fee,
        total_amount: data.total_amount,
        deposit_amount: data.deposit_amount,
        order_status: data.order_status,
        payment_status: data.payment_status,
        notes: cleanNotes,
        created_at: new Date().toISOString(),
        items: sanitizedItems.map((it) => ({
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

      // Tự động gửi Email thông báo đơn mới cho Admin & xác nhận cho Khách hàng
      emailService.notifyOrderCreated(createdOrder).catch(() => {});

      return createdOrder;
    });
  },

  async lookupOrders(orderRef?: string, phone?: string): Promise<Order[]> {
    return withActionLock('track_order', async () => {
      if (containsXssPayload(orderRef) || containsXssPayload(phone)) {
        throw new Error('Thông tin tra cứu chứa ký tự không an toàn.');
      }

      const db = requireSupabase();
      const cleanRef = sanitizeText(orderRef || '', 40).toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const cleanPhoneDigits = sanitizeText(phone || '', 20).replace(/\D/g, '');
      const phoneLast9 =
        cleanPhoneDigits.length >= 9 ? cleanPhoneDigits.slice(-9) : cleanPhoneDigits;

      if (!cleanRef && !cleanPhoneDigits) {
        return [];
      }

      enforceRateLimit('track_order');

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
    });
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
    return withActionLock(`update_order_${orderId}`, async () => {
      assertCsrfAndSameOrigin();
      enforceRateLimit('admin_mutation');
      const db = requireSupabase();
      const { error } = await db
        .from('orders')
        .update({ order_status: status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw new Error(error.message);
    });
  },

  async updatePaymentStatus(orderId: string, status: PaymentStatus): Promise<void> {
    return withActionLock(`update_payment_${orderId}`, async () => {
      assertCsrfAndSameOrigin();
      enforceRateLimit('admin_mutation');
      const db = requireSupabase();
      const { error } = await db
        .from('orders')
        .update({ payment_status: status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw new Error(error.message);
    });
  },

  async submitPaymentProof(orderId: string, proofImageUrl: string, amount: number): Promise<void> {
    return withActionLock('submit_payment_proof', async () => {
      assertCsrfAndSameOrigin();
      enforceRateLimit('submit_payment_proof');
      const cleanUrl = sanitizeUrl(proofImageUrl);
      const db = requireSupabase();
      const { error } = await db.from('payments').insert({
        order_id: orderId,
        amount,
        payment_method: 'bank_transfer',
        payment_status: 'pending_verification',
        proof_image_url: cleanUrl,
      });
      if (error) throw new Error(error.message);
    });
  },

  async verifyDeposit(orderId: string, isFullPayment = false): Promise<void> {
    return withActionLock(`verify_deposit_${orderId}`, async () => {
      assertCsrfAndSameOrigin();
      enforceRateLimit('admin_mutation');
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
    });
  },

  /**
   * Admin gửi ảnh chụp / render bản Demo file 3D để khách hàng xem trước và chốt in
   */
  async sendDemo3DPreview(
    order: Order,
    payload: {
      imageUrl: string;
      images?: string[];
      adminNote?: string;
    }
  ): Promise<Demo3DPreview> {
    return withActionLock(`send_demo_${order.id}`, async () => {
      assertCsrfAndSameOrigin();
      enforceRateLimit('admin_mutation');

      if (!payload.imageUrl || !payload.imageUrl.trim()) {
        throw new Error('Vui lòng chọn ảnh chụp file 3D hoặc dán link ảnh demo.');
      }

      if (containsXssPayload(payload.adminNote)) {
        throw new Error('Lời nhắn chứa ký tự không hợp lệ.');
      }

      const db = requireSupabase();
      const firstItem = order.items?.[0];
      if (!firstItem) {
        throw new Error('Đơn hàng không có sản phẩm để gắn bản demo 3D.');
      }

      const demoPreview: Demo3DPreview = {
        imageUrl: payload.imageUrl.trim(),
        images: payload.images && payload.images.length > 0 ? payload.images : [payload.imageUrl.trim()],
        adminNote: payload.adminNote ? sanitizeText(payload.adminNote, 500) : undefined,
        sentAt: new Date().toISOString(),
        status: 'pending_review',
      };

      const updatedCustomization = {
        ...(firstItem.customization_data || {}),
        demoPreview,
      };

      let query = db
        .from('order_items')
        .update({ customization_data: updatedCustomization });

      if (firstItem.id) {
        query = query.eq('id', firstItem.id);
      } else {
        query = query.eq('order_id', order.id);
      }

      const { error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      // Tự động gửi Email thông báo bản Demo 3D cho khách hàng vào xem & chốt in
      emailService.notifyCustomerDemo3DSent(order, demoPreview).catch(() => {});

      return demoPreview;
    });
  },

  /**
   * Khách hàng xác nhận Chốt In ('approved') hoặc Yêu cầu chỉnh sửa thêm ('revision_requested')
   */
  async submitCustomerDemoReview(
    order: Order,
    payload: {
      status: DemoReviewStatus;
      customerFeedback?: string;
    }
  ): Promise<Demo3DPreview> {
    return withActionLock(`review_demo_${order.id}`, async () => {
      assertCsrfAndSameOrigin();
      enforceRateLimit('submit_payment_proof');

      if (containsXssPayload(payload.customerFeedback)) {
        throw new Error('Nội dung phản hồi chứa mã lệnh không an toàn.');
      }

      const cleanFeedback = payload.customerFeedback
        ? sanitizeText(payload.customerFeedback, 500)
        : undefined;
      const nowIso = new Date().toISOString();

      const firstItem = order.items?.[0];
      const existingDemo = firstItem?.customization_data?.demoPreview;
      if (!existingDemo) {
        throw new Error('Chưa có bản demo 3D trên đơn hàng này.');
      }

      const updatedDemo: Demo3DPreview = {
        ...existingDemo,
        status: payload.status,
        customerFeedback: cleanFeedback,
        reviewedAt: nowIso,
      };

      const updatedCustomization = {
        ...(firstItem.customization_data || {}),
        demoPreview: updatedDemo,
      };

      const db = requireSupabase();
      let savedViaOrderItems = false;

      // 1. Thử gọi RPC submit_order_demo_review (nếu đã tạo trong SQL)
      const { error: rpcErr } = await db.rpc('submit_order_demo_review', {
        p_order_id: order.id,
        p_status: payload.status,
        p_feedback: cleanFeedback || '',
      });
      if (!rpcErr) {
        savedViaOrderItems = true;
      }

      // 2. Thử cập nhật trực tiếp order_items (thành công ngay nếu là chủ đơn / Admin)
      if (!savedViaOrderItems) {
        let updateQuery = db
          .from('order_items')
          .update({ customization_data: updatedCustomization });

        if (firstItem.id) {
          updateQuery = updateQuery.eq('id', firstItem.id);
        } else {
          updateQuery = updateQuery.eq('order_id', order.id);
        }

        const { error: itemErr } = await updateQuery;
        if (!itemErr) {
          savedViaOrderItems = true;
        }
      }

      // 3. Ghi đồng thời vào bảng payments (hỗ trợ cả khách vãng lai chưa đăng nhập ngay lập tức)
      await db.from('payments').insert({
        order_id: order.id,
        amount: 0,
        payment_method: 'bank_transfer',
        payment_status: 'pending_verification',
        proof_image_url: `DEMO_REVIEW::${payload.status}::${cleanFeedback || ''}`,
      });

      // 4. Tự động gửi Email thông báo phản hồi / yêu cầu chỉnh sửa file 3D của khách về cho Admin
      emailService
        .notifyAdminCustomerAction(order, {
          type: payload.status === 'approved' ? 'demo_approved' : 'demo_revision_requested',
          feedback: cleanFeedback,
        })
        .catch(() => {});

      return updatedDemo;
    });
  },

  async updateOrderCustomerEmail(orderId: string, customerEmail: string): Promise<void> {
    return withActionLock(`update_email_${orderId}`, async () => {
      assertCsrfAndSameOrigin();
      if (containsXssPayload(customerEmail)) {
        throw new Error('Email chứa ký tự không hợp lệ.');
      }
      const cleanEmail = sanitizeText(customerEmail, 120);
      const db = requireSupabase();
      const { error } = await db
        .from('orders')
        .update({ customer_email: cleanEmail || null, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw new Error(error.message);
    });
  },
};
