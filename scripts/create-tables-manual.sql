-- Manual Table Creation Script for Supabase Dashboard SQL Editor
-- Copy and paste each section one by one into the SQL Editor

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