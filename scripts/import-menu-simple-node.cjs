#!/usr/bin/env node

/**
 * Simple Node.js script to import menu CSV to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importMenuItems() {
  console.log('🚀 Starting FUJI menu import to Supabase...\n');

  try {
    // Step 1: Ensure categories exist
    console.log('📂 Creating/checking menu categories...');

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
      {
        name: 'Tempura Appetizer',
        category_type: 'tempura_appetizer',
        display_order: 10,
        color: '#ffa500',
      },
      {
        name: 'Lunch Specials',
        category_type: 'lunch_specials',
        display_order: 11,
        color: '#32cd32',
      },
      {
        name: 'Early Bird Specials',
        category_type: 'early_bird',
        display_order: 12,
        color: '#ff69b4',
      },
      { name: 'Dinner Entrées', category_type: 'dinner', display_order: 13, color: '#8b4513' },
      { name: 'Side Orders', category_type: 'side_orders', display_order: 14, color: '#9370db' },
      {
        name: "Children's Menu",
        category_type: 'children_menu',
        display_order: 15,
        color: '#00ced1',
      },
    ];

    const categoryMap = new Map();

    for (const category of categories) {
      // Check if category exists
      const { data: existing } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('name', category.name)
        .single();

      if (existing) {
        categoryMap.set(category.name, existing.id);
        console.log(`   ✅ Using existing category: ${category.name}`);
      } else {
        // Create new category
        const { data: newCategory, error } = await supabase
          .from('menu_categories')
          .insert(category)
          .select('id')
          .single();

        if (error) {
          console.error(`   ❌ Failed to create category ${category.name}:`, error.message);
        } else {
          categoryMap.set(category.name, newCategory.id);
          console.log(`   🆕 Created new category: ${category.name}`);
        }
      }
    }

    // Step 2: Clear existing menu items
    console.log('\n🗑️  Clearing existing menu items...');
    const { error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('   ❌ Failed to clear existing items:', deleteError.message);
    } else {
      console.log('   ✅ Cleared existing menu items');
    }

    // Step 3: Read CSV file
    const csvFile = path.join(__dirname, '..', 'data', 'fuji_menu_items.csv');
    console.log(`\n📊 Reading CSV file: ${csvFile}`);

    if (!fs.existsSync(csvFile)) {
      console.error(`❌ CSV file not found: ${csvFile}`);
      console.error('Please run: python scripts/import-menu-simple.py');
      process.exit(1);
    }

    const items = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(csvFile)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          console.log(`   📝 Found ${results.length} items in CSV`);
          resolve(results);
        })
        .on('error', reject);
    });

    // Step 4: Import menu items
    console.log('\n💾 Importing menu items to Supabase...');

    const itemsToInsert = [];
    let skippedItems = 0;

    for (const item of items) {
      const categoryId = categoryMap.get(item.category);

      if (!categoryId) {
        console.log(`   ⚠️  Skipping item '${item.name}' - category '${item.category}' not found`);
        skippedItems++;
        continue;
      }

      // Clean up item name
      const cleanName = item.name.replace(/^\*+\s*/, '').trim();

      const menuItem = {
        category_id: categoryId,
        name: cleanName,
        description: item.description || '',
        base_price: parseFloat(item.base_price) || 0,
        glass_price: item.glass_price ? parseFloat(item.glass_price) : null,
        bottle_price: item.bottle_price ? parseFloat(item.bottle_price) : null,
        lunch_price: item.lunch_price ? parseFloat(item.lunch_price) : null,
        dinner_price: item.dinner_price ? parseFloat(item.dinner_price) : null,
        preparation_time: parseInt(item.preparation_time) || 15,
        is_available: item.is_available === 'True' || item.is_available === true,
        is_featured: item.is_featured === 'True' || item.is_featured === true,
        display_order: itemsToInsert.length + 1,
      };

      itemsToInsert.push(menuItem);
    }

    console.log(`   📋 Prepared ${itemsToInsert.length} items for insertion`);
    if (skippedItems > 0) {
      console.log(`   ⚠️  Skipped ${skippedItems} items due to missing categories`);
    }

    // Insert items in batches
    const batchSize = 50;
    let totalInserted = 0;

    for (let i = 0; i < itemsToInsert.length; i += batchSize) {
      const batch = itemsToInsert.slice(i, i + batchSize);

      const { data, error } = await supabase.from('menu_items').insert(batch).select('id');

      if (error) {
        console.error(
          `   ❌ Failed to insert batch ${Math.floor(i / batchSize) + 1}:`,
          error.message
        );
      } else {
        totalInserted += data.length;
        console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${data.length} items`);
      }
    }

    // Step 5: Verify import
    console.log('\n🔍 Verifying import...');

    const { data: finalItems, error: itemError } = await supabase.from('menu_items').select('*');

    if (itemError) {
      console.error('   ❌ Error fetching menu items:', itemError.message);
    } else {
      console.log(`   🍽️  Total menu items in database: ${finalItems.length}`);

      // Show sample items
      if (finalItems.length > 0) {
        console.log('\n📋 Sample imported items:');
        finalItems.slice(0, 5).forEach((item) => {
          console.log(`   • ${item.name} - $${item.base_price}`);
        });
      }
    }

    console.log(`\n🎉 Import completed successfully!`);
    console.log(`📊 Total items imported: ${totalInserted}`);
    console.log(`📊 Total items in database: ${finalItems ? finalItems.length : 0}`);
    console.log('🚀 Your POS system is ready to use!');
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error(error.stack);
  }
}

// Run the import
importMenuItems();
