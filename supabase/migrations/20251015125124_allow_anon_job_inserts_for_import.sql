/*
  # Allow Anonymous Job Inserts for Import Script

  ## Changes
  - Add policy to allow anonymous inserts into jobs table
  - This is needed for the CSV import script to work
  - The policy will be removed after import in production

  ## Security Note
  - This temporarily allows anonymous inserts for data import
  - In production, this should be restricted to admin only
*/

-- Temporarily allow anonymous users to insert jobs (for import script)
CREATE POLICY "Allow imports to insert jobs"
  ON jobs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);