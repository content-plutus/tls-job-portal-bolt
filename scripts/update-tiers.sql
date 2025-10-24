-- Update job tiers: first 20 as free, rest distributed across silver/gold/platinum
-- This assigns tiers based on row number (ordered by created_at)

WITH numbered_jobs AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM jobs
  WHERE status = 'active'
)
UPDATE jobs
SET tier_requirement = CASE
  -- First 20 jobs: free
  WHEN (SELECT row_num FROM numbered_jobs WHERE numbered_jobs.id = jobs.id) <= 20 THEN 'free'
  
  -- Next ~33% of remaining: silver
  WHEN (SELECT row_num FROM numbered_jobs WHERE numbered_jobs.id = jobs.id) <= (
    SELECT CEIL(COUNT(*) * 0.53) FROM jobs WHERE status = 'active'
  ) THEN 'silver'
  
  -- Next ~33% of remaining: gold
  WHEN (SELECT row_num FROM numbered_jobs WHERE numbered_jobs.id = jobs.id) <= (
    SELECT CEIL(COUNT(*) * 0.87) FROM jobs WHERE status = 'active'
  ) THEN 'gold'
  
  -- Remaining ~13%: platinum (top tier, fewer jobs)
  ELSE 'platinum'
END
WHERE status = 'active';

-- Show the distribution
SELECT 
  tier_requirement, 
  COUNT(*) as job_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM jobs WHERE status = 'active'), 1) as percentage
FROM jobs
WHERE status = 'active'
GROUP BY tier_requirement
ORDER BY 
  CASE tier_requirement
    WHEN 'free' THEN 1
    WHEN 'silver' THEN 2
    WHEN 'gold' THEN 3
    WHEN 'platinum' THEN 4
  END;
