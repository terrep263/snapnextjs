/**
 * Centralized API Client Service
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

export interface ApiError extends Error {
  status: number;
  data?: any;
}

export const apiClient = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> => {
  // Use relative URLs client-side; use APP_URL server-side
  const baseUrl =
    typeof window !== 'undefined'
      ? ''
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  try {
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || `HTTP ${response.status}: ${response.statusText}`,
        data: data,
        status: response.status,
      };
    }

    return { success: true, data: data, status: response.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message, status: 0 };
  }
};

export const apiGet = async <T = any>(
  endpoint: string,
  options?: Omit<RequestInit, 'method'>
): Promise<ApiResponse<T>> => apiClient<T>(endpoint, { ...options, method: 'GET' });

export const apiPost = async <T = any>(
  endpoint: string,
  body?: Record<string, any>,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<ApiResponse<T>> =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

export const apiPut = async <T = any>(
  endpoint: string,
  body?: Record<string, any>,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<ApiResponse<T>> =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });

export const apiDelete = async <T = any>(
  endpoint: string,
  options?: Omit<RequestInit, 'method'>
): Promise<ApiResponse<T>> => apiClient<T>(endpoint, { ...options, method: 'DELETE' });

export const apiPatch = async <T = any>(
  endpoint: string,
  body?: Record<string, any>,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<ApiResponse<T>> =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });

export const throwIfError = <T,>(response: ApiResponse<T>): T => {
  if (!response.success) {
    const error = new Error(response.error || 'API Error') as ApiError;
    error.status = response.status;
    error.data = response.data;
    throw error;
  }
  return response.data as T;
};

// Admin API
export const adminApi = {
  verify: () => apiPost('/api/admin/auth', { action: 'verify' }),
  logout: () => apiPost('/api/admin/auth', { action: 'logout' }),
  login: (email: string, password: string) =>
    apiPost('/api/admin/auth', { action: 'login', email, password }),
  getStats: () => apiGet('/api/admin/promo-stats'),
  getEvents: () => apiGet('/api/admin/promo-events'),
  getBlockedEmails: () => apiGet('/api/admin/blocked-emails'),
  blockEmail: (email: string) => apiPost('/api/admin/block-email', { email }),
  unblockEmail: (email: string) => apiPost('/api/admin/unblock-email', { email }),
  deleteEvent: (eventId: string) => apiPost('/api/admin/delete-event', { eventId }),
  listAdmins: () => apiGet('/api/admin/list-admins'),
  getSettings: () => apiGet('/api/admin/settings'),
  updateSettings: (settings: Record<string, any>) =>
    apiPost('/api/admin/settings', settings),
};

// Affiliate API
export const affiliateApi = {
  register: (email: string, code: string) =>
    apiPost('/api/affiliate/register', { email, code }),
  getDashboard: () => apiGet('/api/affiliate/dashboard'),
  validate: (email: string, code: string) =>
    apiPost('/api/affiliate/validate', { email, code }),
};

// Event API
export const eventApi = {
  getPhotos: (eventId: string) => apiGet(`/api/photos/${eventId}`),
  uploadPhotos: (_eventId: string, formData: FormData) =>
    apiClient('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }),
};

// Stripe API — corrected endpoint paths
export const stripeApi = {
  createCheckoutSession: (body: any) =>
    apiPost('/api/create-checkout-session', body),
  verifyPayment: (sessionId: string) =>
    apiPost('/api/verify-payment', { sessionId }),
  getPromotion: (code: string) =>
    apiGet(`/api/stripe-promotions?code=${code}`),
  getCoupons: () => apiGet('/api/stripe-coupons'),
  getDiscountOffer: (email: string) =>
    apiGet(`/api/discount-offer?email=${email}`),
};

// Email API — corrected endpoint path
export const emailApi = {
  send: (body: any) => apiPost('/api/send-email', body),
};

// Test API (dev only)
export const testApi = {
  testDb: () => apiGet('/api/test-db'),
  debugEvent: (eventId: string) => apiGet(`/api/debug-event?id=${eventId}`),
};
