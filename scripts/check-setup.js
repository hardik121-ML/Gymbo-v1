#!/usr/bin/env node

/**
 * Gymbo Setup Checker
 * Verifies environment variables and Supabase configuration
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking Gymbo Setup...\n');

// Check for .env.local file
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found');
  console.log('   Run: cp .env.local.example .env.local');
  process.exit(1);
}
console.log('✅ .env.local file exists');

// Load environment variables
require('dotenv').config({ path: envPath });

// Check required environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let allVarsPresent = true;
requiredVars.forEach(varName => {
  if (!process.env[varName] || process.env[varName].includes('your-')) {
    console.error(`❌ ${varName} is not set or is a placeholder`);
    allVarsPresent = false;
  } else {
    console.log(`✅ ${varName} is configured`);
  }
});

if (!allVarsPresent) {
  console.log('\n⚠️  Please update .env.local with your actual Supabase credentials');
  console.log('   Get them from: https://supabase.com/dashboard/project/_/settings/api\n');
  process.exit(1);
}

// Validate URL format
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL format looks incorrect');
  console.log('   Expected format: https://xxxxx.supabase.co');
  process.exit(1);
}

console.log('\n✨ Environment configuration looks good!');
console.log('\n📝 Next step: Run your database migrations in Supabase');
console.log('   See SUPABASE_SETUP.md for detailed instructions\n');
