import type { SupabaseClient } from '@supabase/supabase-js';
import { dispatchServerEmail, hasServerEmailProvider } from './emailDispatch.js';

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

interface StoredEmailPreferences {
  enabled?: boolean;
  admin_email?: string;
  admin_backup_email?: string;
  production_site_url?: string;
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

function normalizeProductionUrl(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^https:\/([^/])/i, 'https://$1')
    .replace(/^http:\/([^/])/i, 'http://$1')
    .replace(/\.vercel\.appp+\b/i, '.vercel.app')
    .replace(/\/+$/, '');
}

function resolveSiteUrl(
  cfg?: StoredEmailPreferences | null,
  siteUrlHint?: string | null
): string {
  const configured = normalizeProductionUrl(cfg?.production_site_url);
  if (
    configured &&
    configured.startsWith('http') &&
    !/^https?:\/\/bolwdog\.vercel\.app$/i.test(configured)
  ) {
    return configured;
  }
  const hinted = normalizeProductionUrl(siteUrlHint);
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

/**
 * Gửi đồng thời email xác nhận đã nhận tiền cọc tới Admin & Khách hàng.
 * Toàn bộ credentials email (`EMAIL_WEBHOOK_URL`, `EMAILJS_*`) đọc nghiêm ngặt từ `.env` server,
 * chỉ đọc địa chỉ email nhận / tên miền hiển thị từ `shop_settings`.
 */
export async function sendDepositConfirmedEmailsServer(
  supabase: SupabaseClient,
  info: DepositEmailOrderInfo
): Promise<ServerDepositEmailResult> {
  try {
    if (!hasServerEmailProvider()) {
      return { sent: false, adminSent: false, customerSent: false, reason: 'no_server_provider' };
    }

    const { data: emailSetting } = await supabase
      .from('shop_settings')
      .select('setting_value')
      .eq('setting_key', 'email_notifications')
      .maybeSingle();

    const cfg = (emailSetting?.setting_value || null) as StoredEmailPreferences | null;
    if (cfg && cfg.enabled === false) {
      return { sent: false, adminSent: false, customerSent: false, reason: 'disabled' };
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
        // Ignore if optional helper RPC fails
      }
    }

    const isFullPaid =
      info.paymentStatus === 'paid' || (totalAmount > 0 && paidAmount >= totalAmount * 0.98);
    const remainingAmount = isFullPaid
      ? 0
      : totalAmount > 0
        ? Math.max(0, totalAmount - paidAmount)
        : 0;
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

    const adminEmail =
      cfg?.admin_email?.trim() ||
      process.env.ADMIN_EMAIL?.trim() ||
      'conghaunguyen994@gmail.com.vn';
    const adminBackupEmail = cfg?.admin_backup_email?.trim() || undefined;

    const sendAdminPromise = adminEmail.includes('@')
      ? dispatchServerEmail({
        to: adminEmail,
        cc: adminBackupEmail,
        replyTo: customerEmail.includes('@') ? customerEmail : adminEmail,
        subject: isFullPaid
          ? `[Ú òa Shop] 🎉 ĐÃ THANH TOÁN ĐỦ 100% ${formatVndServer(paidAmount)} - Đơn #${orderRef} (${customerName})`
          : `[Ú òa Shop] 💰 ĐÃ NHẬN CỌC ${formatVndServer(paidAmount)} - Đơn #${orderRef} (${customerName})`,
        textBody: [
          `Xin chào Admin Nguyễn Công Hậu,`,
          ``,
          isFullPaid
            ? `Hệ thống vừa ghi nhận THANH TOÁN ĐỦ 100% TOÀN BỘ ĐƠN thành công cho đơn #${orderRef} (0 đ COD — chỉ chờ giao đơn).`
            : `Hệ thống vừa ghi nhận thanh toán cọc thành công cho đơn #${orderRef}.`,
          `• Khách hàng: ${customerName} (${customerPhone || 'N/A'})`,
          customerEmail ? `• Email khách: ${customerEmail}` : '',
          `• Số tiền đã nhận: ${formatVndServer(paidAmount)}`,
          totalAmount > 0
            ? isFullPaid
              ? `• Tổng giá trị đơn: ${formatVndServer(totalAmount)} (Còn lại COD: 0 đ — Đã thanh toán đủ 100%)`
              : `• Tổng giá trị đơn: ${formatVndServer(totalAmount)} (Còn lại COD: ${formatVndServer(remainingAmount)})`
            : '',
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
                    ${isFullPaid ? '🎉 Thanh toán đủ 100% (0đ COD)' : '💸 Thanh toán tự động'}
                  </div>
                  <h1 style="margin:0;font-size:20px;font-weight:900;color:#065F46;">
                    ${isFullPaid ? `Đã Thanh Toán Đủ 100% Đơn #${safeRef}` : `Đã Nhận Tiền Cọc Đơn #${safeRef}`}
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
                    ${customerEmail
            ? `<tr><td style="padding:7px 0;color:#8C6239;">Email khách:</td><td style="padding:7px 0;"><a href="mailto:${safeEmail}" style="color:#2563EB;font-weight:600;">${safeEmail}</a></td></tr>`
            : ''
          }
                    <tr>
                      <td style="padding:7px 0;color:#8C6239;">Kênh nhận:</td>
                      <td style="padding:7px 0;font-weight:700;">${safeGateway}</td>
                    </tr>
                    ${totalAmount > 0
            ? `<tr><td style="padding:7px 0;color:#8C6239;">Tổng đơn / COD:</td><td style="padding:7px 0;"><strong>${formatVndServer(totalAmount)}</strong> (${isFullPaid ? '<strong style="color:#059669;">Đã thanh toán đủ 100% — COD 0 đ</strong>' : `Còn thu COD: <strong style="color:#DB2777;">${formatVndServer(remainingAmount)}</strong>`})</td></tr>`
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
      }).then((r) => r.ok)
      : Promise.resolve(false);

    const sendCustomerPromise = customerEmail.includes('@')
      ? dispatchServerEmail({
        to: customerEmail,
        replyTo: adminEmail,
        subject: isFullPaid
          ? `[Ú òa Shop] 🎉 Đã thanh toán đủ 100% (${formatVndServer(paidAmount)}) cho đơn #${orderRef} — Chỉ chờ nhận đơn!`
          : `[Ú òa Shop] ✅ Đã nhận tiền cọc ${formatVndServer(paidAmount)} cho đơn #${orderRef}`,
        textBody: [
          `Chào bạn ${customerName},`,
          ``,
          isFullPaid
            ? `Ú òa Shop xác nhận đã nhận thanh toán đủ 100% (${formatVndServer(paidAmount)}) qua ${gateway} cho đơn hàng #${orderRef}. Đơn hàng đã hoàn tất thanh toán toàn bộ — khi nhận hàng bạn không cần thanh toán thêm (0 đ COD), chỉ chờ nhận đơn tại nhà!`
            : `Ú òa Shop xác nhận đã nhận được khoản chuyển khoản tiền cọc ${formatVndServer(paidAmount)} qua ${gateway} cho đơn hàng #${orderRef}.`,
          totalAmount > 0 ? `• Tổng giá trị đơn: ${formatVndServer(totalAmount)}` : '',
          `• Đã thanh toán: ${formatVndServer(paidAmount)}`,
          totalAmount > 0
            ? isFullPaid
              ? `• Số tiền còn lại khi nhận hàng (COD): 0 đ (Đã thanh toán đủ 100% — Chỉ chờ nhận đơn)`
              : `• Số tiền còn lại (thanh toán khi nhận hàng): ${formatVndServer(remainingAmount)}`
            : '',
          ``,
          `Xưởng đang bắt đầu thiết kế file 3D cá nhân hóa cho đơn hàng của bạn và sẽ gửi bản xem trước 3D để bạn duyệt trước khi in.`,
          ``,
          `👉 Theo dõi tiến độ đơn hàng trực tuyến tại: ${trackingUrl}`,
          ``,
          `Trân trọng,`,
          `Ú òa Shop – Hotline/Zalo: 0345553913`,
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
                    Ú òa <span style="color:#EC4899;">Shop</span>
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
                      ${totalAmount > 0
            ? `<tr><td style="padding:5px 0;color:#92400E;">Tổng giá trị đơn:</td><td style="padding:5px 0;text-align:right;font-weight:700;">${formatVndServer(totalAmount)}</td></tr>`
            : ''
          }
                      <tr>
                        <td style="padding:5px 0;color:#047857;font-weight:700;">Đã thanh toán cọc:</td>
                        <td style="padding:5px 0;text-align:right;font-weight:900;color:#059669;font-size:15px;">${formatVndServer(paidAmount)}</td>
                      </tr>
                      ${totalAmount > 0
            ? `<tr><td style="padding:5px 0;color:#92400E;">Còn lại thanh toán khi nhận hàng:</td><td style="padding:5px 0;text-align:right;font-weight:800;color:#DB2777;">${formatVndServer(remainingAmount)}</td></tr>`
            : ''
          }
                    </table>
                  </div>
                  <div style="background:#FDF2F8;border-left:4px solid #EC4899;border-radius:12px;padding:12px 14px;font-size:12.5px;line-height:1.55;color:#831843;">
                    🎨 <strong>Bước tiếp theo:</strong> Nghệ nhân Ú òa Shop đang dựng bản thiết kế 3D riêng cho đơn hàng của bạn và sẽ gửi mẫu demo 3D để bạn kiểm tra &amp; chốt trước khi bấm máy in nhé!
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
      }).then((r) => r.ok)
      : Promise.resolve(false);

    const [adminSent, customerSent] = await Promise.all([sendAdminPromise, sendCustomerPromise]);
    return {
      sent: adminSent || customerSent,
      adminSent,
      customerSent,
    };
  } catch (err) {
    console.error('[depositEmail] Unexpected error:', err);
    return { sent: false, adminSent: false, customerSent: false, reason: 'unexpected_error' };
  }
}
