-- Test Queries for Historical Sales Data
-- Copy and paste these into Supabase SQL Editor to verify your data

-- 1. OVERVIEW - Check record counts and date ranges
SELECT
    'Monthly Summary' as table_name,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    ROUND(SUM(gross_sale), 2) as total_gross_sales
FROM historical_monthly_summary

UNION ALL

SELECT
    'Daily Summary' as table_name,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    ROUND(SUM(gross_sale), 2) as total_gross_sales
FROM historical_daily_summary

UNION ALL

SELECT
    'Transactions' as table_name,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    ROUND(SUM(total), 2) as total_gross_sales
FROM historical_transactions;

-- 2. MONTHLY SALES TREND (Top 10 months by sales)
SELECT
    year,
    month_name,
    date,
    ROUND(gross_sale, 2) as gross_sale,
    ROUND(togo, 2) as takeout_sales,
    ROUND(dine_in, 2) as dine_in_sales,
    ROUND(tax, 2) as tax_collected,
    no_of_days_month,
    ROUND(daily_earned / NULLIF(no_of_days_month, 0), 2) as avg_daily_earned
FROM historical_monthly_summary
ORDER BY gross_sale DESC
LIMIT 10;

-- 3. DAILY BREAKDOWN (February 2022)
SELECT
    date,
    day,
    ROUND(gross_sale, 2) as gross_sale,
    ROUND(togo, 2) as takeout,
    ROUND(dine_in, 2) as dine_in,
    ROUND(lunch, 2) as lunch_sales,
    ROUND(daily_earned, 2) as daily_earned
FROM historical_daily_summary
ORDER BY date;

-- 4. TRANSACTION ANALYSIS - Top transaction days
SELECT
    date,
    sheet_name,
    COUNT(*) as transaction_count,
    ROUND(SUM(total), 2) as daily_total,
    ROUND(AVG(total), 2) as avg_transaction,
    ROUND(SUM(service), 2) as total_service_charges,
    COUNT(CASE WHEN to_go > 0 THEN 1 END) as takeout_orders,
    COUNT(CASE WHEN dine_in > 0 THEN 1 END) as dine_in_orders
FROM historical_transactions
WHERE total > 0
GROUP BY date, sheet_name
ORDER BY daily_total DESC
LIMIT 10;

-- 5. REVENUE BREAKDOWN BY TYPE
SELECT
    'Total Historical Revenue (Monthly)' as metric,
    ROUND(SUM(togo), 2) as takeout_revenue,
    ROUND(SUM(dine_in), 2) as dine_in_revenue,
    ROUND(SUM(gross_sale), 2) as total_gross_sales,
    ROUND(SUM(tax), 2) as total_tax_collected,
    ROUND(SUM(gratuity), 2) as total_gratuity
FROM historical_monthly_summary;

-- 6. SERVICE CHARGES AND FEES ANALYSIS
SELECT
    year,
    month_name,
    ROUND(credt_total, 2) as credit_card_sales,
    ROUND(cash, 2) as cash_sales,
    ROUND(sc_merch, 2) as merchant_fees,
    ROUND(sc_owner, 2) as owner_service_charges,
    CASE
        WHEN credt_total > 0
        THEN ROUND((sc_merch / credt_total) * 100, 2)
        ELSE 0
    END as merchant_fee_percentage
FROM historical_monthly_summary
WHERE year >= 2022
ORDER BY date DESC
LIMIT 12;