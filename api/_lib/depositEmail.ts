import type { SupabaseClient } from '@supabase/supabase-js';
import {
  dispatchServerEmail,
  hasServerEmailProvider,
  normalizeEmailAddress,
} from './emailDispatch.js';

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
    const safeGateway = escapeHtml(gateway);

    const adminEmail = normalizeEmailAddress(
      cfg?.admin_email?.trim() ||
        process.env.ADMIN_EMAIL?.trim() ||
        'conghaunguyen994@gmail.com'
    );
    const adminBackupEmail = normalizeEmailAddress(cfg?.admin_backup_email) || undefined;
    const normalizedCustomerEmail = normalizeEmailAddress(customerEmail);

    const sendAdminPromise = adminEmail
      ? dispatchServerEmail({
        to: adminEmail,
        cc: adminBackupEmail,
        replyTo: normalizedCustomerEmail || adminEmail,
        senderName: 'Ú òa Shop',
        subject: isFullPaid
          ? `Xác nhận thanh toán đủ ${formatVndServer(paidAmount)} đơn #${orderRef} - ${customerName}`
          : `Xác nhận đã nhận cọc ${formatVndServer(paidAmount)} đơn #${orderRef} - ${customerName}`,
        textBody: [
          `Xin chào Admin Nguyễn Công Hậu,`,
          ``,
          isFullPaid
            ? `Hệ thống vừa ghi nhận thanh toán đủ 100% cho đơn hàng #${orderRef} (0 đ COD).`
            : `Hệ thống vừa ghi nhận thanh toán cọc thành công cho đơn hàng #${orderRef}.`,
          `- Khách hàng: ${customerName} (${customerPhone || 'N/A'})`,
          normalizedCustomerEmail ? `- Email khách: ${normalizedCustomerEmail}` : '',
          `- Số tiền đã nhận: ${formatVndServer(paidAmount)}`,
          totalAmount > 0
            ? isFullPaid
              ? `- Tổng giá trị đơn: ${formatVndServer(totalAmount)} (Còn lại COD: 0 đ)`
              : `- Tổng giá trị đơn: ${formatVndServer(totalAmount)} (Còn lại COD: ${formatVndServer(remainingAmount)})`
            : '',
          `- Kênh thanh toán: ${gateway}`,
          `- Thời gian ghi nhận: ${nowFormatted}`,
          ``,
          `Mở trang quản trị đơn hàng: ${adminOrdersUrl}`,
          `Trang tra cứu đơn của khách: ${trackingUrl}`,
        ]
          .filter(Boolean)
          .join('\n'),
        htmlBody: `
            <!DOCTYPE html>
            <html lang="vi">
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:16px;background-color:#f9fafb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
              <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#f0fdf4;">
                  <p style="margin:0 0 4px;font-size:12px;font-weight:bold;color:#047857;">Ú òa Shop - Thông báo thanh toán</p>
                  <h1 style="margin:0;font-size:18px;font-weight:bold;color:#065f46;">
                    ${isFullPaid ? `Đã thanh toán đủ 100% đơn #${safeRef}` : `Đã nhận tiền cọc đơn #${safeRef}`}
                  </h1>
                  <p style="margin:6px 0 0;font-size:16px;font-weight:bold;color:#059669;">
                    +${formatVndServer(paidAmount)}
                  </p>
                </div>
                <div style="padding:20px 24px;font-size:14px;line-height:1.6;">
                  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;width:130px;">Khách hàng:</td>
                      <td style="padding:6px 0;font-weight:bold;">${safeName}${safePhone ? ` - <a href="tel:${safePhone}" style="color:#2563eb;text-decoration:none;">${safePhone}</a>` : ''}</td>
                    </tr>
                    ${normalizedCustomerEmail
            ? `<tr><td style="padding:6px 0;color:#6b7280;">Email khách:</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(normalizedCustomerEmail)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(normalizedCustomerEmail)}</a></td></tr>`
            : ''
          }
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;">Kênh nhận:</td>
                      <td style="padding:6px 0;">${safeGateway}</td>
                    </tr>
                    ${totalAmount > 0
            ? `<tr><td style="padding:6px 0;color:#6b7280;">Tổng đơn / COD:</td><td style="padding:6px 0;"><strong>${formatVndServer(totalAmount)}</strong> (${isFullPaid ? 'COD 0 đ' : `Còn thu COD: <strong>${formatVndServer(remainingAmount)}</strong>`})</td></tr>`
            : ''
          }
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;">Thời gian:</td>
                      <td style="padding:6px 0;">${escapeHtml(nowFormatted)}</td>
                    </tr>
                  </table>
                  <p style="margin:20px 0 12px;">
                    <a href="${adminOrdersUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:11px 22px;border-radius:8px;">
                      Mở trang quản trị đơn hàng
                    </a>
                  </p>
                  <p style="margin:0;font-size:12px;color:#6b7280;">
                    Trang tra cứu của khách: <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;">${trackingUrl}</a>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        eventType: 'deposit_confirmed',
        orderReference: orderRef,
      }).then((r) => r.ok)
      : Promise.resolve(false);

    const sendCustomerPromise = normalizedCustomerEmail
      ? dispatchServerEmail({
        to: normalizedCustomerEmail,
        replyTo: adminEmail,
        senderName: 'Ú òa Shop',
        subject: isFullPaid
          ? `Xác nhận thanh toán đủ đơn hàng #${orderRef} - Ú òa Shop`
          : `Xác nhận đã nhận tiền cọc đơn hàng #${orderRef} - Ú òa Shop`,
        textBody: [
          `Chào bạn ${customerName},`,
          ``,
          isFullPaid
            ? `Ú òa Shop xác nhận đã nhận thanh toán đủ 100% (${formatVndServer(paidAmount)}) qua ${gateway} cho đơn hàng #${orderRef}. Khi nhận hàng bạn không cần thanh toán thêm (0 đ COD).`
            : `Ú òa Shop xác nhận đã nhận được khoản chuyển khoản tiền cọc ${formatVndServer(paidAmount)} qua ${gateway} cho đơn hàng #${orderRef}.`,
          totalAmount > 0 ? `- Tổng giá trị đơn: ${formatVndServer(totalAmount)}` : '',
          `- Đã thanh toán: ${formatVndServer(paidAmount)}`,
          totalAmount > 0
            ? isFullPaid
              ? `- Số tiền còn lại khi nhận hàng (COD): 0 đ`
              : `- Số tiền còn lại khi nhận hàng (COD): ${formatVndServer(remainingAmount)}`
            : '',
          `- Thời gian ghi nhận: ${nowFormatted}`,
          ``,
          `Bước tiếp theo: Xưởng đang tiến hành thiết kế bản dựng 3D cá nhân hóa cho đơn hàng của bạn và sẽ gửi bản xem trước để bạn kiểm tra trước khi in.`,
          ``,
          `Theo dõi tiến độ đơn hàng tại: ${trackingUrl}`,
          ``,
          `Nếu cần hỗ trợ thêm, bạn có thể trả lời trực tiếp email này hoặc liên hệ Hotline/Zalo: 0345.553.913.`,
          `Trân trọng,`,
          `Ú òa Shop - 200 Phường Quy Nhơn Nam, TP. Quy Nhơn, Tỉnh Gia Lai`,
        ]
          .filter(Boolean)
          .join('\n'),
        htmlBody: `
            <!DOCTYPE html>
            <html lang="vi">
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:16px;background-color:#f9fafb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
              <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#fdf2f8;">
                  <p style="margin:0 0 4px;font-size:13px;font-weight:bold;color:#be185d;">Ú òa Shop</p>
                  <h1 style="margin:0;font-size:18px;font-weight:bold;color:#111827;">
                    ${isFullPaid ? `Xác nhận thanh toán đủ đơn hàng #${safeRef}` : `Xác nhận đã nhận tiền cọc đơn hàng #${safeRef}`}
                  </h1>
                </div>
                <div style="padding:20px 24px;font-size:14px;line-height:1.6;">
                  <p style="margin:0 0 12px;">Chào bạn <strong>${safeName}</strong>,</p>
                  <p style="margin:0 0 16px;">
                    Ú òa Shop đã ghi nhận khoản chuyển khoản <strong>${formatVndServer(paidAmount)}</strong> qua <strong>${safeGateway}</strong> vào lúc ${escapeHtml(nowFormatted)} cho đơn hàng <strong>#${safeRef}</strong>.
                  </p>
                  <table style="width:100%;border-collapse:collapse;font-size:13px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:16px;">
                    <tr>
                      <td style="padding:8px 12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Mã đơn hàng</td>
                      <td style="padding:8px 12px;text-align:right;font-weight:bold;border-bottom:1px solid #e5e7eb;">#${safeRef}</td>
                    </tr>
                    ${totalAmount > 0
            ? `<tr><td style="padding:8px 12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Tổng giá trị đơn</td><td style="padding:8px 12px;text-align:right;border-bottom:1px solid #e5e7eb;">${formatVndServer(totalAmount)}</td></tr>`
            : ''
          }
                    <tr>
                      <td style="padding:8px 12px;color:#047857;font-weight:bold;border-bottom:1px solid #e5e7eb;">Đã thanh toán</td>
                      <td style="padding:8px 12px;text-align:right;font-weight:bold;color:#059669;border-bottom:1px solid #e5e7eb;">${formatVndServer(paidAmount)}</td>
                    </tr>
                    ${totalAmount > 0
            ? `<tr><td style="padding:8px 12px;color:#6b7280;">Còn lại khi nhận hàng (COD)</td><td style="padding:8px 12px;text-align:right;font-weight:bold;">${isFullPaid ? '0 đ' : formatVndServer(remainingAmount)}</td></tr>`
            : ''
          }
                  </table>
                  <p style="margin:0 0 18px;font-size:13px;color:#374151;">
                    <strong>Bước tiếp theo:</strong> Xưởng đang tiến hành thiết kế bản dựng 3D cá nhân hóa cho đơn hàng của bạn và sẽ gửi bản xem trước để bạn kiểm tra, xác nhận trước khi in.
                  </p>
                  <p style="margin:0 0 18px;">
                    <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:11px 22px;border-radius:8px;">
                      Theo dõi tiến độ đơn hàng
                    </a>
                  </p>
                  <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;">
                    Link tra cứu trực tiếp: <a href="${trackingUrl}" style="color:#2563eb;">${trackingUrl}</a>
                  </p>
                </div>
                <div style="padding:14px 24px;border-top:1px solid #e5e7eb;background:#f9fafb;font-size:12px;color:#6b7280;line-height:1.5;">
                  Email này được gửi tự động để xác nhận thanh toán cho đơn hàng #${safeRef} tại Ú òa Shop.<br/>
                  Hotline/Zalo hỗ trợ: 0345.553.913 &middot; 200 Phường Quy Nhơn Nam, TP. Quy Nhơn, Tỉnh Gia Lai.
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
