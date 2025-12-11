/**
 * Error Logger Utility
 * Centralized error logging system for Sprint 1
 */

import { getServiceRoleClient } from './supabase';

interface ErrorLogParams {
  errorType: string;
  errorMessage: string;
  stackTrace?: string | null;
  userId?: string | null;
  eventId?: string | null;
  requestData?: Record<string, any> | null;
  severity?: 'error' | 'warning' | 'critical' | 'high' | 'info';
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



