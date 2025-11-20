-- Migration: Add Excel Export Columns
-- Purpose: Add all remaining columns from Grand_Totals_Sales_Summary.xlsx and Month_Year_SALES.xlsx
-- to support complete Excel export functionality

-- Add columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tip_cash DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tip_cr DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_subtract DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sc_merch DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sc_owner DECIMAL(10,2) DEFAULT 0;

-- Add columns to daily_sales table
ALTER TABLE daily_sales
ADD COLUMN IF NOT EXISTS tip_cr DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tip_cash DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_subtract DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sc_merch DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sc_owner DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposited DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS credt_total DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS before_earned DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_earned DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_earned DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS lunch DECIMAL(12,2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN orders.tip_cash IS 'Cash tips received for this order';
COMMENT ON COLUMN orders.tip_cr IS 'Credit card tips received for this order';
COMMENT ON COLUMN orders.coupon_subtract IS 'Coupon discount amount applied to this order';
COMMENT ON COLUMN orders.sc_merch IS 'Service charge portion to merchant';
COMMENT ON COLUMN orders.sc_owner IS 'Service charge portion to owner';

COMMENT ON COLUMN daily_sales.tip_cr IS 'Total credit card tips for the day';
COMMENT ON COLUMN daily_sales.tip_cash IS 'Total cash tips for the day';
COMMENT ON COLUMN daily_sales.coupon_subtract IS 'Total coupon discounts for the day';
COMMENT ON COLUMN daily_sales.sc_merch IS 'Total service charge to merchant for the day';
COMMENT ON COLUMN daily_sales.sc_owner IS 'Total service charge to owner for the day';
COMMENT ON COLUMN daily_sales.deposited IS 'Total cash deposited for the day';
COMMENT ON COLUMN daily_sales.cash IS 'Total cash sales/revenue for the day';
COMMENT ON COLUMN daily_sales.credt_total IS 'Total credit card sales for the day';
COMMENT ON COLUMN daily_sales.before_earned IS 'Amount before earnings calculation';
COMMENT ON COLUMN daily_sales.daily_earned IS 'Daily earnings amount';
COMMENT ON COLUMN daily_sales.weekly_earned IS 'Weekly earnings amount';
COMMENT ON COLUMN daily_sales.lunch IS 'Lunch sales for the day';

-- Update the update_daily_sales function to aggregate new columns
CREATE OR REPLACE FUNCTION update_daily_sales()
RETURNS TRIGGER AS $$
DECLARE
    v_tip_cash DECIMAL(10,2) := 0;
    v_tip_cr DECIMAL(10,2) := 0;
    v_coupon_subtract DECIMAL(10,2) := 0;
    v_sc_merch DECIMAL(10,2) := 0;
    v_sc_owner DECIMAL(10,2) := 0;
    v_payment_method TEXT;
    v_cash_deposited DECIMAL(10,2) := 0;
    v_credit_total DECIMAL(10,2) := 0;
BEGIN
    -- Get tip amounts from order (handle both old and new column names)
    BEGIN
        v_tip_cash := COALESCE(NEW.tip_cash, 0);
        v_tip_cr := COALESCE(NEW.tip_cr, 0);
    EXCEPTION
        WHEN undefined_column THEN
            v_tip_cash := 0;
            v_tip_cr := 0;
    END;

    -- Get coupon subtract from order
    BEGIN
        v_coupon_subtract := COALESCE(NEW.coupon_subtract, 0);
    EXCEPTION
        WHEN undefined_column THEN
            v_coupon_subtract := 0;
    END;

    -- Get service charge breakdown
    BEGIN
        v_sc_merch := COALESCE(NEW.sc_merch, 0);
        v_sc_owner := COALESCE(NEW.sc_owner, 0);
    EXCEPTION
        WHEN undefined_column THEN
            -- Default: split service charge 50/50 if not specified
            v_sc_merch := COALESCE(NEW.service_charge, 0) * 0.5;
            v_sc_owner := COALESCE(NEW.service_charge, 0) * 0.5;
    END;

    -- Get payment method to determine cash/credit breakdown
    BEGIN
        v_payment_method := NEW.payment_method;
    EXCEPTION
        WHEN undefined_column THEN
            v_payment_method := NULL;
    END;

    -- Calculate cash/credit totals based on payment method
    IF v_payment_method = 'cash' THEN
        v_cash_deposited := COALESCE(NEW.total_amount, 0);
        v_credit_total := 0;
    ELSIF v_payment_method IN ('credit', 'debit') THEN
        v_credit_total := COALESCE(NEW.total_amount, 0);
        v_cash_deposited := 0;
    END IF;

    -- Insert or update daily sales record
    INSERT INTO daily_sales (
        sales_date,
        day_of_week,
        total_orders,
        dine_in_orders,
        take_out_orders,
        gross_sales,
        dine_in_sales,
        take_out_sales,
        total_tax,
        total_gratuity,
        total_discounts,
        tip_cash,
        tip_cr,
        coupon_subtract,
        sc_merch,
        sc_owner,
        cash_deposited,
        credit_deposited,
        cash_sales,
        credit_sales,
        credt_total,
        deposited,
        cash
    )
    VALUES (
        NEW.order_date,
        TO_CHAR(NEW.order_date, 'Day'),
        1,
        CASE WHEN NEW.order_type = 'dine_in' THEN 1 ELSE 0 END,
        CASE WHEN NEW.order_type = 'take_out' THEN 1 ELSE 0 END,
        COALESCE(NEW.total_amount, 0),
        CASE WHEN NEW.order_type = 'dine_in' THEN COALESCE(NEW.total_amount, 0) ELSE 0 END,
        CASE WHEN NEW.order_type = 'take_out' THEN COALESCE(NEW.total_amount, 0) ELSE 0 END,
        COALESCE(NEW.tax_amount, NEW.tax, 0),
        COALESCE(NEW.gratuity_amount, NEW.gratuity, 0),
        COALESCE(NEW.discount_amount, 0),
        v_tip_cash,
        v_tip_cr,
        v_coupon_subtract,
        v_sc_merch,
        v_sc_owner,
        v_cash_deposited,
        CASE WHEN v_payment_method IN ('credit', 'debit') THEN COALESCE(NEW.total_amount, 0) ELSE 0 END,
        CASE WHEN v_payment_method = 'cash' THEN COALESCE(NEW.total_amount, 0) ELSE 0 END,
        CASE WHEN v_payment_method IN ('credit', 'debit') THEN COALESCE(NEW.total_amount, 0) ELSE 0 END,
        v_credit_total,
        v_cash_deposited,
        CASE WHEN v_payment_method = 'cash' THEN COALESCE(NEW.total_amount, 0) ELSE 0 END
    )
    ON CONFLICT (sales_date)
    DO UPDATE SET
        total_orders = daily_sales.total_orders + 1,
        dine_in_orders = daily_sales.dine_in_orders + 
            CASE WHEN NEW.order_type = 'dine_in' THEN 1 ELSE 0 END,
        take_out_orders = daily_sales.take_out_orders + 
            CASE WHEN NEW.order_type = 'take_out' THEN 1 ELSE 0 END,
        gross_sales = daily_sales.gross_sales + COALESCE(NEW.total_amount, 0),
        dine_in_sales = daily_sales.dine_in_sales + 
            CASE WHEN NEW.order_type = 'dine_in' THEN COALESCE(NEW.total_amount, 0) ELSE 0 END,
        take_out_sales = daily_sales.take_out_sales + 
            CASE WHEN NEW.order_type = 'take_out' THEN COALESCE(NEW.total_amount, 0) ELSE 0 END,
        total_tax = daily_sales.total_tax + COALESCE(NEW.tax_amount, NEW.tax, 0),
        total_gratuity = daily_sales.total_gratuity + COALESCE(NEW.gratuity_amount, NEW.gratuity, 0),
        total_discounts = daily_sales.total_discounts + COALESCE(NEW.discount_amount, 0),
        tip_cash = daily_sales.tip_cash + v_tip_cash,
        tip_cr = daily_sales.tip_cr + v_tip_cr,
        coupon_subtract = daily_sales.coupon_subtract + v_coupon_subtract,
        sc_merch = daily_sales.sc_merch + v_sc_merch,
        sc_owner = daily_sales.sc_owner + v_sc_owner,
        cash_deposited = daily_sales.cash_deposited + v_cash_deposited,
        credit_deposited = daily_sales.credit_deposited + 
            CASE WHEN v_payment_method IN ('credit', 'debit') THEN COALESCE(NEW.total_amount, 0) ELSE 0 END,
        cash_sales = daily_sales.cash_sales + 
            CASE WHEN v_payment_method = 'cash' THEN COALESCE(NEW.total_amount, 0) ELSE 0 END,
        credit_sales = daily_sales.credit_sales + 
            CASE WHEN v_payment_method IN ('credit', 'debit') THEN COALESCE(NEW.total_amount, 0) ELSE 0 END,
        credt_total = daily_sales.credt_total + v_credit_total,
        deposited = daily_sales.deposited + v_cash_deposited,
        cash = daily_sales.cash + 
            CASE WHEN v_payment_method = 'cash' THEN COALESCE(NEW.total_amount, 0) ELSE 0 END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_daily_sales() IS 'Updates daily sales summary when orders are completed - includes all Excel export columns';

