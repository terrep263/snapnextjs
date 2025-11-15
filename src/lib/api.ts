/**
 * Centralized API Client Service
 * Provides consistent fetch wrapper with error handling, auth, and standard response format
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

/**
 * Standard fetch wrapper for API calls
 * Handles errors, content-type, and response parsing
 */
export const apiClient = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  try {
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      credentials: 'include', // ✅ IMPORTANT: Send cookies with API requests
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

    return {
      success: true,
      data: data,
      status: response.status,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: message,
      status: 0,
    };
  }
};

/**
 * GET request
 */
export const apiGet = async <T = any>(
  endpoint: string,
  options?: Omit<RequestInit, 'method'>
): Promise<ApiResponse<T>> => {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'GET',
  });
};

/**
 * POST request
 */
export const apiPost = async <T = any>(
  endpoint: string,
  body?: Record<string, any>,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<ApiResponse<T>> => {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
};

/**
 * PUT request
 */
export const apiPut = async <T = any>(
  endpoint: string,
  body?: Record<string, any>,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<ApiResponse<T>> => {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
};

/**
 * DELETE request
 */
export const apiDelete = async <T = any>(
  endpoint: string,
  options?: Omit<RequestInit, 'method'>
): Promise<ApiResponse<T>> => {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'DELETE',
  });
};

/**
 * PATCH request
 */
export const apiPatch = async <T = any>(
  endpoint: string,
  body?: Record<string, any>,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<ApiResponse<T>> => {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
};

/**
 * Throw if response is not successful
 * Useful for components that need to throw errors for error boundaries
 */
export const throwIfError = <T,>(response: ApiResponse<T>): T => {
  if (!response.success) {
    const error = new Error(response.error || 'API Error') as ApiError;
    error.status = response.status;
    error.data = response.data;
    throw error;
  }
  return response.data as T;
};

/**
 * Admin API endpoints
 */
export const adminApi = {
  verify: () => apiPost('/api/admin/auth', { action: 'verify' }),
  logout: () => apiPost('/api/admin/auth', { action: 'logout' }),
  login: (email: string, code: string) =>
    apiPost('/api/admin/auth', { action: 'login', email, code }),
  getStats: () => apiGet('/api/admin/promo-stats'),
  getEvents: () => apiGet('/api/admin/promo-events'),
  getBlockedEmails: () => apiGet('/api/admin/blocked-emails'),
  blockEmail: (email: string) => apiPost('/api/admin/block-email', { email }),
  unblockEmail: (email: string) => apiPost('/api/admin/unblock-email', { email }),
  deleteEvent: (eventId: string) =>
    apiPost('/api/admin/delete-event', { eventId }),
  listAdmins: () => apiGet('/api/admin/list-admins'),
  getSettings: () => apiGet('/api/admin/settings'),
  updateSettings: (settings: Record<string, any>) =>
    apiPost('/api/admin/settings', settings),
};

/**
 * Affiliate API endpoints
 */
export const affiliateApi = {
  register: (email: string, code: string) =>
    apiPost('/api/affiliate/register', { email, code }),
  getDashboard: () => apiGet('/api/affiliate/dashboard'),
  validate: (email: string, code: string) =>
    apiPost('/api/affiliate/validate', { email, code }),
};

/**
 * Event API endpoints
 */
export const eventApi = {
  getPhotos: (eventId: string) => apiGet(`/api/photos/${eventId}`),
  uploadPhotos: (eventId: string, formData: FormData) =>
    apiClient(`/api/upload`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }),
};

/**
 * Stripe API endpoints
 */
export const stripeApi = {
  createCheckoutSession: (body: any) =>
    apiPost('/api/checkout/create-checkout-session', body),
  verifyPayment: (sessionId: string) =>
    apiPost('/api/checkout/verify-payment', { sessionId }),
  getPromotion: (code: string) =>
    apiGet(`/api/stripe/stripe-promotions?code=${code}`),
  getCoupons: () => apiGet('/api/stripe/stripe-coupons'),
  getDiscountOffer: (email: string) =>
    apiGet(`/api/stripe/discount-offer?email=${email}`),
};

/**
 * Email API endpoints
 */
export const emailApi = {
  send: (body: any) => apiPost('/api/email/send-email', body),
};

/**
 * Testing API endpoints (dev only)
 */
export const testApi = {
  testDb: () => apiGet('/api/test-db'),
  debugEvent: (eventId: string) => apiGet(`/api/debug-event?id=${eventId}`),
};
