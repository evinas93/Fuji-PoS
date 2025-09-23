-- =====================================================
-- Fuji Restaurant POS System - Sales Data Tables
-- =====================================================

-- Sales Summary Table
CREATE TABLE IF NOT EXISTS sales_summary (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    month_year TEXT NOT NULL,
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_tax DECIMAL(12,2) DEFAULT 0,
    total_gratuity DECIMAL(12,2) DEFAULT 0,
    net_sales DECIMAL(12,2) DEFAULT 0,
    cash_sales DECIMAL(12,2) DEFAULT 0,
    credit_sales DECIMAL(12,2) DEFAULT 0,
    total_orders INT DEFAULT 0,
    average_ticket DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly Sales Table
CREATE TABLE IF NOT EXISTS monthly_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    month_year TEXT NOT NULL,
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_tax DECIMAL(12,2) DEFAULT 0,
    total_gratuity DECIMAL(12,2) DEFAULT 0,
    net_sales DECIMAL(12,2) DEFAULT 0,
    cash_sales DECIMAL(12,2) DEFAULT 0,
    credit_sales DECIMAL(12,2) DEFAULT 0,
    total_orders INT DEFAULT 0,
    average_ticket DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grand Totals Table
CREATE TABLE IF NOT EXISTS grand_totals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    period_type TEXT NOT NULL, -- 'daily', 'monthly', 'yearly', 'total'
    period_value TEXT NOT NULL, -- the actual period (date, month, year, etc.)
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_tax DECIMAL(12,2) DEFAULT 0,
    total_gratuity DECIMAL(12,2) DEFAULT 0,
    net_sales DECIMAL(12,2) DEFAULT 0,
    cash_sales DECIMAL(12,2) DEFAULT 0,
    credit_sales DECIMAL(12,2) DEFAULT 0,
    total_orders INT DEFAULT 0,
    average_ticket DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_summary_date ON sales_summary(date);
CREATE INDEX IF NOT EXISTS idx_sales_summary_month_year ON sales_summary(month_year);
CREATE INDEX IF NOT EXISTS idx_monthly_sales_month_year ON monthly_sales(month_year);
CREATE INDEX IF NOT EXISTS idx_grand_totals_period ON grand_totals(period_type, period_value);

-- Comments
COMMENT ON TABLE sales_summary IS 'Daily sales summary data imported from Excel';
COMMENT ON TABLE monthly_sales IS 'Monthly sales data imported from Excel';
COMMENT ON TABLE grand_totals IS 'Grand totals and aggregated sales data';
