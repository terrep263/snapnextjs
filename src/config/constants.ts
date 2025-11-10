/**
 * Centralized Application Constants & Configuration
 * Single source of truth for app-wide constants
 */

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_ENDPOINTS = {
  // Admin
  ADMIN: {
    AUTH: '/api/admin/auth',
    PROMO_STATS: '/api/admin/promo-stats',
    PROMO_EVENTS: '/api/admin/promo-events',
    BLOCKED_EMAILS: '/api/admin/blocked-emails',
    BLOCK_EMAIL: '/api/admin/block-email',
    UNBLOCK_EMAIL: '/api/admin/unblock-email',
    DELETE_EVENT: '/api/admin/delete-event',
    LIST_ADMINS: '/api/admin/list-admins',
    SETTINGS: '/api/admin/settings',
  },
  // Affiliate
  AFFILIATE: {
    REGISTER: '/api/affiliate/register',
    DASHBOARD: '/api/affiliate/dashboard',
    VALIDATE: '/api/affiliate/validate',
  },
  // Checkout & Payment
  CHECKOUT: {
    CREATE_SESSION: '/api/checkout/create-checkout-session',
    VERIFY_PAYMENT: '/api/checkout/verify-payment',
  },
  // Stripe
  STRIPE: {
    PROMOTIONS: '/api/stripe/stripe-promotions',
    COUPONS: '/api/stripe/stripe-coupons',
    DISCOUNT_OFFER: '/api/stripe/discount-offer',
  },
  // Photos & Media
  PHOTOS: '/api/photos',
  UPLOAD: '/api/upload',
  // Email
  EMAIL: '/api/email/send-email',
  // Testing
  TEST_DB: '/api/test-db',
  DEBUG_EVENT: '/api/debug-event',
} as const;

// ============================================================================
// PAGINATION & LIMITS
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  ADMIN_PAGE_SIZE: 20,
  GALLERY_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
} as const;

export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_PHOTOS_PER_EVENT: 1000,
  MAX_VIDEO_SIZE: 500 * 1024 * 1024, // 500MB
  ALLOWED_PHOTO_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
} as const;

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280,
} as const;

export const COLORS = {
  PRIMARY: '#9333ea', // Purple
  PRIMARY_DARK: '#7e22ce',
  PRIMARY_LIGHT: '#a855f7',
  SECONDARY: '#3b82f6', // Blue
  SUCCESS: '#10b981', // Green
  WARNING: '#f59e0b', // Amber
  ERROR: '#ef4444', // Red
  GRAY_50: '#f9fafb',
  GRAY_100: '#f3f4f6',
  GRAY_200: '#e5e7eb',
  GRAY_300: '#d1d5db',
  GRAY_400: '#9ca3af',
  GRAY_500: '#6b7280',
  GRAY_600: '#4b5563',
  GRAY_700: '#374151',
  GRAY_800: '#1f2937',
  GRAY_900: '#111827',
} as const;

// ============================================================================
// ANIMATION TIMING
// ============================================================================

export const ANIMATION_TIMING = {
  FAST: 150, // ms
  NORMAL: 300, // ms
  SLOW: 500, // ms
  VERY_SLOW: 1000, // ms
} as const;

// ============================================================================
// MESSAGE TIMEOUTS
// ============================================================================

export const MESSAGE_TIMEOUTS = {
  SUCCESS: 3000, // ms
  ERROR: 5000, // ms
  INFO: 4000, // ms
  WARNING: 4000, // ms
  PERSISTENT: Infinity, // Never auto-close
} as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION = {
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PATTERN: /^\+?1?\d{9,15}$/,
  URL_PATTERN: /^https?:\/\/.+/,
  SLUG_PATTERN: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  MIN_PASSWORD_LENGTH: 8,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 2000,
} as const;

// ============================================================================
// STATUS CODES & MESSAGES
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
} as const;

// ============================================================================
// FEATURE FLAGS (for A/B testing, gradual rollouts)
// ============================================================================

export const FEATURES = {
  AFFILIATE_SYSTEM: true,
  PROMO_SYSTEM: true,
  STRIPE_INTEGRATION: true,
  ADVANCED_GALLERY: true,
  EMAIL_NOTIFICATIONS: true,
  QR_CODES: true,
} as const;

// ============================================================================
// STORAGE KEYS (localStorage, sessionStorage)
// ============================================================================

export const STORAGE_KEYS = {
  ADMIN_SESSION: 'admin_session',
  USER_PREFERENCES: 'user_preferences',
  RECENT_EVENTS: 'recent_events',
  FORM_DRAFTS: 'form_drafts',
  AFFILIATE_TOKEN: 'affiliate_token',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// ============================================================================
// DATE & TIME FORMATS
// ============================================================================

export const DATE_FORMATS = {
  SHORT_DATE: 'MMM d, yyyy',
  LONG_DATE: 'MMMM d, yyyy',
  TIME: 'h:mm a',
  DATETIME: 'MMM d, yyyy h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // ms
  MAX_DELAY: 10000, // ms
  BACKOFF_MULTIPLIER: 2,
} as const;

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

export const CACHE = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes in ms
  LONG_TTL: 1 * 60 * 60 * 1000, // 1 hour
  SHORT_TTL: 1 * 60 * 1000, // 1 minute
  STATS_TTL: 10 * 60 * 1000, // 10 minutes
} as const;

// ============================================================================
// ROUTE PATHS
// ============================================================================

export const ROUTES = {
  HOME: '/',
  LOGIN: '/admin/login',
  DASHBOARD: '/admin/dashboard',
  ADMIN_MANAGE: '/admin/manage',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_RESOURCES: '/admin/resources',
  CREATE_EVENT: '/create',
  EVENT_DASHBOARD: '/dashboard/:id',
  EVENT_UPLOAD: '/e/:slug/upload',
  EVENT_GALLERY: '/e/:slug',
  AFFILIATE_REGISTER: '/affiliate/register',
  AFFILIATE_DASHBOARD: '/affiliate/dashboard',
  PROMO_CONFIRMATION: '/promo/confirmation/:slug',
  SUCCESS: '/success',
  TEST_DB: '/test-db',
  TEST_EMAIL: '/test-email',
  TEST_STORAGE: '/test-storage',
  DEBUG_EVENT: '/debug-event',
  DIAGNOSTICS: '/diagnostics',
} as const;

// ============================================================================
// ENVIRONMENT-SPECIFIC CONFIG
// ============================================================================

export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  stripeKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
} as const;
