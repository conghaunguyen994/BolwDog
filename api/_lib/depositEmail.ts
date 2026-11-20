import type { SupabaseClient } from '@supabase/supabase-js';

export interface DepositEmailOrderInfo {
  orderReference: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  transferAmount?: number | null;
  gateway?: string | null;
  paymentStatus?: string | null;
  siteUrlHint?: string | null;
}

export interface ServerDepositEmailResult {
  sent: boolean;
  adminSent: boolean;
  customerSent: boolean;
  reason?: string;
}

interface StoredEmailConfig {
  enabled?: boolean;
  admin_email?: string;
  admin_backup_email?: string;
  production_site_url?: string;
  webhook_url?: string;
  emailjs_service_id?: string;
  emailjs_template_id?: string;
  emailjs_public_key?: string;
}

interface ServerEmailPayload {
  to: string;
  cc?: string;
  replyTo?: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  eventType: 'deposit_confirmed';
  orderReference: string;
}

function escapeHtml(value?: string | null): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatVndServer(amount?: number | null): string {
  const safeAmount = Math.max(0, Math.round(Number(amount || 0)));
  return `${safeAmount.toLocaleString('vi-VN')} đ`;
}

function resolveSiteUrl(cfg?: StoredEmailConfig | null, siteUrlHint?: string | null): string {
  const configured = cfg?.production_site_url?.trim().replace(/\/+$/, '');
  if (configured && !/^https?:\/\/bolwdog\.vercel\.app$/i.test(configured)) {
    return configured;
  }
  const hinted = siteUrlHint?.trim().replace(/\/+$/, '');
  if (
    hinted &&
    !hinted.includes('localhost') &&
    !hinted.includes('127.0.0.1') &&
    !/^https?:\/\/bolwdog\.vercel\.app$/i.test(hinted)
  ) {
    return hinted;
  }
  return 'https://bowlshop.vercel.app';
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function dispatchServerEmail(
  payload: ServerEmailPayload,
  cfg: StoredEmailConfig
): Promise<boolean> {
  const webhookUrl = cfg.webhook_url?.trim();
  if (webhookUrl) {
    try {
      const res = await fetchWithTimeout(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return true;
    } catch (err) {
      console.error('[depositEmail] Webhook dispatch failed:', err);
    }
  }

  const serviceId = cfg.emailjs_service_id?.trim();
  const templateId = cfg.emailjs_template_id?.trim();
  const publicKey = cfg.emailjs_public_key?.trim();
  if (serviceId && templateId && publicKey) {
    try {
      const res = await fetchWithTimeout('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_email: payload.to,
            cc_email: payload.cc || '',
            reply_to: payload.replyTo || payload.to,
            subject: payload.subject,
            message: payload.textBody,
            html_content: payload.htmlBody,
            order_reference: payload.orderReference,
            event_type: payload.eventType,
          },
        }),
      });
      if (res.ok) return true;
    } catch (err) {
      console.error('[depositEmail] EmailJS dispatch failed:', err);
    }
  }

  return false;
}

/**
 * Gửi đồng thời email xác nhận đã nhận tiền cọc tới Admin & Khách hàng
 * từ Vercel Serverless Functions (webhook SePay hoặc `/api/check-sepay`).
 */
