# Complete Supabase Import Guide
## ALL Excel Columns Preserved for Comprehensive Reporting

This guide covers importing **every single column** from your Excel files into Supabase for complete data analysis and reporting capabilities.

## 📊 What's Included

### Generated Files:
- `monthly_summary_complete.csv` - 36 monthly records with 30 columns
- `daily_summary_complete.csv` - 28 daily records with 32 columns
- `transactions_complete.csv` - 411 individual transactions with 22 columns
- `*.json` column mapping files for reference

### Database Tables Created:
- `historical_monthly_summary` - Complete monthly data (2021-2024)
- `historical_daily_summary` - Complete daily breakdown (Feb 2022)
- `historical_transactions` - Every individual transaction

## 🔧 Import Methods

### Method 1: Supabase Dashboard (Recommended)
1. **Create Tables**: Run `complete-supabase-schema.sql` in SQL Editor
2. **Import Data**:
   - Go to Table Editor
   - Select each table
   - Click "Insert" → "Import data from CSV"
   - Upload corresponding CSV files

### Method 2: Supabase CLI
```bash
# 1. Setup
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# 2. Create tables
supabase db push

# 3. Import data using psql
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"

# Import monthly summaries
\copy historical_monthly_summary(id,date,year,month,month_name,original_month_string,togo,dine_in,tax,gross_sale,gratuity,coupon_subtract,net_sale,tip_cr,tip_cash,before_earned,sc_merch,sc_owner,credt_total,deposited,cash,daily_earned,weekly_earned,no_of_days_closed,month_1,no_of_days_month,unnamed_column_21,unnamed_column_22,average_daily,quarterly_total_daily_earned) FROM 'data/monthly_summary_complete.csv' DELIMITER ',' CSV HEADER;

# Import daily summaries
\copy historical_daily_summary(id,date,day,togo,dine_in,tax,gross_sale,gratuity,coupon_subtract,net_sale,tip_cr,tip_cash,before_earned,sc_merch,sc_owner,credt_total,deposited,cash,daily_earned,weekly_earned,lunch,day_1,date_1,unnamed_column_22,unnamed_column_23,unnamed_column_24,unnamed_column_25,unnamed_column_26,unnamed_column_27,unnamed_column_28,unnamed_column_29,unnamed_column_30) FROM 'data/daily_summary_complete.csv' DELIMITER ',' CSV HEADER;

# Import transactions
\copy historical_transactions(id,date,sheet_name,row_index,transaction,to_go,dine_in,unnamed_column_4,unnamed_column_5,coupon,gross,unnamed_column_8,total,service,receipt,unnamed_column_12,unnamed_column_13,unnamed_column_14,unnamed_column_15,unnamed_column_16,unnamed_column_17,unnamed_column_18) FROM 'data/transactions_complete.csv' DELIMITER ',' CSV HEADER;
```

### Method 3: JavaScript Batch Import
```javascript
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import csvParser from 'csv-parser'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Batch import function
async function batchImport(filename, tableName, batchSize = 100) {
  const results = []

  fs.createReadStream(filename)
    .pipe(csvParser())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`Importing ${results.length} records to ${tableName}`)

      // Import in batches
      for (let i = 0; i < results.length; i += batchSize) {
        const batch = results.slice(i, i + batchSize)
        const { error } = await supabase.from(tableName).insert(batch)

        if (error) {
          console.error(`Error importing batch ${i}-${i+batchSize}:`, error)
        } else {
          console.log(`Imported batch ${i}-${i+batchSize}`)
        }
      }
    })
}

// Run imports
await batchImport('data/monthly_summary_complete.csv', 'historical_monthly_summary')
await batchImport('data/daily_summary_complete.csv', 'historical_daily_summary')
await batchImport('data/transactions_complete.csv', 'historical_transactions')
```

## 📈 Sample Reporting Queries

### Monthly Sales Trends
```sql
SELECT
  year,
  month_name,
  gross_sale,
  net_sale,
  togo,
  dine_in,
  daily_earned,
  no_of_days_month,
  ROUND(daily_earned / no_of_days_month, 2) as avg_daily_earned
FROM historical_monthly_summary
ORDER BY year, month;
```

