export type UserRole = 'job_seeker' | 'admin';

export type SubscriptionTier = 'free' | 'silver' | 'gold' | 'platinum' | 'basic_3m' | 'professional_6m' | 'premium_12m';

export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';

export type ValidityPeriod = '3_months' | '6_months' | '12_months';

export interface PricingTierDetails {
  id: SubscriptionTier;
  name: string;
  validityPeriod: ValidityPeriod;
  validityMonths: number;
  priceINR: number;
  priceUSD: number;
  description: string;
  features: string[];
  isPopular?: boolean;
  savingsPercentage?: number;
}

export type JobCategory = 'Corporate' | 'Litigation' | 'IP' | 'Criminal' | 'Family' | 'Real Estate' | 'Tax' | 'Immigration';

export type JobStatus = 'active' | 'closed';

export type JobSource = 'manual' | 'google_sheets';

export type ApplicationStatus = 'submitted' | 'under_review' | 'shortlisted' | 'interview' | 'rejected' | 'offer';

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: UserRole;
  subscription_tier: SubscriptionTier;
  subscription_start: string | null;
  subscription_end: string | null;
  stripe_customer_id: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  bio: string | null;
  location: string | null;
  experience_years: number | null;
  preferred_categories: string[] | null;
  skills: string[] | null;
  resume_url: string | null;
  profile_picture_url: string | null;
  profile_completion: number;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  job_type: string | null;
  posted_by: string | null;
  posted_date: string | null;
  deadline: string | null;
  compensation: string | null;
  category: string | null;
  description: string;
  tier_requirement: SubscriptionTier;
  status: JobStatus;
  source: JobSource;
  views_count: number;
  applications_count: number;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  user_id: string;
  cover_letter: string | null;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
  job?: Job;
}

export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  saved_at: string;
  job?: Job;
}

export interface ApplicationLimit {
  id: string;
  user_id: string;
  month: string;
  applications_used: number;
  applications_limit: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  plan: 'silver' | 'gold' | 'platinum';
  status: 'active' | 'cancelled' | 'past_due' | 'expired';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
}

export interface GoogleSheetsConfig {
  id: string;
  sheet_id: string;
  sheet_name: string;
  sync_interval_minutes: number;
  last_sync: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SyncLog {
  id: string;
  sync_started: string;
  sync_completed: string | null;
  jobs_created: number;
  jobs_updated: number;
  jobs_closed: number;
  errors: string | null;
  status: 'success' | 'partial' | 'failed';
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  features: string[];
  isPopular?: boolean;
}
