#!/usr/bin/env node

/**
 * Environment setup script for Fuji POS System
 * Helps create and validate .env.local configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('🏪 Fuji POS Environment Setup');
console.log('==============================\n');

// Check if .env.local already exists
const envLocalPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env example');

if (fs.existsSync(envLocalPath)) {
  console.log('⚠️  .env.local already exists');
  console.log('   Current file will be backed up as .env.local.backup');
  
  // Create backup
  const backupPath = path.join(process.cwd(), '.env.local.backup');
  fs.copyFileSync(envLocalPath, backupPath);
  console.log('✅ Backup created: .env.local.backup\n');
}

// Copy template to .env.local
if (fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envLocalPath);
  console.log('✅ Created .env.local from template');
} else {
  console.log('❌ .env example file not found');
  process.exit(1);
}

// Provide setup instructions
console.log('\n📋 Next Steps:');
console.log('==============');
console.log('');
console.log('1. 🔧 SET UP SUPABASE (REQUIRED):');
console.log('   • Go to: https://supabase.com');
console.log('   • Create a new project');
console.log('   • Go to Settings > API');
console.log('   • Copy your Project URL and anon key');
console.log('   • Copy your service_role key (keep secret!)');
console.log('');

console.log('2. 💳 SET UP STRIPE (FOR PAYMENTS):');
console.log('   • Go to: https://dashboard.stripe.com');
console.log('   • Create account or login');
console.log('   • Go to Developers > API keys');
console.log('   • Copy your Publishable key and Secret key');
console.log('   • Use test keys for development');
console.log('');

console.log('3. ✏️  EDIT .env.local FILE:');
console.log('   • Open .env.local in your editor');
console.log('   • Replace all placeholder values');
console.log('   • Focus on * REQUIRED sections first');
console.log('   • Save the file');
console.log('');

console.log('4. 🗄️  SET UP DATABASE:');
console.log('   • Install Supabase CLI: npm install -g supabase');
console.log('   • Link project: supabase link --project-ref your-project-ref');
console.log('   • Push migrations: supabase db push');
console.log('   • Verify tables in Supabase dashboard');
console.log('');

console.log('5. 🚀 START DEVELOPMENT:');
console.log('   • Run: npm run dev:all');
console.log('   • Open: http://localhost:3000');
console.log('   • Test login with demo accounts');
console.log('');

console.log('📖 For detailed setup instructions, see:');
console.log('   • CLAUDE.md - Technical specifications');
console.log('   • fuji-pos-prd.md - Business requirements');
console.log('   • TESTING.md - Testing procedures');
console.log('');

console.log('🆘 TROUBLESHOOTING:');
console.log('   • Supabase error: Check URL and keys');
console.log('   • Build errors: Run npm install');
console.log('   • Auth errors: Verify database migrations');
console.log('   • Port conflicts: Change PORT in .env.local');
console.log('');

console.log('✨ Environment setup complete!');
console.log('   Edit .env.local and restart your dev server.');

rl.close();
