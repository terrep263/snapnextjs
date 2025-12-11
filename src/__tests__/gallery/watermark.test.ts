/**
 * Unit Tests: Watermark Generation
 */

import {
  generateBasicWatermark,
  generateFreebieWatermark,
  shouldApplyWatermark,
} from '@/lib/download-utils';
import { EventData } from '@/lib/gallery-utils';

describe('Watermark Generation', () => {
  test('generates Basic watermark SVG', () => {
    const svg = generateBasicWatermark(1200);
    expect(svg).toContain('shared by snapworxx.com');
    expect(svg).toContain('opacity="0.7"');
    expect(svg).toContain('<svg');
  });

  test('generates Freebie watermark SVG', () => {
    const svg = generateFreebieWatermark(1200);
    expect(svg).toContain('snapworxx.com');
    expect(svg).toContain('opacity="0.9"');
    expect(svg).toContain('<svg');
  });

  test('watermark scales with width', () => {
    const small = generateBasicWatermark(400);
    const large = generateBasicWatermark(2000);
    
    // Large watermark should have larger dimensions
    const smallMatch = small.match(/height="(\d+)"/);
    const largeMatch = large.match(/height="(\d+)"/);
    
    if (smallMatch && largeMatch) {
      expect(parseInt(largeMatch[1])).toBeGreaterThan(parseInt(smallMatch[1]));
    }
  });

  test('shouldApplyWatermark returns true for Basic', () => {
    const event: EventData = {
      id: 'test',
      name: 'Test',
      slug: 'test',
      is_freebie: false,
      is_free: true,
    };

    expect(shouldApplyWatermark(event, 'basic')).toBe(true);
  });

  test('shouldApplyWatermark returns true for Freebie', () => {
    const event: EventData = {
      id: 'test',
      name: 'Test',
      slug: 'test',
      is_freebie: true,
      is_free: false,
    };

    expect(shouldApplyWatermark(event, 'freebie')).toBe(true);
  });

  test('shouldApplyWatermark returns false for Premium without flag', () => {
    const event: EventData = {
      id: 'test',
      name: 'Test',
      slug: 'test',
      is_freebie: false,
      is_free: false,
      watermark_enabled: false,
    };

    expect(shouldApplyWatermark(event, 'premium')).toBe(false);
  });
});

