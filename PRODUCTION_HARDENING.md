# SnapWorxx Gallery - Production Hardening Guide

## Overview

This document outlines the production hardening measures implemented for the SnapWorxx gallery system, including performance optimizations, security controls, testing, accessibility, and staged rollout support.

## Performance Optimizations

### Image Optimization
- **Next.js Image Component**: Implemented `OptimizedImage` component using Next.js Image with:
  - Automatic WebP/AVIF format conversion
  - Responsive image sizing
  - Lazy loading for off-screen images
  - Priority loading for above-the-fold content

- **Multiple Image Sizes**: Image optimizer generates:
  - Thumbnail: 400×400px (WebP)
  - Small: 800×800px (WebP)
  - Medium: 1200×1200px (WebP)
  - Large: 1920×1920px (JPEG)
  - Original: Full resolution

- **Caching Headers**:
  - Static media: `Cache-Control: public, max-age=31536000, immutable` (1 year)
  - Gallery API responses: `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` (5 min with 10 min stale-while-revalidate)

### Lightbox Optimization
- **Prefetching**: Preloads ±3 adjacent images for instant navigation
- **Progressive Loading**: Shows blurred thumbnail while full image loads
- **Cleanup**: Removes prefetched images beyond ±5 range to manage memory

### Performance Targets
- **Load Time**: <3 seconds on 4G for 500+ photos
- **Lighthouse Score**: Target 90+ for Performance
- **Time to Interactive**: <3.5 seconds

## Security & Privacy

### File Validation
- **Server-Side Checks**: All file type and size validation happens server-side
- **Magic Byte Detection**: Validates file types using file signatures, not just extensions
- **Size Limits**:
  - Photos: 25 MB maximum
  - Videos: 500 MB maximum

### EXIF Data Stripping
- **GPS Removal**: All GPS coordinates stripped from images on upload
- **Metadata Cleanup**: Uses Sharp to remove EXIF data for privacy

### Signed URLs
- **All Downloads**: Use signed URLs with 1-hour expiration
- **Bulk Downloads**: ZIP files use 24-hour signed URLs
- **Security**: Prevents unauthorized access and hotlinking

### Rate Limiting
- **Uploads**: 50 per hour per session/IP
- **Downloads**: 100 per hour per session/IP
- **API Protection**: Prevents abuse and DoS attacks

### Package-Based Security
- **Basic/Freebie**: Never expose original file URLs
- **Watermarking**: Always applied for Basic/Freebie packages
- **Premium**: Original files only accessible via signed URLs

## Testing

### Unit Tests
Located in `src/__tests__/gallery/`:
- `package-detection.test.ts`: Package type detection logic
- `watermark.test.ts`: Watermark generation and application
- `upload-validation.test.ts`: File type and size validation
- `rate-limiting.test.ts`: Rate limiting functionality

### Integration Tests
Located in `src/__tests__/integration/`:
- `upload-flow.test.ts`: Upload → View → Download → Share flows

### E2E Tests
Located in `src/__tests__/e2e/`:
- `public-guest-flow.test.ts`: Public user journey
- `event-owner-flow.test.ts`: Event owner journey
- `package-behavior.test.ts`: Basic vs Premium behavior

### Running Tests
```bash
# Run all tests
npm test

# Run unit tests only
npm test -- __tests__/gallery

# Run integration tests
npm test -- __tests__/integration

# Run E2E tests (requires test environment)
npm test -- __tests__/e2e
```

## Accessibility (WCAG AA)

### Keyboard Navigation
- **Full Keyboard Support**: All interactive elements accessible via keyboard
- **Lightbox Controls**: Arrow keys, ESC, Space (for videos)
- **Focus Management**: Proper focus trapping in modals
- **Tab Order**: Logical tab order throughout

### ARIA Labels
- **Interactive Elements**: All buttons have descriptive `aria-label` attributes
- **Modal Dialogs**: Lightbox uses `role="dialog"` and `aria-modal="true"`
- **Image Alt Text**: All images have descriptive alt text

### Visual Accessibility
- **Focus Indicators**: Visible focus rings on all interactive elements
- **Color Contrast**: WCAG AA compliant (4.5:1 for text, 3:1 for UI components)
- **Focus Visibility**: `focus:ring-2` classes ensure focus is always visible

### Screen Reader Support
- **Semantic HTML**: Proper use of semantic elements
- **ARIA Attributes**: Comprehensive ARIA labels and roles
- **Alt Text**: Descriptive alt text for all images

## Staged Rollout

### Feature Flags
Located in `src/lib/feature-flags.ts`:
- **Configuration**: Environment variables or database-driven
- **Rollout Stages**: staging → internal → beta → production
- **Percentage Rollout**: Gradual percentage-based enablement
- **Event-Specific**: Enable for specific events or slugs
- **Role-Based**: Always enable for admins/owners

### Configuration
Set via environment variables:
```bash
GALLERY_VERSION=new|legacy
ROLLOUT_STAGE=staging|internal|beta|production
ENABLED_EVENT_IDS=event1,event2,event3
ENABLED_EVENT_SLUGS=slug1,slug2
ENABLED_PERCENTAGE=25  # 25% of events
```

### Rollback
- **Legacy Path**: Old gallery remains at `/e/[slug]`
- **Automatic Redirect**: Feature flag redirects to legacy if new gallery disabled
- **Zero Downtime**: Rollback is instant via environment variable change

## Deployment Checklist

### Pre-Deployment
- [ ] Run all unit tests
- [ ] Run integration tests
- [ ] Run E2E tests
- [ ] Verify security controls
- [ ] Check accessibility (Lighthouse)
- [ ] Performance testing (500+ photos)
- [ ] Load testing

### Deployment
- [ ] Deploy to staging
- [ ] Enable for internal testers (feature flag)
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Enable for beta users (10-25%)
- [ ] Monitor for 24-48 hours
- [ ] Gradual rollout to 50%, 75%, 100%

### Post-Deployment
- [ ] Monitor error logs
- [ ] Track performance metrics
- [ ] Collect user feedback
- [ ] Monitor rate limiting
- [ ] Check security events

## Monitoring

### Key Metrics
- **Load Time**: Average gallery load time
- **Error Rate**: API error percentage
- **Rate Limit Hits**: Number of rate limit violations
- **Upload Success Rate**: Successful upload percentage
- **Download Success Rate**: Successful download percentage

### Alerts
- Error rate > 1%
- Load time > 5 seconds
- Rate limit violations > 100/hour
- Upload failure rate > 5%

## Compatibility

### No Breaking Changes
- ✅ No database schema changes
- ✅ All existing APIs remain functional
- ✅ Legacy gallery path preserved
- ✅ Backward compatible with existing data

### Additive Only
- ✅ New components and utilities
- ✅ New API endpoints (additive)
- ✅ Feature flags (opt-in)
- ✅ No modifications to existing tables

## Support

For issues or questions:
1. Check error logs in ErrorLogger
2. Review feature flag configuration
3. Verify environment variables
4. Check rate limiting status
5. Review security audit logs

