// Insert sample data for Fuji POS System
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertSampleData() {
  console.log('🗄️ Inserting Sample Data...\n');

  try {
    // Insert menu categories
    console.log('1. Inserting menu categories...');
    const categories = [
      { name: 'Red Wine', category_type: 'red_wine', display_order: 1, color: '#722f37' },
      { name: 'White Wine', category_type: 'white_wine', display_order: 2, color: '#f3e5ab' },
      { name: 'Blush Wine', category_type: 'blush_wine', display_order: 3, color: '#ffc0cb' },
      { name: 'Plum Wine', category_type: 'plum_wine', display_order: 4, color: '#8b4789' },
      { name: 'Domestic Beer', category_type: 'domestic_beer', display_order: 5, color: '#f28e1c' },
      { name: 'Imported Beer', category_type: 'imported_beer', display_order: 6, color: '#ffd700' },
      { name: 'Sake', category_type: 'sake', display_order: 7, color: '#e6e6fa' },
      { name: 'Beverages', category_type: 'beverages', display_order: 8, color: '#4169e1' },
      { name: 'Sushi Rolls', category_type: 'sushi_rolls', display_order: 9, color: '#ff6347' },
      { name: 'Tempura Appetizer', category_type: 'tempura_appetizer', display_order: 10, color: '#ffa500' },
      { name: 'Lunch Specials', category_type: 'lunch_specials', display_order: 11, color: '#32cd32' },
      { name: 'Early Bird', category_type: 'early_bird', display_order: 12, color: '#ff69b4' },
      { name: 'Dinner', category_type: 'dinner', display_order: 13, color: '#8b4513' },
      { name: 'Side Orders', category_type: 'side_orders', display_order: 14, color: '#9370db' },
      { name: 'Children Menu', category_type: 'children_menu', display_order: 15, color: '#00ced1' }
    ];

    const { error: categoryError } = await supabase
      .from('menu_categories')
      .upsert(categories, { onConflict: 'name' });

    if (categoryError) {
      console.log('   ❌ Category insertion failed:', categoryError.message);
    } else {
      console.log('   ✅ Categories inserted successfully');
    }

    // Insert modifiers
    console.log('2. Inserting modifiers...');
    const modifiers = [
      { name: 'Spicy Sauce', price: 1.50, modifier_group: 'sauces' },
      { name: 'Teriyaki Sauce', price: 1.50, modifier_group: 'sauces' },
      { name: 'Ginger (Fresh)', price: 1.50, modifier_group: 'sauces' },
      { name: 'Extra Spicy', price: 0, modifier_group: 'spice_level' },
      { name: 'Mild', price: 0, modifier_group: 'spice_level' },
      { name: 'No Spice', price: 0, modifier_group: 'spice_level' },
      { name: 'Rare', price: 0, modifier_group: 'cooking_temp' },
      { name: 'Medium Rare', price: 0, modifier_group: 'cooking_temp' },
      { name: 'Medium', price: 0, modifier_group: 'cooking_temp' },
      { name: 'Medium Well', price: 0, modifier_group: 'cooking_temp' },
      { name: 'Well Done', price: 0, modifier_group: 'cooking_temp' },
      { name: 'Chicken Fried Rice', price: 5.50, modifier_group: 'rice_upgrade' },
      { name: 'Split Plate', price: 8.00, modifier_group: 'service' }
    ];

    // Clear existing data first
    await supabase.from('modifiers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const { error: modifierError } = await supabase
      .from('modifiers')
      .insert(modifiers);

    if (modifierError) {
      console.log('   ❌ Modifier insertion failed:', modifierError.message);
    } else {
      console.log('   ✅ Modifiers inserted successfully');
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
    console.log('3. Inserting menu items...');
    const menuItems = [
      {
        category_id: categoryMap['red_wine'],
        name: 'Cabernet Sauvignon',
        description: 'Full-bodied red wine with rich flavor and dark fruit notes',
        base_price: 12.00,
        glass_price: 12.00,
        bottle_price: 45.00,
        preparation_time: 0,
        is_available: true,
        is_featured: true,
        allergens: ['sulfites']
      },
      {
        category_id: categoryMap['white_wine'],
        name: 'Chardonnay',
        description: 'Crisp white wine with citrus notes and oak finish',
        base_price: 10.00,
        glass_price: 10.00,
        bottle_price: 38.00,
        preparation_time: 0,
        is_available: true,
        allergens: ['sulfites']
      },
      {
        category_id: categoryMap['sushi_rolls'],
        name: 'California Roll',
        description: 'Crab, avocado, and cucumber with sesame seeds',
        base_price: 8.95,
        preparation_time: 12,
        is_raw: false,
        is_vegetarian: true,
        is_gluten_free: true,
        is_available: true,
        is_featured: true,
        cost: 3.50,
        allergens: ['shellfish', 'sesame']
      },
      {
        category_id: categoryMap['sushi_rolls'],
        name: 'Spicy Tuna Roll',
        description: 'Spicy tuna with cucumber and avocado',
        base_price: 9.95,
        spicy_level: 3,
        preparation_time: 15,
        is_raw: true,
        is_available: true,
        cost: 4.25,
        allergens: ['fish', 'sesame', 'eggs']
      },
      {
        category_id: categoryMap['dinner'],
        name: 'Chicken Teriyaki',
        description: 'Grilled chicken with teriyaki sauce, served with rice and vegetables',
        base_price: 18.99,
        lunch_price: 15.99,
        dinner_price: 18.99,
        preparation_time: 20,
        is_vegetarian: false,
        is_gluten_free: false,
        is_available: true,
        cost: 12.00,
        allergens: ['soy', 'gluten']
      }
    ];

    // Clear existing data first
    await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const { error: itemError } = await supabase
      .from('menu_items')
      .insert(menuItems);

    if (itemError) {
      console.log('   ❌ Menu item insertion failed:', itemError.message);
    } else {
      console.log('   ✅ Menu items inserted successfully');
    }

    // Insert restaurant tables
    console.log('4. Inserting restaurant tables...');
    const tables = [
      { table_number: 1, section: 'Main', seats: 4 },
      { table_number: 2, section: 'Main', seats: 4 },
      { table_number: 3, section: 'Main', seats: 6 },
      { table_number: 4, section: 'Main', seats: 2 },
      { table_number: 5, section: 'Main', seats: 4 },
      { table_number: 6, section: 'Main', seats: 8 },
      { table_number: 7, section: 'Patio', seats: 4 },
      { table_number: 8, section: 'Patio', seats: 4 },
      { table_number: 9, section: 'Patio', seats: 6 },
      { table_number: 10, section: 'Bar', seats: 2 },
      { table_number: 11, section: 'Bar', seats: 2 },
      { table_number: 12, section: 'Bar', seats: 4 }
    ];

    const { error: tableError } = await supabase
      .from('restaurant_tables')
      .upsert(tables, { onConflict: 'table_number' });

    if (tableError) {
      console.log('   ❌ Table insertion failed:', tableError.message);
    } else {
      console.log('   ✅ Restaurant tables inserted successfully');
    }

    console.log('\n🎉 Sample data insertion complete!');
    console.log('🧪 Testing the data...');

    // Test the data
    const { data: finalCategories } = await supabase
      .from('menu_categories')
      .select('*');

    const { data: finalItems } = await supabase
      .from('menu_items')
      .select('*');

    console.log(`✅ Found ${finalCategories?.length || 0} categories`);
    console.log(`✅ Found ${finalItems?.length || 0} menu items`);
    console.log('🚀 Ready to start the application: npm run dev');

  } catch (error) {
    console.error('❌ Sample data insertion failed:', error.message);
  }
}

insertSampleData();
