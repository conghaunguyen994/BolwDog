import nodemailer from 'nodemailer';

export type ServerEmailEventType =
  | 'new_order'
  | 'deposit_confirmed'
  | 'demo_3d_sent'
  | 'demo_approved'
  | 'demo_revision_requested'
  | 'payment_proof_submitted'
  | 'order_status_updated'
  | 'test_email';

export interface ServerEmailPayload {
  to: string;
  cc?: string;
  replyTo?: string;
  senderName?: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  eventType: ServerEmailEventType;
  orderReference?: string;
}

export function normalizeEmailAddress(email?: string | null): string {
  const trimmed = String(email ?? '').trim();
  if (!trimmed || !trimmed.includes('@')) return '';
  // Sửa lỗi typo phổ biến @gmail.com.vn -> @gmail.com để tránh lệch Reply-To gây vào Spam
  return trimmed.replace(/@gmail\.com\.vn$/i, '@gmail.com');
}

export interface ServerDispatchResult {
  ok: boolean;
  channel: 'gmail_smtp' | 'webhook' | 'emailjs' | 'none';
  reason?: string;
}

export async function fetchWithTimeout(
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

export function getServerEmailCredentials() {
  return {
    gmailUser: normalizeEmailAddress(process.env.GMAIL_SMTP_USER || ''),
    // Google App Password 16 ký tự thường copy kèm dấu cách ("abcd efgh ijkl mnop") -> tự động xóa khoảng trắng
    gmailAppPassword: String(process.env.GMAIL_SMTP_APP_PASSWORD || '').replace(/\s+/g, '').trim(),
    gmailFromName: String(process.env.GMAIL_SMTP_FROM_NAME || '').trim(),
    webhookUrl: String(process.env.EMAIL_WEBHOOK_URL || '').trim(),
    emailjsServiceId: String(process.env.EMAILJS_SERVICE_ID || '').trim(),
    emailjsTemplateId: String(process.env.EMAILJS_TEMPLATE_ID || '').trim(),
    emailjsPublicKey: String(process.env.EMAILJS_PUBLIC_KEY || '').trim(),
    emailjsPrivateKey: String(process.env.EMAILJS_PRIVATE_KEY || '').trim(),
  };
}

export function getActiveServerEmailChannel(): 'gmail_smtp' | 'webhook' | 'emailjs' | 'none' {
  const creds = getServerEmailCredentials();
  if (creds.gmailUser && creds.gmailAppPassword) return 'gmail_smtp';
  if (creds.webhookUrl && creds.webhookUrl.startsWith('https://')) return 'webhook';
  if (creds.emailjsServiceId && creds.emailjsTemplateId && creds.emailjsPublicKey) return 'emailjs';
  return 'none';
}

export function hasServerEmailProvider(): boolean {
  return getActiveServerEmailChannel() !== 'none';
}

/**
 * Gửi email từ Vercel Serverless Functions chỉ dùng credentials trong biến môi trường `.env`
 * (KHÔNG đọc mật khẩu, webhook URL hay API key từ Database).
 * Thứ tự ưu tiên:
 * 1. Gmail SMTP chính chủ (smtp.gmail.com:465 + App Password) -> có DKIM chính chủ Gmail, vào Inbox tốt nhất
 * 2. Google Apps Script Webhook (dự phòng)
 * 3. EmailJS REST API (dự phòng)
 */
export async function dispatchServerEmail(
  payload: ServerEmailPayload
): Promise<ServerDispatchResult> {
  const {
    gmailUser,
    gmailAppPassword,
    gmailFromName,
    webhookUrl,
    emailjsServiceId,
    emailjsTemplateId,
    emailjsPublicKey,
    emailjsPrivateKey,
  } = getServerEmailCredentials();

  const normalizedTo = normalizeEmailAddress(payload.to);
  const normalizedCcRaw = normalizeEmailAddress(payload.cc);
  const normalizedCc =
    normalizedCcRaw && normalizedCcRaw.toLowerCase() !== normalizedTo.toLowerCase()
      ? normalizedCcRaw
      : '';
  const normalizedReplyTo = normalizeEmailAddress(payload.replyTo);
  const senderName = (gmailFromName || payload.senderName || 'Ú òa Shop').trim();

  if (!normalizedTo) {
    return { ok: false, channel: 'none', reason: 'invalid_recipient' };
  }

  // Kênh 1 (Ưu tiên): Gmail SMTP chính chủ với App Password
  if (gmailUser && gmailAppPassword) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
      });

      await transporter.sendMail({
        from: `"${senderName.replace(/"/g, '')}" <${gmailUser}>`,
        to: normalizedTo,
        cc: normalizedCc || undefined,
        replyTo: normalizedReplyTo || gmailUser,
        subject: payload.subject,
        text: payload.textBody,
        html: payload.htmlBody,
      });

      return { ok: true, channel: 'gmail_smtp' };
    } catch (err) {
      console.error('[emailDispatch] Gmail SMTP send failed, trying fallback:', err);
    }
  }

  if (webhookUrl && webhookUrl.startsWith('https://')) {
    try {
      const res = await fetchWithTimeout(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          to: normalizedTo,
          cc: normalizedCc,
          replyTo: normalizedReplyTo,
          senderName,
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
      console.error('[emailDispatch] EMAIL_WEBHOOK_URL request failed:', err);
    }
  }

  if (emailjsServiceId && emailjsTemplateId && emailjsPublicKey) {
    try {
      const bodyPayload: Record<string, unknown> = {
        service_id: emailjsServiceId,
        template_id: emailjsTemplateId,
        user_id: emailjsPublicKey,
        template_params: {
          to_email: normalizedTo,
          cc_email: normalizedCc,
          reply_to: normalizedReplyTo || normalizedTo,
          from_name: senderName,
          subject: payload.subject,
          message: payload.textBody,
          html_content: payload.htmlBody,
          html_message: payload.htmlBody,
          order_reference: payload.orderReference || '',
          event_type: payload.eventType,
        },
      };
      if (emailjsPrivateKey) {
        bodyPayload.accessToken = emailjsPrivateKey;
      }

      const res = await fetchWithTimeout('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      if (res.ok) {
        return { ok: true, channel: 'emailjs' };
      }
    } catch (err) {
      console.error('[emailDispatch] EmailJS request failed:', err);
    }
  }

  return { ok: false, channel: 'none', reason: 'no_server_provider' };
}
