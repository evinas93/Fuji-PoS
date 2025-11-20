#!/usr/bin/env node
/**
 * Script to manually run database migrations
 * Usage: npx tsx scripts/run-migration.ts <migration-file-name>
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile: string) {
  try {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile);

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    console.log(`📄 Reading migration: ${migrationFile}`);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log(`🚀 Executing migration...`);

    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`   Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        // Try direct execution if exec_sql doesn't exist
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ query: statement + ';' })
        });

        if (!response.ok) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          console.error(`   Statement: ${statement.substring(0, 100)}...`);
          throw error;
        }
      }
    }

    console.log(`✅ Migration completed successfully!`);
    console.log(`\n📝 Applied: ${migrationFile}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: npx tsx scripts/run-migration.ts <migration-file-name>');
  console.error('Example: npx tsx scripts/run-migration.ts 008_fix_calculate_order_totals.sql');
  process.exit(1);
}

runMigration(migrationFile);
