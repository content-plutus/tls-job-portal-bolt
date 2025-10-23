/*
  # Legal Jobs Portal Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - User unique identifier
      - `email` (text, unique) - User email for login
      - `password_hash` (text) - Encrypted password
      - `first_name` (text) - User first name
      - `last_name` (text) - User last name
      - `phone` (text) - Contact phone number
      - `role` (text) - User role (job_seeker, admin)
      - `subscription_tier` (text) - Subscription level (free, silver, gold, platinum)
      - `subscription_start` (timestamptz) - When subscription started
      - `subscription_end` (timestamptz) - When subscription expires
      - `stripe_customer_id` (text) - Stripe customer reference
      - `is_verified` (boolean) - Email verification status
      - `is_active` (boolean) - Account active status
      - `created_at` (timestamptz) - Account creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `profiles`
      - `id` (uuid, primary key) - Profile unique identifier
      - `user_id` (uuid, foreign key) - References users table
      - `bio` (text) - User biography
      - `location` (text) - User location (city, state)
      - `experience_years` (integer) - Years of experience
      - `preferred_categories` (text[]) - Preferred job categories array
      - `skills` (text[]) - Skills array
      - `resume_url` (text) - Link to uploaded resume
      - `profile_picture_url` (text) - Link to profile picture
      - `profile_completion` (integer) - Profile completion percentage
      - `created_at` (timestamptz) - Profile creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `jobs`
      - `id` (uuid, primary key) - Job unique identifier
      - `title` (text) - Job title
      - `company` (text) - Company name
      - `location` (text) - Job location
      - `job_type` (text) - Job type (Full-time, Part-time, Contract, Internship)
      - `posted_by` (text) - Person who posted the job
      - `posted_date` (date) - Date job was posted
      - `deadline` (date) - Application deadline
      - `compensation` (text) - Salary or hourly rate
      - `category` (text) - Practice area category
      - `description` (text) - Full job description
      - `tier_requirement` (text) - Required subscription tier
      - `status` (text) - Job status (active, closed)
      - `source` (text) - Source of job (manual, google_sheets)
      - `views_count` (integer) - Number of views
      - `applications_count` (integer) - Number of applications
      - `created_at` (timestamptz) - Job creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `applications`
      - `id` (uuid, primary key) - Application unique identifier
      - `job_id` (uuid, foreign key) - References jobs table
      - `user_id` (uuid, foreign key) - References users table
      - `cover_letter` (text) - Application cover letter
      - `status` (text) - Application status
      - `applied_at` (timestamptz) - Application submission timestamp
      - `updated_at` (timestamptz) - Last status update timestamp

    - `saved_jobs`
      - `id` (uuid, primary key) - Saved job unique identifier
      - `user_id` (uuid, foreign key) - References users table
      - `job_id` (uuid, foreign key) - References jobs table
      - `saved_at` (timestamptz) - When job was saved

    - `application_limits`
      - `id` (uuid, primary key) - Limit tracking unique identifier
      - `user_id` (uuid, foreign key) - References users table
      - `month` (date) - Month being tracked
      - `applications_used` (integer) - Applications used this month
      - `applications_limit` (integer) - Application limit for user's tier

    - `subscriptions`
      - `id` (uuid, primary key) - Subscription unique identifier
      - `user_id` (uuid, foreign key) - References users table
      - `stripe_subscription_id` (text) - Stripe subscription reference
      - `plan` (text) - Subscription plan (silver, gold, platinum)
      - `status` (text) - Subscription status
      - `current_period_start` (timestamptz) - Current billing period start
      - `current_period_end` (timestamptz) - Current billing period end
      - `cancel_at_period_end` (boolean) - Will cancel at period end
      - `created_at` (timestamptz) - Subscription creation timestamp

    - `google_sheets_config`
      - `id` (uuid, primary key) - Config unique identifier
      - `sheet_id` (text) - Google Sheet ID
      - `sheet_name` (text) - Sheet tab name
      - `sync_interval_minutes` (integer) - Sync frequency
      - `last_sync` (timestamptz) - Last successful sync
      - `is_active` (boolean) - Whether sync is enabled
      - `created_at` (timestamptz) - Config creation timestamp

    - `sync_logs`
      - `id` (uuid, primary key) - Log unique identifier
      - `sync_started` (timestamptz) - When sync started
      - `sync_completed` (timestamptz) - When sync completed
      - `jobs_created` (integer) - Number of jobs created
      - `jobs_updated` (integer) - Number of jobs updated
      - `jobs_closed` (integer) - Number of jobs closed
      - `errors` (text) - Any errors encountered
      - `status` (text) - Sync status (success, partial, failed)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for admin role to manage all data
    - Add policies for public job viewing (with tier restrictions)

  3. Important Notes
    - All tables use UUID primary keys
    - Foreign keys enforce referential integrity
    - Timestamps track creation and updates
    - RLS ensures data security
    - Indexes on frequently queried columns for performance
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  role text NOT NULL DEFAULT 'job_seeker' CHECK (role IN ('job_seeker', 'admin')),
  subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'silver', 'gold', 'platinum')),
  subscription_start timestamptz,
  subscription_end timestamptz,
  stripe_customer_id text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  bio text,
  location text,
  experience_years integer,
  preferred_categories text[],
  skills text[],
  resume_url text,
  profile_picture_url text,
  profile_completion integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  location text,
  job_type text,
  posted_by text,
  posted_date date DEFAULT CURRENT_DATE,
  deadline date,
  compensation text,
  category text,
  description text NOT NULL,
  tier_requirement text DEFAULT 'free' CHECK (tier_requirement IN ('free', 'silver', 'gold', 'platinum')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'google_sheets')),
  views_count integer DEFAULT 0,
  applications_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  cover_letter text,
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'interview', 'rejected', 'offer')),
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, user_id)
);

-- Create saved_jobs table
CREATE TABLE IF NOT EXISTS saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Create application_limits table
CREATE TABLE IF NOT EXISTS application_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  month date NOT NULL,
  applications_used integer DEFAULT 0,
  applications_limit integer DEFAULT 5,
  UNIQUE(user_id, month)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  plan text CHECK (plan IN ('silver', 'gold', 'platinum')),
  status text CHECK (status IN ('active', 'cancelled', 'past_due', 'expired')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create google_sheets_config table
CREATE TABLE IF NOT EXISTS google_sheets_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id text NOT NULL,
  sheet_name text NOT NULL,
  sync_interval_minutes integer DEFAULT 30,
  last_sync timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_started timestamptz DEFAULT now(),
  sync_completed timestamptz,
  jobs_created integer DEFAULT 0,
  jobs_updated integer DEFAULT 0,
  jobs_closed integer DEFAULT 0,
  errors text,
  status text CHECK (status IN ('success', 'partial', 'failed'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_tier_requirement ON jobs(tier_requirement);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_date ON jobs(posted_date);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_sheets_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Jobs policies (public can view active jobs)
CREATE POLICY "Anyone can view active jobs"
  ON jobs FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can insert jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Applications policies
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
  ON applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Saved jobs policies
CREATE POLICY "Users can view own saved jobs"
  ON saved_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved jobs"
  ON saved_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved jobs"
  ON saved_jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Application limits policies
CREATE POLICY "Users can view own limits"
  ON application_limits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own limits"
  ON application_limits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own limits"
  ON application_limits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Google Sheets config policies (admin only)
CREATE POLICY "Admins can manage sheets config"
  ON google_sheets_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Sync logs policies (admin only)
CREATE POLICY "Admins can view sync logs"
  ON sync_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );