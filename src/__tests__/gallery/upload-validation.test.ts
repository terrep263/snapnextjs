/**
 * Unit Tests: Upload Validation
 */

import { validateFile, detectFileTypeFromMagicBytes } from '@/lib/upload-utils';

describe('Upload Validation', () => {
  // JPEG magic bytes: FF D8 FF
  const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
  // PNG magic bytes: 89 50 4E 47
  const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  test('detects JPEG from magic bytes', () => {
    const type = detectFileTypeFromMagicBytes(jpegBytes);
    expect(type).toBe('image/jpeg');
  });

  test('detects PNG from magic bytes', () => {
    const type = detectFileTypeFromMagicBytes(pngBytes);
    expect(type).toBe('image/png');
  });

  test('rejects files that are too small', () => {
    const smallBuffer = Buffer.from([0xff, 0xd8]);
    const type = detectFileTypeFromMagicBytes(smallBuffer);
    expect(type).toBeNull();
  });

  test('validates JPEG file size', () => {
    const validSize = 10 * 1024 * 1024; // 10MB
    const invalidSize = 30 * 1024 * 1024; // 30MB (over 25MB limit)

    const validBuffer = Buffer.alloc(validSize);
    jpegBytes.copy(validBuffer, 0);

    const invalidBuffer = Buffer.alloc(invalidSize);
    jpegBytes.copy(invalidBuffer, 0);

    const validResult = validateFile(validBuffer, 'test.jpg', 'image/jpeg');
    const invalidResult = validateFile(invalidBuffer, 'test.jpg', 'image/jpeg');

    expect(validResult.valid).toBe(true);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.error).toContain('too large');
  });

  test('rejects unsupported file types', () => {
    const gifBytes = Buffer.from([0x47, 0x49, 0x46, 0x38]); // GIF
    const result = validateFile(gifBytes, 'test.gif', 'image/gif');
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unsupported');
  });
});

