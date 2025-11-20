#!/usr/bin/env node
/**
 * Script to apply database migrations using direct PostgreSQL connection
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL not found in .env.local');
  process.exit(1);
}

async function applyMigration(migrationFile: string) {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Required for Supabase connections
    }
  });

  try {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile);

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    console.log(`📄 Reading migration: ${migrationFile}`);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log(`🔌 Connecting to database...`);
    await client.connect();
    console.log(`✅ Connected`);

    console.log(`🚀 Executing migration...`);
    await client.query(sql);

    console.log(`✅ Migration completed successfully!`);
    console.log(`\n📝 Applied: ${migrationFile}`);

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.position) {
      console.error(`   Error at position: ${error.position}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: npx tsx scripts/apply-migration.ts <migration-file-name>');
  console.error('Example: npx tsx scripts/apply-migration.ts 008_fix_calculate_order_totals.sql');
  process.exit(1);
}

applyMigration(migrationFile);
