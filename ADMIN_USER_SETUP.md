# Admin User Provisioning Setup Guide

## 🎯 Overview

This guide shows you how to create users without enabling public signup on your website using:
1. **Admin API** - Direct user creation with auto-confirmed emails
2. **Google OAuth** - Allow users to sign in with Google accounts

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Get Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **qadgutvarytmbpxldevt**
3. Click **Settings** (gear icon) → **API**
4. Find **service_role** key (NOT the anon key)
5. Click "Reveal" and copy the key

### Step 2: Add to .env File

Open `.env` and add:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ IMPORTANT**: Never commit this key to git. It has full database access.

### Step 3: Test It

```bash
# Create a single user (will auto-confirm email)
npm run create-user -- test@example.com Password123 gold

# User can now login immediately!
```

---

## 📦 User Creation Methods

### Method 1: Single User (Interactive)

```bash
npm run create-user
```

Follow the prompts to create one user at a time.

### Method 2: Single User (Command-Line)

```bash
npm run create-user -- <email> <password> <tier> <role>
```

**Examples:**
```bash
# Free tier user
npm run create-user -- user@example.com Pass123 free job_seeker

# Gold tier user  
npm run create-user -- user@example.com Pass123 gold job_seeker

# Platinum tier admin
npm run create-user -- admin@example.com AdminPass platinum admin
```

### Method 3: Bulk CSV Import

**Create a CSV file** (e.g., `users.csv`):
```csv
email,password,subscription_tier,role,first_name,last_name
user1@example.com,Pass123,gold,job_seeker,John,Doe
user2@example.com,Pass456,silver,employer,Jane,Smith
```

**Run the import:**
```bash
npm run bulk-create-users -- users.csv
```

**Example file included**: `scripts/users-example.csv`

---

## 🔐 Enable Google OAuth

### Why?
- Users can sign in without you creating accounts
- More secure (no passwords to manage)
- Better user experience

### Setup Steps:

1. **Get Google OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create/select a project
   - Enable "Google+ API"
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI:
     ```
     https://qadgutvarytmbpxldevt.supabase.co/auth/v1/callback
     ```

2. **Configure in Supabase**:
   - Supabase Dashboard → Authentication → Providers
   - Find "Google" and click configure
   - Enable it
   - Paste your Client ID and Client Secret
   - Save

3. **Add Authorized Domains**:
   - In Supabase: Authentication → URL Configuration
   - Add your site: `https://legalladderjobs.netlify.app`

4. **Test**:
   - Go to your site
   - Click "Sign in with Google"
   - Should work! ✅

---

## 🚀 Migrate Existing Users

You currently have 5 users created via SQL that can't log in. Let's fix them:

### Option A: Use Bulk Import (Recommended)

```bash
# File already created: scripts/users-example.csv
npm run bulk-create-users -- scripts/users-example.csv
```

### Option B: Create Individually

```bash
npm run create-user -- mohit.jayendra.singh@testbook.com TLS@5432 gold
npm run create-user -- nagender@thelegalschool.in TLS@5432 gold
npm run create-user -- aniket.jha@testbook.com TLS@5432 gold
npm run create-user -- sakshi.dev@testbook.com TLS@5432 gold
npm run create-user -- mohit.kumar@testbook.com TLS@5432 gold
```

### Option C: Manual in Supabase Dashboard

1. Supabase Dashboard → Authentication → Users
2. Click "Add user" for each
3. Enter email and password
4. User is auto-confirmed

---

## 📋 CSV Format Reference

### Required Columns:
- `email` - User's email address
- `password` - Initial password (min 6 characters)

### Optional Columns:
- `subscription_tier` - free, silver, gold, or platinum (default: free)
- `role` - job_seeker, employer, or admin (default: job_seeker)
- `first_name` - User's first name
- `last_name` - User's last name

### Example:
```csv
email,password,subscription_tier,role,first_name,last_name
john@example.com,SecurePass123,gold,job_seeker,John,Doe
jane@company.com,CompanyPass456,silver,employer,Jane,Smith
admin@site.com,AdminSecret789,platinum,admin,Admin,User
```

---

## ✅ Verification

### Test User Can Login:

1. Go to https://legalladderjobs.netlify.app/login
2. Enter email and password you just created
3. Should login immediately (no email verification needed!)
4. Dashboard should show correct tier and application limits

### Check Database:

```sql
-- Verify user exists and is confirmed
SELECT email, email_confirmed_at, subscription_tier 
FROM auth.users 
WHERE email = 'your-test-email@example.com';

-- Should show email_confirmed_at with a timestamp
```

---

## 🔒 Security Best Practices

### DO:
✅ Keep service role key in `.env` (never commit to git)  
✅ Add `.env` to `.gitignore` (already done)  
✅ Only run admin scripts on your local machine  
✅ Use strong passwords for users  
✅ Revoke and regenerate service key if exposed  

### DON'T:
❌ Use service role key in frontend code  
❌ Commit service role key to GitHub  
❌ Share service role key in screenshots/docs  
❌ Use service role key in browser/client apps  

---

## 🐛 Troubleshooting

### "Missing SUPABASE_SERVICE_ROLE_KEY"
- Check `.env` file has the key
- Restart your terminal/script
- Verify you copied the full key

### "User already exists"
- Email is already registered
- Use a different email OR
- Delete existing user in Supabase Dashboard → Authentication → Users

### Google OAuth "Unsupported provider" Error
- Google provider not enabled in Supabase
- Follow "Enable Google OAuth" section above

### Users Created But Can't Login
- Verify `email_confirm: true` is in the script
- Check auth.users table: `email_confirmed_at` should not be null
- Make sure you're using the service role key

---

## 📊 Application Limits by Tier

| Tier     | Applications/Month | Created With       |
|----------|-------------------|--------------------|
| free     | 5                 | Auto-created       |
| silver   | 20                | Auto-created       |
| gold     | 50                | Auto-created       |
| platinum | 999999            | Auto-created       |

All limits are automatically set when the user is created via the database triggers.

---

## 🎓 What Happens Behind the Scenes

When you create a user with the admin API:

1. **Supabase creates auth.users entry** ✅
   - Email automatically confirmed
   - Password hash stored securely

2. **Trigger creates public.users entry** ✅
   - `on_auth_user_created` trigger fires
   - Creates user with subscription tier

3. **Trigger creates public.profiles entry** ✅
   - `on_user_created_create_profile` trigger fires
   - Empty profile ready for user to fill

4. **Trigger creates application limits** ✅
   - `on_user_created_set_app_limits` trigger fires
   - Sets limits based on subscription tier

All automatic! 🎉

---

## 📞 Need Help?

- **Script issues**: Check `scripts/README.md`
- **Database issues**: Check `TESTING.md`
- **General questions**: Check `WARP.md`
- **Test results**: Check `TEST_RESULTS.md`

---

## 🚀 Next Steps

1. ✅ Add service role key to `.env`
2. ✅ Test with one user: `npm run create-user`
3. ✅ Import your 5 Gold users: `npm run bulk-create-users -- scripts/users-example.csv`
4. ✅ Enable Google OAuth (optional but recommended)
5. ✅ Test login at https://legalladderjobs.netlify.app/login

**You're all set!** 🎉
