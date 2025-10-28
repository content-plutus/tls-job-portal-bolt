import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
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
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  console.error('');
  console.error('SUPABASE_SERVICE_ROLE_KEY is required for bulk user creation.');
  console.error('Get it from: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validate CSV row
function validateRow(row, rowIndex) {
  const errors = [];

  if (!row.email || !row.email.trim()) {
    errors.push(`Row ${rowIndex}: Missing required field 'email'`);
  }

  if (!row.password || !row.password.trim()) {
    errors.push(`Row ${rowIndex}: Missing required field 'password'`);
  }

  if (row.subscription_tier && !['free', 'silver', 'gold', 'platinum'].includes(row.subscription_tier.toLowerCase())) {
    errors.push(`Row ${rowIndex}: Invalid subscription_tier '${row.subscription_tier}'. Must be: free, silver, gold, or platinum`);
  }

  if (row.role && !['job_seeker', 'employer', 'admin'].includes(row.role.toLowerCase())) {
    errors.push(`Row ${rowIndex}: Invalid role '${row.role}'. Must be: job_seeker, employer, or admin`);
  }

  return errors;
}

// Create a single user via Admin API
async function createUser(userData, rowIndex) {
  const email = userData.email.trim();
  const password = userData.password.trim();
  const subscriptionTier = (userData.subscription_tier || 'free').toLowerCase();
  const role = (userData.role || 'job_seeker').toLowerCase();
  const firstName = userData.first_name?.trim() || '';
  const lastName = userData.last_name?.trim() || '';

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        subscription_tier: subscriptionTier,
        role: role,
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (error) {
      return {
        success: false,
        email,
        error: error.message,
        rowIndex,
      };
    }

    return {
      success: true,
      email,
      userId: data.user.id,
      subscriptionTier,
      role,
      rowIndex,
    };
  } catch (error) {
    return {
      success: false,
      email,
      error: error.message,
      rowIndex,
    };
  }
}

async function main() {
  console.log('🚀 Bulk User Creation Script');
  console.log('━'.repeat(50));

  // Get CSV file path from command line
  const csvFilePath = process.argv[2];

  if (!csvFilePath) {
    console.error('\n❌ Missing CSV file path');
    console.log('\nUsage:');
    console.log('  npm run bulk-create-users -- <path-to-csv>');
    console.log('\nExample:');
    console.log('  npm run bulk-create-users -- scripts/users.csv');
    console.log('\nCSV Format:');
    console.log('  email,password,subscription_tier,role,first_name,last_name');
    console.log('  user@example.com,Pass123,gold,job_seeker,John,Doe');
    process.exit(1);
  }

  // Read CSV file
  console.log(`\n📂 Reading CSV file: ${csvFilePath}`);
  let fileContent;
  try {
    fileContent = readFileSync(csvFilePath, 'utf-8');
  } catch (error) {
    console.error(`❌ Failed to read CSV file: ${error.message}`);
    process.exit(1);
  }

  // Parse CSV
  console.log('📊 Parsing CSV data...');
  let records;
  try {
    records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
  } catch (error) {
    console.error(`❌ Failed to parse CSV: ${error.message}`);
    process.exit(1);
  }

  console.log(`✅ Found ${records.length} users in CSV`);

  // Validate all rows first
  console.log('\n🔄 Validating data...');
  const allErrors = [];
  records.forEach((row, index) => {
    const rowErrors = validateRow(row, index + 2); // +2 for 1-indexed and header row
    allErrors.push(...rowErrors);
  });

  if (allErrors.length > 0) {
    console.error('\n❌ Validation errors found:');
    allErrors.forEach(error => console.error(`   ${error}`));
    process.exit(1);
  }

  console.log('✅ All rows validated successfully');

  // Create users
  console.log(`\n📦 Creating ${records.length} users...`);
  console.log('━'.repeat(50));

  const results = [];
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowIndex = i + 2;

    process.stdout.write(`\n[${i + 1}/${records.length}] Creating ${record.email}... `);

    const result = await createUser(record, rowIndex);
    results.push(result);

    if (result.success) {
      console.log(`✅`);
      console.log(`     User ID: ${result.userId}`);
      console.log(`     Tier: ${result.subscriptionTier}, Role: ${result.role}`);
    } else {
      console.log(`❌`);
      console.log(`     Error: ${result.error}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n' + '━'.repeat(50));
  console.log('📊 Summary');
  console.log('━'.repeat(50));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successfully created: ${successful.length}/${records.length}`);
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}/${records.length}`);
    console.log('\nFailed users:');
    failed.forEach(f => {
      console.log(`   Row ${f.rowIndex}: ${f.email} - ${f.error}`);
    });
  }

  console.log('\n✨ Bulk user creation complete!');

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
