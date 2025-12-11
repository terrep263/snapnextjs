/**
 * Unit Tests: Package Detection
 */

import { detectPackageType } from '@/lib/download-utils';
import { EventData } from '@/lib/gallery-utils';

describe('Package Detection', () => {
  test('detects Freebie package correctly', () => {
    const event: EventData = {
      id: 'test-1',
      name: 'Test Event',
      slug: 'test-event',
      is_freebie: true,
      is_free: false,
    };

    expect(detectPackageType(event)).toBe('freebie');
  });

  test('detects Basic package correctly', () => {
    const event: EventData = {
      id: 'test-2',
      name: 'Test Event',
      slug: 'test-event',
      is_freebie: false,
      is_free: true,
    };

    expect(detectPackageType(event)).toBe('basic');
  });

  test('detects Premium package correctly', () => {
    const event: EventData = {
      id: 'test-3',
      name: 'Test Event',
      slug: 'test-event',
      is_freebie: false,
      is_free: false,
    };

    expect(detectPackageType(event)).toBe('premium');
  });

  test('Freebie takes priority over Basic', () => {
    const event: EventData = {
      id: 'test-4',
      name: 'Test Event',
      slug: 'test-event',
      is_freebie: true,
      is_free: true,
    };

    expect(detectPackageType(event)).toBe('freebie');
  });
});

