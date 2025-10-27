# Database Migrations Applied - Summary

This document tracks all database migrations that have been successfully applied to the Supabase project.

**Project ID:** `xokgcgxzbkvpsncsraqv`  
**Last Updated:** 2025-10-27

---

## ✅ Applied Migrations

### 1. Core Schema Setup
**File:** `20251015124019_create_legal_jobs_schema.sql`  
**Status:** ✅ Applied

Creates all core tables:
- `users` - User accounts with subscription info
- `profiles` - Extended user profiles
- `jobs` - Job listings
- `applications` - Job applications
- `saved_jobs` - Saved job bookmarks
- `application_limits` - Monthly application tracking
- `subscriptions` - Stripe subscription data
- `google_sheets_config` - Sheet sync configuration
- `sync_logs` - Sync operation logs

**RLS Policies:** All tables have Row Level Security enabled with appropriate policies.

---

### 2. Anonymous Job Access Fix
**File:** `20251015124038_fix_jobs_anonymous_access.sql`  
**Status:** ✅ Applied

**Changes:**
- Updated jobs table policy to allow anonymous users to view active jobs
- Fixes white screen issue when accessing jobs page without login

**Policy:** `"Public can view active jobs"` on `jobs` table (SELECT for anon + authenticated)

---

### 3. User Creation Trigger
**File:** `20251015124056_fix_user_creation_trigger.sql`  
**Status:** ✅ Applied

**Function Created:** `public.handle_new_user()`  
**Trigger Created:** `on_auth_user_created` on `auth.users`

**What it does:**
- Automatically creates `public.users` record when user registers in `auth.users`
- Sets default values: role='job_seeker', tier='free', password_hash=''
- Uses SECURITY DEFINER to bypass RLS
- Handles conflicts gracefully with ON CONFLICT UPDATE

---

### 4. Anonymous Job Inserts for Import
**File:** `20251015125124_allow_anon_job_inserts_for_import.sql`  
**Status:** ✅ Applied

**Policy:** `"Allow imports to insert jobs"` on `jobs` table (INSERT for anon + authenticated)

**Note:** This policy allows CSV import script to work. Should be restricted to admin-only in production.

---

### 5. Users Insert Policy Fix
**File:** `20251016080528_fix_users_insert_policy.sql`  
**Status:** ✅ Applied

**Policy:** `"Authenticated users can insert own user record"` on `users` table

**What it fixes:**
- Resolves infinite loading spinner on login
- Allows authenticated users to create their own user record if trigger fails
- Ensures users can only insert records with their own `auth.uid()`

---

### 6. Subscription Expiry Automation
**File:** `20251027000001_subscription_expiry_automation.sql`  
**Status:** ✅ Applied

**Table Created:** `subscription_downgrade_logs`  
**Function Created:** `public.downgrade_expired_subscriptions()`  
**Cron Job:** Scheduled daily at 00:30 UTC (`subscription_downgrade_daily`)

**What it does:**
- Finds users with expired subscriptions (`subscription_end < today`)
- Downgrades them to free tier
- Updates application limits to 5 for current month
- Logs all operations in audit table
- Returns count of downgraded users

**Security:**
- Function access restricted to postgres and service_role only
- Uses SECURITY DEFINER to bypass RLS
- Comprehensive error handling with audit logging

---

### 7. Complete Triggers Setup
**File:** `20251027000002_complete_triggers_setup.sql`  
**Status:** ✅ Applied

**Functions Created:**
1. `public.handle_new_user_profile()` - Auto-creates profile on user creation
2. `public.handle_new_user_app_limits()` - Auto-creates application limits based on tier

**Triggers Created:**
1. `on_user_created_create_profile` on `public.users` (AFTER INSERT)
2. `on_user_created_set_app_limits` on `public.users` (AFTER INSERT)

**What it does:**
- When a new user is created in `public.users`, automatically creates:
  - Profile record with profile_completion = 0
  - Application limits for current month based on subscription tier:
    - free: 5 applications
    - silver: 20 applications
    - gold: 50 applications
    - platinum: 999,999 applications
- Uses ON CONFLICT DO NOTHING to prevent duplicates
- Error handling logs warnings but doesn't fail user creation

---

## 🔧 Database Functions Summary

| Function Name | Trigger | Purpose |
|--------------|---------|---------|
| `handle_new_user()` | `on_auth_user_created` on `auth.users` | Creates `public.users` record on registration |
| `handle_new_user_profile()` | `on_user_created_create_profile` on `public.users` | Creates profile record |
| `handle_new_user_app_limits()` | `on_user_created_set_app_limits` on `public.users` | Creates monthly application limits |
| `downgrade_expired_subscriptions()` | Cron job (daily 00:30 UTC) | Downgrades expired subscriptions to free |

---

## 🔐 RLS Policies Summary

