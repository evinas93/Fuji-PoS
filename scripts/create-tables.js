import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createHistoricalTables() {
    console.log('Creating historical data tables...');

    // Read and execute the migration file
    const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '005_historical_sales_tables.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Split SQL into individual statements (basic approach)
    const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;

        console.log(`Executing statement ${i + 1}/${statements.length}...`);

        try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            if (error) {
                console.error(`Error in statement ${i + 1}:`, error);
                // Continue with other statements
            } else {
                console.log(`✅ Statement ${i + 1} executed successfully`);
            }
        } catch (err) {
            console.error(`Error executing statement ${i + 1}:`, err);
        }
    }
}

createHistoricalTables()
    .then(() => {
        console.log('✅ Historical tables creation completed');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Failed to create tables:', err);
        process.exit(1);
    });