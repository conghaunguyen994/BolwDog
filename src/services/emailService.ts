import { Demo3DPreview, Order, OrderStatus } from '../types/order';
import { EmailNotificationConfig } from '../types/settings';
import { defaultShopSettings } from '../constants/defaultSettings';
import { settingsService } from './settingsService';
import { formatVND } from '../utils/currency';
import { getOrderStatusLabel } from '../utils/statusLabels';

export interface EmailPayload {
  to: string;
  cc?: string;
  replyTo?: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  eventType:
    | 'new_order'
    | 'demo_3d_sent'
    | 'demo_approved'
    | 'demo_revision_requested'
    | 'payment_proof_submitted'
    | 'order_status_updated'
    | 'test_email';
  orderReference?: string;
}

function getBaseSiteUrl(customConfig?: EmailNotificationConfig): string {
  if (customConfig?.production_site_url?.trim()) {
    return customConfig.production_site_url.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    // Nếu đang test ở localhost, ưu tiên dùng domain production để link trong email bấm vào xem được trên điện thoại
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'https://bolwdog.vercel.app';
    }
    return origin.replace(/\/+$/, '');
  }
  return 'https://bolwdog.vercel.app';
}

export function buildOrderTrackingUrl(
  order: Pick<Order, 'order_reference' | 'customer_phone'>,
  customConfig?: EmailNotificationConfig
): string {
  const base = getBaseSiteUrl(customConfig);
  return `${base}/track?ref=${encodeURIComponent(order.order_reference)}&phone=${encodeURIComponent(
    order.customer_phone
  )}`;
}

export function buildGmailComposeUrl(params: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
}): string {
  const url = new URL('https://mail.google.com/mail/');
  url.searchParams.set('view', 'cm');
  url.searchParams.set('fs', '1');
  if (params.to) url.searchParams.set('to', params.to);
  if (params.cc) url.searchParams.set('cc', params.cc);
  url.searchParams.set('su', params.subject);
  url.searchParams.set('body', params.body);
  return url.toString();
}

async function getEmailConfig(): Promise<EmailNotificationConfig> {
  try {
    const settings = await settingsService.getSettings();
    return {
      ...defaultShopSettings.email_notifications!,
      ...(settings.email_notifications || {}),
    };
  } catch {
    return defaultShopSettings.email_notifications!;
  }
}

/**
 * Gửi email tự động qua đa kênh:
 * 1. Google Apps Script / Webhook tùy chỉnh (Gửi 2 chiều từ Gmail chính chủ tới cả Khách hàng & Admin)
 * 2. EmailJS REST API (Nếu Admin cấu hình Service ID / Template ID)
 * 3. FormSubmit AJAX Relay (Gửi thông báo trực tiếp tới hộp thư Admin & CC khách hàng không cần API key)
 */