### Users Table
- ✅ Users can view own profile
- ✅ Users can update own profile
- ✅ Users can insert own record
- ✅ Admins can view all users
- ✅ Admins can update all users

### Jobs Table
- ✅ Public (anon + authenticated) can view active jobs
- ✅ Public (anon + authenticated) can insert jobs (for CSV import)
- ✅ Admins can insert/update/delete jobs

### Applications Table
- ✅ Users can view own applications
- ✅ Users can insert own applications
- ✅ Admins can view/update all applications

### Profiles Table
- ✅ Users can view/insert/update own profile
- ✅ Admins can view all profiles

### Saved Jobs Table
- ✅ Users can view/insert/delete own saved jobs

### Application Limits Table
- ✅ Users can view/insert/update own limits

### Subscriptions Table
- ✅ Users can view own subscriptions
- ✅ Admins can view all subscriptions

---

## 📊 Audit Tables

### subscription_downgrade_logs
Tracks all automatic subscription downgrade operations:
- `run_at` - When the operation ran
- `downgraded_count` - Number of users downgraded
- `notes` - Operation notes
- `error` - Any errors encountered

Query recent downgrades:
```sql
SELECT * FROM public.subscription_downgrade_logs 
ORDER BY run_at DESC 
LIMIT 10;
```

---

## ⏰ Scheduled Jobs (pg_cron)

### subscription_downgrade_daily
- **Schedule:** Daily at 00:30 UTC (`30 0 * * *`)
- **Command:** `SELECT public.downgrade_expired_subscriptions();`
- **Purpose:** Automatically downgrade expired subscriptions

View cron jobs:
```sql
SELECT * FROM cron.job;
```

View cron job history:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'subscription_downgrade_daily')
ORDER BY start_time DESC 
LIMIT 10;
```

---

## 🧪 Testing & Verification

### Test Subscription Downgrade Function
```sql
-- Run manually to test
SELECT public.downgrade_expired_subscriptions();

-- Check audit log
SELECT * FROM public.subscription_downgrade_logs ORDER BY run_at DESC LIMIT 1;
```

### Test User Creation Flow
```sql
-- Simulate new user registration (via Supabase Auth)
-- Then verify records are auto-created:

-- Check user record
SELECT * FROM public.users WHERE email = 'test@example.com';

-- Check profile was auto-created
SELECT * FROM public.profiles WHERE user_id = (SELECT id FROM public.users WHERE email = 'test@example.com');

-- Check application limits were auto-created
SELECT * FROM public.application_limits WHERE user_id = (SELECT id FROM public.users WHERE email = 'test@example.com');
```

### Verify Triggers
```sql
SELECT 
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE NOT t.tgisinternal 
  AND c.relnamespace = 'public'::regnamespace
ORDER BY c.relname, t.tgname;
```

---

## 🚨 Known Issues & Resolutions

### Issue: Function does not exist error
**Symptom:** `ERROR: function public.downgrade_expired_subscriptions() does not exist`

**Resolution:** ✅ Fixed
- Applied migration `20251027000001_subscription_expiry_automation.sql` via Supabase MCP tools
- Function now exists and is callable
- Cron job successfully scheduled

### Issue: NULL value in password_hash violates not-null constraint
**Symptom:** INSERT queries fail on `public.users` table

**Resolution:** ✅ Fixed
- Updated all INSERT queries in DATABASE.md to include `password_hash` field
- Set to empty string `''` for manual testing/import scenarios
- Auth trigger sets this automatically on registration

---

## 🔄 Future Migrations Needed

1. **Stripe Integration:**
   - Populate `subscriptions` table when payments are implemented
   - Add webhooks for subscription status changes

2. **Google Sheets Sync:**
   - Activate `google_sheets_config` for automated job imports
   - Implement sync function to populate `sync_logs`

3. **Monthly Application Limits Reset:**
   - Add cron job to reset `applications_used` to 0 each month
   - Alternative: Implement on-the-fly check using current month

4. **Email Verification:**
   - Enhance `is_verified` logic beyond just `email_confirmed_at`

5. **Admin Dashboard:**
   - Build UI for common admin SQL tasks

---

## 📝 Migration Best Practices

When adding new migrations:

1. **Naming Convention:** `YYYYMMDDHHMMSS_descriptive_name.sql`
2. **Documentation:** Include header comment explaining what/why/safety
3. **Idempotency:** Use `IF NOT EXISTS`, `OR REPLACE`, `ON CONFLICT` clauses
4. **Error Handling:** Wrap in exception blocks, log warnings
5. **Security:** Use `SECURITY DEFINER` carefully, restrict function access
6. **Testing:** Test in development first, verify with queries
7. **Apply via MCP:** Use `apply_migration` MCP tool for consistency

---

## 🛠️ Useful Admin Queries

### View All Functions
```sql
SELECT 
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
ORDER BY p.proname;
```

### View All Policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### View Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

**End of Migration Summary**
