#!/usr/bin/env node
/**
 * Supabase Historical Data Import Script
 * Imports complete Excel data into Supabase for comprehensive reporting
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csvParser from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
const envPath = path.join(__dirname, '..', '.env.local');
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Service Key:', supabaseServiceKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || 'Missing');
    console.error('   SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY):', supabaseServiceKey ? 'Found' : 'Missing');
    console.error('\nPlease set these in your .env.local file at:', envPath);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
    console.log('🏗️  Creating historical data tables...');

    const tableCreationSQL = `
        -- 1. MONTHLY SUMMARY TABLE
        CREATE TABLE IF NOT EXISTS historical_monthly_summary (
            id TEXT PRIMARY KEY,
            date DATE NOT NULL,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            month_name TEXT NOT NULL,
            original_month_string TEXT,
            togo DECIMAL(10,2) DEFAULT 0,
            dine_in DECIMAL(10,2) DEFAULT 0,
            tax DECIMAL(10,2) DEFAULT 0,
            gross_sale DECIMAL(10,2) DEFAULT 0,
            gratuity DECIMAL(10,2) DEFAULT 0,
            coupon_subtract DECIMAL(10,2) DEFAULT 0,
            net_sale DECIMAL(10,2) DEFAULT 0,
            tip_cr DECIMAL(10,2) DEFAULT 0,
            tip_cash DECIMAL(10,2) DEFAULT 0,
            before_earned DECIMAL(10,2) DEFAULT 0,
            credt_total DECIMAL(10,2) DEFAULT 0,
            deposited DECIMAL(10,2) DEFAULT 0,
            cash DECIMAL(10,2) DEFAULT 0,
            sc_merch DECIMAL(10,2) DEFAULT 0,
            sc_owner DECIMAL(10,2) DEFAULT 0,
            daily_earned DECIMAL(10,2) DEFAULT 0,
            weekly_earned DECIMAL(10,2) DEFAULT 0,
            average_daily DECIMAL(10,2) DEFAULT 0,
            quarterly_total_daily_earned DECIMAL(10,2) DEFAULT 0,
            no_of_days_closed INTEGER DEFAULT 0,
            no_of_days_month INTEGER DEFAULT 0,
            month_1 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_21 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_22 DECIMAL(10,2) DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- 2. DAILY SUMMARY TABLE
        CREATE TABLE IF NOT EXISTS historical_daily_summary (
            id TEXT PRIMARY KEY,
            date DATE NOT NULL,
            day TEXT,
            togo DECIMAL(10,2) DEFAULT 0,
            dine_in DECIMAL(10,2) DEFAULT 0,
            tax DECIMAL(10,2) DEFAULT 0,
            gross_sale DECIMAL(10,2) DEFAULT 0,
            gratuity DECIMAL(10,2) DEFAULT 0,
            coupon_subtract DECIMAL(10,2) DEFAULT 0,
            net_sale DECIMAL(10,2) DEFAULT 0,
            tip_cr DECIMAL(10,2) DEFAULT 0,
            tip_cash DECIMAL(10,2) DEFAULT 0,
            before_earned DECIMAL(10,2) DEFAULT 0,
            credt_total DECIMAL(10,2) DEFAULT 0,
            deposited DECIMAL(10,2) DEFAULT 0,
            cash DECIMAL(10,2) DEFAULT 0,
            sc_merch DECIMAL(10,2) DEFAULT 0,
            sc_owner DECIMAL(10,2) DEFAULT 0,
            daily_earned DECIMAL(10,2) DEFAULT 0,
            weekly_earned DECIMAL(10,2) DEFAULT 0,
            lunch DECIMAL(10,2) DEFAULT 0,
            day_1 TEXT,
            date_1 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_22 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_23 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_24 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_25 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_26 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_27 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_28 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_29 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_30 DECIMAL(10,2) DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- 3. TRANSACTIONS TABLE
        CREATE TABLE IF NOT EXISTS historical_transactions (
            id TEXT PRIMARY KEY,
            date DATE NOT NULL,
            sheet_name TEXT NOT NULL,
            row_index INTEGER,
            transaction TEXT,
            to_go DECIMAL(10,2) DEFAULT 0,
            dine_in DECIMAL(10,2) DEFAULT 0,
            coupon DECIMAL(10,2) DEFAULT 0,
            gross DECIMAL(10,2) DEFAULT 0,
            total DECIMAL(10,2) DEFAULT 0,
            service DECIMAL(10,2) DEFAULT 0,
            receipt DECIMAL(10,2) DEFAULT 0,
            unnamed_column_4 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_5 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_8 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_12 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_13 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_14 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_15 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_16 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_17 DECIMAL(10,2) DEFAULT 0,
            unnamed_column_18 DECIMAL(10,2) DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_monthly_summary_date ON historical_monthly_summary(date);
        CREATE INDEX IF NOT EXISTS idx_monthly_summary_year_month ON historical_monthly_summary(year, month);
        CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON historical_daily_summary(date);
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON historical_transactions(date);
        CREATE INDEX IF NOT EXISTS idx_transactions_sheet ON historical_transactions(sheet_name);

        -- Enable RLS
        ALTER TABLE historical_monthly_summary ENABLE ROW LEVEL SECURITY;
        ALTER TABLE historical_daily_summary ENABLE ROW LEVEL SECURITY;
        ALTER TABLE historical_transactions ENABLE ROW LEVEL SECURITY;

        -- RLS Policies
        CREATE POLICY IF NOT EXISTS "Allow authenticated users to view monthly summary" ON historical_monthly_summary
        FOR SELECT USING (auth.role() = 'authenticated');

        CREATE POLICY IF NOT EXISTS "Allow authenticated users to view daily summary" ON historical_daily_summary
        FOR SELECT USING (auth.role() = 'authenticated');

        CREATE POLICY IF NOT EXISTS "Allow authenticated users to view transactions" ON historical_transactions
        FOR SELECT USING (auth.role() = 'authenticated');
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: tableCreationSQL });
    if (error) {
        console.error('❌ Error creating tables:', error.message);
        throw error;
    }
    console.log('✅ Tables created successfully');
}

async function importCSV(filename, tableName, batchSize = 50) {
    const filePath = path.join(__dirname, '..', 'data', filename);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return;
    }

    console.log(`📊 Importing ${filename} to ${tableName}...`);

    return new Promise((resolve, reject) => {
        const results = [];

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => {
                // Clean empty string values and convert to null for numeric fields
                const cleanedData = {};
                for (const [key, value] of Object.entries(data)) {
                    if (value === '' || value === null || value === undefined) {
                        cleanedData[key] = null;
                    } else if (!isNaN(value) && key !== 'id' && key !== 'transaction' && key !== 'sheet_name' && key !== 'day' && key !== 'month_name' && key !== 'original_month_string' && key !== 'day_1') {
                        // Convert numeric strings to numbers
                        cleanedData[key] = parseFloat(value) || 0;
                    } else {
                        cleanedData[key] = value;
                    }
                }
                results.push(cleanedData);
            })
            .on('end', async () => {
                console.log(`   Found ${results.length} records`);

                try {
                    // Import in batches
                    for (let i = 0; i < results.length; i += batchSize) {
                        const batch = results.slice(i, i + batchSize);
                        const { error } = await supabase
                            .from(tableName)
                            .insert(batch);

                        if (error) {
                            console.error(`   ❌ Error importing batch ${i}-${i+batchSize}:`, error.message);
                            if (error.details) console.error('   Details:', error.details);
                            throw error;
                        } else {
                            console.log(`   ✅ Imported batch ${i+1}-${Math.min(i+batchSize, results.length)}`);
                        }
                    }
                    console.log(`✅ Successfully imported ${results.length} records to ${tableName}`);
                    resolve(results.length);
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => {
                console.error(`❌ Error reading ${filename}:`, error);
                reject(error);
            });
    });
}

async function verifyImport() {
    console.log('\n🔍 Verifying import...');

    const tables = [
        'historical_monthly_summary',
        'historical_daily_summary',
        'historical_transactions'
    ];

    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error(`❌ Error checking ${table}:`, error.message);
        } else {
            console.log(`✅ ${table}: ${data?.length || 'unknown'} records imported`);
        }
    }

    // Test a sample query
    console.log('\n📈 Running sample query...');
    const { data: sampleData, error: sampleError } = await supabase
        .from('historical_monthly_summary')
        .select('date, month_name, gross_sale, net_sale')
        .order('date')
        .limit(3);

    if (sampleError) {
        console.error('❌ Error running sample query:', sampleError.message);
    } else {
        console.log('✅ Sample monthly data:');
        console.table(sampleData);
    }
}

async function main() {
    try {
        console.log('🚀 Starting Supabase historical data import...');
        console.log(`📍 Supabase URL: ${supabaseUrl}`);

        // Step 1: Test Supabase connection first
        console.log('\n🔗 Testing Supabase connection...');
        const { data: testData, error: testError } = await supabase
            .from('profiles')
            .select('count', { count: 'exact', head: true });

        if (testError) {
            console.error('❌ Supabase connection failed:', testError.message);
            process.exit(1);
        }
        console.log('✅ Supabase connection successful');

        // Step 2: Check if historical tables exist
        console.log('\n🔍 Checking if historical tables exist...');
        const { data: tableCheck, error: tableError } = await supabase
            .from('historical_monthly_summary')
            .select('count', { count: 'exact', head: true });

        if (tableError && tableError.code === '42P01') {
            console.log('❌ Historical tables not found. Please create them first:');
            console.log('   1. Go to your Supabase dashboard SQL Editor');
            console.log('   2. Run the migration file: supabase/migrations/005_historical_sales_tables.sql');
            console.log('   3. Then run this script again');
            process.exit(1);
        } else if (tableError) {
            console.error('❌ Error checking tables:', tableError.message);
            process.exit(1);
        }
        console.log('✅ Historical tables found');

        // Step 2: Import data
        console.log('\n📊 Starting data import...');

        await importCSV('monthly_summary_complete.csv', 'historical_monthly_summary');
        await importCSV('daily_summary_complete.csv', 'historical_daily_summary');
        await importCSV('transactions_complete.csv', 'historical_transactions');

        // Step 3: Verify import
        await verifyImport();

        console.log('\n🎉 Import completed successfully!');
        console.log('\n📊 Next steps:');
        console.log('   • Check your Supabase dashboard to view the data');
        console.log('   • Use the built-in views for reporting');
        console.log('   • Run analytics queries on historical data');

    } catch (error) {
        console.error('❌ Import failed:', error.message);
        process.exit(1);
    }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
});

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}