/*
  # Update Subscription Tiers to Validity-Based Model

  ## Overview
  This migration restructures the subscription system from traditional monthly recurring billing 
  (free, silver, gold, platinum) to a validity-based annual payment model with three tiers 
  based on subscription duration (3-month, 6-month, 12-month).

  ## Changes Made

  1. **Tier Structure Updates**
     - Old tiers: free, silver, gold, platinum
     - New tiers: basic_3m (3-month), professional_6m (6-month), premium_12m (12-month)
     - Maintains backwards compatibility during transition

  2. **Users Table**
     - Updated subscription_tier constraint to include new tier names
     - Existing tiers remain valid during migration period

  3. **Jobs Table**
     - Updated tier_requirement constraint to support new tier structure
     - Existing job tier requirements remain accessible

  4. **Subscriptions Table**
     - Updated plan constraint to include new validity-based plans
     - Added support for upfront payment model

  ## Migration Strategy
  - Non-destructive: Existing data remains valid
  - New tiers are added alongside old tiers
  - Application code will handle tier mapping logic
  - Future migration can remove old tier values once all users are migrated

  ## Important Notes
  - This migration uses ALTER TABLE to modify existing constraints
  - No data is deleted or modified
  - RLS policies remain unchanged as they reference table structure, not tier values
  - Subscription validity tracking uses existing subscription_start/subscription_end fields
*/

-- Drop existing check constraints to update them
DO $$ 
BEGIN
  -- Update users table subscription_tier constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_subscription_tier_check' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_subscription_tier_check;
  END IF;

  -- Update jobs table tier_requirement constraint  
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'jobs_tier_requirement_check'
    AND table_name = 'jobs'
  ) THEN
    ALTER TABLE jobs DROP CONSTRAINT jobs_tier_requirement_check;
  END IF;

  -- Update subscriptions table plan constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'subscriptions_plan_check'
    AND table_name = 'subscriptions'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_plan_check;
  END IF;
END $$;

-- Add new constraints with updated tier values
ALTER TABLE users ADD CONSTRAINT users_subscription_tier_check 
  CHECK (subscription_tier IN ('free', 'silver', 'gold', 'platinum', 'basic_3m', 'professional_6m', 'premium_12m'));

ALTER TABLE jobs ADD CONSTRAINT jobs_tier_requirement_check 
  CHECK (tier_requirement IN ('free', 'silver', 'gold', 'platinum', 'basic_3m', 'professional_6m', 'premium_12m'));

ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check 
  CHECK (plan IN ('silver', 'gold', 'platinum', 'basic_3m', 'professional_6m', 'premium_12m'));

-- Add comment to document the new tier structure
COMMENT ON COLUMN users.subscription_tier IS 'Subscription tier: Legacy (free, silver, gold, platinum) or Validity-based (basic_3m, professional_6m, premium_12m)';
COMMENT ON COLUMN jobs.tier_requirement IS 'Minimum subscription tier required to view this job: Legacy (free, silver, gold, platinum) or Validity-based (basic_3m, professional_6m, premium_12m)';
COMMENT ON COLUMN subscriptions.plan IS 'Subscription plan: Legacy (silver, gold, platinum) or Validity-based (basic_3m, professional_6m, premium_12m)';

-- Create function to map legacy tiers to new tiers (for migration helper)
CREATE OR REPLACE FUNCTION map_legacy_tier_to_new(legacy_tier text) 
RETURNS text AS $$
BEGIN
  CASE legacy_tier
    WHEN 'free' THEN RETURN 'free';
    WHEN 'silver' THEN RETURN 'basic_3m';
    WHEN 'gold' THEN RETURN 'professional_6m';
    WHEN 'platinum' THEN RETURN 'premium_12m';
    ELSE RETURN legacy_tier;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION map_legacy_tier_to_new IS 'Helper function to map legacy subscription tiers to new validity-based tiers';
