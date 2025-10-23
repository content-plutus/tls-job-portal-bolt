/*
  # Fix Users Table INSERT Policy - Resolve Infinite Loading Spinner

  ## Problem
  The users table has RLS enabled but is missing an INSERT policy for authenticated users.
  When users sign in and their record doesn't exist in public.users, the LoginPage tries
  to create it but gets blocked by RLS, causing an infinite loading spinner.

  ## Solution
  Add an INSERT policy that allows authenticated users to create their own user record
  on first login. This works in conjunction with the trigger that auto-creates users
  on registration.

  ## Changes
  1. Add INSERT policy for authenticated users to create their own record
  2. Policy ensures users can only insert records with their own auth.uid()
  3. Maintains security by preventing users from creating records for other users

  ## Security
  - Only authenticated users can insert
  - Users can only insert records where id = auth.uid()
  - Prevents unauthorized user record creation
  - Works with existing trigger for seamless user creation
*/

-- Add INSERT policy for authenticated users to create their own record
CREATE POLICY "Authenticated users can insert own user record"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also ensure anon users can't insert (security hardening)
-- The trigger handles registration, this policy handles login edge cases
COMMENT ON POLICY "Authenticated users can insert own user record" ON users IS 
  'Allows authenticated users to create their user record on first login if trigger failed or for edge cases';
