# Database Management Guide

## Quick Reference

### User Authentication Flow
1. User signs up via Supabase Auth → creates record in `auth.users`
2. Trigger `on_auth_user_created` fires → creates record in `public.users`
3. Trigger `on_user_created_create_profile` fires → creates record in `public.profiles`
4. Trigger `on_user_created_set_app_limits` fires → creates record in `public.application_limits`

**All of this happens automatically!** No manual intervention needed.

---

## Database Tables Status

### Active Tables (Have Data)
- ✅ `users` - 1 row (authenticated users)
- ✅ `jobs` - 19,929 rows (job listings)
- ✅ `applications` - 1 row (job applications)

### Auto-Populated Tables (Triggers Active)
- 🔄 `profiles` - Auto-created when user signs up
- 🔄 `application_limits` - Auto-created with tier-based limits
- 🔄 `saved_jobs` - Populated when users save jobs

### Admin/Feature Tables (Currently Unused)
- ⏸️ `subscriptions` - For Stripe integration (future)
- ⏸️ `google_sheets_config` - For automated job imports (future)
- ⏸️ `sync_logs` - For tracking Google Sheets syncs (future)

---

## Common Admin Tasks

### Make a User an Admin

```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

### Change User Subscription Tier

```sql
-- Upgrade to Platinum
UPDATE public.users 
SET 
  subscription_tier = 'platinum',
  subscription_start = NOW(),
  subscription_end = NOW() + INTERVAL '1 year'
WHERE email = 'user@example.com';

-- Update their application limit
UPDATE public.application_limits
SET applications_limit = 999999
WHERE user_id = (SELECT id FROM public.users WHERE email = 'user@example.com')
  AND month = DATE_TRUNC('month', CURRENT_DATE)::DATE;
```

### Reset User Application Limit

```sql
UPDATE public.application_limits
SET applications_used = 0
WHERE user_id = (SELECT id FROM public.users WHERE email = 'user@example.com')
  AND month = DATE_TRUNC('month', CURRENT_DATE)::DATE;
```

### View User Details

```sql
SELECT 
  u.email,
  u.role,
  u.subscription_tier,
  u.is_verified,
  p.bio,
  p.location,
  p.profile_completion,
  al.applications_used,
  al.applications_limit,
  COUNT(a.id) as total_applications,
  COUNT(sj.id) as saved_jobs_count
FROM public.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.application_limits al ON al.user_id = u.id 
  AND al.month = DATE_TRUNC('month', CURRENT_DATE)::DATE
LEFT JOIN public.applications a ON a.user_id = u.id
LEFT JOIN public.saved_jobs sj ON sj.user_id = u.id
WHERE u.email = 'user@example.com'
GROUP BY u.id, p.id, al.id;
```

---

## Troubleshooting

### Issue: User can't log in ("Login timeout")

**Possible causes:**
1. **Network issues** - Check Supabase dashboard status
2. **RLS policy blocking** - Check policies with `SELECT * FROM pg_policies WHERE tablename = 'users';`
3. **User row missing** - Check if user exists in both `auth.users` and `public.users`

**Fix:**
```sql
-- Check if user exists in auth but not public
SELECT au.id, au.email, pu.id as public_user_id
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;

-- If missing, trigger will create on next login
-- Or manually create:
INSERT INTO public.users (id, email, role, subscription_tier, is_verified)
SELECT id, email, 'job_seeker', 'free', email_confirmed_at IS NOT NULL
FROM auth.users
WHERE id = 'USER_ID_HERE';
```

### Issue: Profile/Application Limits Missing

**Fix:**
```sql
-- Recreate missing profiles
INSERT INTO public.profiles (user_id, profile_completion)
SELECT id, 0 FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Recreate missing application limits
INSERT INTO public.application_limits (user_id, month, applications_used, applications_limit)
SELECT 
  id,
  DATE_TRUNC('month', CURRENT_DATE)::DATE,
  0,
  CASE subscription_tier
    WHEN 'free' THEN 5
    WHEN 'silver' THEN 20
    WHEN 'gold' THEN 50
    WHEN 'platinum' THEN 999999
    ELSE 5
  END
FROM public.users
WHERE id NOT IN (
  SELECT user_id FROM public.application_limits 
  WHERE month = DATE_TRUNC('month', CURRENT_DATE)::DATE
);
```

### Issue: Jobs not showing up

**Check RLS policy:**
```sql
-- Jobs should be visible to everyone
SELECT * FROM pg_policies WHERE tablename = 'jobs' AND cmd = 'SELECT';
-- Should return: "Public can view active jobs"
```

**Check job status:**
```sql
SELECT status, COUNT(*) FROM public.jobs GROUP BY status;
-- All visible jobs should have status = 'active'
```

---

## Database Triggers (Auto-Created)

### `handle_new_user()`
**Trigger:** `on_auth_user_created` on `auth.users`  
**Action:** Creates/updates `public.users` row when auth user is created  
**Security:** SECURITY DEFINER (runs with elevated privileges)

### `handle_new_user_profile()`
**Trigger:** `on_user_created_create_profile` on `public.users`  
**Action:** Creates `public.profiles` row when user is created  
**Security:** SECURITY DEFINER

### `handle_new_user_app_limits()`
**Trigger:** `on_user_created_set_app_limits` on `public.users`  
**Action:** Creates `public.application_limits` with tier-based limits  
**Security:** SECURITY DEFINER

---

## RLS Policies Summary

### Users Table
- ✅ Users can view own profile (`auth.uid() = id`)
- ✅ Users can update own profile (`auth.uid() = id`)
- ✅ Users can insert self (`auth.uid() = id`)

### Jobs Table
- ✅ Public can view active jobs (`status = 'active'`)
- ✅ Admins can manage all jobs
- ✅ Anonymous/Authenticated can insert (for imports)

### Applications Table
- ✅ Users can view own applications
- ✅ Users can insert own applications
- ✅ Admins can view/update all applications

### Profiles Table
- ✅ Users can view/update/insert own profile

### Saved Jobs Table
- ✅ Users can view/insert/delete own saved jobs

---

## Performance Notes

- **Indexes:** All foreign keys are automatically indexed
- **Row count:** 19,929 jobs; queries use `status = 'active'` filter
- **RLS overhead:** Minimal; policies use simple `auth.uid()` checks
- **Trigger overhead:** Negligible; only fire on INSERT/UPDATE of users

---

## Backup & Restore

### Export Jobs Data
```bash
npm run import-jobs  # Imports from scripts/jobs.csv
```

### Manual SQL Backup
Use Supabase Dashboard → Database → Backups, or:
```bash
pg_dump -h db.xxx.supabase.co -U postgres -d postgres -t public.jobs > jobs_backup.sql
```

---

## Future Enhancements Needed

1. **Stripe Integration:** Populate `subscriptions` table when implementing payments
2. **Google Sheets Sync:** Activate `google_sheets_config` and `sync_logs` for auto-imports
3. **Email Verification:** Currently `is_verified` is set from `email_confirmed_at`
4. **Monthly Limits Reset:** Add cron job to reset `application_limits` each month
5. **Admin Dashboard:** Build UI for admin tasks (currently SQL only)
