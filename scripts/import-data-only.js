import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csvParser from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importCSV(filename, tableName, batchSize = 50) {
    const filePath = path.join(__dirname, '..', 'data', filename);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return false;
    }

    console.log(`📊 Importing ${filename} to ${tableName}...`);

    return new Promise((resolve) => {
        const results = [];

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => {
                // Clean empty string values and convert to null for numeric fields
                const cleanedData = {};
                for (const [key, value] of Object.entries(data)) {
                    if (value === '' || value === null || value === undefined) {
                        cleanedData[key] = null;
                    } else if (!isNaN(value) && value !== '' &&
                              !['id', 'transaction', 'sheet_name', 'day', 'month_name', 'original_month_string', 'day_1'].includes(key)) {
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
                            resolve(false);
                            return;
                        } else {
                            console.log(`   ✅ Imported batch ${i+1}-${Math.min(i+batchSize, results.length)}`);
                        }
                    }
                    console.log(`✅ Successfully imported ${results.length} records to ${tableName}`);
                    resolve(true);
                } catch (error) {
                    console.error(`   ❌ Unexpected error:`, error);
                    resolve(false);
                }
            })
            .on('error', (error) => {
                console.error(`❌ Error reading ${filename}:`, error);
                resolve(false);
            });
    });
}

async function main() {
    console.log('🚀 Starting data import...');
    console.log(`📍 Supabase URL: ${supabaseUrl}`);

    // Test connection
    try {
        const { data, error } = await supabase.from('hourly_sales').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('❌ Supabase connection failed:', error.message);
            return;
        }
        console.log('✅ Supabase connection successful');
    } catch (err) {
        console.error('❌ Connection error:', err);
        return;
    }

    // Import data files
    console.log('\n📊 Starting data import...');

    const imports = [
        { file: 'monthly_summary_complete.csv', table: 'historical_monthly_summary' },
        { file: 'daily_summary_complete.csv', table: 'historical_daily_summary' },
        { file: 'transactions_complete.csv', table: 'historical_transactions' }
    ];

    let successCount = 0;

    for (const { file, table } of imports) {
        const success = await importCSV(file, table);
        if (success) successCount++;
    }

    // Summary
    console.log(`\n🎉 Import completed! ${successCount}/${imports.length} files imported successfully`);

    if (successCount === imports.length) {
        // Verify import
        console.log('\n🔍 Verifying import...');
        for (const { table } of imports) {
            try {
                const { count, error } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });

                if (!error) {
                    console.log(`✅ ${table}: ${count} records`);
                }
            } catch (err) {
                console.log(`⚠️  ${table}: Could not verify count`);
            }
        }

        console.log('\n✅ All data successfully imported!');
        console.log('\n📊 You can now use these tables for reporting:');
        console.log('   • historical_monthly_summary - Monthly sales data');
        console.log('   • historical_daily_summary - Daily breakdown');
        console.log('   • historical_transactions - Individual transactions');
    }
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Import failed:', err);
        process.exit(1);
    });