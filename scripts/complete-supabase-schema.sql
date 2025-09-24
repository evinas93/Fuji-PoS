-- Complete Supabase Schema for ALL Excel Data Import
-- Captures every column from the original Excel files for comprehensive reporting

-- Drop existing tables if they exist (be careful in production!)
-- DROP TABLE IF EXISTS historical_monthly_summary CASCADE;
-- DROP TABLE IF EXISTS historical_daily_summary CASCADE;
-- DROP TABLE IF EXISTS historical_transactions CASCADE;

-- 1. MONTHLY SUMMARY TABLE (Grand_Totals_Sales_Summary.xlsx)
-- Contains 36 months of complete monthly data with ALL original columns
CREATE TABLE IF NOT EXISTS historical_monthly_summary (
    -- Primary identification
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    month_name TEXT NOT NULL,
    original_month_string TEXT,

    -- Core sales data
    togo DECIMAL(10,2) DEFAULT 0,
    dine_in DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    gross_sale DECIMAL(10,2) DEFAULT 0,
    gratuity DECIMAL(10,2) DEFAULT 0,
    coupon_subtract DECIMAL(10,2) DEFAULT 0,
    net_sale DECIMAL(10,2) DEFAULT 0,

    -- Payment breakdown
    tip_cr DECIMAL(10,2) DEFAULT 0,
    tip_cash DECIMAL(10,2) DEFAULT 0,
    before_earned DECIMAL(10,2) DEFAULT 0,
    credt_total DECIMAL(10,2) DEFAULT 0,
    deposited DECIMAL(10,2) DEFAULT 0,
    cash DECIMAL(10,2) DEFAULT 0,

    -- Service charges and merchant fees
    sc_merch DECIMAL(10,2) DEFAULT 0,
    sc_owner DECIMAL(10,2) DEFAULT 0,

    -- Earnings and performance
    daily_earned DECIMAL(10,2) DEFAULT 0,
    weekly_earned DECIMAL(10,2) DEFAULT 0,
    average_daily DECIMAL(10,2) DEFAULT 0,
    quarterly_total_daily_earned DECIMAL(10,2) DEFAULT 0,

    -- Operational metrics
    no_of_days_closed INTEGER DEFAULT 0,
    no_of_days_month INTEGER DEFAULT 0,
    month_1 DECIMAL(10,2) DEFAULT 0, -- Duplicate month field from Excel

    -- Unknown/additional columns preserved
    unnamed_column_21 DECIMAL(10,2) DEFAULT 0,
    unnamed_column_22 DECIMAL(10,2) DEFAULT 0,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for monthly summary
CREATE INDEX IF NOT EXISTS idx_monthly_summary_date ON historical_monthly_summary(date);
CREATE INDEX IF NOT EXISTS idx_monthly_summary_year_month ON historical_monthly_summary(year, month);

-- 2. DAILY SUMMARY TABLE (Month_Year_SALES.xlsx - FEB 2022 sheet)
-- Contains complete daily breakdown with ALL original columns
CREATE TABLE IF NOT EXISTS historical_daily_summary (
    -- Primary identification
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    day TEXT, -- Day of week (TUE, WED, etc.)

    -- Core sales data (same structure as monthly)
    togo DECIMAL(10,2) DEFAULT 0,
    dine_in DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    gross_sale DECIMAL(10,2) DEFAULT 0,
    gratuity DECIMAL(10,2) DEFAULT 0,
    coupon_subtract DECIMAL(10,2) DEFAULT 0,
    net_sale DECIMAL(10,2) DEFAULT 0,

    -- Payment breakdown
    tip_cr DECIMAL(10,2) DEFAULT 0,
    tip_cash DECIMAL(10,2) DEFAULT 0,
    before_earned DECIMAL(10,2) DEFAULT 0,
    credt_total DECIMAL(10,2) DEFAULT 0,
    deposited DECIMAL(10,2) DEFAULT 0,
    cash DECIMAL(10,2) DEFAULT 0,

    -- Service charges
    sc_merch DECIMAL(10,2) DEFAULT 0,
    sc_owner DECIMAL(10,2) DEFAULT 0,

    -- Earnings
    daily_earned DECIMAL(10,2) DEFAULT 0,
    weekly_earned DECIMAL(10,2) DEFAULT 0,

    -- Lunch-specific tracking
    lunch DECIMAL(10,2) DEFAULT 0,

    -- Duplicate fields from Excel structure
    day_1 TEXT,
    date_1 DECIMAL(10,2) DEFAULT 0,

    -- All unnamed columns preserved for analysis
    unnamed_column_22 DECIMAL(10,2) DEFAULT 0,
    unnamed_column_23 DECIMAL(10,2) DEFAULT 0,
    unnamed_column_24 DECIMAL(10,2) DEFAULT 0,
    unnamed_column_25 DECIMAL(10,2) DEFAULT 0,
    unnamed_column_26 DECIMAL(10,2) DEFAULT 0,
    unnamed_column_27 DECIMAL(10,2) DEFAULT 0,
    unnamed_column_28 DECIMAL(10,2) DEFAULT 0,
    unnamed_column_29 DECIMAL(10,2) DEFAULT 0,
    unnamed_column_30 DECIMAL(10,2) DEFAULT 0,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for daily summary
CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON historical_daily_summary(date);
CREATE INDEX IF NOT EXISTS idx_daily_summary_day ON historical_daily_summary(day);

-- 3. INDIVIDUAL TRANSACTIONS TABLE (Month_Year_SALES.xlsx - daily sheets)
-- Contains every individual transaction with ALL original columns
CREATE TABLE IF NOT EXISTS historical_transactions (
    -- Primary identification
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    sheet_name TEXT NOT NULL, -- Original sheet name (2-1, 2-2, etc.)
    row_index INTEGER, -- Row position in original sheet
    transaction TEXT, -- Transaction number/identifier

    -- Transaction amounts
    to_go DECIMAL(10,2) DEFAULT 0,
    dine_in DECIMAL(10,2) DEFAULT 0,
    coupon DECIMAL(10,2) DEFAULT 0,
    gross DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    service DECIMAL(10,2) DEFAULT 0, -- Service charge
    receipt DECIMAL(10,2) DEFAULT 0, -- Final receipt total

    -- Unknown columns preserved (might contain item details, tips, etc.)
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

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_date ON historical_transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_sheet ON historical_transactions(sheet_name);
CREATE INDEX IF NOT EXISTS idx_transactions_total ON historical_transactions(total);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE historical_monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to read historical data
CREATE POLICY "Allow authenticated users to view monthly summary" ON historical_monthly_summary
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view daily summary" ON historical_daily_summary
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view transactions" ON historical_transactions
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow managers to insert/update historical data
CREATE POLICY "Allow managers to manage monthly summary" ON historical_monthly_summary
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'manager'
  )
);

CREATE POLICY "Allow managers to manage daily summary" ON historical_daily_summary
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'manager'
  )
);