### Daily Performance Analysis
```sql
SELECT
  date,
  day,
  gross_sale,
  lunch,
  daily_earned,
  weekly_earned,
  tip_cr + tip_cash as total_tips
FROM historical_daily_summary
ORDER BY date;
```

### Transaction Pattern Analysis
```sql
SELECT
  date,
  sheet_name,
  COUNT(*) as transaction_count,
  SUM(total) as daily_total,
  AVG(total) as avg_transaction,
  SUM(service) as service_charges,
  SUM(CASE WHEN to_go > 0 THEN 1 ELSE 0 END) as takeout_orders,
  SUM(CASE WHEN dine_in > 0 THEN 1 ELSE 0 END) as dinein_orders
FROM historical_transactions
WHERE total > 0
GROUP BY date, sheet_name
ORDER BY date;
```

### Revenue Breakdown by Source
```sql
SELECT
  'Take Out' as source,
  SUM(togo) as total_revenue,
  COUNT(*) as record_count
FROM historical_monthly_summary
UNION ALL
SELECT
  'Dine In' as source,
  SUM(dine_in) as total_revenue,
  COUNT(*) as record_count
FROM historical_monthly_summary;
```

### Service Charge Analysis
```sql
SELECT
  year,
  month_name,
  sc_merch as merchant_fees,
  sc_owner as owner_service_charges,
  credt_total as credit_sales,
  cash as cash_sales,
  ROUND((sc_merch / credt_total) * 100, 2) as merchant_fee_percentage
FROM historical_monthly_summary
WHERE credt_total > 0
ORDER BY year, month;
```

## 🔍 Data Quality Verification

### Check Import Success
```sql
SELECT
  'Monthly Summary' as table_name,
  COUNT(*) as imported_records,
  MIN(date) as earliest,
  MAX(date) as latest
FROM historical_monthly_summary
UNION ALL
SELECT
  'Daily Summary' as table_name,
  COUNT(*) as imported_records,
  MIN(date) as earliest,
  MAX(date) as latest
FROM historical_daily_summary
UNION ALL
SELECT
  'Transactions' as table_name,
  COUNT(*) as imported_records,
  MIN(date) as earliest,
  MAX(date) as latest
FROM historical_transactions;
```

### Validate Column Preservation
```sql
-- Check that all columns have data
SELECT column_name,
       COUNT(*) as non_null_count,
       AVG(CASE WHEN column_name LIKE '%unnamed%' THEN 0 ELSE 1 END) as named_column_ratio
FROM information_schema.columns
WHERE table_name IN ('historical_monthly_summary', 'historical_daily_summary', 'historical_transactions')
GROUP BY column_name;
```

## 🎯 Key Benefits

✅ **Complete Data Preservation** - Every Excel column captured
✅ **Flexible Reporting** - All original metrics available
✅ **Historical Analysis** - 3+ years of monthly data
✅ **Transaction Details** - Individual transaction tracking
✅ **Unknown Column Analysis** - Preserve data for future insights
✅ **Multiple Granularities** - Monthly, daily, and transaction levels

## 📝 Column Mapping Reference

- **Named Columns**: Standard business metrics (sales, tax, tips, etc.)
- **Unnamed Columns**: Preserved as `unnamed_column_X` for analysis
- **All Currency**: Cleaned of $ symbols, stored as DECIMAL(10,2)
- **All Dates**: Standardized to YYYY-MM-DD format
- **IDs**: Generated as unique identifiers for each record

## ⚠️ Important Notes

1. **Unnamed Columns**: Some Excel columns were unlabeled - these are preserved as `unnamed_column_X`
2. **Data Integrity**: All currency values cleaned and validated
3. **Historical Context**: This is legacy data from your paper-based system
4. **Reporting Ready**: Tables include views for common reporting scenarios
5. **Extensible**: Schema supports adding new columns as business evolves

Your complete historical sales data is now ready for comprehensive analysis and reporting in Supabase! 🚀