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
  | 'deposit_confirmed'
  | 'demo_3d_sent'
  | 'demo_approved'
  | 'demo_revision_requested'
  | 'payment_proof_submitted'
  | 'order_status_updated'
  | 'test_email';
  orderReference?: string;
}

const DEPOSIT_EMAIL_SENT_PREFIX = 'bowldog_deposit_mail_sent_';

function escapeHtml(value?: string | null): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeEmailAddress(email?: string | null): string {
  const trimmed = String(email ?? '').trim();
  if (!trimmed || !trimmed.includes('@')) return '';
  return trimmed.replace(/@gmail\.com\.vn$/i, '@gmail.com');
}

function buildTransactionalEmailHtml(params: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  bodyHtml: string;
  footerNote: string;
  accentBg?: string;
  accentColor?: string;
}): string {
  const accentColor = params.accentColor || '#111827';
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:16px;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <div style="max-width:560px;margin:0 auto;">
        <div style="padding-bottom:12px;margin-bottom:16px;border-bottom:1px solid #e5e7eb;">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280;">${params.eyebrow}</p>
          <h2 style="margin:0;font-size:17px;font-weight:bold;color:#111827;line-height:1.4;">${params.title}</h2>
          ${params.subtitle ? `<p style="margin:4px 0 0;font-size:15px;font-weight:bold;color:${accentColor};">${params.subtitle}</p>` : ''}
        </div>
        <div style="font-size:14px;line-height:1.65;color:#1f2937;">
          ${params.bodyHtml}
        </div>
        <div style="margin-top:20px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;line-height:1.5;">
          ${params.footerNote}<br/>
          Hotline/Zalo hỗ trợ: 0345.553.913 &middot; 200 Phường Quy Nhơn Nam, TP. Quy Nhơn, Tỉnh Gia Lai.
        </div>
      </div>
    </body>
    </html>
  `;
}

export function hasDepositEmailBeenDispatched(orderKey?: string): boolean {
  if (!orderKey || typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(`${DEPOSIT_EMAIL_SENT_PREFIX}${orderKey}`) === '1';
  } catch {
    return false;
  }
}

export function markDepositEmailDispatched(orderKey?: string): void {
  if (!orderKey || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${DEPOSIT_EMAIL_SENT_PREFIX}${orderKey}`, '1');
  } catch {
    // Bỏ qua lỗi quota / private mode
  }
}

function normalizeProductionUrl(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^https:\/([^/])/i, 'https://$1')
    .replace(/^http:\/([^/])/i, 'http://$1')
    .replace(/\.vercel\.appp+\b/i, '.vercel.app')
    .replace(/\/+$/, '');
}

function getBaseSiteUrl(customConfig?: EmailNotificationConfig): string {
  const configured = normalizeProductionUrl(customConfig?.production_site_url);
  if (
    configured &&
    configured.startsWith('http') &&
    !/^https?:\/\/bolwdog\.vercel\.app$/i.test(configured)
  ) {
    return configured;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.replace(/\/+$/, '');
    // Nếu đang test ở localhost, ưu tiên dùng domain production để link trong email bấm vào xem được trên điện thoại
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin;
    }
  }
  return 'https://bowlshop.vercel.app';
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

async function checkHasServerEmailProvider(): Promise<boolean> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status' }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      return Boolean(json?.hasServerProvider);
    }
  } catch {
    // Bỏ qua nếu đang chạy vite dev local không có `/api/send-email`
  }
  return false;
}

/**
 * Gửi email tự động qua đa kênh (không lưu bất kỳ API key hay Webhook URL nào ở client/DB):
 * 1. Serverless API `/api/send-email` (đọc `EMAIL_WEBHOOK_URL` / `EMAILJS_*` từ `.env` server)
 * 2. FormSubmit AJAX Relay (dự phòng khi server `.env` chưa cấu hình kênh gửi email)
 */
