-- Supabase Import Instructions for Fuji POS Sales Data
-- Generated CSV files: monthly_sales_summary.csv, historical_orders.csv, historical_order_items.csv

-- First, ensure your tables exist with proper structure
-- These should already exist from your schema setup, but here are the table definitions:

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (for server_id references)
INSERT INTO profiles (id, username, role, first_name, last_name, status) VALUES
('srv_001', 'historical_server', 'server', 'Historical', 'Data', 'active')
ON CONFLICT (id) DO NOTHING;

-- Sample menu items for historical order items
INSERT INTO menu_items (id, category_id, name, description, base_price, availability) VALUES
('menu_item_01', 'cat_001', 'California Roll', 'Classic avocado and cucumber roll', 8.50, true),
('menu_item_02', 'cat_001', 'Salmon Teriyaki', 'Grilled salmon with teriyaki sauce', 16.95, true),
('menu_item_03', 'cat_001', 'Chicken Tempura', 'Crispy chicken tempura', 12.50, true),
('menu_item_04', 'cat_001', 'Miso Soup', 'Traditional soybean soup', 3.50, true),
('menu_item_05', 'cat_001', 'Edamame', 'Steamed soybeans', 4.95, true),
('menu_item_06', 'cat_001', 'Beef Teriyaki', 'Grilled beef with teriyaki sauce', 18.95, true),
('menu_item_07', 'cat_001', 'Vegetable Tempura', 'Mixed vegetable tempura', 9.95, true),
('menu_item_08', 'cat_001', 'Spicy Tuna Roll', 'Spicy tuna with cucumber', 9.50, true),
('menu_item_09', 'cat_001', 'Green Tea', 'Hot green tea', 2.95, true),
('menu_item_10', 'cat_001', 'Sake (Hot)', 'Traditional hot sake', 7.50, true)
ON CONFLICT (id) DO NOTHING;

-- Category for menu items
INSERT INTO categories (id, name, display_order, active) VALUES
('cat_001', 'Mixed Items', 1, true)
ON CONFLICT (id) DO NOTHING;

-- MANUAL IMPORT STEPS:
-- =====================
-- You cannot directly execute COPY commands in Supabase dashboard.
-- Instead, use one of these methods:

-- METHOD 1: Supabase Dashboard (Recommended for small datasets)
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to Table Editor
-- 3. Select the target table
-- 4. Click "Insert" > "Import data from CSV"
-- 5. Upload your CSV files one by one

-- METHOD 2: Supabase CLI (Recommended for large datasets)
-- 1. Install Supabase CLI: npm install -g supabase
-- 2. Login: supabase login
-- 3. Link your project: supabase link --project-ref YOUR_PROJECT_REF
-- 4. Use psql to connect and import:

-- For monthly_sales_summary.csv:
-- \copy daily_sales(date,togo_sales,dine_in_sales,tax_collected,gross_sale,gratuity_total,net_sale,credit_total,cash_deposited) FROM 'data/monthly_sales_summary.csv' DELIMITER ',' CSV HEADER;

-- For historical_orders.csv:
-- \copy orders(id,order_date,type,table_number,server_id,status,subtotal,tax,gratuity,total,payment_method) FROM 'data/historical_orders.csv' DELIMITER ',' CSV HEADER;

-- For historical_order_items.csv:
-- \copy order_items(id,order_id,item_id,quantity,unit_price,modifiers,special_instructions) FROM 'data/historical_order_items.csv' DELIMITER ',' CSV HEADER;

-- METHOD 3: JavaScript Import Script (Run in Supabase Edge Function or Node.js)
/*
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import csvParser from 'csv-parser'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Import monthly sales
const importMonthlySales = () => {
  const results = []
  fs.createReadStream('data/monthly_sales_summary.csv')
    .pipe(csvParser())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      const { error } = await supabase
        .from('daily_sales')
        .insert(results)
      if (error) console.error('Error importing monthly sales:', error)
      else console.log('Monthly sales imported successfully')
    })
}

// Similar functions for orders and order_items...
*/

-- POST-IMPORT VERIFICATION QUERIES:
-- =================================

-- Check imported data counts
SELECT 'daily_sales' as table_name, COUNT(*) as record_count FROM daily_sales
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as record_count FROM orders
UNION ALL
SELECT 'order_items' as table_name, COUNT(*) as record_count FROM order_items;

-- Verify date ranges
SELECT
  MIN(date) as earliest_date,
  MAX(date) as latest_date,
  COUNT(*) as total_days
FROM daily_sales;

SELECT
  MIN(order_date) as earliest_order,
  MAX(order_date) as latest_order,
  COUNT(*) as total_orders
FROM orders;

-- Check data integrity
SELECT
  o.id,
  o.total as order_total,
  SUM(oi.quantity * oi.unit_price) as calculated_subtotal
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.total
HAVING ABS(o.subtotal - SUM(oi.quantity * oi.unit_price)) > 0.01
LIMIT 10;

-- Sales summary by month
SELECT
  DATE_TRUNC('month', order_date) as month,
  COUNT(*) as orders,
  SUM(total) as total_sales,
  AVG(total) as avg_order_value
FROM orders
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month;

-- NOTES:
-- ======
-- 1. All currency values are cleaned (no $ symbols)
-- 2. Historical orders use a default server ID (srv_001)
-- 3. Order items are synthetic but proportional to order totals
-- 4. Dates are in YYYY-MM-DD format
-- 5. All decimal values are rounded to 2 places
-- 6. Order types are inferred from TOGO vs DINE IN amounts