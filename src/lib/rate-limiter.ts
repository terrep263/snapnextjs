/**
 * Simple In-Memory Rate Limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_UPLOADS_PER_HOUR = 50;
const MAX_DOWNLOADS_PER_HOUR = 100;

/**
 * Check if a session/IP has exceeded rate limit
 */
export function checkRateLimit(
  identifier: string,
  maxLimit: number = MAX_UPLOADS_PER_HOUR
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    // Create new entry or reset expired one
    const newEntry: RateLimitEntry = {
      count: 0,
      resetAt: now + RATE_LIMIT_WINDOW,
    };
    rateLimitStore.set(identifier, newEntry);
    return {
      allowed: true,
      remaining: maxLimit,
      resetAt: newEntry.resetAt,
    };
  }

  if (entry.count >= maxLimit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: maxLimit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Increment rate limit counter
 */
export function incrementRateLimit(identifier: string): void {
  const entry = rateLimitStore.get(identifier);
  if (entry) {
    entry.count++;
  }
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get session ID from cookie
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const sessionMatch = cookieHeader.match(/session[_-]?id=([^;]+)/i);
    if (sessionMatch) {
      return `session:${sessionMatch[1]}`;
    }
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  return `ip:${ip}`;
}

/**
 * Clean up expired entries (run periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

