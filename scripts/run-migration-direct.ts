#!/usr/bin/env node
/**
 * Script to run database migrations using direct PostgreSQL connection
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'public'
  }
});

async function runMigration(migrationFile: string) {
  try {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile);

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    console.log(`📄 Reading migration: ${migrationFile}`);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log(`🚀 Executing migration as single transaction...`);

    // Execute the entire SQL file as one query
    const { data, error } = await supabase.rpc('exec', { sql });

    if (error) {
      console.error(`❌ Error executing migration:`, error);
      throw error;
    }

    console.log(`✅ Migration completed successfully!`);
    console.log(`\n📝 Applied: ${migrationFile}`);

  } catch (error: any) {
    if (error.message?.includes('function public.exec')) {
      console.error('\n❌ Migration failed: Direct SQL execution not available via Supabase RPC');
      console.error('\n💡 Alternative: Copy and paste the migration SQL directly into:');
      console.error(`   ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/editor`);
    } else {
      console.error('❌ Migration failed:', error);
    }
    process.exit(1);
  }
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: npx tsx scripts/run-migration-direct.ts <migration-file-name>');
  console.error('Example: npx tsx scripts/run-migration-direct.ts 008_fix_calculate_order_totals.sql');
  process.exit(1);
}

runMigration(migrationFile);
