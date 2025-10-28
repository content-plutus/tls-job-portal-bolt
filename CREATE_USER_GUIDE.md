# User Creation Quick Guide

## Interactive Mode (Easiest)

```bash
npm run create-user
```

Follow the prompts to enter:
1. Email address
2. Password (minimum 6 characters)
3. Subscription tier (free/silver/gold/platinum)
4. Role (job_seeker/employer/admin)

## Command-Line Mode (Fast)

### Basic Syntax
```bash
npm run create-user -- <email> <password> [tier] [role]
```

### Examples

**Create free tier job seeker (default):**
```bash
npm run create-user -- john@example.com Password123
```

**Create silver tier job seeker:**
```bash
npm run create-user -- jane@example.com SecurePass456 silver
```

**Create gold tier employer:**
```bash
npm run create-user -- company@example.com CompanyPass789 gold employer
```

**Create platinum tier admin:**
```bash
npm run create-user -- admin@example.com AdminPass000 platinum admin
```

## Subscription Tiers

| Tier       | Applications/Month | Use Case            |
|------------|-------------------|---------------------|
| `free`     | 5                 | Basic users         |
| `silver`   | 20                | Regular users       |
| `gold`     | 50                | Power users         |
| `platinum` | 999999 (unlimited)| Premium/Enterprise  |

## Roles

- **`job_seeker`** - Default role for applicants looking for jobs
- **`employer`** - Companies posting job listings  
- **`admin`** - Full administrative access to platform

## What Happens Automatically

When you create a user, the system **automatically**:
1. ✅ Creates user account in Supabase Auth
2. ✅ Creates user record in `public.users` table
3. ✅ Creates profile in `public.profiles` (via trigger)
4. ✅ Sets application limits in `public.application_limits` (via trigger)
5. ✅ Verifies everything was created successfully

You don't need to do anything else - it's all handled by database triggers!

## Troubleshooting

### "Signups not allowed for this instance"
**Solution:** Enable signups in Supabase Dashboard
- Go to: Authentication → Settings
- Enable "Enable email signups"

### "Missing Supabase environment variables"
**Solution:** Check your `.env` file has:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### User created but can't log in
**Solution:** Check email confirmation settings
- In Supabase Dashboard: Authentication → Settings
- Disable "Enable email confirmations" for instant login
- OR have user check email for confirmation link

## Testing New User

After creating a user, test by:

1. **Via Browser:**
   - Go to your app login page
   - Log in with the email and password you created
   - Verify user can access dashboard

2. **Via SQL (Supabase Dashboard):**
   ```sql
   -- Check user was created
   SELECT email, subscription_tier, role FROM public.users 
   WHERE email = 'your-email@example.com';
   
   -- Check profile was created
   SELECT * FROM public.profiles 
   WHERE user_id = (SELECT id FROM public.users WHERE email = 'your-email@example.com');
   
   -- Check application limits
   SELECT * FROM public.application_limits 
   WHERE user_id = (SELECT id FROM public.users WHERE email = 'your-email@example.com');
   ```

## Need More Help?

- Full documentation: `scripts/README.md`
- Testing guide: `TESTING.md`
- Project architecture: `WARP.md`
