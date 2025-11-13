# Database Schema Check for Freebie Feature

## Columns Required by `/api/create-freebie-event`:

| Column | Type | Status | Notes |
|--------|------|--------|-------|
| `id` | text | ✅ Exists | Primary key |
| `name` | text | ✅ Exists | Event name |
| `slug` | text | ✅ Exists | URL slug |
| `email` | text | ✅ Exists | From add_email_field_migration.sql |
| `status` | text | ✅ Exists | active/inactive/expired |
| `is_free` | boolean | ✅ Exists | From add_promo_columns.sql |
| `is_freebie` | boolean | ❓ CHECK | From migrations/add_freebie_column.sql |
| `max_photos` | integer | ✅ Exists | From add_promo_columns.sql |
| `max_storage_bytes` | bigint | ❓ CHECK | NOT in any migration file! |
| `password_hash` | text | ✅ Exists | From add_password_protection.sql |
| `owner_name` | text | ❓ CHECK | NOT in any migration file! |

## Migration Files to Run:

### ✅ Already have these:
- `migrations/add_promo_columns.sql` (max_photos, is_free, etc.)
- `migrations/add_password_protection.sql` (password_hash)
- `add_email_field_migration.sql` (email column)

### ❓ Need to verify/run:
- `migrations/add_freebie_column.sql` (is_freebie)

### ❌ MISSING - Need to create:
- Migration for `max_storage_bytes` column
- Migration for `owner_name` column

## Action Items:

1. Run the existing migration: `migrations/add_freebie_column.sql`
2. Create migration for `max_storage_bytes` and `owner_name` columns
3. Verify all columns exist in Supabase
