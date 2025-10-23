/*
  # Fix Authentication Flow - Auto-create User Records

  ## Problem
  Users registering via Supabase Auth only get created in auth.users table.
  The application expects records in public.users table for subscription tier and profile data.

  ## Solution
  Create a database trigger that automatically creates a record in public.users
  when a new user registers in auth.users.

  ## Changes
  1. Create function to handle new user registration
  2. Create trigger on auth.users insert
  3. Automatically populate public.users with:
     - User ID from auth.users
     - Email from auth.users
     - Default subscription_tier = 'free'
     - Default role = 'job_seeker'

  ## Security
  - Uses SECURITY DEFINER to allow function to insert into public.users
  - Only triggers on new auth.users inserts
  - Handles errors gracefully
*/

-- Function to create public.users record when auth.users record is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (
    id,
    email,
    password_hash,
    role,
    subscription_tier,
    is_verified,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    '',  -- Password is managed by Supabase Auth
    'job_seeker',
    'free',
    NEW.email_confirmed_at IS NOT NULL,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth.users insert
    RAISE WARNING 'Error creating public.users record: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a public.users record when a new auth.users record is created';
