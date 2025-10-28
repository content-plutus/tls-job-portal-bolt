import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createInterface } from 'readline';

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
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL environment variable');
  process.exit(1);
}

// Use service role key if available (for admin API), otherwise use anon key
const useAdminAPI = !!supabaseServiceKey;
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseKey) {
  console.error('❌ Missing Supabase keys');
  console.error('Please ensure either SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY is set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

if (useAdminAPI) {
  console.log('✨ Using Admin API - users will be auto-confirmed');
} else {
  console.log('⚠️  Using Anon Key - users will need email verification');
  console.log('   Add SUPABASE_SERVICE_ROLE_KEY to .env for auto-confirmation');
}

// Helper to get user input
function prompt(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate subscription tier
function isValidTier(tier) {
  const validTiers = ['free', 'silver', 'gold', 'platinum'];
  return validTiers.includes(tier.toLowerCase());
}

// Create a new user
async function createUser(email, password, subscriptionTier = 'free', role = 'job_seeker') {
  console.log('\n🔐 Creating user account...');
  
  try {
    let authData, authError, userId;

    if (useAdminAPI) {
      // Use Admin API - auto-confirms email, bypasses email verification
      const result = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          subscription_tier: subscriptionTier,
          role: role,
        },
      });
      authData = result.data;
      authError = result.error;
    } else {
      // Use regular signup - requires email verification
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            subscription_tier: subscriptionTier,
            role: role,
          },
        },
      });
      authData = result.data;
      authError = result.error;
    }

    if (authError) {
      throw new Error(`Auth ${useAdminAPI ? 'admin create' : 'signup'} failed: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('No user data returned from creation');
    }

    userId = authData.user.id;
    console.log(`✅ User created successfully!`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${email}`);
    if (useAdminAPI) {
      console.log(`   ✅ Email auto-confirmed - user can login immediately`);
    }

    // Wait for triggers to execute
    console.log('\n⏳ Waiting for database triggers to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify profile was created
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profileData) {
      console.warn('⚠️  Warning: Profile may not have been created automatically');
    } else {
      console.log('✅ Profile created automatically');
    }

    // Verify application limits were set
    const { data: limitsData, error: limitsError } = await supabase
      .from('application_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (limitsError || !limitsData) {
      console.warn('⚠️  Warning: Application limits may not have been set');
    } else {
      console.log(`✅ Application limits set: ${limitsData.applications_limit} per month`);
    }

    console.log('\n' + '━'.repeat(50));
    console.log('✅ User creation complete!');
    console.log('━'.repeat(50));
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Subscription Tier: ${subscriptionTier}`);
    console.log(`Role: ${role}`);
    console.log('━'.repeat(50));

    return { success: true, userId };

  } catch (error) {
    console.error('\n❌ Error creating user:', error.message);
    return { success: false, error: error.message };
  }
}

// Interactive mode
async function interactiveMode() {
  console.log('\n📝 Create New User - Interactive Mode');
  console.log('━'.repeat(50));

  // Get email
  let email;
  while (true) {
    email = await prompt('\nEmail address: ');
    if (isValidEmail(email)) {
      break;
    }
    console.log('❌ Invalid email format. Please try again.');
  }

  // Get password
  let password;
  while (true) {
    password = await prompt('Password (min 6 characters): ');
    if (password.length >= 6) {
      break;
    }
    console.log('❌ Password must be at least 6 characters. Please try again.');
  }

  // Get subscription tier
  let subscriptionTier;
  while (true) {
    console.log('\nSubscription Tiers:');
    console.log('  - free (5 applications/month)');
    console.log('  - silver (20 applications/month)');
    console.log('  - gold (50 applications/month)');
    console.log('  - platinum (unlimited applications)');
    subscriptionTier = await prompt('Subscription tier [free]: ');
    subscriptionTier = subscriptionTier.trim().toLowerCase() || 'free';
    
    if (isValidTier(subscriptionTier)) {
      break;
    }
    console.log('❌ Invalid tier. Please choose: free, silver, gold, or platinum');
  }

  // Get role
  let role;
  while (true) {
    console.log('\nRoles:');
    console.log('  - job_seeker (default)');
    console.log('  - employer');
    console.log('  - admin');
    role = await prompt('Role [job_seeker]: ');
    role = role.trim().toLowerCase() || 'job_seeker';
    
    if (['job_seeker', 'employer', 'admin'].includes(role)) {
      break;
    }
    console.log('❌ Invalid role. Please choose: job_seeker, employer, or admin');
  }

  // Create the user
  await createUser(email, password, subscriptionTier, role);
}

// Command-line mode
async function commandLineMode() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('\n❌ Missing required arguments');
    console.log('\nUsage:');
    console.log('  npm run create-user -- <email> <password> [tier] [role]');
    console.log('\nExamples:');
    console.log('  npm run create-user -- user@example.com Password123');
    console.log('  npm run create-user -- user@example.com Password123 silver');
    console.log('  npm run create-user -- user@example.com Password123 gold job_seeker');
    console.log('\nFor interactive mode, run without arguments:');
    console.log('  npm run create-user');
    process.exit(1);
  }

  const [email, password, tier = 'free', role = 'job_seeker'] = args;

  // Validate inputs
  if (!isValidEmail(email)) {
    console.error('❌ Invalid email format');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ Password must be at least 6 characters');
    process.exit(1);
  }

  if (!isValidTier(tier)) {
    console.error('❌ Invalid subscription tier. Valid options: free, silver, gold, platinum');
    process.exit(1);
  }

  if (!['job_seeker', 'employer', 'admin'].includes(role.toLowerCase())) {
    console.error('❌ Invalid role. Valid options: job_seeker, employer, admin');
    process.exit(1);
  }

  await createUser(email, password, tier.toLowerCase(), role.toLowerCase());
}

// Main function
async function main() {
  console.log('🚀 User Creation Script');
  console.log('━'.repeat(50));

  const args = process.argv.slice(2);

  if (args.length === 0) {
    // No arguments - run in interactive mode
    await interactiveMode();
  } else {
    // Has arguments - run in command-line mode
    await commandLineMode();
  }
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
