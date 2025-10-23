/*
  # Fix Anonymous Access to Jobs

  1. Changes
    - Update jobs policies to allow anonymous (non-authenticated) users to view active jobs
    - This fixes the white screen issue when accessing the jobs page without being logged in

  2. Security
    - Only SELECT operations are allowed for anonymous users
    - Only active jobs are visible
    - All other operations still require authentication
*/

-- Drop existing policy that only allows authenticated users
DROP POLICY IF EXISTS "Anyone can view active jobs" ON jobs;

-- Create new policy that allows both authenticated and anonymous users to view active jobs
CREATE POLICY "Public can view active jobs"
  ON jobs FOR SELECT
  TO anon, authenticated
  USING (status = 'active');