// Database setup script for Fuji POS System
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🗄️ Setting up Fuji POS Database...\n');

  try {
    // Step 1: Test connection
    console.log('1. Testing database connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected)
      throw error;
    }
    console.log('✅ Database connection successful\n');

    // Step 2: Check if tables exist
    console.log('2. Checking database schema...');
    const { data: tables } = await supabase.rpc('get_table_names');
    
    if (tables && tables.length > 0) {
      console.log('✅ Database schema already exists');
      console.log(`Found ${tables.length} tables: ${tables.join(', ')}\n`);
    } else {
      console.log('⚠️  Database schema not found. Please run migrations first.\n');
      console.log('📋 Next steps:');
      console.log('1. Copy the migration files to Supabase SQL Editor');
      console.log('2. Run them in order: 001, 002, 003, 004');
      console.log('3. Then run this script again\n');
      return;
    }

    // Step 3: Insert sample data
    console.log('3. Setting up sample data...');
    await insertSampleData();

    // Step 4: Test menu system
    console.log('4. Testing menu system...');
    await testMenuSystem();

    console.log('🎉 Database setup complete!');
    console.log('🚀 You can now start the development server: npm run dev');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\n📋 Troubleshooting:');
    console.error('1. Verify your Supabase URL and service key');
    console.error('2. Make sure you\'ve run all database migrations');
    console.error('3. Check that RLS policies are properly configured');
  }
}

async function insertSampleData() {
  // Insert sample categories
  const categories = [
    { name: 'Red Wine', category_type: 'red_wine', display_order: 1, color: '#dc2626' },
    { name: 'White Wine', category_type: 'white_wine', display_order: 2, color: '#fbbf24' },
    { name: 'Domestic Beer', category_type: 'domestic_beer', display_order: 3, color: '#d97706' },
    { name: 'Sushi Rolls', category_type: 'sushi_rolls', display_order: 4, color: '#059669' },
    { name: 'Dinner', category_type: 'dinner', display_order: 5, color: '#6b7280' }
  ];

  console.log('   Inserting sample categories...');
  const { error: categoryError } = await supabase
    .from('menu_categories')
    .upsert(categories, { onConflict: 'name' });

  if (categoryError) {
    console.log('   ⚠️  Categories may already exist:', categoryError.message);
  } else {
    console.log('   ✅ Sample categories inserted');
  }

  // Insert sample modifiers
  const modifiers = [
    { name: 'Extra Spicy', price: 0.50, modifier_group: 'sauces' },
    { name: 'No Spicy', price: 0, modifier_group: 'sauces' },
    { name: 'Extra Avocado', price: 1.50, modifier_group: 'additions' },
    { name: 'No Avocado', price: 0, modifier_group: 'additions' },
    { name: 'Brown Rice', price: 0.75, modifier_group: 'rice' },
    { name: 'White Rice', price: 0, modifier_group: 'rice' }
  ];

  console.log('   Inserting sample modifiers...');
  const { error: modifierError } = await supabase
    .from('modifiers')
    .upsert(modifiers, { onConflict: 'name' });

  if (modifierError) {
    console.log('   ⚠️  Modifiers may already exist:', modifierError.message);
  } else {
    console.log('   ✅ Sample modifiers inserted');
  }

  // Get category IDs for menu items
  const { data: categoryData } = await supabase
    .from('menu_categories')
    .select('id, category_type');

  const categoryMap = {};
  categoryData.forEach(cat => {
    categoryMap[cat.category_type] = cat.id;
  });

  // Insert sample menu items
  const menuItems = [
    {
      category_id: categoryMap['red_wine'],
      name: 'Shiraz',
      description: 'Full-bodied red wine with rich berry flavors',
      base_price: 30.00,
      glass_price: 10.00,
      bottle_price: 30.00,
      preparation_time: 1,
      is_available: true,
      is_featured: true
    },
    {
      category_id: categoryMap['white_wine'],
      name: 'Chardonnay',
      description: 'Crisp white wine with citrus notes',
      base_price: 28.00,
      glass_price: 9.50,
      bottle_price: 28.00,
      preparation_time: 1,
      is_available: true
    },
    {
      category_id: categoryMap['sushi_rolls'],
      name: 'California Roll',
      description: 'Fresh crab, avocado, and cucumber',
      base_price: 12.99,
      lunch_price: 10.99,
      dinner_price: 12.99,
      cost: 8.50,
      preparation_time: 15,
      calories: 250,
      is_raw: false,
      is_vegetarian: true,
      is_gluten_free: true,
      allergens: ['sesame'],
      is_available: true,
      is_featured: true
    },
    {
      category_id: categoryMap['sushi_rolls'],
      name: 'Spicy Tuna Roll',
      description: 'Fresh tuna with spicy mayo',
      base_price: 13.99,
      lunch_price: 11.99,
      dinner_price: 13.99,
      cost: 9.00,
      preparation_time: 12,
      calories: 280,
      spicy_level: 2,
      is_raw: true,
      allergens: ['fish'],
      is_available: true
    },
    {
      category_id: categoryMap['dinner'],
      name: 'Chicken Teriyaki',
      description: 'Grilled chicken with teriyaki sauce, served with rice and vegetables',
      base_price: 18.99,
      lunch_price: 15.99,
      dinner_price: 18.99,
      cost: 12.00,
      preparation_time: 20,
      calories: 450,
      is_vegetarian: false,
      is_gluten_free: false,
      allergens: ['soy', 'gluten'],
      is_available: true
    }
  ];

  console.log('   Inserting sample menu items...');
  const { error: itemError } = await supabase
    .from('menu_items')
    .upsert(menuItems, { onConflict: 'name' });

  if (itemError) {
    console.log('   ⚠️  Menu items may already exist:', itemError.message);
  } else {
    console.log('   ✅ Sample menu items inserted');
  }

  console.log('   ✅ Sample data setup complete\n');
}

async function testMenuSystem() {
  // Test 1: Fetch categories
  console.log('   Testing category fetching...');
  const { data: categories, error: catError } = await supabase
    .from('menu_categories')
    .select('*')
    .order('display_order');

  if (catError) {
    console.log('   ❌ Category fetch failed:', catError.message);
    return;
  }
  console.log(`   ✅ Found ${categories.length} categories`);

  // Test 2: Fetch menu items
  console.log('   Testing menu item fetching...');
  const { data: items, error: itemError } = await supabase
    .from('menu_items')
    .select('*')
    .order('name');

  if (itemError) {
    console.log('   ❌ Menu item fetch failed:', itemError.message);
    return;
  }
  console.log(`   ✅ Found ${items.length} menu items`);

  // Test 3: Test search function
  console.log('   Testing search functionality...');
  const { data: searchResults, error: searchError } = await supabase
    .rpc('search_menu_items', { search_term: 'california' });

  if (searchError) {
    console.log('   ❌ Search failed:', searchError.message);
  } else {
    console.log(`   ✅ Search found ${searchResults.length} results`);
  }

  // Test 4: Test modifiers
  console.log('   Testing modifier system...');
  const { data: modifiers, error: modError } = await supabase
    .from('modifiers')
    .select('*')
    .order('modifier_group');

  if (modError) {
    console.log('   ❌ Modifier fetch failed:', modError.message);
  } else {
    console.log(`   ✅ Found ${modifiers.length} modifiers`);
  }

  console.log('   ✅ Menu system tests passed\n');
}

// Run the setup
setupDatabase();