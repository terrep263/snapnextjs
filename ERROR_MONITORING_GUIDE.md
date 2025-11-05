# Error Monitoring Quick Reference

## Dashboard Queries

### 🔴 Critical Errors (Requires Immediate Action)
```sql
SELECT 
  event_id,
  filename,
  error_message,
  metadata,
  created_at
FROM media_security_events
WHERE severity = 'critical'
  AND created_at > NOW() - INTERVAL '7 days'
  AND resolved = false
ORDER BY created_at DESC;
```

### 🟠 High Priority Errors (Last 24 Hours)
```sql
SELECT 
  COUNT(*) as error_count,
  filename,
  error_message,
  MAX(created_at) as latest_error
FROM media_security_events
WHERE severity = 'high'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY filename, error_message
ORDER BY error_count DESC;
```

### 📊 Error Rate by Event
```sql
SELECT 
  event_id,
  COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_errors,
  COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_errors,
  COUNT(*) as total_errors,
  ROUND(100.0 * COUNT(*) / NULLIF(
    (SELECT COUNT(*) FROM media_audit_logs WHERE event_id = m.event_id), 0
  ), 2) as error_percentage
FROM media_security_events m
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY event_id
ORDER BY critical_errors DESC, total_errors DESC;
```

### 🔍 Filter by Error Type
```sql
SELECT 
  error_message,
  COUNT(*) as occurrences,
  ARRAY_AGG(DISTINCT filename) as affected_files,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen
FROM media_security_events
WHERE error_message ILIKE '%upload%'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY error_message
ORDER BY occurrences DESC;
```

## Common Error Messages & Solutions

### ❌ "Chunked upload failed: Upload timeout"
- **Cause**: Large file taking too long, connection timeout
- **Solution**: Check internet speed, try smaller file, or use compression
- **Action**: Monitor retry attempts, consider increasing timeout for slow connections

### ❌ "Upload failed: application/octet-stream is not supported"
- **Cause**: File MIME type not recognized
- **Solution**: Ensure file is valid video/image format
- **Status**: Fixed in latest version with MIME type preservation

### ❌ "Database insertion failed: violates foreign key constraint"
- **Cause**: Event doesn't exist or is invalid
- **Solution**: Verify event exists before upload, refresh page
- **Action**: Log includes photo record for debugging

### ❌ "File failed security validation"
- **Cause**: File blocked by security rules (extension, filename, pattern)
- **Solution**: Rename file to remove special characters, use supported format
- **Action**: Review validation errors in metadata

### ❌ "Upload batch failed: undefined is not a function"
- **Cause**: Missing security class or backup manager
- **Solution**: Verify all 3 security classes imported correctly
- **Action**: Check build logs for import errors

## Email Alert Template

**Subject**: [CRITICAL] Media Upload System Error - Requires Investigation

**Body**:
```
Error Type: {{error_type}}
Severity: {{severity}}
Event ID: {{event_id}}
File: {{filename}}
Count: {{error_count}} errors in last {{hours}} hours

Error Message:
{{error_message}}

Metadata:
{{metadata_json}}

Last Occurred: {{latest_timestamp}}

Action Required:
1. Check media_security_events table for full details
2. Review error metadata for patterns
3. Contact user if file upload was important
4. Check internet/database connectivity if high volume
5. Update error handling if new error type discovered
```

## Severity Escalation

| Severity | Detection | Action | Timeline |
|----------|-----------|--------|----------|
| Low | Validation warning | Log only | Monitor |
| Medium | Recoverable error | Review weekly | 1 week |
| High | Upload failure | Check daily | 24 hours |
| Critical | Database/batch error | **Alert immediately** | **1 hour** |

## Weekly Review Checklist

- [ ] Check for unresolved critical errors
- [ ] Identify error patterns (same file, same error type)
- [ ] Review error trends (increasing/decreasing)
- [ ] Check success rate vs error rate
- [ ] Verify backup creation for successful uploads
- [ ] Review user impact (how many events affected)
- [ ] Check system resources during error peaks
- [ ] Update documentation if new error discovered

## Monthly Maintenance

- [ ] Export error logs for compliance
- [ ] Archive logs older than 1 month (optional)
- [ ] Generate error report for stakeholders
- [ ] Review and update error handling code
- [ ] Test disaster recovery procedures
- [ ] Clean up resolved errors from dashboard
- [ ] Update runbooks for common errors
- [ ] Train team on new error patterns

## Integration Points

### Slack Notification
```typescript
// Pseudo-code - send critical errors to Slack
if (severity === 'critical') {
  await fetch(process.env.SLACK_WEBHOOK, {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 Critical Media Error`,
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Event: ${eventId}\nFile: ${filename}\nError: ${errorMessage}`
        }
      }]
    })
  });
}
```

### Dashboard Widget
```sql
-- Real-time error rate
SELECT 
  COUNT(*) as errors_per_hour,
  EXTRACT(HOUR FROM created_at) as hour
FROM media_security_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour DESC;
```

### Custom Metrics
```typescript
// Track error rates in application
const errorMetrics = {
  securityValidationFailures: 0,
  uploadTimeouts: 0,
  databaseErrors: 0,
  batchFailures: 0,
  recoveryAttempts: 0
};
```

---

**Last Updated**: Production Deployment  
**Status**: ✅ Ready for Monitoring  
**Documentation**: Refer to ERROR_LOGGING_SUMMARY.md for full details