CREATE POLICY "Allow managers to manage transactions" ON historical_transactions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'manager'
  )
);

-- Create views for easier reporting
-- Monthly sales trends
CREATE OR REPLACE VIEW monthly_sales_trend AS
SELECT
    date,
    year,
    month,
    month_name,
    togo,
    dine_in,
    gross_sale,
    net_sale,
    tax,
    gratuity,
    daily_earned,
    no_of_days_month,
    CASE
        WHEN no_of_days_month > 0
        THEN daily_earned / no_of_days_month
        ELSE 0
    END as avg_daily_earned_calculated
FROM historical_monthly_summary
ORDER BY date;

-- Daily transaction summary
CREATE OR REPLACE VIEW daily_transaction_summary AS
SELECT
    date,
    sheet_name,
    COUNT(*) as transaction_count,
    SUM(to_go) as total_togo,
    SUM(dine_in) as total_dinein,
    SUM(total) as total_sales,
    SUM(service) as total_service_charges,
    SUM(receipt) as total_receipts,
    AVG(receipt) as avg_transaction_size
FROM historical_transactions
WHERE total > 0
GROUP BY date, sheet_name
ORDER BY date;

-- Complete sales overview
CREATE OR REPLACE VIEW complete_sales_overview AS
SELECT
    'Monthly Summary' as data_source,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    SUM(gross_sale) as total_gross_sales,
    AVG(gross_sale) as avg_monthly_sales
FROM historical_monthly_summary

UNION ALL

SELECT
    'Daily Summary' as data_source,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    SUM(gross_sale) as total_gross_sales,
    AVG(gross_sale) as avg_daily_sales
FROM historical_daily_summary

UNION ALL

SELECT
    'Individual Transactions' as data_source,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    SUM(total) as total_gross_sales,
    AVG(total) as avg_transaction_size
FROM historical_transactions
WHERE total > 0;

-- Grant permissions to authenticated users
GRANT SELECT ON monthly_sales_trend TO authenticated;
GRANT SELECT ON daily_transaction_summary TO authenticated;
GRANT SELECT ON complete_sales_overview TO authenticated;