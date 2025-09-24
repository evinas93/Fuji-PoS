// Check and create user profiles for demo users
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndCreateProfiles() {
  console.log('🔍 Checking user profiles...\n');

  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      throw authError;
    }

    console.log(`Found ${authUsers.users.length} users in auth`);

    const demoEmails = ['manager@fuji.com', 'server@fuji.com', 'cashier@fuji.com', 'kitchen@fuji.com'];
    const roleMap = {
      'manager@fuji.com': 'manager',
      'server@fuji.com': 'server',
      'cashier@fuji.com': 'cashier',
      'kitchen@fuji.com': 'kitchen'
    };

    for (const authUser of authUsers.users) {
      if (demoEmails.includes(authUser.email)) {
        console.log(`\nChecking profile for: ${authUser.email}`);

        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          console.log('  ⚠️ Profile not found, creating...');

          // Create profile
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.user_metadata?.full_name || `Demo ${roleMap[authUser.email]}`,
              role: roleMap[authUser.email],
              is_active: true
            });

          if (insertError) {
            console.log(`  ❌ Failed to create profile: ${insertError.message}`);
          } else {
            console.log(`  ✅ Profile created for ${authUser.email}`);
          }
        } else if (profileError) {
          console.log(`  ❌ Error checking profile: ${profileError.message}`);
        } else {
          console.log(`  ✅ Profile exists: ${profile.full_name} (${profile.role})`);
        }
      }
    }

    console.log('\n✅ Profile check complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAndCreateProfiles();