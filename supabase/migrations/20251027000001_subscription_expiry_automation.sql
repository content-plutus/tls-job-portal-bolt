/*
  # Subscription Expiry Automation

  ## What This Does
  Automatically downgrades users whose subscription_end date has passed.
  
  ## Changes
  1. Create audit log table for tracking downgrade operations
  2. Create function to downgrade expired subscriptions
  3. Schedule function to run daily via pg_cron
  
  ## Safety
  - Idempotent: safe to run multiple times
  - Only affects users where subscription_end < today AND tier != 'free'
  - Updates application_limits for current month
  - Logs all operations for audit trail
*/

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.subscription_downgrade_logs (
  id bigserial PRIMARY KEY,
  run_at timestamptz NOT NULL DEFAULT now(),
  downgraded_count integer NOT NULL DEFAULT 0,
  notes text,
  error text
);

-- Create function to downgrade expired subscriptions
CREATE OR REPLACE FUNCTION public.downgrade_expired_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  -- Find and downgrade expired users
  WITH expired_users AS (
    SELECT id
    FROM public.users
    WHERE subscription_end IS NOT NULL
      AND subscription_end < CURRENT_DATE
      AND subscription_tier IS DISTINCT FROM 'free'
  ),
  updated_users AS (
    UPDATE public.users u
    SET 
      subscription_tier = 'free',
      subscription_start = NULL,
      subscription_end = NULL,
      updated_at = NOW()
    WHERE u.id IN (SELECT id FROM expired_users)
    RETURNING u.id
  ),
  updated_limits AS (
    UPDATE public.application_limits al
    SET applications_limit = 5
    WHERE al.user_id IN (SELECT id FROM updated_users)
      AND al.month = DATE_TRUNC('month', CURRENT_DATE)::date
    RETURNING al.user_id
  )
  SELECT COUNT(*) INTO v_count FROM updated_users;

  -- Log the operation
  INSERT INTO public.subscription_downgrade_logs (downgraded_count, notes)
  VALUES (v_count, 'Automatic downgrade via scheduled function');

  RAISE NOTICE 'Downgraded % user(s) to free tier', v_count;
  RETURN v_count;

EXCEPTION WHEN OTHERS THEN
  -- Best-effort audit logging on failure
  BEGIN
    INSERT INTO public.subscription_downgrade_logs (downgraded_count, notes, error)
    VALUES (COALESCE(v_count, 0), 'Function encountered error', SQLERRM);
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Silently fail audit log if table doesn't exist
  END;
  
  RAISE WARNING 'downgrade_expired_subscriptions failed: %', SQLERRM;
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Restrict function access for security
REVOKE ALL ON FUNCTION public.downgrade_expired_subscriptions() FROM public;
GRANT EXECUTE ON FUNCTION public.downgrade_expired_subscriptions() TO postgres;
GRANT EXECUTE ON FUNCTION public.downgrade_expired_subscriptions() TO service_role;

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run daily at 00:30 UTC
SELECT cron.schedule(
  'subscription_downgrade_daily',
  '30 0 * * *',
  $$SELECT public.downgrade_expired_subscriptions();$$
);

-- Add helpful comments
COMMENT ON FUNCTION public.downgrade_expired_subscriptions() IS 
  'Automatically downgrades users with expired subscriptions to free tier. Runs daily at 00:30 UTC via pg_cron.';

COMMENT ON TABLE public.subscription_downgrade_logs IS 
  'Audit log for subscription downgrade operations. Records count and any errors.';
