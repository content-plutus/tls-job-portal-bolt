import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvFile() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return envVars;
  } catch (error) {
    console.error('Error reading .env file:', error.message);
    return {};
  }
}

const env = loadEnvFile();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateJobTiers() {
  console.log('🚀 Starting Job Tier Update...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // First, get total count of active jobs
    console.log('📊 Checking total active jobs...');
    const { count: totalJobs, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (countError) throw countError;
    
    console.log(`✅ Found ${totalJobs} active jobs\n`);

    if (totalJobs === 0) {
      console.log('⚠️  No active jobs found. Nothing to update.');
      return;
    }

    // Get all jobs ordered by created_at (paginated)
    console.log('🔄 Fetching all jobs...');
    let jobs = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select('id, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .range(from, to);

      if (fetchError) throw fetchError;
      
      if (data.length === 0) break;
      
      jobs = jobs.concat(data);
      console.log(`   Fetched ${jobs.length} jobs so far...`);
      
      if (data.length < pageSize) break; // Last page
      page++;
    }
    
    console.log(`✅ Retrieved ${jobs.length} jobs total\n`);

    // Calculate distribution
    const freeCount = 20;
    const remaining = totalJobs - freeCount;
    
    // Silver: 50% of remaining, Gold: 30%, Platinum: 20%
    const silverEnd = freeCount + Math.floor(remaining * 0.5);
    const goldEnd = silverEnd + Math.floor(remaining * 0.3);

    console.log('📈 Planned Distribution:');
    console.log(`   Free:     Jobs 1-20 (${freeCount} jobs)`);
    console.log(`   Silver:   Jobs 21-${silverEnd} (${silverEnd - freeCount} jobs)`);
    console.log(`   Gold:     Jobs ${silverEnd + 1}-${goldEnd} (${goldEnd - silverEnd} jobs)`);
    console.log(`   Platinum: Jobs ${goldEnd + 1}-${totalJobs} (${totalJobs - goldEnd} jobs)\n`);

    // Update jobs in batches
    console.log('🔄 Updating job tiers...\n');
    
    const updates = jobs.map((job, index) => {
      const rowNum = index + 1;
      let tier;
      
      if (rowNum <= freeCount) {
        tier = 'free';
      } else if (rowNum <= silverEnd) {
        tier = 'silver';
      } else if (rowNum <= goldEnd) {
        tier = 'gold';
      } else {
        tier = 'platinum';
      }
      
      return { id: job.id, tier };
    });

    // Update in batches of 100
    const batchSize = 100;
    let updated = 0;
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      // Update each job in the batch
      for (const { id, tier } of batch) {
        const { error } = await supabase
          .from('jobs')
          .update({ tier_requirement: tier })
          .eq('id', id);
        
        if (error) {
          console.error(`❌ Failed to update job ${id}:`, error.message);
        } else {
          updated++;
        }
      }
      
      const progress = ((updated / totalJobs) * 100).toFixed(1);
      console.log(`✅ Progress: ${updated}/${totalJobs} (${progress}%)`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 FINAL DISTRIBUTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get final distribution
    const { data: distribution, error: distError } = await supabase
      .from('jobs')
      .select('tier_requirement')
      .eq('status', 'active');

    if (distError) throw distError;

    const counts = distribution.reduce((acc, job) => {
      acc[job.tier_requirement] = (acc[job.tier_requirement] || 0) + 1;
      return acc;
    }, {});

    const tierOrder = ['free', 'silver', 'gold', 'platinum'];
    tierOrder.forEach(tier => {
      const count = counts[tier] || 0;
      const percentage = ((count / totalJobs) * 100).toFixed(1);
      console.log(`${tier.toUpperCase().padEnd(10)} ${count.toString().padStart(4)} jobs (${percentage}%)`);
    });

    console.log('\n✨ Job tier update completed successfully!');

  } catch (error) {
    console.error('\n❌ Fatal error during update:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

updateJobTiers();
