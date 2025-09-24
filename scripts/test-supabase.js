import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseServiceKey?.length);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
    try {
        console.log('Attempting to connect to hourly_sales table...');
        const { data, error } = await supabase
            .from('hourly_sales')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error:', error);
            return;
        }

        console.log('Success! Data:', data);
    } catch (err) {
        console.error('Catch error:', err);
    }
}

test().then(() => {
    console.log('Test completed');
    process.exit(0);
}).catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});