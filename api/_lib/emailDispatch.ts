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
  subject: string;
  textBody: string;
  htmlBody: string;
  eventType: ServerEmailEventType;
  orderReference?: string;
}

export interface ServerDispatchResult {
  ok: boolean;
  channel: 'webhook' | 'emailjs' | 'none';
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
    webhookUrl: String(process.env.EMAIL_WEBHOOK_URL || '').trim(),
    emailjsServiceId: String(process.env.EMAILJS_SERVICE_ID || '').trim(),
    emailjsTemplateId: String(process.env.EMAILJS_TEMPLATE_ID || '').trim(),
    emailjsPublicKey: String(process.env.EMAILJS_PUBLIC_KEY || '').trim(),
    emailjsPrivateKey: String(process.env.EMAILJS_PRIVATE_KEY || '').trim(),
  };
}

export function hasServerEmailProvider(): boolean {
  const creds = getServerEmailCredentials();
  return (
    Boolean(creds.webhookUrl && creds.webhookUrl.startsWith('https://')) ||
    Boolean(creds.emailjsServiceId && creds.emailjsTemplateId && creds.emailjsPublicKey)
  );
}

/**
 * Gửi email từ Vercel Serverless Functions chỉ dùng credentials trong biến môi trường `.env`
 * (KHÔNG đọc webhook URL hay API key từ Database).
 */
export async function dispatchServerEmail(
  payload: ServerEmailPayload
): Promise<ServerDispatchResult> {
  const {
    webhookUrl,
    emailjsServiceId,
    emailjsTemplateId,
    emailjsPublicKey,
    emailjsPrivateKey,
  } = getServerEmailCredentials();

  if (webhookUrl && webhookUrl.startsWith('https://')) {
    try {
      const res = await fetchWithTimeout(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          to: payload.to,
          cc: payload.cc || '',
          replyTo: payload.replyTo || '',
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
          to_email: payload.to,
          cc_email: payload.cc || '',
          reply_to: payload.replyTo || payload.to,
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