export async function sendDepositConfirmedEmailsServer(
  supabase: SupabaseClient,
  info: DepositEmailOrderInfo
): Promise<ServerDepositEmailResult> {
  try {
    const { data: emailSetting } = await supabase
      .from('shop_settings')
      .select('setting_value')
      .eq('setting_key', 'email_notifications')
      .maybeSingle();

    const cfg = (emailSetting?.setting_value || null) as StoredEmailConfig | null;
    if (!cfg || cfg.enabled === false) {
      return { sent: false, adminSent: false, customerSent: false, reason: 'disabled_or_missing' };
    }

    const hasServerProvider =
      Boolean(cfg.webhook_url?.trim()) ||
      Boolean(
        cfg.emailjs_service_id?.trim() &&
          cfg.emailjs_template_id?.trim() &&
          cfg.emailjs_public_key?.trim()
      );
    if (!hasServerProvider) {
      return { sent: false, adminSent: false, customerSent: false, reason: 'no_server_provider' };
    }

    const orderRef = info.orderReference.trim();
    const customerName = info.customerName?.trim() || 'Quý khách';
    const customerPhone = info.customerPhone?.trim() || '';
    const customerEmail = info.customerEmail?.trim() || '';
    const gateway = info.gateway?.trim() || 'MB Bank / SePay';
    let paidAmount = Number(info.transferAmount || 0);
    let totalAmount = 0;

    if (customerPhone) {
      try {
        const { data: statusData } = await supabase.rpc('get_order_payment_status', {
          p_order_ref: orderRef,
          p_phone: customerPhone,
        });
        const statusRow = Array.isArray(statusData) ? statusData[0] : statusData;
        if (statusRow?.found) {
          totalAmount = Number(statusRow.total_amount || 0);
          if (paidAmount <= 0) {
            paidAmount = Number(statusRow.deposit_amount || 0);
          }
        }
      } catch {
        // Bỏ qua nếu RPC phụ chưa cập nhật schema
      }
    }

    const remainingAmount = totalAmount > 0 ? Math.max(0, totalAmount - paidAmount) : 0;
    const baseUrl = resolveSiteUrl(cfg, info.siteUrlHint);
    const trackingUrl = `${baseUrl}/track?ref=${encodeURIComponent(orderRef)}&phone=${encodeURIComponent(
      customerPhone
    )}`;
    const adminOrdersUrl = `${baseUrl}/admin/orders`;
    const nowFormatted = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    const safeRef = escapeHtml(orderRef);
    const safeName = escapeHtml(customerName);
    const safePhone = escapeHtml(customerPhone);
    const safeEmail = escapeHtml(customerEmail);
    const safeGateway = escapeHtml(gateway);

    const adminEmail = cfg.admin_email?.trim() || '';
    const adminBackupEmail = cfg.admin_backup_email?.trim() || undefined;

    const sendAdminPromise = adminEmail.includes('@')
      ? dispatchServerEmail(
          {
            to: adminEmail,
            cc: adminBackupEmail,
            replyTo: customerEmail.includes('@') ? customerEmail : adminEmail,
            subject: `[BolwDog] 💰 ĐÃ NHẬN CỌC ${formatVndServer(paidAmount)} - Đơn #${orderRef} (${customerName})`,
            textBody: [
              `Xin chào Admin Nguyễn Công Hậu,`,
              ``,
              `Hệ thống vừa ghi nhận thanh toán cọc thành công cho đơn #${orderRef}.`,
              `• Khách hàng: ${customerName} (${customerPhone || 'N/A'})`,
              customerEmail ? `• Email khách: ${customerEmail}` : '',
              `• Số tiền cọc đã nhận: ${formatVndServer(paidAmount)}`,
              totalAmount > 0 ? `• Tổng giá trị đơn: ${formatVndServer(totalAmount)} (Còn lại COD: ${formatVndServer(remainingAmount)})` : '',
              `• Kênh thanh toán: ${gateway}`,
              `• Thời gian ghi nhận: ${nowFormatted}`,
              ``,
              `👉 Mở Cổng Admin xử lý đơn ngay: ${adminOrdersUrl}`,
              `👉 Link đơn hàng của khách: ${trackingUrl}`,
            ]
              .filter(Boolean)
              .join('\n'),
            htmlBody: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
              <body style="margin:0;padding:20px;background-color:#FFF5EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <div style="max-width:580px;margin:0 auto;background:#FFFFFF;border-radius:24px;border:2px solid #A7F3D0;overflow:hidden;box-shadow:0 10px 25px rgba(16,185,129,0.12);">
                  <div style="background:linear-gradient(135deg,#ECFDF5 0%,#F0FDF4 100%);padding:24px;text-align:center;border-bottom:1px solid #A7F3D0;">
                    <div style="display:inline-block;background:#D1FAE5;color:#047857;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:800;text-transform:uppercase;margin-bottom:8px;">
                      💸 Thanh toán tự động
                    </div>
                    <h1 style="margin:0;font-size:20px;font-weight:900;color:#065F46;">
                      Đã Nhận Tiền Cọc Đơn #${safeRef}
                    </h1>
                    <p style="margin:6px 0 0;font-size:18px;font-weight:900;color:#059669;">
                      +${formatVndServer(paidAmount)}
                    </p>
                  </div>
                  <div style="padding:24px;color:#4A2810;">
                    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
                      <tr>
                        <td style="padding:7px 0;color:#8C6239;width:130px;">Khách hàng:</td>
                        <td style="padding:7px 0;font-weight:800;">${safeName}${safePhone ? ` • <a href="tel:${safePhone}" style="color:#2563EB;">${safePhone}</a>` : ''}</td>
                      </tr>
                      ${
                        customerEmail
                          ? `<tr><td style="padding:7px 0;color:#8C6239;">Email khách:</td><td style="padding:7px 0;"><a href="mailto:${safeEmail}" style="color:#2563EB;font-weight:600;">${safeEmail}</a></td></tr>`
                          : ''
                      }
                      <tr>
                        <td style="padding:7px 0;color:#8C6239;">Kênh nhận:</td>
                        <td style="padding:7px 0;font-weight:700;">${safeGateway}</td>
                      </tr>
                      ${
                        totalAmount > 0
                          ? `<tr><td style="padding:7px 0;color:#8C6239;">Tổng đơn / COD:</td><td style="padding:7px 0;"><strong>${formatVndServer(totalAmount)}</strong> (Còn thu COD: <strong style="color:#DB2777;">${formatVndServer(remainingAmount)}</strong>)</td></tr>`
                          : ''
                      }
                      <tr>
                        <td style="padding:7px 0;color:#8C6239;">Thời gian:</td>
                        <td style="padding:7px 0;color:#6B7280;">${escapeHtml(nowFormatted)}</td>
                      </tr>
                    </table>
                    <div style="text-align:center;margin:24px 0 12px;">
                      <a href="${adminOrdersUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:linear-gradient(135deg,#10B981 0%,#059669 100%);color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:900;padding:14px 30px;border-radius:99px;box-shadow:0 8px 18px rgba(16,185,129,0.3);">
                        Mở Cổng Admin Xử Lý Đơn Ngay
                      </a>
                    </div>
                    <div style="text-align:center;margin-top:12px;">
                      <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="font-size:12px;color:#2563EB;text-decoration:underline;">
                        Xem trang tra cứu đơn của khách
                      </a>
                    </div>
                  </div>
                </div>
              </body>
              </html>
            `,
            eventType: 'deposit_confirmed',
            orderReference: orderRef,
          },
          cfg
        )
      : Promise.resolve(false);

    const sendCustomerPromise = customerEmail.includes('@')
      ? dispatchServerEmail(
          {
            to: customerEmail,
            replyTo: adminEmail || undefined,
            subject: `[BolwDog Studio] ✅ Đã nhận tiền cọc ${formatVndServer(paidAmount)} cho đơn #${orderRef}`,
            textBody: [
              `Chào ba mẹ ${customerName},`,
              ``,
              `BolwDog Studio xác nhận đã nhận được khoản chuyển khoản tiền cọc ${formatVndServer(paidAmount)} qua ${gateway} cho đơn hàng #${orderRef}.`,
              totalAmount > 0 ? `• Tổng giá trị đơn: ${formatVndServer(totalAmount)}` : '',
              `• Đã thanh toán cọc: ${formatVndServer(paidAmount)}`,
              totalAmount > 0 ? `• Số tiền còn lại (thanh toán khi nhận hàng): ${formatVndServer(remainingAmount)}` : '',
              ``,
              `Xưởng đang bắt đầu thiết kế file 3D cá nhân hóa cho bé và sẽ gửi bản xem trước 3D để ba mẹ duyệt trước khi in.`,
              ``,
              `👉 Theo dõi tiến độ đơn hàng trực tuyến tại: ${trackingUrl}`,
              ``,
              `Trân trọng,`,
              `BolwDog Studio – Hotline/Zalo: 0345553913`,
            ]
              .filter(Boolean)
              .join('\n'),
            htmlBody: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
              <body style="margin:0;padding:20px;background-color:#FFF5EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <div style="max-width:580px;margin:0 auto;background:#FFFFFF;border-radius:24px;border:2px solid #FBCFE8;overflow:hidden;box-shadow:0 10px 25px rgba(244,114,182,0.14);">
                  <div style="background:linear-gradient(135deg,#FDF2F8 0%,#ECFDF5 100%);padding:26px 24px;text-align:center;border-bottom:1px solid #FBCFE8;">
                    <div style="display:inline-block;width:54px;height:54px;line-height:54px;border-radius:18px;background:#D1FAE5;font-size:26px;margin-bottom:10px;">
                      🐾
                    </div>
                    <h1 style="margin:0;font-size:22px;font-weight:900;color:#831843;">
                      BolwDog <span style="color:#EC4899;">Studio</span>
                    </h1>
                    <p style="margin:4px 0 0;font-size:12px;color:#047857;font-weight:700;">
                      Xác nhận thanh toán cọc thành công
                    </p>
                  </div>
                  <div style="padding:26px 24px;color:#4A2810;">
                    <div style="display:inline-block;background:#ECFDF5;border:1px solid #A7F3D0;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:800;color:#047857;text-transform:uppercase;margin-bottom:12px;">
                      ✅ Đã Nhận Tiền Cọc
                    </div>
                    <h2 style="margin:0 0 12px;font-size:18px;font-weight:900;color:#065F46;">
                      Cảm ơn ba mẹ ${safeName}! Đơn hàng #${safeRef} đã được xác nhận cọc.
                    </h2>
                    <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#52301B;">
                      Hệ thống đã ghi nhận tự động khoản chuyển khoản <strong>${formatVndServer(paidAmount)}</strong> qua <strong>${safeGateway}</strong> vào lúc ${escapeHtml(nowFormatted)}.
                    </p>
                    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:16px;padding:16px;margin:18px 0;">
                      <table style="width:100%;border-collapse:collapse;font-size:13px;">
                        <tr>
                          <td style="padding:5px 0;color:#92400E;">Mã đơn hàng:</td>
                          <td style="padding:5px 0;text-align:right;font-weight:900;color:#4A2810;">#${safeRef}</td>
                        </tr>
                        ${
                          totalAmount > 0
                            ? `<tr><td style="padding:5px 0;color:#92400E;">Tổng giá trị đơn:</td><td style="padding:5px 0;text-align:right;font-weight:700;">${formatVndServer(totalAmount)}</td></tr>`
                            : ''
                        }
                        <tr>
                          <td style="padding:5px 0;color:#047857;font-weight:700;">Đã thanh toán cọc:</td>
                          <td style="padding:5px 0;text-align:right;font-weight:900;color:#059669;font-size:15px;">${formatVndServer(paidAmount)}</td>
                        </tr>
                        ${
                          totalAmount > 0
                            ? `<tr><td style="padding:5px 0;color:#92400E;">Còn lại thanh toán khi nhận hàng:</td><td style="padding:5px 0;text-align:right;font-weight:800;color:#DB2777;">${formatVndServer(remainingAmount)}</td></tr>`
                            : ''
                        }
                      </table>
                    </div>
                    <div style="background:#FDF2F8;border-left:4px solid #EC4899;border-radius:12px;padding:12px 14px;font-size:12.5px;line-height:1.55;color:#831843;">
                      🎨 <strong>Bước tiếp theo:</strong> Nghệ nhân BolwDog đang dựng bản thiết kế 3D riêng cho bé và sẽ gửi mẫu demo 3D để ba mẹ kiểm tra & chốt trước khi bấm máy in nhé!
                    </div>
                    <div style="text-align:center;margin:26px 0 18px;">
                      <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:linear-gradient(135deg,#10B981 0%,#059669 100%);color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:900;padding:14px 30px;border-radius:99px;box-shadow:0 8px 20px rgba(16,185,129,0.3);">
                        👉 Theo Dõi Tiến Độ Đơn Hàng
                      </a>
                    </div>
                    <div style="padding:12px;background:#F9FAFB;border-radius:12px;border:1px dashed #E5E7EB;word-break:break-all;font-size:11px;color:#6B7280;">
                      Link tra cứu trực tiếp: <a href="${trackingUrl}" style="color:#2563EB;">${trackingUrl}</a>
                    </div>
                  </div>
                </div>
              </body>
              </html>
            `,
            eventType: 'deposit_confirmed',
            orderReference: orderRef,
          },
          cfg
        )
      : Promise.resolve(false);

    const [adminSent, customerSent] = await Promise.all([sendAdminPromise, sendCustomerPromise]);
    return {
      sent: adminSent || customerSent,
      adminSent,
      customerSent,
    };
  } catch (err) {
    console.error('[depositEmail] Unexpected error sending deposit confirmation emails:', err);
    return { sent: false, adminSent: false, customerSent: false, reason: 'unexpected_error' };
  }
}
