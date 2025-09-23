#!/usr/bin/env node

/**
 * Demo Users Creation Script for Fuji POS System
 * Creates the demo users shown on the login page
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Environment Check:');
console.log(`   Supabase URL: ${supabaseUrl ? '✅ Found' : '❌ Missing'}`);
console.log(`   Service Key: ${supabaseServiceKey ? '✅ Found' : '❌ Missing'}`);
console.log('');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  console.error('Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const demoUsers = [
  {
    email: 'manager@fujirestaurant.com',
    password: 'password123',
    full_name: 'Manager Demo',
    role: 'manager',
    pin_code: '1234'
  },
  {
    email: 'server@fujirestaurant.com',
    password: 'password123',
    full_name: 'Server Demo',
    role: 'server',
    pin_code: '2345'
  },
  {
    email: 'cashier@fujirestaurant.com',
    password: 'password123',
    full_name: 'Cashier Demo',
    role: 'cashier',
    pin_code: '3456'
  },
  {
    email: 'kitchen@fujirestaurant.com',
    password: 'password123',
    full_name: 'Kitchen Demo',
    role: 'kitchen',
    pin_code: '4567'
  },
  {
    email: 'admin@fujirestaurant.com',
    password: 'password123',
    full_name: 'Admin Demo',
    role: 'admin',
    pin_code: '0000'
  }
];

async function createDemoUsers() {
  console.log('🔧 Creating demo users for Fuji POS...\n');

  for (const userData of demoUsers) {
    try {
      console.log(`Creating ${userData.role}: ${userData.email}`);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role
        }
      });

      if (authError) {
        console.log(`  ⚠️  Auth user already exists: ${authError.message}`);
      } else {
        console.log(`  ✅ Auth user created: ${authData.user.id}`);
      }

      // Create or update user profile
      const userId = authData?.user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === userData.email)?.id;
      
      if (userId) {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
            pin_code: userData.pin_code,
            is_active: true,
            hourly_rate: userData.role === 'admin' ? 0 : (userData.role === 'manager' ? 25 : 15)
          })
          .select()
          .single();

        if (profileError) {
          console.log(`  ⚠️  Profile error: ${profileError.message}`);
        } else {
          console.log(`  ✅ Profile created/updated`);
        }
      }

    } catch (error) {
      console.log(`  ❌ Error creating ${userData.email}: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🎉 Demo user creation complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('==================');
  demoUsers.forEach(user => {
    console.log(`${user.role.padEnd(8)}: ${user.email} / password123`);
  });
  console.log('\n🚀 You can now test login at: http://localhost:3000/auth/login');
}

// Test database connection first
async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful\n');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\n💡 Make sure you have:');
    console.error('   1. Created your Supabase project');
    console.error('   2. Run database migrations: supabase db push');
    console.error('   3. Updated .env.local with correct keys');
    return false;
  }
}

async function main() {
  const canConnect = await testConnection();
  if (canConnect) {
    await createDemoUsers();
  }
  process.exit(0);
}

main().catch(console.error);
