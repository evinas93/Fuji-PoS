-- Fix column names to match CSV files (add spaces)

-- Fix monthly summary table
ALTER TABLE historical_monthly_summary
RENAME COLUMN unnamed_column_21 TO "unnamed_column_ 21";

ALTER TABLE historical_monthly_summary
RENAME COLUMN unnamed_column_22 TO "unnamed_column_ 22";

-- Fix daily summary table
ALTER TABLE historical_daily_summary
RENAME COLUMN unnamed_column_22 TO "unnamed_column_ 22";

ALTER TABLE historical_daily_summary
RENAME COLUMN unnamed_column_23 TO "unnamed_column_ 23";

ALTER TABLE historical_daily_summary
RENAME COLUMN unnamed_column_24 TO "unnamed_column_ 24";

ALTER TABLE historical_daily_summary
RENAME COLUMN unnamed_column_25 TO "unnamed_column_ 25";

ALTER TABLE historical_daily_summary
RENAME COLUMN unnamed_column_26 TO "unnamed_column_ 26";

ALTER TABLE historical_daily_summary
RENAME COLUMN unnamed_column_27 TO "unnamed_column_ 27";

ALTER TABLE historical_daily_summary
RENAME COLUMN unnamed_column_28 TO "unnamed_column_ 28";

ALTER TABLE historical_daily_summary
RENAME COLUMN unnamed_column_29 TO "unnamed_column_ 29";

ALTER TABLE historical_daily_summary
RENAME COLUMN unnamed_column_30 TO "unnamed_column_ 30";

-- Fix transactions table
ALTER TABLE historical_transactions
RENAME COLUMN unnamed_column_4 TO "unnamed_column_ 4";

ALTER TABLE historical_transactions
RENAME COLUMN unnamed_column_5 TO "unnamed_column_ 5";

ALTER TABLE historical_transactions
RENAME COLUMN unnamed_column_8 TO "unnamed_column_ 8";

ALTER TABLE historical_transactions
RENAME COLUMN unnamed_column_12 TO "unnamed_column_ 12";

ALTER TABLE historical_transactions
RENAME COLUMN unnamed_column_13 TO "unnamed_column_ 13";

ALTER TABLE historical_transactions
RENAME COLUMN unnamed_column_14 TO "unnamed_column_ 14";

ALTER TABLE historical_transactions
RENAME COLUMN unnamed_column_15 TO "unnamed_column_ 15";

ALTER TABLE historical_transactions
RENAME COLUMN unnamed_column_16 TO "unnamed_column_ 16";

ALTER TABLE historical_transactions
RENAME COLUMN unnamed_column_17 TO "unnamed_column_ 17";

ALTER TABLE historical_transactions
RENAME COLUMN unnamed_column_18 TO "unnamed_column_ 18";