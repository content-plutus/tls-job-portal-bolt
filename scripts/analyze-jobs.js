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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeJobs() {
  console.log('🔍 Analyzing Jobs Data...\n');

  try {
    // Fetch all jobs (paginated)
    let allJobs = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await supabase
        .from('jobs')
        .select('location, job_type, category, compensation')
        .eq('status', 'active')
        .range(from, to);

      if (error) throw error;
      if (data.length === 0) break;
      
      allJobs = allJobs.concat(data);
      console.log(`   Fetched ${allJobs.length} jobs...`);
      
      if (data.length < pageSize) break;
      page++;
    }

    console.log(`\n✅ Total jobs analyzed: ${allJobs.length}\n`);

    // Get unique values
    const locations = new Set();
    const jobTypes = new Set();
    const categories = new Set();
    const compensations = new Set();

    allJobs.forEach(job => {
      if (job.location) locations.add(job.location.trim());
      if (job.job_type) jobTypes.add(job.job_type.trim());
      if (job.category) categories.add(job.category.trim());
      if (job.compensation && job.compensation !== 'Not Disclosed') {
        compensations.add(job.compensation.trim());
      }
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 UNIQUE LOCATIONS (' + locations.size + ')');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Array.from(locations).sort().slice(0, 50).forEach(loc => console.log(`  • ${loc}`));
    if (locations.size > 50) console.log(`  ... and ${locations.size - 50} more`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💼 UNIQUE JOB TYPES (' + jobTypes.size + ')');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Array.from(jobTypes).sort().forEach(type => console.log(`  • ${type}`));

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📂 UNIQUE CATEGORIES (' + categories.size + ')');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Array.from(categories).sort().forEach(cat => console.log(`  • ${cat}`));

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💰 SAMPLE COMPENSATIONS (first 20)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Array.from(compensations).slice(0, 20).forEach(comp => console.log(`  • ${comp}`));
    if (compensations.size > 20) console.log(`  ... and ${compensations.size - 20} more`);

    console.log('\n✨ Analysis complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

analyzeJobs();
