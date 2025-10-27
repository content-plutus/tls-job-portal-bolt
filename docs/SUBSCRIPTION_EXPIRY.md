# Subscription Expiry Automation

## Overview

Automatically downgrades users to free tier when their `subscription_end` date passes.

**Status:** ✅ Automated (runs daily at 00:30 UTC)

---

## How It Works

### Automatic Daily Check
- **Schedule:** Every day at 00:30 UTC
- **Method:** PostgreSQL `pg_cron` runs `downgrade_expired_subscriptions()` function
- **Action:** Downgrades expired users to free tier

### What Gets Updated

When a user's `subscription_end < today`:

| Field | Before | After |
|-------|--------|-------|
| `subscription_tier` | silver/gold/platinum | **free** |
| `subscription_start` | date | **NULL** |
| `subscription_end` | date | **NULL** |
| `application_limits.applications_limit` | 20/50/999999 | **5** |

---

## Monitoring

### Check Audit Logs

```sql
-- View recent downgrade operations
SELECT 
  run_at,
  downgraded_count,
  notes,
  error
FROM public.subscription_downgrade_logs
ORDER BY run_at DESC
LIMIT 10;
```

### Check Scheduled Jobs

```sql
-- View all cron jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'subscription_downgrade_daily')
ORDER BY start_time DESC
LIMIT 10;
```

---

## Manual Operations

### Run Immediately (One-Time)

```sql
-- Run the downgrade function now
SELECT public.downgrade_expired_subscriptions();
```

### Check Who Will Be Downgraded

```sql
-- Preview users that will be downgraded
SELECT 
  email,
  subscription_tier,
  subscription_end,
  CURRENT_DATE - subscription_end AS days_expired
FROM public.users
WHERE subscription_end IS NOT NULL
  AND subscription_end < CURRENT_DATE
  AND subscription_tier != 'free'
ORDER BY subscription_end;
```

### Manually Downgrade Specific User

```sql
-- Downgrade one user immediately
UPDATE public.users
SET 
  subscription_tier = 'free',
  subscription_start = NULL,
  subscription_end = NULL,
  updated_at = NOW()
WHERE email = 'user@example.com';

-- Update their application limit for current month
UPDATE public.application_limits
SET applications_limit = 5
WHERE user_id = (SELECT id FROM public.users WHERE email = 'user@example.com')
  AND month = DATE_TRUNC('month', CURRENT_DATE)::date;
```

---

## Adding/Extending Subscriptions

### Give User a Subscription

```sql
-- Example: Give user gold tier for 6 months
UPDATE public.users
SET 
  subscription_tier = 'gold',
  subscription_start = CURRENT_DATE,
  subscription_end = CURRENT_DATE + INTERVAL '6 months',
  updated_at = NOW()
WHERE email = 'user@example.com';

-- Update their application limit for current month
UPDATE public.application_limits
SET applications_limit = 50
WHERE user_id = (SELECT id FROM public.users WHERE email = 'user@example.com')
  AND month = DATE_TRUNC('month', CURRENT_DATE)::date;
```

### Extend Existing Subscription

```sql
-- Extend subscription by 3 months
UPDATE public.users
SET 
  subscription_end = subscription_end + INTERVAL '3 months',
  updated_at = NOW()
WHERE email = 'user@example.com';
```

---

## Subscription Tiers & Limits

| Tier | Monthly Application Limit | Job Access |
|------|---------------------------|------------|
| Free | 5 | Free tier jobs only (first 20) |
| Silver | 20 | Free + Silver tier jobs |
| Gold | 50 | Free + Silver + Gold tier jobs |
| Platinum | Unlimited (999999) | All jobs |

---

## Troubleshooting

### Function Not Running

**Check if pg_cron is enabled:**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

**If not found, enable it:**
```sql
CREATE EXTENSION pg_cron;
```

**Re-schedule the job:**
```sql
SELECT cron.unschedule('subscription_downgrade_daily');
SELECT cron.schedule(
  'subscription_downgrade_daily',
  '30 0 * * *',
  $$SELECT public.downgrade_expired_subscriptions();$$
);
```

### Users Not Being Downgraded

**Check for errors in logs:**
```sql
SELECT * FROM public.subscription_downgrade_logs
WHERE error IS NOT NULL
ORDER BY run_at DESC;
```

**Manually run and check output:**
```sql
SELECT public.downgrade_expired_subscriptions();
```

### Change Schedule Time

```sql
-- Unschedule existing job
SELECT cron.unschedule('subscription_downgrade_daily');

-- Reschedule at different time (e.g., 2:00 AM UTC)
SELECT cron.schedule(
  'subscription_downgrade_daily',
  '0 2 * * *',
  $$SELECT public.downgrade_expired_subscriptions();$$
);
```

---

## Safety Features

✅ **Idempotent** - Safe to run multiple times, won't double-downgrade  
✅ **Audited** - All operations logged in `subscription_downgrade_logs`  
✅ **Error Handling** - Graceful failure with logging  
✅ **Selective** - Only affects users with expired subscriptions  
✅ **Preserves Data** - Doesn't delete users, just changes tier  

---

## Deployment

The migration file is located at:
```
supabase/migrations/20251027000001_subscription_expiry_automation.sql
```

**To apply:**
1. Push to Supabase: `supabase db push`
2. Or apply manually in Supabase Dashboard → SQL Editor

**First run will:**
- Create `subscription_downgrade_logs` table
- Create `downgrade_expired_subscriptions()` function
- Enable `pg_cron` extension
- Schedule daily job at 00:30 UTC

---

## Testing

### Create Test Users

```sql
-- Create test users with expired subscription
INSERT INTO public.users (email, password_hash, subscription_tier, subscription_start, subscription_end)
VALUES 
  ('test-expired@example.com', '', 'silver', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '1 day'),
  ('test-active@example.com', '', 'gold', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days');

-- Run downgrade function
SELECT public.downgrade_expired_subscriptions();

-- Verify: test-expired should be free, test-active should stay gold
SELECT email, subscription_tier, subscription_start, subscription_end 
FROM public.users
WHERE email LIKE 'test-%@example.com';
```

### Cleanup Test Data

```sql
DELETE FROM public.users WHERE email LIKE 'test-%@example.com';
```
