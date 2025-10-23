import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
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

const BATCH_SIZE = 500;
const CSV_FILE_PATH = join(__dirname, 'jobs.csv');

function parseDate(dateString) {
  if (!dateString || dateString.trim() === '') return null;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;

    return date.toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
}

function transformCsvRowToJob(row) {
  return {
    title: row.title?.trim() || '',
    company: row.company?.trim() || '',
    location: row.location?.trim() || null,
    job_type: row.job_type?.trim() || null,
    posted_by: row.posted_by?.trim() || null,
    posted_date: parseDate(row.posted_date),
    deadline: parseDate(row.deadline),
    compensation: row.compensation?.trim() || null,
    category: row.category?.trim() || null,
    description: row.description?.trim() || '',
    tier_requirement: 'free',
    status: 'active',
    source: 'manual',
    views_count: 0,
    applications_count: 0
  };
}

function validateJob(job, rowIndex) {
  const errors = [];

  if (!job.title || job.title === '') {
    errors.push(`Row ${rowIndex}: Missing required field 'title'`);
  }

  if (!job.company || job.company === '') {
    errors.push(`Row ${rowIndex}: Missing required field 'company'`);
  }

  if (!job.description || job.description === '') {
    errors.push(`Row ${rowIndex}: Missing required field 'description'`);
  }

  return errors;
}

async function clearExistingJobs() {
  console.log('\n🗑️  Clearing existing jobs from database...');

  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;

    console.log('✅ Successfully cleared existing jobs');
  } catch (error) {
    console.error('❌ Error clearing existing jobs:', error.message);
    throw error;
  }
}

async function importJobsInBatches(jobs) {
  const totalJobs = jobs.length;
  const batches = [];

  for (let i = 0; i < totalJobs; i += BATCH_SIZE) {
    batches.push(jobs.slice(i, i + BATCH_SIZE));
  }

  console.log(`\n📦 Importing ${totalJobs} jobs in ${batches.length} batches of ${BATCH_SIZE}...`);

  let successCount = 0;
  let failCount = 0;
  const failedRecords = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchNumber = i + 1;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert(batch)
        .select('id');

      if (error) throw error;

      successCount += batch.length;

      const progress = ((successCount / totalJobs) * 100).toFixed(1);
      console.log(`✅ Batch ${batchNumber}/${batches.length}: Imported ${batch.length} jobs (${successCount}/${totalJobs} - ${progress}%)`);

      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Batch ${batchNumber} failed:`, error.message);
      failCount += batch.length;
      failedRecords.push({
        batchNumber,
        error: error.message,
        recordCount: batch.length
      });

      for (const job of batch) {
        try {
          const { error: singleError } = await supabase
            .from('jobs')
            .insert([job])
            .select('id');

          if (!singleError) {
            successCount++;
            failCount--;
          }
        } catch (e) {
        }
      }
    }
  }

  return { successCount, failCount, failedRecords };
}

async function main() {
  console.log('🚀 Starting CSV Import Process...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    console.log(`\n📂 Reading CSV file: ${CSV_FILE_PATH}`);
    const fileContent = readFileSync(CSV_FILE_PATH, 'utf-8');

    console.log('📊 Parsing CSV data...');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true
    });

    console.log(`✅ Parsed ${records.length} records from CSV`);

    console.log('\n🔄 Transforming and validating data...');
    const jobs = [];
    const validationErrors = [];

    for (let i = 0; i < records.length; i++) {
      const job = transformCsvRowToJob(records[i]);
      const errors = validateJob(job, i + 2);

      if (errors.length > 0) {
        validationErrors.push(...errors);
      } else {
        jobs.push(job);
      }
    }

    if (validationErrors.length > 0) {
      console.warn(`\n⚠️  Found ${validationErrors.length} validation errors:`);
      validationErrors.slice(0, 10).forEach(err => console.warn(`  - ${err}`));
      if (validationErrors.length > 10) {
        console.warn(`  ... and ${validationErrors.length - 10} more errors`);
      }
    }

    console.log(`✅ ${jobs.length} jobs ready for import`);

    if (jobs.length === 0) {
      console.error('\n❌ No valid jobs to import. Please check your CSV file.');
      process.exit(1);
    }

    await clearExistingJobs();

    const startTime = Date.now();
    const { successCount, failCount, failedRecords } = await importJobsInBatches(jobs);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 IMPORT SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successfully imported: ${successCount} jobs`);
    console.log(`❌ Failed to import: ${failCount} jobs`);
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log(`🚀 Average speed: ${(successCount / parseFloat(duration)).toFixed(0)} jobs/second`);

    if (failedRecords.length > 0) {
      console.log('\n⚠️  Failed Batches:');
      failedRecords.forEach(record => {
        console.log(`  - Batch ${record.batchNumber}: ${record.recordCount} records (${record.error})`);
      });
    }

    console.log('\n✨ Import process completed!');

  } catch (error) {
    console.error('\n❌ Fatal error during import:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
