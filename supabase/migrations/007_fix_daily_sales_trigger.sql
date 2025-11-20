-- Fix the update_daily_sales function to handle both schema versions
-- and fix the ambiguous column reference

CREATE OR REPLACE FUNCTION update_daily_sales()
RETURNS TRIGGER AS $$
DECLARE
    order_date_val DATE;
    total_val DECIMAL(10,2);
    tax_val DECIMAL(10,2);
    gratuity_val DECIMAL(10,2);
    discount_val DECIMAL(10,2);
BEGIN
    -- Determine which schema columns to use
    -- Try to get order_date (original schema) or use created_at date (MVP schema)
    BEGIN
        order_date_val := NEW.order_date;
    EXCEPTION
        WHEN undefined_column THEN
            order_date_val := DATE(NEW.created_at);
    END;

    -- Try to get totals from either schema
    BEGIN
        total_val := NEW.total_amount;
    EXCEPTION
        WHEN undefined_column THEN
            total_val := NEW.total;
    END;

    BEGIN
        tax_val := NEW.tax_amount;
    EXCEPTION
        WHEN undefined_column THEN
            tax_val := NEW.tax;
    END;

    BEGIN
        gratuity_val := NEW.gratuity_amount;
    EXCEPTION
        WHEN undefined_column THEN
            gratuity_val := NEW.gratuity;
    END;

    BEGIN
        discount_val := NEW.discount_amount;
    EXCEPTION
        WHEN undefined_column THEN
            discount_val := 0;
    END;

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
        total_discounts
    )
    VALUES (
        order_date_val,
        TO_CHAR(order_date_val, 'Day'),
        1,
        CASE WHEN NEW.order_type = 'dine_in' THEN 1 ELSE 0 END,
        CASE WHEN NEW.order_type = 'take_out' THEN 1 ELSE 0 END,
        total_val,
        CASE WHEN NEW.order_type = 'dine_in' THEN total_val ELSE 0 END,
        CASE WHEN NEW.order_type = 'take_out' THEN total_val ELSE 0 END,
        tax_val,
        gratuity_val,
        discount_val
    )
    ON CONFLICT (sales_date)
    DO UPDATE SET
        -- Use EXCLUDED to avoid ambiguity
        total_orders = EXCLUDED.total_orders + daily_sales.total_orders,
        dine_in_orders = EXCLUDED.dine_in_orders + daily_sales.dine_in_orders,
        take_out_orders = EXCLUDED.take_out_orders + daily_sales.take_out_orders,
        gross_sales = EXCLUDED.gross_sales + daily_sales.gross_sales,
        dine_in_sales = EXCLUDED.dine_in_sales + daily_sales.dine_in_sales,
        take_out_sales = EXCLUDED.take_out_sales + daily_sales.take_out_sales,
        total_tax = EXCLUDED.total_tax + daily_sales.total_tax,
        total_gratuity = EXCLUDED.total_gratuity + daily_sales.total_gratuity,
        total_discounts = EXCLUDED.total_discounts + daily_sales.total_discounts,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_daily_sales() IS 'Updates daily sales summary when orders are completed - handles both original and MVP schemas';





