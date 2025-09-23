// Create demo users for testing the Fuji POS System
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDemoUsers() {
  console.log('👥 Creating Demo Users...\n');

  try {
    // Demo users data
    const demoUsers = [
      {
        email: 'manager@fuji.com',
        password: 'manager123',
        full_name: 'John Manager',
        role: 'manager'
      },
      {
        email: 'server@fuji.com',
        password: 'server123',
        full_name: 'Sarah Server',
        role: 'server'
      },
      {
        email: 'cashier@fuji.com',
        password: 'cashier123',
        full_name: 'Mike Cashier',
        role: 'cashier'
      },
      {
        email: 'kitchen@fuji.com',
        password: 'kitchen123',
        full_name: 'Chef Wong',
        role: 'kitchen'
      }
    ];

    console.log('1. Creating demo users in Supabase Auth...');

    for (const user of demoUsers) {
      try {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true
        });

        if (authError) {
          console.log(`   ⚠️  User ${user.email} may already exist: ${authError.message}`);
          continue;
        }

        // Create user profile in our users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            is_active: true
          });

        if (profileError) {
          console.log(`   ❌ Profile creation failed for ${user.email}: ${profileError.message}`);
        } else {
          console.log(`   ✅ Created user: ${user.email} (${user.role})`);
        }

      } catch (error) {
        console.log(`   ❌ Error creating ${user.email}: ${error.message}`);
      }
    }

    console.log('\n2. Demo users created!');
    console.log('\n📋 Login Credentials:');
    console.log('┌─────────────────────┬──────────────────┬──────────┐');
    console.log('│ Email               │ Password         │ Role     │');
    console.log('├─────────────────────┼──────────────────┼──────────┤');
    console.log('│ manager@fuji.com    │ manager123       │ Manager  │');
    console.log('│ server@fuji.com     │ server123        │ Server   │');
    console.log('│ cashier@fuji.com    │ cashier123       │ Cashier  │');
    console.log('│ kitchen@fuji.com    │ kitchen123       │ Kitchen  │');
    console.log('└─────────────────────┴──────────────────┴──────────┘');

    console.log('\n🎯 Test the application:');
    console.log('1. Go to http://localhost:3000/auth/login');
    console.log('2. Use any of the credentials above');
    console.log('3. Explore the menu management system');

  } catch (error) {
    console.error('❌ Demo user creation failed:', error.message);
  }
}

createDemoUsers();