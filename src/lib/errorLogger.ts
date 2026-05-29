/**
 * Error Logger Utility
 * Centralized error logging system for Sprint 1
 *
 * In addition to persisting errors to the error_logs table, high-severity
 * events trigger an admin notification email via Resend so that silent route
 * failures surface to the operator instead of disappearing into the logs.
 */

import { getServiceRoleClient } from './supabase';
import { Resend } from 'resend';

interface ErrorLogParams {
  errorType: string;
  errorMessage: string;
  stackTrace?: string | null;
  userId?: string | null;
  eventId?: string | null;
  requestData?: Record<string, any> | null;
  severity?: 'error' | 'warning' | 'critical' | 'high' | 'info';
}

// Severities that warrant an immediate admin email.
const ALERT_SEVERITIES = new Set(['high', 'critical']);

// In-memory throttle so a single broken route cannot flood the inbox.
// Keyed by errorType; one alert per key per window.
const ALERT_THROTTLE_MS = 15 * 60 * 1000; // 15 minutes
const lastAlertAt = new Map<string, number>();

/**
 * Send an admin notification email for a high-severity error.
 * Fails silently (logs to console) so alerting never breaks the caller.
 */
async function sendAdminAlert(params: ErrorLogParams): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    // Recipient is configurable; falls back to the operator address.
    const to =
      process.env.SNAPWORXX_ALERT_EMAIL ||
      process.env.ADMIN_ALERT_EMAIL ||
      'terre@dplkfactory.com';
    const from =
      process.env.RESEND_FROM_EMAIL || 'SnapWorxx <noreply@snapworxx.com>';

    if (!apiKey) {
      console.warn('Admin alert skipped: RESEND_API_KEY not configured');
      return;
    }

    // Throttle per errorType.
    const now = Date.now();
    const last = lastAlertAt.get(params.errorType) || 0;
    if (now - last < ALERT_THROTTLE_MS) {
      return; // Already alerted for this error type recently.
    }
    lastAlertAt.set(params.errorType, now);

    const resend = new Resend(apiKey);
    const env = process.env.NODE_ENV || 'unknown';
    const when = new Date().toISOString();

    const safe = (v: unknown) =>
      String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const requestSnippet = params.requestData
      ? safe(JSON.stringify(params.requestData).slice(0, 1500))
      : '(none)';
    const stackSnippet = params.stackTrace
      ? safe(params.stackTrace.slice(0, 1500))
      : '(none)';

    await resend.emails.send({
      from,
      to,
      subject: `🚨 SnapWorxx ${params.severity?.toUpperCase()} error: ${params.errorType}`,
      html: `
        <div style="font-family: Arial, sans-serif; color:#1f2937; max-width:640px;">
          <h2 style="color:#b91c1c; margin:0 0 12px;">SnapWorxx error alert</h2>
          <p style="margin:0 0 16px; color:#4b5563;">A ${safe(
            params.severity
          )}-severity error was logged on <strong>${safe(env)}</strong> at ${safe(
        when
      )}.</p>
          <table style="border-collapse:collapse; width:100%; font-size:14px;">
            <tr><td style="padding:6px 10px; background:#f3f4f6; font-weight:bold; width:120px;">Type</td><td style="padding:6px 10px;">${safe(
              params.errorType
            )}</td></tr>
            <tr><td style="padding:6px 10px; background:#f3f4f6; font-weight:bold;">Message</td><td style="padding:6px 10px;">${safe(
              params.errorMessage
            )}</td></tr>
            ${
              params.eventId
                ? `<tr><td style="padding:6px 10px; background:#f3f4f6; font-weight:bold;">Event</td><td style="padding:6px 10px;">${safe(
                    params.eventId
                  )}</td></tr>`
                : ''
            }
          </table>
          <h3 style="margin:18px 0 6px; font-size:14px;">Request</h3>
          <pre style="background:#0f172a; color:#e2e8f0; padding:12px; border-radius:6px; overflow:auto; font-size:12px; white-space:pre-wrap;">${requestSnippet}</pre>
          <h3 style="margin:18px 0 6px; font-size:14px;">Stack</h3>
          <pre style="background:#0f172a; color:#e2e8f0; padding:12px; border-radius:6px; overflow:auto; font-size:12px; white-space:pre-wrap;">${stackSnippet}</pre>
          <p style="margin:16px 0 0; color:#9ca3af; font-size:12px;">Further alerts for "${safe(
            params.errorType
          )}" are throttled for ${ALERT_THROTTLE_MS / 60000} minutes.</p>
        </div>
      `,
    });
  } catch (err) {
    // Never let alerting break the logging path.
    console.error('sendAdminAlert() failed:', err);
  }
}

class ErrorLogger {
  /**
   * Log an error to the error_logs table
   */
  static async log({
    errorType,
    errorMessage,
    stackTrace = null,
    userId = null,
    eventId = null,
    requestData = null,
    severity = 'error',
  }: ErrorLogParams): Promise<void> {
    try {
      const supabase = getServiceRoleClient();

      const { error } = await supabase.from('error_logs').insert({
        error_type: errorType,
        error_message: errorMessage,
        stack_trace: stackTrace,
        user_id: userId,
        event_id: eventId,
        request_data: requestData,
        severity,
        created_at: new Date().toISOString(),
      });

      if (error) {
        // Fallback to console logging if database insert fails
        console.error('Failed to log error to database:', error);
        console.error('Original error:', {
          errorType,
          errorMessage,
          stackTrace,
        });
      }
    } catch (err) {
      // Fallback to console logging if anything fails
      console.error('ErrorLogger.log() failed:', err);
      console.error('Original error:', {
        errorType,
        errorMessage,
        stackTrace,
      });
    }

    // Notify the admin for high-severity events. Awaited but self-contained
    // and non-throwing, so it can never break the caller.
    if (ALERT_SEVERITIES.has(severity)) {
      await sendAdminAlert({
        errorType,
        errorMessage,
        stackTrace,
        userId,
        eventId,
        requestData,
        severity,
      });
    }
  }

  /**
   * Log a database error
   */
  static async logDatabaseError(
    err: Error,
    query?: string | null
  ): Promise<void> {
    await this.log({
      errorType: 'DATABASE_ERROR',
      errorMessage: err.message,
      stackTrace: err.stack || null,
      requestData: query ? { query } : null,
      severity: 'critical',
    });
  }

  /**
   * Log a webhook error
   */
  static async logWebhookError(
    webhookId: string | null,
    err: Error,
    payload?: any
  ): Promise<void> {
    await this.log({
      errorType: 'WEBHOOK_ERROR',
      errorMessage: err.message,
      stackTrace: err.stack || null,
      requestData: {
        webhookId,
        payload: payload ? JSON.stringify(payload) : null,
      },
      severity: 'high',
    });
  }

  /**
   * Log an API error
   */
  static async logApiError(
    err: Error,
    req: {
      method?: string;
      path?: string;
      body?: any;
      query?: any;
      user?: { id?: string } | null;
    }
  ): Promise<void> {
    await this.log({
      errorType: err.name || 'API_ERROR',
      errorMessage: err.message,
      stackTrace: err.stack || null,
      userId: req.user?.id || null,
      requestData: {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
      },
      severity: 'error',
    });
  }
}

export default ErrorLogger;
