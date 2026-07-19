/**
 * Centralized transactional email sender for SnapWorxx.
 *
 * All outbound app email goes through MailerCloud's Email API
 * (POST https://email-api.mailercloud.com/email). This is intentionally
 * non-throwing: every call returns a result object so a mail failure can
 * never break the request that triggered it.
 *
 * Sender: the from address is always the MailerCloud-verified sender
 * (terrepolite@snapworxx.com by default). Callers may override the display
 * name via `fromName`, but not the address — an unverified from address is
 * rejected by MailerCloud with a 403/validation error.
 */

const MAILERCLOUD_EMAIL_API = 'https://email-api.mailercloud.com/email';

const DEFAULT_FROM_EMAIL =
  process.env.MAILERCLOUD_FROM_EMAIL || 'terrepolite@snapworxx.com';
const DEFAULT_FROM_NAME = process.env.MAILERCLOUD_FROM_NAME || 'SnapWorxx';

export interface SendMailParams {
  /** One or more recipient email addresses. */
  to: string | string[];
  subject: string;
  html: string;
  /** Display name override. The from address stays the verified sender. */
  fromName?: string;
}

export interface SendMailResult {
  ok: boolean;
  error?: string;
}

/**
 * Send a transactional email via MailerCloud. Never throws.
 */
export async function sendMail(params: SendMailParams): Promise<SendMailResult> {
  const { subject, html } = params;
  const fromName = params.fromName || DEFAULT_FROM_NAME;

  const apiKey = process.env.MAILERCLOUD_API_KEY;
  if (!apiKey) {
    console.error('[Mailer] MAILERCLOUD_API_KEY not configured — skipping send');
    return { ok: false, error: 'Email service not configured' };
  }

  const recipients = (Array.isArray(params.to) ? params.to : [params.to])
    .filter((e): e is string => typeof e === 'string' && e.trim().length > 0)
    .map((email) => ({ email: email.trim() }));

  if (recipients.length === 0) {
    console.error('[Mailer] No valid recipient — skipping send');
    return { ok: false, error: 'No recipient address' };
  }

  const body = {
    email: {
      from: DEFAULT_FROM_EMAIL,
      fromName,
      subject,
      html,
      recipients: { to: recipients },
    },
    metadata: { campaignType: 'transactional' },
    version: '1.0',
  };

  try {
    const res = await fetch(MAILERCLOUD_EMAIL_API, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data: any = await res.json().catch(() => ({}));

    if (!res.ok || data?.status === 'ERROR') {
      const msg = data?.message || `HTTP ${res.status}`;
      console.error('[Mailer] MailerCloud send failed:', res.status, msg);
      return { ok: false, error: String(msg) };
    }

    console.log(
      `[Mailer] Sent "${subject}" to ${recipients
        .map((r) => r.email)
        .join(', ')} via MailerCloud`
    );
    return { ok: true };
  } catch (err) {
    console.error('[Mailer] Send error:', err);
    return { ok: false, error: 'Failed to send email' };
  }
}
