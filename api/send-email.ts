import {
  dispatchServerEmail,
  getActiveServerEmailChannel,
  hasServerEmailProvider,
  type ServerEmailEventType,
} from './_lib/emailDispatch.js';

const ALLOWED_EVENTS = new Set<ServerEmailEventType>([
  'new_order',
  'deposit_confirmed',
  'demo_3d_sent',
  'demo_approved',
  'demo_revision_requested',
  'payment_proof_submitted',
  'order_status_updated',
  'test_email',
]);

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    if (body.action === 'status') {
      return res.status(200).json({
        ok: true,
        hasServerProvider: hasServerEmailProvider(),
        activeChannel: getActiveServerEmailChannel(),
      });
    }

    const to = String(body.to || '').trim();
    const cc = body.cc ? String(body.cc).trim() : undefined;
    const replyTo = body.replyTo ? String(body.replyTo).trim() : undefined;
    const subject = String(body.subject || '').trim();
    const textBody = String(body.textBody || '');
    const htmlBody = String(body.htmlBody || '');
    const eventType = String(body.eventType || '') as ServerEmailEventType;
    const orderReference = body.orderReference ? String(body.orderReference).trim() : '';

    if (!to.includes('@') || !subject || !textBody || !ALLOWED_EVENTS.has(eventType)) {
      return res.status(400).json({
        ok: false,
        reason: 'invalid_payload',
        error: 'Thiếu thông tin email hợp lệ.',
      });
    }

    if (subject.length > 350 || textBody.length > 30000 || htmlBody.length > 80000) {
      return res.status(400).json({
        ok: false,
        reason: 'payload_too_large',
        error: 'Nội dung email vượt quá giới hạn cho phép.',
      });
    }

    if (!hasServerEmailProvider()) {
      return res.status(200).json({
        ok: false,
        channel: 'none',
        reason: 'no_server_provider',
      });
    }

    const result = await dispatchServerEmail({
      to,
      cc,
      replyTo,
      subject,
      textBody,
      htmlBody: htmlBody || `<p>${textBody.replace(/\n/g, '<br/>')}</p>`,
      eventType,
      orderReference,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      channel: 'none',
      error: err?.message || 'Lỗi máy chủ gửi email',
    });
  }
}
