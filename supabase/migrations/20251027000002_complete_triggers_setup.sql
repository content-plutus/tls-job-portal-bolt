/*
  # Complete Database Setup - User Profile & Application Limits Auto-Creation
  
  ## What This Does
  Creates triggers and functions to automatically set up user profiles and application limits
  when a new user is created.
  
  ## Changes
  1. Create function to auto-create profiles for new users
  2. Create function to auto-create application limits based on subscription tier
  3. Create triggers on public.users table to call these functions
  
  ## Safety
  - Idempotent: safe to run multiple times
  - Uses ON CONFLICT DO NOTHING to prevent duplicates
  - SECURITY DEFINER allows function to bypass RLS
  - Error handling logs warnings but doesn't fail user creation
*/

-- Function to create profile when user is created
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, profile_completion, created_at, updated_at)
  VALUES (NEW.id, 0, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Function to create application limits when user is created
CREATE OR REPLACE FUNCTION public.handle_new_user_app_limits()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_limit integer;
BEGIN
  -- Determine application limit based on subscription tier
  v_limit := CASE NEW.subscription_tier
    WHEN 'free' THEN 5
    WHEN 'silver' THEN 20
    WHEN 'gold' THEN 50
    WHEN 'platinum' THEN 999999
    ELSE 5
  END;
  
  INSERT INTO public.application_limits (
    user_id,
    month,
    applications_used,
    applications_limit
  )
  VALUES (
    NEW.id,
    DATE_TRUNC('month', CURRENT_DATE)::date,
    0,
    v_limit
  )
  ON CONFLICT (user_id, month) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating application limits for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_user_created_create_profile ON public.users;
DROP TRIGGER IF EXISTS on_user_created_set_app_limits ON public.users;

-- Create trigger to auto-create profile when user is created
CREATE TRIGGER on_user_created_create_profile
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Create trigger to auto-create application limits when user is created
CREATE TRIGGER on_user_created_set_app_limits
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_app_limits();

-- Add comments
COMMENT ON FUNCTION public.handle_new_user_profile() IS 'Automatically creates a profile record when a new user is created';
COMMENT ON FUNCTION public.handle_new_user_app_limits() IS 'Automatically creates application limits based on subscription tier when a new user is created';
