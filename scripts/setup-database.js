#!/usr/bin/env node

/**
 * Database Setup Script for Fuji POS System
 * Sets up the database schema and creates demo users
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('🗄️  Setting up Fuji POS Database...\n');

  try {
    // Read migration files
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      console.log(`\n📄 Running migration: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      // Split migration into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            if (error && !error.message.includes('already exists')) {
              console.log(`  ⚠️  ${error.message}`);
            } else {
              console.log(`  ✅ Executed successfully`);
            }
          } catch (err) {
            // Try direct query execution for non-RPC statements
            try {
              const { error } = await supabase.from('_dummy_').select('*').limit(0);
              // If we get here, connection works, try to execute statement differently
              console.log(`  ⚠️  Statement may need manual execution: ${statement.substring(0, 50)}...`);
            } catch (e) {
              console.log(`  ⚠️  Could not execute: ${err.message}`);
            }
          }
        }
      }
    }

    console.log('\n🎉 Database setup complete!');
    return true;

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n💡 Alternative setup options:');
    console.log('   1. Use Supabase Dashboard: https://supabase.com/dashboard');
    console.log('   2. Install Supabase CLI: https://github.com/supabase/cli#install-the-cli');
    console.log('   3. Copy migration files manually to Supabase SQL editor');
    return false;
  }
}

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('system_settings')
      .select('count')
      .limit(1);

    if (error) {
      console.log(`  ⚠️  Connection test: ${error.message}`);
      return false;
    }

    console.log('  ✅ Database connection successful');
    return true;
  } catch (error) {
    console.log(`  ❌ Connection failed: ${error.message}`);
    return false;
  }
}

async function createDemoUsers() {
  console.log('\n👥 Creating demo users...');

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

  for (const userData of demoUsers) {
    try {
      console.log(`  Creating ${userData.role}: ${userData.email}`);

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
        console.log(`    ⚠️  Auth user already exists: ${authError.message}`);
      } else {
        console.log(`    ✅ Auth user created: ${authData.user.id}`);
      }

      // Get user ID (either from new creation or existing user)
      let userId = authData?.user?.id;
      if (!userId) {
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === userData.email);
        userId = existingUser?.id;
      }

      if (userId) {
        // Create or update user profile
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
          console.log(`    ⚠️  Profile error: ${profileError.message}`);
        } else {
          console.log(`    ✅ Profile created/updated`);
        }
      }

    } catch (error) {
      console.log(`    ❌ Error creating ${userData.email}: ${error.message}`);
    }
  }

  console.log('\n🎉 Demo user creation complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('==================');
  demoUsers.forEach(user => {
    console.log(`${user.role.padEnd(8)}: ${user.email} / password123`);
  });
}

async function main() {
  console.log('🏪 Fuji POS Database Setup');
  console.log('==========================\n');

  // Test connection first
  const canConnect = await testConnection();
  
  if (!canConnect) {
    console.log('\n❌ Cannot connect to database. Please check:');
    console.log('   1. Supabase project is created and running');
    console.log('   2. Environment variables are correct');
    console.log('   3. Database migrations have been run');
    process.exit(1);
  }

  // Try to set up database (this may fail if migrations are complex)
  const setupSuccess = await setupDatabase();
  
  if (setupSuccess) {
    await createDemoUsers();
  } else {
    console.log('\n📋 Manual Setup Instructions:');
    console.log('=============================');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Open your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and run the contents of:');
    console.log('   - supabase/migrations/001_initial_schema.sql');
    console.log('   - supabase/migrations/002_functions_and_triggers.sql');
    console.log('   - supabase/migrations/003_sample_data.sql');
    console.log('5. Run this script again to create demo users');
  }

  console.log('\n🚀 Next steps:');
  console.log('   1. Start development servers: npm run dev:all');
  console.log('   2. Test login at: http://localhost:3000/auth/login');
  console.log('   3. Use demo credentials above');
}

main().catch(console.error);
