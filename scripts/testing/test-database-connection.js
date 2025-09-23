// Quick database connection test
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Testing Database Connection...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    console.error('Please check your .env.local file has:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  console.log('✅ Environment variables found');
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...\n`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('menu_categories').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    console.log('✅ Connection successful\n');

    // Test table existence
    console.log('2. Checking database schema...');
    const tables = ['users', 'menu_categories', 'menu_items', 'modifiers', 'orders'];
    
    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('*').limit(1);
      if (tableError) {
        console.log(`   ❌ Table '${table}' not found`);
      } else {
        console.log(`   ✅ Table '${table}' exists`);
      }
    }
    console.log('');

    // Test sample data
    console.log('3. Checking sample data...');
    const { data: categories, error: catError } = await supabase
      .from('menu_categories')
      .select('*');

    if (catError) {
      console.log('   ❌ No categories found');
    } else {
      console.log(`   ✅ Found ${categories.length} categories`);
    }

    const { data: items, error: itemError } = await supabase
      .from('menu_items')
      .select('*');

    if (itemError) {
      console.log('   ❌ No menu items found');
    } else {
      console.log(`   ✅ Found ${items.length} menu items`);
    }

    console.log('\n🎉 Database connection test complete!');
    console.log('🚀 Ready to start the application: npm run dev');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testConnection();