export async function dispatchEmail(
  payload: EmailPayload,
  overrideConfig?: EmailNotificationConfig
): Promise<{ ok: boolean; channel: string; error?: string }> {
  const config = overrideConfig || (await getEmailConfig());
  if (!config.enabled) {
    return { ok: false, channel: 'disabled', error: 'Tính năng gửi email đang tắt.' };
  }

  // Kênh 1: Google Apps Script / Custom Webhook (Khuyên dùng - Gửi được tới mọi email khách hàng & Admin)
  if (config.webhook_url && config.webhook_url.trim().startsWith('https://')) {
    try {
      const res = await fetch(config.webhook_url.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          to: payload.to,
          cc: payload.cc || '',
          replyTo: payload.replyTo || config.admin_email,
          subject: payload.subject,
          textBody: payload.textBody,
          htmlBody: payload.htmlBody,
          eventType: payload.eventType,
          orderReference: payload.orderReference || '',
          sentAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        return { ok: true, channel: 'webhook' };
      }
    } catch (err) {
      console.warn('Webhook email error, falling back:', err);
    }
  }

  // Kênh 2: EmailJS REST API (Nếu có cấu hình trong Cài đặt tiệm)
  if (
    config.emailjs_service_id?.trim() &&
    config.emailjs_template_id?.trim() &&
    config.emailjs_public_key?.trim()
  ) {
    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: config.emailjs_service_id.trim(),
          template_id: config.emailjs_template_id.trim(),
          user_id: config.emailjs_public_key.trim(),
          template_params: {
            to_email: payload.to,
            cc_email: payload.cc || '',
            reply_to: payload.replyTo || config.admin_email,
            subject: payload.subject,
            message: payload.textBody,
            html_message: payload.htmlBody,
            order_reference: payload.orderReference || '',
          },
        }),
      });
      if (res.ok) {
        return { ok: true, channel: 'emailjs' };
      }
    } catch (err) {
      console.warn('EmailJS error, falling back:', err);
    }
  }

  // Kênh 3: FormSubmit.co AJAX Relay (Không cần backend hay API key trong .env)
  try {
    const targetEmail = payload.to || config.admin_email || 'conghaunguyen994@gmail.com.vn';
    const bodyData: Record<string, string> = {
      _subject: payload.subject,
      _template: 'box',
      _captcha: 'false',
      Ma_Don_Hang: payload.orderReference || 'BolwDog',
      Su_Kien: payload.eventType,
      Noi_Dung_Chi_Tiet: payload.textBody,
    };
    if (payload.cc) {
      bodyData._cc = payload.cc;
    }
    if (payload.replyTo) {
      bodyData._replyto = payload.replyTo;
    }

    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(bodyData),
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.success === 'false') {
        return {
          ok: false,
          channel: 'formsubmit',
          error: data.message || 'FormSubmit cần xác nhận kích hoạt từ email của bạn lần đầu tiên.',
        };
      }
      return { ok: true, channel: 'formsubmit' };
    }
  } catch (err: any) {
    return { ok: false, channel: 'none', error: err?.message };
  }

  return { ok: false, channel: 'none', error: 'Không thể kết nối máy chủ gửi email.' };
}

export const emailService = {
  /**
   * 1. Khi Khách tạo đơn hàng mới -> Gửi Email báo cho Admin + Gửi Email xác nhận cho Khách (nếu có điền email)
   */
  async notifyOrderCreated(order: Order): Promise<void> {
    const config = await getEmailConfig();
    if (!config.enabled || !config.notify_on_new_order) return;

    const trackingUrl = buildOrderTrackingUrl(order);
    const itemsSummary = order.items
      .map((it) => {
        const pet = it.customization_data?.petName || it.customization_data?.customText || 'Không khắc tên';
        const colors = [it.customization_data?.bodyColor, it.customization_data?.baseColor]
          .filter(Boolean)
          .join(' / ');
        return `- ${it.product_name} (SL: ${it.quantity}) | Tên bé: ${pet} ${colors ? `| Màu: ${colors}` : ''}`;
      })
      .join('\n');

    const adminSubject = `[BolwDog] 🛒 Đơn hàng mới #${order.order_reference} - ${order.customer_name} (${order.customer_phone})`;
    const adminText = [
      `Xin chào Admin Nguyễn Công Hậu,`,
      `Tiệm vừa nhận được đơn đặt hàng in 3D mới!`,
      ``,
      `• Mã đơn hàng: ${order.order_reference}`,
      `• Khách hàng: ${order.customer_name}`,
      `• Số điện thoại: ${order.customer_phone}`,
      `• Email khách: ${order.customer_email || 'Chưa cung cấp'}`,
      `• Địa chỉ giao: ${order.shipping_address}`,
      `• Tổng thanh toán: ${formatVND(order.total_amount)} (Cần cọc 50%: ${formatVND(order.deposit_amount)})`,
      `• Ghi chú: ${order.notes || 'Không có'}`,
      ``,
      `Danh sách sản phẩm đặt in 3D:`,
      itemsSummary,
      ``,
      `👉 Link kiểm tra đơn & gửi bản Demo 3D: ${getBaseSiteUrl()}/admin/orders`,
    ].join('\n');

    const adminHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #f3d6dc;border-radius:16px;background:#fffaf7;color:#3b251b;">
        <h2 style="color:#e11d48;margin-top:0;">🐾 Đơn Hàng In 3D Mới #${order.order_reference}</h2>
        <p><strong>Khách hàng:</strong> ${order.customer_name} (${order.customer_phone})</p>
        <p><strong>Email khách:</strong> ${order.customer_email || 'Chưa cung cấp'}</p>
        <p><strong>Địa chỉ nhận:</strong> ${order.shipping_address}</p>
        <p><strong>Tổng tiền:</strong> <strong style="color:#e11d48;">${formatVND(order.total_amount)}</strong> (Cọc 50%: ${formatVND(order.deposit_amount)})</p>
        <pre style="background:#ffffff;padding:12px;border-radius:10px;border:1px solid #eee;white-space:pre-wrap;">${itemsSummary}</pre>
        <p style="margin-top:16px;">
          <a href="${getBaseSiteUrl()}/admin/orders" style="display:inline-block;padding:10px 18px;background:#9333ea;color:#fff;text-decoration:none;border-radius:99px;font-weight:bold;">
            Mở Cổng Quản Trị Đơn Hàng
          </a>
        </p>
      </div>
    `;

    // Gửi về cho Admin
    await dispatchEmail(
      {
        to: config.admin_email,
        cc: config.admin_backup_email || undefined,
        replyTo: order.customer_email || undefined,
        subject: adminSubject,
        textBody: adminText,
        htmlBody: adminHtml,
        eventType: 'new_order',
        orderReference: order.order_reference,
      },
      config
    );

    // Nếu khách hàng có nhập Email -> Gửi email xác nhận đơn hàng cho khách
    if (order.customer_email && order.customer_email.includes('@')) {
      const custSubject = `[BolwDog Studio] 🐾 Xác nhận đơn hàng #${order.order_reference} của bé`;
      const custText = [
        `Chào ba mẹ ${order.customer_name},`,
        `Cảm ơn ba mẹ đã đặt sản phẩm in 3D cá nhân hóa tại BolwDog Studio!`,
        ``,
        `• Mã đơn hàng: ${order.order_reference}`,
        `• Tổng tiền: ${formatVND(order.total_amount)} (Số tiền đặt cọc 50%: ${formatVND(order.deposit_amount)})`,
        ``,
        `Chi tiết sản phẩm:`,
        itemsSummary,
        ``,
        `🎨 Quy trình tiếp theo: Sau khi xưởng thiết kế xong bản dựng file 3D theo tên & màu sắc của bé, xưởng sẽ gửi hình Demo 3D qua email này và trên trang tra cứu để ba mẹ xem trước và bấm "Chốt In".`,
        ``,
        `👉 Xem tiến độ đơn hàng & duyệt bản Demo 3D tại đây: ${trackingUrl}`,
      ].join('\n');

      const custHtml = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #f9a8d4;border-radius:16px;background:#fffaf7;color:#3b251b;">
          <h2 style="color:#db2777;margin-top:0;">🐾 Cảm ơn ba mẹ đã đặt hàng tại BolwDog Studio!</h2>
          <p>Xin chào <strong>${order.customer_name}</strong>,</p>
          <p>Đơn hàng <strong>#${order.order_reference}</strong> của bé đã được ghi nhận trên hệ thống.</p>
          <pre style="background:#ffffff;padding:12px;border-radius:10px;border:1px solid #f3d6dc;white-space:pre-wrap;">${itemsSummary}</pre>
          <p><strong>Tổng thanh toán:</strong> ${formatVND(order.total_amount)} (Cọc 50%: <strong>${formatVND(order.deposit_amount)}</strong>)</p>
          <p>🎨 <strong>Đặc biệt:</strong> Sau khi nghệ nhân dựng xong file 3D chuẩn bị in, xưởng sẽ gửi bản Demo 3D để ba mẹ kiểm tra và chốt duyệt trước khi bấm máy in!</p>
          <p style="margin-top:18px;">
            <a href="${trackingUrl}" style="display:inline-block;padding:12px 22px;background:#ec4899;color:#fff;text-decoration:none;border-radius:99px;font-weight:bold;">
              Theo Dõi Đơn & Xem Bản Demo 3D
            </a>
          </p>
        </div>
      `;

      await dispatchEmail(
        {
          to: order.customer_email.trim(),
          replyTo: config.admin_email,
          subject: custSubject,
          textBody: custText,
          htmlBody: custHtml,
          eventType: 'new_order',
          orderReference: order.order_reference,
        },
        config
      );
    }
  },

  /**
   * 2. Khi Admin gửi Bản Demo File 3D -> Gửi Email cho Khách hàng vào xem & chốt in
   */
  async notifyCustomerDemo3DSent(
    order: Order,
    demo: Demo3DPreview
  ): Promise<{ sent: boolean; gmailUrl: string }> {
    const config = await getEmailConfig();
    const trackingUrl = buildOrderTrackingUrl(order, config);
    const petName =
      order.items[0]?.customization_data?.petName ||
      order.items[0]?.customization_data?.customText ||
      'bé cưng';

    const subject = `[BolwDog Studio] 🎨 Bản Demo 3D đơn #${order.order_reference} (${petName}) đã sẵn sàng – Mời ba mẹ duyệt chốt in!`;
    const textBody = [
      `Chào ba mẹ ${order.customer_name},`,
      ``,
      `Nghệ nhân của BolwDog Studio vừa hoàn thiện bản dựng file 3D cho đơn hàng #${order.order_reference} (tên in trên bát: "${petName}").`,
      ``,
      `💬 Lời nhắn từ xưởng: "${demo.adminNote || 'Ba mẹ kiểm tra tên, icon và màu sắc trên bản dựng 3D rồi bấm Chốt In giúp xưởng nhé!'}"`,
      ``,
      `👉 Ba mẹ bấm vào đường link dưới đây để xem hình ảnh mô phỏng 3D chi tiết và bấm nút "✅ Xác Nhận Chốt In" (hoặc "✏️ Yêu Cầu Chỉnh Sửa Thêm" nếu muốn đổi chi tiết nào nhé):`,
      `${trackingUrl}`,
      ``,
      `Trân trọng,`,
      `BolwDog Studio – Nguyễn Công Hậu (Hotline/Zalo: 0345553913)`,
    ].join('\n');

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:20px;background-color:#FFF5EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="max-width:580px;margin:0 auto;background:#FFFFFF;border-radius:24px;border:2px solid #FBCFE8;overflow:hidden;box-shadow:0 10px 25px rgba(244,114,182,0.15);">
          
          <!-- Header Banner Cute Pastel -->
          <div style="background:linear-gradient(135deg, #FDF2F8 0%, #F5F3FF 100%);padding:28px 24px;text-align:center;border-bottom:1px solid #FBCFE8;">
            <div style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:18px;background:#FCE7F3;font-size:28px;margin-bottom:10px;">
              🐾
            </div>
            <h1 style="margin:0;font-size:22px;font-weight:900;color:#831843;letter-spacing:-0.5px;">
              BolwDog <span style="color:#EC4899;">Studio</span>
            </h1>
            <p style="margin:4px 0 0;font-size:12px;color:#9D174D;font-weight:600;">
              Xưởng in 3D sinh học cá nhân hóa cho thú cưng
            </p>
          </div>

          <!-- Main Content -->
          <div style="padding:28px 24px;color:#4A2810;">
            <div style="display:inline-block;background:#FDF2F8;border:1px solid #FBCFE8;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:800;color:#DB2777;text-transform:uppercase;margin-bottom:12px;">
              ✨ Bản Demo File 3D Hoàn Tất
            </div>

            <h2 style="margin:0 0 14px;font-size:18px;font-weight:900;color:#831843;line-height:1.4;">
              Mẫu thiết kế 3D của bé <span style="color:#DB2777;">"${petName}"</span> đã sẵn sàng cho ba mẹ duyệt!
            </h2>

            <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#52301B;">
              Chào ba mẹ <strong>${order.customer_name}</strong>,<br/>
              Nghệ nhân vừa hoàn thành mô phỏng 3D chiếc bát ăn theo đúng tên bé, phối màu và icon ba mẹ đã chọn cho đơn hàng <strong>#${order.order_reference}</strong>.
            </p>

            <!-- Lời nhắn nghệ nhân -->
            <div style="background:#FFF1F2;border-left:4px solid #F43F5E;border-radius:14px;padding:14px 16px;margin:18px 0;">
              <div style="font-size:11px;font-weight:800;color:#E11D48;text-transform:uppercase;margin-bottom:4px;">
                💬 Lời nhắn từ xưởng in 3D:
              </div>
              <div style="font-size:13px;font-style:italic;color:#881337;line-height:1.5;">
                "${demo.adminNote || 'Ba mẹ bấm vào link bên dưới để kiểm tra góc nhìn 3D, tên bé và phối màu rồi bấm nút Chốt In giúp xưởng nhé!'}"
              </div>
            </div>

            <!-- Big Action Button (Link clickable 100%) -->
            <div style="text-align:center;margin:30px 0 20px;">
              <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:linear-gradient(135deg, #EC4899 0%, #D946EF 100%);color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:900;padding:15px 32px;border-radius:99px;box-shadow:0 8px 20px rgba(236,72,153,0.35);letter-spacing:0.3px;">
                👉 Xem Bản Demo 3D & Bấm Chốt In Ngay
              </a>
              <p style="margin:10px 0 0;font-size:11px;color:#9CA3AF;">
                (Bấm vào nút trên để xem hình ảnh 3D và chọn <strong>Ưng ý 100%</strong> hoặc <strong>Yêu cầu chỉnh sửa thêm</strong>)
              </p>
            </div>

            <!-- Direct Link Fallback (Clickable <a>) -->
            <div style="margin-top:20px;padding:12px 14px;background:#F9FAFB;border-radius:12px;border:1px dashed #E5E7EB;word-break:break-all;">
              <span style="font-size:11px;color:#6B7280;font-weight:bold;display:block;margin-bottom:4px;">
                Hoặc copy/bấm link trực tiếp dưới đây:
              </span>
              <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563EB;font-size:12px;text-decoration:underline;font-weight:600;">
                ${trackingUrl}
              </a>
            </div>

          </div>

          <!-- Footer Info -->
          <div style="background:#FDF2F8;padding:18px 24px;border-top:1px solid #FBCFE8;text-align:center;font-size:11px;color:#831843;">
            <p style="margin:0 0 4px;font-weight:800;">
              🐾 BolwDog Boutique – Nguyễn Công Hậu
            </p>
            <p style="margin:0;color:#9D174D;">
              Hotline / Zalo hỗ trợ 24/7: <strong>0345.553.913</strong> • Địa chỉ xưởng: Quy Nhơn, Gia Lai
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    const gmailUrl = buildGmailComposeUrl({
      to: order.customer_email || '',
      subject,
      body: textBody,
    });

    if (!config.enabled || !config.notify_on_demo_sent || !order.customer_email) {
      return { sent: false, gmailUrl };
    }

    const res = await dispatchEmail(
      {
        to: order.customer_email.trim(),
        cc: config.admin_email,
        replyTo: config.admin_email,
        subject,
        textBody,
        htmlBody,
        eventType: 'demo_3d_sent',
        orderReference: order.order_reference,
      },
      config
    );

    return { sent: res.ok, gmailUrl };
  },

  /**
   * 3. Khi User thực hiện hành động (Chốt in 3D, Yêu cầu chỉnh sửa thêm file 3D, Gửi xác nhận chuyển khoản)
   *    -> Gửi Email thông báo ngay lập tức về cho Admin!
   */
  async notifyAdminCustomerAction(
    order: Order,
    action: {
      type: 'demo_approved' | 'demo_revision_requested' | 'payment_proof_submitted';
      feedback?: string;
    }
  ): Promise<void> {
    const config = await getEmailConfig();
    if (!config.enabled || !config.notify_on_demo_review) return;

    const trackingUrl = buildOrderTrackingUrl(order, config);
    const adminOrdersUrl = `${getBaseSiteUrl(config)}/admin/orders`;

    let subject = '';
    let actionHeading = '';
    let statusColor = '#16a34a';

    if (action.type === 'demo_revision_requested') {
      subject = `[BolwDog] ✏️ KHÁCH YÊU CẦU CHỈNH SỬA FILE 3D - Đơn #${order.order_reference} (${order.customer_name})`;
      actionHeading = `✏️ Khách hàng yêu cầu chỉnh sửa lại file 3D trên đơn #${order.order_reference}`;
      statusColor = '#e11d48';
    } else if (action.type === 'demo_approved') {
      subject = `[BolwDog] ✅ KHÁCH ĐÃ CHỐT IN FILE 3D - Đơn #${order.order_reference} (${order.customer_name})`;
      actionHeading = `✅ Khách hàng đã XÁC NHẬN CHỐT IN bản Demo 3D đơn #${order.order_reference}!`;
      statusColor = '#16a34a';
    } else {
      subject = `[BolwDog] 💸 Khách vừa gửi xác nhận chuyển khoản cọc - Đơn #${order.order_reference}`;
      actionHeading = `💸 Khách hàng vừa báo đã chuyển cọc cho đơn #${order.order_reference}`;
      statusColor = '#d97706';
    }

    const textBody = [
      `Xin chào Admin Nguyễn Công Hậu,`,
      ``,
      actionHeading,
      ``,
      `• Mã đơn hàng: ${order.order_reference}`,
      `• Khách hàng: ${order.customer_name}`,
      `• Số điện thoại: ${order.customer_phone}`,
      `• Email khách: ${order.customer_email || 'Chưa cung cấp'}`,
      action.feedback ? `• Nội dung phản hồi / yêu cầu chỉnh sửa của khách:\n  "${action.feedback}"` : '',
      `• Thời gian thực hiện: ${new Date().toLocaleString('vi-VN')}`,
      ``,
      `👉 Mở trang Quản lý đơn hàng Admin để xử lý ngay: ${adminOrdersUrl}`,
      `👉 Link đơn hàng phía khách: ${trackingUrl}`,
    ]
      .filter(Boolean)
      .join('\n');

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:20px;background-color:#FFF5EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="max-width:580px;margin:0 auto;background:#FFFFFF;border-radius:24px;border:2px solid ${statusColor}40;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <div style="background:${statusColor}15;padding:24px;border-bottom:1px solid ${statusColor}30;text-align:center;">
            <div style="font-size:28px;margin-bottom:6px;">🔔</div>
            <h1 style="margin:0;font-size:18px;font-weight:900;color:${statusColor};line-height:1.4;">
              ${actionHeading}
            </h1>
          </div>

          <!-- Body -->
          <div style="padding:24px;color:#4A2810;">
            <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:13px;">
              <tr>
                <td style="padding:8px 0;color:#8C6239;width:120px;">Mã đơn:</td>
                <td style="padding:8px 0;font-weight:900;color:#4A2810;">#${order.order_reference}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#8C6239;">Khách hàng:</td>
                <td style="padding:8px 0;font-weight:bold;">${order.customer_name} • <a href="tel:${order.customer_phone}" style="color:#2563EB;">${order.customer_phone}</a></td>
              </tr>
              ${order.customer_email ? `
              <tr>
                <td style="padding:8px 0;color:#8C6239;">Email khách:</td>
                <td style="padding:8px 0;font-weight:bold;"><a href="mailto:${order.customer_email}" style="color:#2563EB;">${order.customer_email}</a></td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding:8px 0;color:#8C6239;">Thời gian:</td>
                <td style="padding:8px 0;color:#6B7280;">${new Date().toLocaleString('vi-VN')}</td>
              </tr>
            </table>

            ${
              action.feedback
                ? `<div style="background:#FFF1F2;border-left:4px solid ${statusColor};border-radius:12px;padding:14px 16px;margin:16px 0;">
                    <div style="font-size:11px;font-weight:800;color:${statusColor};text-transform:uppercase;margin-bottom:4px;">
                      📝 Nội dung khách yêu cầu:
                    </div>
                    <div style="font-size:14px;font-weight:800;color:#881337;line-height:1.5;">
                      "${action.feedback}"
                    </div>
                  </div>`
                : ''
            }

            <div style="text-align:center;margin:28px 0 10px;">
              <a href="${adminOrdersUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:${statusColor};color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:900;padding:14px 30px;border-radius:99px;box-shadow:0 8px 18px ${statusColor}40;">
                Mở Cổng Admin Xử Lý Đơn Ngay
              </a>
            </div>

            <div style="margin-top:18px;text-align:center;">
              <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563EB;font-size:12px;text-decoration:underline;">
                Xem link giao diện trang tra cứu của khách
              </a>
            </div>
          </div>

        </div>
      </body>
      </html>
    `;

    // Gửi về cho Admin
    await dispatchEmail(
      {
        to: config.admin_email,
        cc: config.admin_backup_email || undefined,
        replyTo: order.customer_email || undefined,
        subject,
        textBody,
        htmlBody,
        eventType: action.type,
        orderReference: order.order_reference,
      },
      config
    );

    // Nếu khách có email -> Gửi email xác nhận đã tiếp nhận yêu cầu cho khách yên tâm
    if (order.customer_email && order.customer_email.includes('@')) {
      const custAckSubject =
        action.type === 'demo_approved'
          ? `[BolwDog Studio] ✅ Đã nhận xác nhận CHỐT IN 3D cho đơn #${order.order_reference}`
          : `[BolwDog Studio] ✍️ Đã tiếp nhận yêu cầu chỉnh sửa file 3D đơn #${order.order_reference}`;

      const custAckText =
        action.type === 'demo_approved'
          ? `Chào ba mẹ ${order.customer_name},\nXưởng đã nhận được xác nhận CHỐT IN bản thiết kế 3D cho đơn #${order.order_reference}. Nghệ nhân sẽ bắt đầu bấm máy in 3D cho bé ngay nhé!\nXem tiến độ tại: ${trackingUrl}`
          : `Chào ba mẹ ${order.customer_name},\nXưởng đã nhận được yêu cầu chỉnh sửa file 3D cho đơn #${order.order_reference} với nội dung: "${action.feedback || ''}".\nNghệ nhân sẽ điều chỉnh lại file 3D và gửi bản Demo mới qua email này cho ba mẹ duyệt lại nhé!\nXem tiến độ tại: ${trackingUrl}`;

      await dispatchEmail(
        {
          to: order.customer_email.trim(),
          replyTo: config.admin_email,
          subject: custAckSubject,
          textBody: custAckText,
          htmlBody: `<div style="font-family:sans-serif;padding:18px;border:1px solid #f3d6dc;border-radius:14px;"><p>${custAckText.replace(
            /\n/g,
            '<br/>'
          )}</p></div>`,
          eventType: action.type,
          orderReference: order.order_reference,
        },
        config
      );
    }
  },

  /**
   * 4. Khi Admin cập nhật trạng thái đơn hàng -> Gửi Email báo cho Khách hàng
   */
  async notifyOrderStatusChanged(order: Order, newStatus: OrderStatus): Promise<void> {
    const config = await getEmailConfig();
    if (!config.enabled || !config.notify_on_status_change) return;
    if (!order.customer_email || !order.customer_email.includes('@')) return;

    const statusLabel = getOrderStatusLabel(newStatus);
    const trackingUrl = buildOrderTrackingUrl(order);
    const subject = `[BolwDog Studio] 📦 Đơn hàng #${order.order_reference} vừa chuyển sang: ${statusLabel}`;
    const textBody = [
      `Chào ba mẹ ${order.customer_name},`,
      `Đơn hàng #${order.order_reference} của bé vừa được cập nhật trạng thái mới: "${statusLabel}".`,
      ``,
      `👉 Xem chi tiết tiến độ đơn hàng tại: ${trackingUrl}`,
    ].join('\n');

    await dispatchEmail(
      {
        to: order.customer_email.trim(),
        replyTo: config.admin_email,
        subject,
        textBody,
        htmlBody: `<div style="font-family:sans-serif;padding:18px;border:1px solid #f3d6dc;border-radius:14px;">
          <h3>📦 Cập nhật trạng thái đơn #${order.order_reference}</h3>
          <p>Trạng thái hiện tại: <strong style="color:#db2777;">${statusLabel}</strong></p>
          <p><a href="${trackingUrl}">Xem chi tiết tiến độ tại đây</a></p>
        </div>`,
        eventType: 'order_status_updated',
        orderReference: order.order_reference,
      },
      config
    );
  },

  /**
   * 5. Gửi Email kiểm tra kết nối từ trang Cài đặt Admin
   */
  async sendTestEmail(config: EmailNotificationConfig): Promise<{ ok: boolean; channel: string; error?: string }> {
    return dispatchEmail(
      {
        to: config.admin_email || 'conghaunguyen994@gmail.com.vn',
        cc: config.admin_backup_email || undefined,
        subject: '[BolwDog Studio] ✅ Kiểm tra kết nối thông báo Email 2 chiều thành công!',
        textBody:
          'Xin chào Nguyễn Công Hậu! Hệ thống thông báo Email tự động 2 chiều (Khách hàng ⇄ Admin) của BolwDog Studio đang hoạt động tốt.',
        htmlBody: `
          <div style="font-family:sans-serif;padding:20px;border:2px solid #ec4899;border-radius:16px;background:#fffaf7;">
            <h2 style="color:#db2777;margin-top:0;">🐾 Kết nối Email BolwDog Studio Thành Công!</h2>
            <p>Hệ thống gửi thông báo tự động khi khách đặt đơn, khi Admin gửi bản Demo 3D và khi khách phản hồi / yêu cầu chỉnh sửa file 3D đã sẵn sàng hoạt động.</p>
          </div>
        `,
        eventType: 'test_email',
        orderReference: 'TEST-EMAIL',
      },
      config
    );
  },
};
