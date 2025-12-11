/**
 * Unit Tests: Rate Limiting
 */

import { checkRateLimit, incrementRateLimit } from '@/lib/rate-limiter';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limit store between tests
    // Note: In a real implementation, you'd want to reset the store
  });

  test('allows requests within limit', () => {
    const identifier = 'test-user-1';
    const result = checkRateLimit(identifier, 10);
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(10);
  });

  test('tracks request count', () => {
    const identifier = 'test-user-2';
    
    // First check
    const first = checkRateLimit(identifier, 5);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(5);

    // Increment
    incrementRateLimit(identifier);
    
    // Second check
    const second = checkRateLimit(identifier, 5);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(4);
  });

  test('blocks requests over limit', () => {
    const identifier = 'test-user-3';
    const limit = 3;

    // Exhaust limit
    for (let i = 0; i < limit; i++) {
      incrementRateLimit(identifier);
    }

    const result = checkRateLimit(identifier, limit);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});