export async function dispatchEmail(
  payload: EmailPayload,
  overrideConfig?: EmailNotificationConfig
): Promise<{ ok: boolean; channel: string; error?: string }> {
  const config = overrideConfig || (await getEmailConfig());
  if (!config.enabled) {
    return { ok: false, channel: 'disabled', error: 'Tính năng gửi email đang tắt.' };
  }

  const normalizedTo = normalizeEmailAddress(payload.to);
  const normalizedCcRaw = normalizeEmailAddress(payload.cc);
  const normalizedCc =
    normalizedCcRaw && normalizedCcRaw.toLowerCase() !== normalizedTo.toLowerCase()
      ? normalizedCcRaw
      : '';
  const normalizedReplyTo = normalizeEmailAddress(payload.replyTo || config.admin_email);

  // Kênh 1: Serverless Backend /api/send-email (đọc EMAIL_WEBHOOK_URL & EmailJS keys an toàn từ .env)
  try {
    const apiRes = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: normalizedTo,
        cc: normalizedCc,
        replyTo: normalizedReplyTo,
        subject: payload.subject,
        textBody: payload.textBody,
        htmlBody: payload.htmlBody,
        eventType: payload.eventType,
        orderReference: payload.orderReference || '',
      }),
    });
    const contentType = apiRes.headers.get('content-type') || '';
    if (apiRes.ok && contentType.includes('application/json')) {
      const json = await apiRes.json();
      if (json?.ok) {
        return { ok: true, channel: json.channel || 'server' };
      }
    }
  } catch (err) {
    console.warn('Server email relay error, falling back:', err);
  }

  // Kênh 2: FormSubmit.co AJAX Relay (Dự phòng miễn phí không cần API key)
  try {
    const targetEmail =
      normalizedTo || normalizeEmailAddress(config.admin_email) || 'conghaunguyen994@gmail.com';
    const bodyData: Record<string, string> = {
      _subject: payload.subject,
      _template: 'box',
      _captcha: 'false',
      Ma_Don_Hang: payload.orderReference || 'UOaShop',
      Su_Kien: payload.eventType,
      Noi_Dung_Chi_Tiet: payload.textBody,
    };
    if (normalizedCc) {
      bodyData._cc = normalizedCc;
    }
    if (normalizedReplyTo) {
      bodyData._replyto = normalizedReplyTo;
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
    const depositPct =
      order.total_amount > 0 ? Math.round((order.deposit_amount / order.total_amount) * 100) : 0;
    const itemsSummary = order.items
      .map((it) => {
        const pet = it.customization_data?.petName || it.customization_data?.customText || 'Không khắc tên';
        const colors = [it.customization_data?.bodyColor, it.customization_data?.baseColor]
          .filter(Boolean)
          .join(' / ');
        return `- ${it.product_name} (SL: ${it.quantity}) | Tên bé: ${pet} ${colors ? `| Màu: ${colors}` : ''}`;
      })
      .join('\n');

    const safeRef = escapeHtml(order.order_reference);
    const safeName = escapeHtml(order.customer_name);
    const safePhone = escapeHtml(order.customer_phone);
    const safeCustomerEmail = escapeHtml(order.customer_email || 'Chưa cung cấp');
    const safeAddress = escapeHtml(order.shipping_address);
    const safeItemsSummary = escapeHtml(itemsSummary);
    const adminOrdersUrl = `${getBaseSiteUrl(config)}/admin/orders`;

    const adminSubject = `Đơn hàng mới #${order.order_reference} - ${order.customer_name} (${order.customer_phone})`;
    const adminText = [
      `Xin chào Admin Nguyễn Công Hậu,`,
      `Hệ thống vừa ghi nhận đơn đặt hàng in 3D mới.`,
      ``,
      `- Mã đơn hàng: #${order.order_reference}`,
      `- Khách hàng: ${order.customer_name}`,
      `- Số điện thoại: ${order.customer_phone}`,
      `- Email khách: ${order.customer_email || 'Chưa cung cấp'}`,
      `- Địa chỉ giao: ${order.shipping_address}`,
      `- Tổng thanh toán: ${formatVND(order.total_amount)} (Cọc ${depositPct}%: ${formatVND(order.deposit_amount)})`,
      `- Ghi chú: ${order.notes || 'Không có'}`,
      ``,
      `Danh sách sản phẩm:`,
      itemsSummary,
      ``,
      `Mở trang quản trị đơn hàng: ${adminOrdersUrl}`,
    ].join('\n');

    const adminHtml = buildTransactionalEmailHtml({
      eyebrow: 'Ú òa Shop - Đơn hàng mới',
      title: `Đơn hàng in 3D mới #${safeRef}`,
      accentBg: '#fdf2f8',
      accentColor: '#be185d',
      bodyHtml: `
        <p style="margin:0 0 8px;"><strong>Khách hàng:</strong> ${safeName} (${safePhone})</p>
        <p style="margin:0 0 8px;"><strong>Email khách:</strong> ${safeCustomerEmail}</p>
        <p style="margin:0 0 8px;"><strong>Địa chỉ nhận:</strong> ${safeAddress}</p>
        <p style="margin:0 0 12px;"><strong>Tổng tiền:</strong> ${formatVND(order.total_amount)} (Cọc ${depositPct}%: <strong>${formatVND(order.deposit_amount)}</strong>)</p>
        <pre style="background:#f9fafb;padding:12px;border-radius:8px;border:1px solid #e5e7eb;white-space:pre-wrap;font-family:Arial,Helvetica,sans-serif;font-size:13px;margin:0 0 16px;">${safeItemsSummary}</pre>
        <p style="margin:0;">
          <a href="${adminOrdersUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 22px;background:#be185d;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">
            Mở trang quản trị đơn hàng
          </a>
        </p>
      `,
      footerNote: `Thông báo đơn hàng mới #${safeRef} từ hệ thống Ú òa Shop.`,
    });

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
      const custSubject = `Xác nhận đơn hàng #${order.order_reference} tại Ú òa Shop`;
      const custText = [
        `Chào bạn ${order.customer_name},`,
        `Cảm ơn bạn đã đặt sản phẩm in 3D cá nhân hóa tại Ú òa Shop.`,
        ``,
        `- Mã đơn hàng: #${order.order_reference}`,
        `- Tổng tiền: ${formatVND(order.total_amount)} (Đặt cọc ${depositPct}%: ${formatVND(order.deposit_amount)})`,
        ``,
        `Chi tiết sản phẩm:`,
        itemsSummary,
        ``,
        `Quy trình tiếp theo: Sau khi xưởng thiết kế xong bản dựng 3D theo yêu cầu, xưởng sẽ gửi hình xem trước qua email này và trên trang tra cứu để bạn kiểm tra và xác nhận trước khi in.`,
        ``,
        `Theo dõi tiến độ đơn hàng tại: ${trackingUrl}`,
        ``,
        `Trân trọng,`,
        `Ú òa Shop - Hotline/Zalo: 0345.553.913`,
      ].join('\n');

      const custHtml = buildTransactionalEmailHtml({
        eyebrow: 'Ú òa Shop',
        title: `Xác nhận đơn hàng #${safeRef}`,
        accentBg: '#fdf2f8',
        accentColor: '#be185d',
        bodyHtml: `
          <p style="margin:0 0 12px;">Chào bạn <strong>${safeName}</strong>,</p>
          <p style="margin:0 0 12px;">Đơn hàng <strong>#${safeRef}</strong> của bạn đã được ghi nhận trên hệ thống Ú òa Shop.</p>
          <pre style="background:#f9fafb;padding:12px;border-radius:8px;border:1px solid #e5e7eb;white-space:pre-wrap;font-family:Arial,Helvetica,sans-serif;font-size:13px;margin:0 0 14px;">${safeItemsSummary}</pre>
          <p style="margin:0 0 12px;"><strong>Tổng thanh toán:</strong> ${formatVND(order.total_amount)} (Cọc ${depositPct}%: <strong>${formatVND(order.deposit_amount)}</strong>)</p>
          <p style="margin:0 0 18px;font-size:13px;color:#374151;">Sau khi xưởng hoàn thiện bản dựng 3D theo yêu cầu, chúng tôi sẽ gửi bản xem trước để bạn kiểm tra và xác nhận trước khi in.</p>
          <p style="margin:0 0 14px;">
            <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 22px;background:#be185d;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">
              Theo dõi đơn hàng
            </a>
          </p>
          <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;">
            Link tra cứu trực tiếp: <a href="${trackingUrl}" style="color:#2563eb;">${trackingUrl}</a>
          </p>
        `,
        footerNote: `Email này được gửi tự động để xác nhận đơn hàng #${safeRef} bạn vừa đặt tại Ú òa Shop.`,
      });

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
    const safeRef = escapeHtml(order.order_reference);
    const safeName = escapeHtml(order.customer_name);
    const safePetName = escapeHtml(petName);
    const noteText =
      demo.adminNote ||
      'Bạn vui lòng kiểm tra tên, biểu tượng và màu sắc trên bản dựng 3D rồi xác nhận chốt in giúp xưởng.';

    const subject = `Bản xem trước 3D đơn hàng #${order.order_reference} (${petName}) đã sẵn sàng`;
    const textBody = [
      `Chào bạn ${order.customer_name},`,
      ``,
      `Xưởng Ú òa Shop vừa hoàn thiện bản dựng 3D cho đơn hàng #${order.order_reference} (tên khắc: "${petName}").`,
      ``,
      `Ghi chú từ xưởng: "${noteText}"`,
      ``,
      `Bạn vui lòng mở đường link dưới đây để xem hình ảnh mô phỏng 3D và chọn Xác nhận chốt in (hoặc gửi yêu cầu chỉnh sửa thêm nếu cần):`,
      `${trackingUrl}`,
      ``,
      `Trân trọng,`,
      `Ú òa Shop - Hotline/Zalo: 0345.553.913`,
    ].join('\n');

    const htmlBody = buildTransactionalEmailHtml({
      eyebrow: 'Ú òa Shop - Bản xem trước 3D',
      title: `Mẫu thiết kế 3D đơn hàng #${safeRef} đã sẵn sàng`,
      accentBg: '#fdf2f8',
      accentColor: '#be185d',
      bodyHtml: `
        <p style="margin:0 0 12px;">Chào bạn <strong>${safeName}</strong>,</p>
        <p style="margin:0 0 14px;">
          Xưởng vừa hoàn thiện bản mô phỏng 3D cho đơn hàng <strong>#${safeRef}</strong> (tên khắc: <strong>${safePetName}</strong>).
        </p>
        <div style="background:#f9fafb;border-left:3px solid #be185d;padding:12px 14px;margin:0 0 18px;font-size:13px;color:#374151;">
          <strong>Ghi chú từ xưởng:</strong><br/>
          ${escapeHtml(noteText)}
        </div>
        <p style="margin:0 0 18px;">
          <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#be185d;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:11px 22px;border-radius:8px;">
            Xem bản dựng 3D và xác nhận chốt in
          </a>
        </p>
        <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;">
          Link tra cứu trực tiếp: <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;">${trackingUrl}</a>
        </p>
      `,
      footerNote: `Email này được gửi tự động để mời bạn duyệt mẫu thiết kế 3D cho đơn hàng #${safeRef} tại Ú òa Shop.`,
    });

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
    const safeRef = escapeHtml(order.order_reference);
    const safeName = escapeHtml(order.customer_name);
    const safePhone = escapeHtml(order.customer_phone);
    const safeEmail = escapeHtml(order.customer_email || '');

    let subject = '';
    let actionHeading = '';
    let statusColor = '#059669';
    let accentBg = '#f0fdf4';

    if (action.type === 'demo_revision_requested') {
      subject = `Khách yêu cầu chỉnh sửa file 3D đơn #${order.order_reference} - ${order.customer_name}`;
      actionHeading = `Khách hàng yêu cầu chỉnh sửa file 3D đơn #${order.order_reference}`;
      statusColor = '#dc2626';
      accentBg = '#fef2f2';
    } else if (action.type === 'demo_approved') {
      subject = `Khách đã duyệt chốt in file 3D đơn #${order.order_reference} - ${order.customer_name}`;
      actionHeading = `Khách hàng đã xác nhận chốt in 3D đơn #${order.order_reference}`;
      statusColor = '#059669';
      accentBg = '#f0fdf4';
    } else {
      subject = `Khách báo đã chuyển khoản cọc đơn #${order.order_reference} - ${order.customer_name}`;
      actionHeading = `Khách hàng báo đã chuyển khoản cọc đơn #${order.order_reference}`;
      statusColor = '#d97706';
      accentBg = '#fffbeb';
    }

    const textBody = [
      `Xin chào Admin Nguyễn Công Hậu,`,
      ``,
      actionHeading,
      ``,
      `- Mã đơn hàng: #${order.order_reference}`,
      `- Khách hàng: ${order.customer_name}`,
      `- Số điện thoại: ${order.customer_phone}`,
      `- Email khách: ${order.customer_email || 'Chưa cung cấp'}`,
      action.feedback ? `- Phản hồi của khách: "${action.feedback}"` : '',
      `- Thời gian thực hiện: ${new Date().toLocaleString('vi-VN')}`,
      ``,
      `Mở trang quản lý đơn hàng: ${adminOrdersUrl}`,
      `Trang tra cứu phía khách: ${trackingUrl}`,
    ]
      .filter(Boolean)
      .join('\n');

    const htmlBody = buildTransactionalEmailHtml({
      eyebrow: 'Ú òa Shop - Phản hồi từ khách hàng',
      title: escapeHtml(actionHeading),
      accentBg,
      accentColor: statusColor,
      bodyHtml: `
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px;">
          <tr>
            <td style="padding:6px 0;color:#6b7280;width:120px;">Mã đơn:</td>
            <td style="padding:6px 0;font-weight:bold;">#${safeRef}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Khách hàng:</td>
            <td style="padding:6px 0;font-weight:bold;">${safeName} - <a href="tel:${safePhone}" style="color:#2563eb;text-decoration:none;">${safePhone}</a></td>
          </tr>
          ${order.customer_email ? `
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Email khách:</td>
            <td style="padding:6px 0;"><a href="mailto:${safeEmail}" style="color:#2563eb;text-decoration:none;">${safeEmail}</a></td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Thời gian:</td>
            <td style="padding:6px 0;">${escapeHtml(new Date().toLocaleString('vi-VN'))}</td>
          </tr>
        </table>
        ${action.feedback
          ? `<div style="background:#f9fafb;border-left:3px solid ${statusColor};padding:12px 14px;margin:0 0 18px;font-size:13px;">
              <strong>Nội dung khách yêu cầu:</strong><br/>
              ${escapeHtml(action.feedback)}
            </div>`
          : ''
        }
        <p style="margin:0 0 12px;">
          <a href="${adminOrdersUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:${statusColor};color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:11px 22px;border-radius:8px;">
            Mở trang quản trị đơn hàng
          </a>
        </p>
        <p style="margin:0;font-size:12px;color:#6b7280;">
          Trang tra cứu của khách: <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;">${trackingUrl}</a>
        </p>
      `,
      footerNote: `Thông báo tự động từ đơn hàng #${safeRef} tại Ú òa Shop.`,
    });

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
          ? `Xác nhận chốt in 3D đơn hàng #${order.order_reference} - Ú òa Shop`
          : `Đã tiếp nhận yêu cầu chỉnh sửa 3D đơn hàng #${order.order_reference} - Ú òa Shop`;

      const custAckText =
        action.type === 'demo_approved'
          ? `Chào bạn ${order.customer_name},\nXưởng đã nhận được xác nhận chốt in bản thiết kế 3D cho đơn hàng #${order.order_reference}. Chúng tôi sẽ tiến hành in 3D cho đơn hàng của bạn.\nXem tiến độ tại: ${trackingUrl}\n\nTrân trọng,\nÚ òa Shop - Hotline/Zalo: 0345.553.913`
          : `Chào bạn ${order.customer_name},\nXưởng đã tiếp nhận yêu cầu chỉnh sửa file 3D cho đơn hàng #${order.order_reference} với nội dung: "${action.feedback || ''}".\nChúng tôi sẽ điều chỉnh lại và gửi bản xem trước mới qua email này để bạn kiểm tra.\nXem tiến độ tại: ${trackingUrl}\n\nTrân trọng,\nÚ òa Shop - Hotline/Zalo: 0345.553.913`;

      await dispatchEmail(
        {
          to: order.customer_email.trim(),
          replyTo: config.admin_email,
          subject: custAckSubject,
          textBody: custAckText,
          htmlBody: buildTransactionalEmailHtml({
            eyebrow: 'Ú òa Shop',
            title:
              action.type === 'demo_approved'
                ? `Đã xác nhận chốt in đơn #${safeRef}`
                : `Đã tiếp nhận yêu cầu chỉnh sửa đơn #${safeRef}`,
            accentBg: '#f0fdf4',
            accentColor: '#059669',
            bodyHtml: `
              <p style="margin:0 0 12px;">Chào bạn <strong>${safeName}</strong>,</p>
              <p style="margin:0 0 16px;">${
                action.type === 'demo_approved'
                  ? `Xưởng đã nhận được xác nhận chốt in bản thiết kế 3D cho đơn hàng <strong>#${safeRef}</strong> và sẽ bắt đầu tiến hành in 3D.`
                  : `Xưởng đã tiếp nhận yêu cầu chỉnh sửa file 3D cho đơn hàng <strong>#${safeRef}</strong>${action.feedback ? ` với nội dung: "${escapeHtml(action.feedback)}"` : ''}. Chúng tôi sẽ điều chỉnh và gửi lại bản xem trước mới sớm nhất.`
              }</p>
              <p style="margin:0;">
                <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:11px 22px;border-radius:8px;">
                  Theo dõi tiến độ đơn hàng
                </a>
              </p>
            `,
            footerNote: `Email xác nhận tự động cho đơn hàng #${safeRef} tại Ú òa Shop.`,
          }),
          eventType: action.type,
          orderReference: order.order_reference,
        },
        config
      );
    }
  },

  /**
   * 3b. Đồng thời gửi Email xác nhận ĐÃ NHẬN TIỀN CỌC cho cả Admin và Khách hàng
   */
  async notifyDepositConfirmed(
    order: Pick<
      Order,
      | 'id'
      | 'order_reference'
      | 'customer_name'
      | 'customer_phone'
      | 'customer_email'
      | 'shipping_address'
      | 'total_amount'
      | 'deposit_amount'
      | 'payment_status'
      | 'items'
    >,
    options?: {
      paidAmount?: number;
      gateway?: string;
      skipIfServerWebhookConfigured?: boolean;
      force?: boolean;
    }
  ): Promise<{ sent: boolean; adminSent: boolean; customerSent: boolean }> {
    const dedupeKey = order.id || order.order_reference;
    if (!options?.force && hasDepositEmailBeenDispatched(dedupeKey)) {
      return { sent: false, adminSent: false, customerSent: false };
    }

    const config = await getEmailConfig();
    if (!config.enabled) {
      return { sent: false, adminSent: false, customerSent: false };
    }

    if (options?.skipIfServerWebhookConfigured && (await checkHasServerEmailProvider())) {
      markDepositEmailDispatched(dedupeKey);
      return { sent: false, adminSent: false, customerSent: false };
    }

    markDepositEmailDispatched(dedupeKey);

    const paidAmount =
      options?.paidAmount && options.paidAmount > 0 ? options.paidAmount : order.deposit_amount || 0;
    const totalAmount = Number(order.total_amount || 0);
    const remainingAmount = totalAmount > 0 ? Math.max(0, totalAmount - paidAmount) : 0;
    const gateway = options?.gateway?.trim() || 'MB Bank / SePay';
    const trackingUrl = buildOrderTrackingUrl(order, config);
    const adminOrdersUrl = `${getBaseSiteUrl(config)}/admin/orders`;
    const nowFormatted = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    const safeRef = escapeHtml(order.order_reference);
    const safeName = escapeHtml(order.customer_name);
    const safePhone = escapeHtml(order.customer_phone);
    const safeEmail = escapeHtml(order.customer_email || '');
    const safeGateway = escapeHtml(gateway);
    const firstItemName = order.items?.[0]?.product_name
      ? escapeHtml(order.items[0].product_name)
      : '';

    const hasAdminEmail = Boolean(config.admin_email && config.admin_email.includes('@'));
    const hasCustomerEmail = Boolean(order.customer_email && order.customer_email.includes('@'));

    const adminPromise: Promise<boolean> = hasAdminEmail
      ? dispatchEmail(
        {
          to: config.admin_email.trim(),
          cc: config.admin_backup_email?.trim() || undefined,
          replyTo: hasCustomerEmail ? order.customer_email!.trim() : config.admin_email.trim(),
          subject: `Xác nhận đã nhận cọc ${formatVND(paidAmount)} đơn #${order.order_reference} - ${order.customer_name}`,
          textBody: [
            `Xin chào Admin Nguyễn Công Hậu,`,
            ``,
            `Hệ thống vừa xác nhận đã nhận tiền cọc cho đơn hàng #${order.order_reference}.`,
            `- Khách hàng: ${order.customer_name} (${order.customer_phone})`,
            hasCustomerEmail ? `- Email khách: ${order.customer_email}` : '',
            `- Số tiền cọc đã nhận: ${formatVND(paidAmount)}`,
            totalAmount > 0
              ? `- Tổng đơn: ${formatVND(totalAmount)} (Còn lại thu COD: ${formatVND(remainingAmount)})`
              : '',
            `- Kênh xác nhận: ${gateway}`,
            `- Thời gian: ${nowFormatted}`,
            ``,
            `Mở trang quản trị đơn hàng: ${adminOrdersUrl}`,
            `Trang tra cứu phía khách: ${trackingUrl}`,
          ]
            .filter(Boolean)
            .join('\n'),
          htmlBody: buildTransactionalEmailHtml({
            eyebrow: 'Ú òa Shop - Thông báo thanh toán',
            title: `Đã nhận tiền cọc đơn #${safeRef}`,
            subtitle: `+${formatVND(paidAmount)}`,
            accentBg: '#f0fdf4',
            accentColor: '#059669',
            bodyHtml: `
              <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
                <tr>
                  <td style="padding:6px 0;color:#6b7280;width:130px;">Khách hàng:</td>
                  <td style="padding:6px 0;font-weight:bold;">${safeName} - <a href="tel:${safePhone}" style="color:#2563eb;text-decoration:none;">${safePhone}</a></td>
                </tr>
                ${hasCustomerEmail
                  ? `<tr><td style="padding:6px 0;color:#6b7280;">Email khách:</td><td style="padding:6px 0;"><a href="mailto:${safeEmail}" style="color:#2563eb;text-decoration:none;">${safeEmail}</a></td></tr>`
                  : ''
                }
                ${firstItemName
                  ? `<tr><td style="padding:6px 0;color:#6b7280;">Sản phẩm chính:</td><td style="padding:6px 0;">${firstItemName}</td></tr>`
                  : ''
                }
                <tr>
                  <td style="padding:6px 0;color:#6b7280;">Kênh nhận:</td>
                  <td style="padding:6px 0;">${safeGateway}</td>
                </tr>
                ${totalAmount > 0
                  ? `<tr><td style="padding:6px 0;color:#6b7280;">Tổng đơn / COD:</td><td style="padding:6px 0;"><strong>${formatVND(totalAmount)}</strong> (Còn thu COD: <strong>${formatVND(remainingAmount)}</strong>)</td></tr>`
                  : ''
                }
                <tr>
                  <td style="padding:6px 0;color:#6b7280;">Thời gian:</td>
                  <td style="padding:6px 0;">${escapeHtml(nowFormatted)}</td>
                </tr>
              </table>
              <p style="margin:0 0 12px;">
                <a href="${adminOrdersUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:11px 22px;border-radius:8px;">
                  Mở trang quản trị đơn hàng
                </a>
              </p>
              <p style="margin:0;font-size:12px;color:#6b7280;">
                Trang tra cứu của khách: <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;">${trackingUrl}</a>
              </p>
            `,
            footerNote: `Thông báo tự động từ đơn hàng #${safeRef} tại Ú òa Shop.`,
          }),
          eventType: 'deposit_confirmed',
          orderReference: order.order_reference,
        },
        config
      )
        .then(() => true)
        .catch(() => false)
      : Promise.resolve(false);

    const customerPromise: Promise<boolean> = hasCustomerEmail
      ? dispatchEmail(
        {
          to: order.customer_email!.trim(),
          replyTo: config.admin_email.trim(),
          subject: `Xác nhận đã nhận tiền cọc đơn hàng #${order.order_reference} - Ú òa Shop`,
          textBody: [
            `Chào bạn ${order.customer_name},`,
            ``,
            `Ú òa Shop xác nhận đã nhận được khoản chuyển khoản tiền cọc ${formatVND(paidAmount)} qua ${gateway} cho đơn hàng #${order.order_reference}.`,
            totalAmount > 0 ? `- Tổng giá trị đơn: ${formatVND(totalAmount)}` : '',
            `- Đã thanh toán cọc: ${formatVND(paidAmount)}`,
            totalAmount > 0
              ? `- Số tiền còn lại khi nhận hàng (COD): ${formatVND(remainingAmount)}`
              : '',
            `- Thời gian ghi nhận: ${nowFormatted}`,
            ``,
            `Xưởng đang bắt đầu dựng file 3D cá nhân hóa cho đơn hàng của bạn và sẽ gửi bản xem trước để bạn kiểm tra trước khi in.`,
            ``,
            `Theo dõi tiến độ đơn hàng tại: ${trackingUrl}`,
            ``,
            `Trân trọng,`,
            `Ú òa Shop - Hotline/Zalo: 0345.553.913`,
          ]
            .filter(Boolean)
            .join('\n'),
          htmlBody: buildTransactionalEmailHtml({
            eyebrow: 'Ú òa Shop',
            title: `Xác nhận đã nhận tiền cọc đơn hàng #${safeRef}`,
            accentBg: '#fdf2f8',
            accentColor: '#be185d',
            bodyHtml: `
              <p style="margin:0 0 12px;">Chào bạn <strong>${safeName}</strong>,</p>
              <p style="margin:0 0 16px;">
                Ú òa Shop đã ghi nhận khoản chuyển khoản <strong>${formatVND(paidAmount)}</strong> qua <strong>${safeGateway}</strong> vào lúc ${escapeHtml(nowFormatted)} cho đơn hàng <strong>#${safeRef}</strong>.
              </p>
              <table style="width:100%;border-collapse:collapse;font-size:13px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:16px;">
                <tr>
                  <td style="padding:8px 12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Mã đơn hàng</td>
                  <td style="padding:8px 12px;text-align:right;font-weight:bold;border-bottom:1px solid #e5e7eb;">#${safeRef}</td>
                </tr>
                ${totalAmount > 0
                  ? `<tr><td style="padding:8px 12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Tổng giá trị đơn</td><td style="padding:8px 12px;text-align:right;border-bottom:1px solid #e5e7eb;">${formatVND(totalAmount)}</td></tr>`
                  : ''
                }
                <tr>
                  <td style="padding:8px 12px;color:#047857;font-weight:bold;border-bottom:1px solid #e5e7eb;">Đã thanh toán cọc</td>
                  <td style="padding:8px 12px;text-align:right;font-weight:bold;color:#059669;border-bottom:1px solid #e5e7eb;">${formatVND(paidAmount)}</td>
                </tr>
                ${totalAmount > 0
                  ? `<tr><td style="padding:8px 12px;color:#6b7280;">Còn lại khi nhận hàng (COD)</td><td style="padding:8px 12px;text-align:right;font-weight:bold;">${formatVND(remainingAmount)}</td></tr>`
                  : ''
                }
              </table>
              <p style="margin:0 0 18px;font-size:13px;color:#374151;">
                <strong>Bước tiếp theo:</strong> Xưởng đang tiến hành thiết kế bản dựng 3D cá nhân hóa và sẽ gửi bản xem trước để bạn kiểm tra, xác nhận trước khi in.
              </p>
              <p style="margin:0 0 16px;">
                <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:11px 22px;border-radius:8px;">
                  Theo dõi tiến độ đơn hàng
                </a>
              </p>
              <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;">
                Link tra cứu trực tiếp: <a href="${trackingUrl}" style="color:#2563eb;">${trackingUrl}</a>
              </p>
            `,
            footerNote: `Email này được gửi tự động để xác nhận thanh toán cho đơn hàng #${safeRef} tại Ú òa Shop.`,
          }),
          eventType: 'deposit_confirmed',
          orderReference: order.order_reference,
        },
        config
      )
        .then(() => true)
        .catch(() => false)
      : Promise.resolve(false);

    const [adminSent, customerSent] = await Promise.all([adminPromise, customerPromise]);
    return {
      sent: adminSent || customerSent,
      adminSent,
      customerSent,
    };
  },

  /**
   * 4. Khi Admin cập nhật trạng thái đơn hàng -> Gửi Email báo cho Khách hàng
   */
  async notifyOrderStatusChanged(order: Order, newStatus: OrderStatus): Promise<void> {
    const config = await getEmailConfig();
    if (!config.enabled || !config.notify_on_status_change) return;
    if (!order.customer_email || !order.customer_email.includes('@')) return;

    const statusLabel = getOrderStatusLabel(newStatus);
    const trackingUrl = buildOrderTrackingUrl(order, config);
    const safeRef = escapeHtml(order.order_reference);
    const safeName = escapeHtml(order.customer_name);
    const safeStatus = escapeHtml(statusLabel);

    const subject = `Cập nhật trạng thái đơn hàng #${order.order_reference}: ${statusLabel}`;
    const textBody = [
      `Chào bạn ${order.customer_name},`,
      `Đơn hàng #${order.order_reference} của bạn vừa được cập nhật trạng thái: "${statusLabel}".`,
      ``,
      `Xem chi tiết tiến độ đơn hàng tại: ${trackingUrl}`,
      ``,
      `Trân trọng,`,
      `Ú òa Shop - Hotline/Zalo: 0345.553.913`,
    ].join('\n');

    await dispatchEmail(
      {
        to: order.customer_email.trim(),
        replyTo: config.admin_email,
        subject,
        textBody,
        htmlBody: buildTransactionalEmailHtml({
          eyebrow: 'Ú òa Shop',
          title: `Cập nhật trạng thái đơn hàng #${safeRef}`,
          accentBg: '#fdf2f8',
          accentColor: '#be185d',
          bodyHtml: `
            <p style="margin:0 0 12px;">Chào bạn <strong>${safeName}</strong>,</p>
            <p style="margin:0 0 16px;">Đơn hàng <strong>#${safeRef}</strong> của bạn vừa được cập nhật trạng thái hiện tại là: <strong>${safeStatus}</strong>.</p>
            <p style="margin:0 0 14px;">
              <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#be185d;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:11px 22px;border-radius:8px;">
                Xem chi tiết đơn hàng
              </a>
            </p>
            <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;">
              Link tra cứu trực tiếp: <a href="${trackingUrl}" style="color:#2563eb;">${trackingUrl}</a>
            </p>
          `,
          footerNote: `Email thông báo tự động cho đơn hàng #${safeRef} tại Ú òa Shop.`,
        }),
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
        to: config.admin_email || 'conghaunguyen994@gmail.com',
        cc: config.admin_backup_email || undefined,
        subject: 'Kiểm tra kết nối thông báo email - Ú òa Shop',
        textBody:
          'Xin chào Nguyễn Công Hậu, hệ thống thông báo email tự động của Ú òa Shop đang hoạt động bình thường.',
        htmlBody: buildTransactionalEmailHtml({
          eyebrow: 'Ú òa Shop - Kiểm tra hệ thống',
          title: 'Kết nối email hoạt động bình thường',
          accentBg: '#f0fdf4',
          accentColor: '#059669',
          bodyHtml: `
            <p style="margin:0;">Hệ thống gửi thông báo tự động khi có đơn mới, xác nhận cọc, gửi bản xem trước 3D và cập nhật trạng thái đơn hàng đã sẵn sàng hoạt động.</p>
          `,
          footerNote: 'Email kiểm tra kết nối từ trang quản trị Ú òa Shop.',
        }),
        eventType: 'test_email',
        orderReference: 'TEST-EMAIL',
      },
      config
    );
  },
};
