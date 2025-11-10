'use client';

/**
 * Toast Notification Utilities
 * Wrapper around 'sonner' toast library with consistent styling
 */

import { toast as sonnerToast, Toaster } from 'sonner';
import { MESSAGE_TIMEOUTS, COLORS } from '@/config/constants';

export interface ToastOptions {
  duration?: number;
  description?: string;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

/**
 * Show success toast
 */
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      duration: options?.duration ?? MESSAGE_TIMEOUTS.SUCCESS,
      description: options?.description,
      position: options?.position ?? 'bottom-right',
    });
  },

  /**
   * Show error toast
   */
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: options?.duration ?? MESSAGE_TIMEOUTS.ERROR,
      description: options?.description,
      position: options?.position ?? 'bottom-right',
    });
  },

  /**
   * Show info toast
   */
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      duration: options?.duration ?? MESSAGE_TIMEOUTS.INFO,
      description: options?.description,
      position: options?.position ?? 'bottom-right',
    });
  },

  /**
   * Show warning toast
   */
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      duration: options?.duration ?? MESSAGE_TIMEOUTS.WARNING,
      description: options?.description,
      position: options?.position ?? 'bottom-right',
    });
  },

  /**
   * Show loading toast (doesn't auto-close)
   */
  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      duration: options?.duration ?? MESSAGE_TIMEOUTS.PERSISTENT,
      description: options?.description,
      position: options?.position ?? 'bottom-right',
    });
  },

  /**
   * Show promise-based toast
   */
  promise: <T,>(
    promise: Promise<T>,
    {
      loading = 'Loading...',
      success = 'Success!',
      error = 'Error',
    }: {
      loading?: string;
      success?: string | ((data: T) => string);
      error?: string | ((err: any) => string);
    } = {},
    options?: ToastOptions
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
      duration: options?.duration,
      position: options?.position ?? 'bottom-right',
    });
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    sonnerToast.dismiss();
  },
};

/**
 * Toast Provider Component
 * Add to root layout for global toast notifications
 * Example: <ToastProvider />
 */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      theme="light"
      expand={true}
      visibleToasts={5}
    />
  );
}

/**
 * Helper to show API error toast
 */
export const toastApiError = (error: any, defaultMessage = 'Something went wrong') => {
  const message =
    typeof error === 'string'
      ? error
      : error?.message || error?.error || defaultMessage;
  toast.error(message);
};

/**
 * Helper to show API success toast
 */
export const toastApiSuccess = (message: string = 'Operation successful') => {
  toast.success(message);
};
