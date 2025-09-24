-- 4. CREATE INDEXES AND RLS POLICIES
-- Run after creating all tables

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_summary_date ON historical_monthly_summary(date);
CREATE INDEX IF NOT EXISTS idx_monthly_summary_year_month ON historical_monthly_summary(year, month);
CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON historical_daily_summary(date);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON historical_transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_sheet ON historical_transactions(sheet_name);

-- Enable Row Level Security
ALTER TABLE historical_monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all authenticated users to read historical data
CREATE POLICY "Allow authenticated users to view monthly summary" ON historical_monthly_summary
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view daily summary" ON historical_daily_summary
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view transactions" ON historical_transactions
FOR SELECT USING (auth.role() = 'authenticated');