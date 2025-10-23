/*
  # Clear Existing Jobs Data

  1. Purpose
    - Removes all existing mock/test job data from the jobs table
    - Prepares database for CSV import of real job data
    - Does not affect table structure or policies

  2. Important Notes
    - This migration deletes ALL existing jobs in the database
    - Run this before importing your CSV data
    - Table structure, indexes, and RLS policies remain unchanged
    - Related data in applications and saved_jobs tables will cascade delete
*/

-- Delete all existing jobs from the database
-- The script will insert fresh data from CSV
DELETE FROM jobs WHERE id IS NOT NULL;
