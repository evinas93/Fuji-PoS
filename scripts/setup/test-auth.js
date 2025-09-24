// Test authentication flow
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('🔐 Testing Authentication Flow...\n');

  try {
    const email = 'manager@fuji.com';
    const password = 'manager123';

    console.log(`1. Attempting to sign in: ${email}`);

    // Step 1: Sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.log(`❌ Auth failed: ${authError.message}`);
      return;
    }

    console.log(`✅ Auth successful: ${authData.user.id}`);

    // Step 2: Get user profile
    console.log('\n2. Fetching user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .eq('is_active', true)
      .single();

    if (profileError) {
      console.log(`❌ Profile fetch failed: ${profileError.message}`);
      console.log('Profile error details:', profileError);
    } else {
      console.log(`✅ Profile found: ${profile.full_name} (${profile.role})`);
    }

    // Step 3: Test getCurrentUser
    console.log('\n3. Testing getCurrentUser...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log(`❌ Session error: ${sessionError?.message || 'No session'}`);
    } else {
      console.log(`✅ Session valid: ${session.user.email}`);

      const { data: currentProfile, error: currentProfileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (currentProfileError) {
        console.log(`❌ Current profile fetch failed: ${currentProfileError.message}`);
      } else {
        console.log(`✅ Current profile: ${currentProfile.full_name} (${currentProfile.role})`);
      }
    }

    // Step 4: Sign out
    console.log('\n4. Signing out...');
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth();