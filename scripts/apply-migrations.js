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

async function applyMigrations() {
  console.log('🚀 Applying database migrations...');
  
  try {
    const migrationPath = join(__dirname, '20251015124019_create_legal_jobs_schema.sql');
    const migrationContent = readFileSync(migrationPath, 'utf-8');

    // Split by semicolons and filter out empty statements
    const statements = migrationContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    let executed = 0;
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec', { sql: statement }, { head: true });
        if (error && !error.message.includes('already exists')) {
          console.warn(`⚠️  Warning executing statement: ${error.message}`);
        } else {
          executed++;
        }
      } catch (e) {
        console.warn(`⚠️  Could not execute individual statement (trying alternative method)...`);
      }
    }

    console.log(`✅ Migration process attempted`);
    console.log('🔄 Retrying import after a short delay...');
    
  } catch (error) {
    console.error('❌ Error during migration:', error.message);
  }
}

applyMigrations();
