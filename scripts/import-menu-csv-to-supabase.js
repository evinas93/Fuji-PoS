#!/usr/bin/env node

/**
 * FUJI Restaurant POS System - Import Menu CSV to Supabase
 * Imports the generated CSV file into Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class MenuCSVImporter {
  constructor() {
    this.csvFile = path.join(__dirname, '..', 'data', 'fuji_menu_items.csv');
    this.categoryMap = new Map();
  }

  async ensureCategories() {
    console.log('📂 Ensuring menu categories exist...');

    // Define all categories that should exist
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

    for (const category of categories) {
      // Check if category exists
      const { data: existing } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('name', category.name)
        .single();

      if (existing) {
        this.categoryMap.set(category.name, existing.id);
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
          this.categoryMap.set(category.name, newCategory.id);
          console.log(`   🆕 Created new category: ${category.name}`);
        }
      }
    }
  }

  async clearExistingMenuItems() {
    console.log('🗑️  Clearing existing menu items...');

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('   ❌ Failed to clear existing items:', error.message);
    } else {
      console.log('   ✅ Cleared existing menu items');
    }
  }

  async readCSVFile() {
    console.log(`📊 Reading CSV file: ${this.csvFile}`);

    if (!fs.existsSync(this.csvFile)) {
      console.error(`❌ CSV file not found: ${this.csvFile}`);
      console.error('Please run the PDF import script first: python scripts/import-menu-simple.py');
      process.exit(1);
    }

    return new Promise((resolve, reject) => {
      const items = [];

      fs.createReadStream(this.csvFile)
        .pipe(csv())
        .on('data', (row) => {
          items.push(row);
        })
        .on('end', () => {
          console.log(`   📝 Found ${items.length} items in CSV`);
          resolve(items);
        })
        .on('error', (error) => {
          console.error('   ❌ Error reading CSV:', error.message);
          reject(error);
        });
    });
  }

  async importMenuItems(items) {
    console.log('💾 Importing menu items to Supabase...');

    const itemsToInsert = [];
    let skippedItems = 0;

    for (const item of items) {
      const categoryId = this.categoryMap.get(item.category);

      if (!categoryId) {
        console.log(`   ⚠️  Skipping item '${item.name}' - category '${item.category}' not found`);
        skippedItems++;
        continue;
      }

      // Clean up item name (remove asterisks and extra spaces)
      const cleanName = item.name.replace(/^\*+\s*/, '').trim();

      // Convert string values to appropriate types
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
        is_available: item.is_available === 'true' || item.is_available === true,
        is_featured: item.is_featured === 'true' || item.is_featured === true,
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

    console.log(`🎉 Successfully imported ${totalInserted} menu items!`);
    return totalInserted;
  }

  async verifyImport() {
    console.log('🔍 Verifying import...');

    // Check categories
    const { data: categories, error: catError } = await supabase
      .from('menu_categories')
      .select('*');

    if (catError) {
      console.error('   ❌ Error fetching categories:', catError.message);
    } else {
      console.log(`   📂 Categories: ${categories.length}`);
    }

    // Check menu items
    const { data: items, error: itemError } = await supabase.from('menu_items').select('*');

    if (itemError) {
      console.error('   ❌ Error fetching menu items:', itemError.message);
    } else {
      console.log(`   🍽️  Menu items: ${items.length}`);

      // Show sample items
      if (items.length > 0) {
        console.log('\n📋 Sample imported items:');
        items.slice(0, 5).forEach((item) => {
          console.log(`   • ${item.name} - $${item.base_price}`);
        });
      }
    }

    return items ? items.length : 0;
  }

  async run() {
    console.log('🚀 Starting CSV to Supabase import process...\n');

    try {
      // Step 1: Ensure categories exist
      await this.ensureCategories();

      // Step 2: Clear existing menu items (optional)
      await this.clearExistingMenuItems();

      // Step 3: Read CSV file
      const items = await this.readCSVFile();

      if (!items || items.length === 0) {
        console.log('❌ No items found in CSV file');
        return;
      }

      // Step 4: Import menu items
      const totalInserted = await this.importMenuItems(items);

      // Step 5: Verify import
      const totalItems = await this.verifyImport();

      console.log(f`\n🎉 Import completed successfully!`);
      console.log(f`📊 Total items imported: ${totalInserted}`);
      console.log(f`📊 Total items in database: ${totalItems}`);
      console.log('🚀 Your POS system is ready to use!');
    } catch (error) {
      console.error('❌ Import failed:', error.message);
      console.error(error.stack);
    }
  }
}

// Run the import if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const importer = new MenuCSVImporter();
  importer.run();
}

export default MenuCSVImporter;
