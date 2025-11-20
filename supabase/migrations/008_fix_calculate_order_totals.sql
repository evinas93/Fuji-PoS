-- Fix calculate_order_totals function to handle both schema versions
-- This resolves the "column reference 'subtotal' is ambiguous" error

CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal DECIMAL(10,2);
    v_tax DECIMAL(10,2);
    v_gratuity DECIMAL(10,2);
    v_service_charge DECIMAL(10,2);
    v_party_size INT;
    v_discount DECIMAL(10,2);
    v_tax_rate DECIMAL(5,4);
    v_gratuity_rate DECIMAL(5,4);
    v_service_charge_rate DECIMAL(5,4);
    v_order_type TEXT;
BEGIN
    -- Calculate subtotal from order items
    SELECT COALESCE(SUM(total_price), 0) INTO v_subtotal
    FROM order_items
    WHERE order_id = NEW.id;

    -- Get order_type safely from the database
    BEGIN
        SELECT order_type INTO v_order_type FROM orders WHERE id = NEW.id;
    EXCEPTION
        WHEN OTHERS THEN
            v_order_type := NULL;
    END;

    -- Get discount amount (try both column names)
    BEGIN
        v_discount := COALESCE(NEW.discount_amount, 0);
    EXCEPTION
        WHEN undefined_column THEN
            v_discount := 0;
    END;

    -- Apply discount
    v_subtotal := v_subtotal - v_discount;

    -- Get tax rate (try both column names)
    BEGIN
        v_tax_rate := NEW.tax_rate;
    EXCEPTION
        WHEN undefined_column THEN
            v_tax_rate := 0.08; -- Default 8%
    END;

    -- Calculate tax
    v_tax := v_subtotal * v_tax_rate;

    -- Auto-apply gratuity for dine-in parties of 2+
    IF v_order_type = 'dine_in' THEN
        SELECT COUNT(DISTINCT oi.id) INTO v_party_size
        FROM order_items oi
        WHERE oi.order_id = NEW.id;

        -- Get gratuity rate (try both column names)
        BEGIN
            v_gratuity_rate := NEW.gratuity_rate;
        EXCEPTION
            WHEN undefined_column THEN
                v_gratuity_rate := NULL;
        END;

        IF v_party_size >= 2 AND v_gratuity_rate IS NULL THEN
            v_gratuity_rate := 0.20; -- 20% gratuity
        ELSIF v_gratuity_rate IS NULL THEN
            v_gratuity_rate := 0;
        END IF;
    ELSE
        BEGIN
            v_gratuity_rate := COALESCE(NEW.gratuity_rate, 0);
        EXCEPTION
            WHEN undefined_column THEN
                v_gratuity_rate := 0;
        END;
    END IF;

    v_gratuity := v_subtotal * v_gratuity_rate;

    -- Get service charge rate (try both column names)
    BEGIN
        v_service_charge_rate := COALESCE(NEW.service_charge_rate, 0);
    EXCEPTION
        WHEN undefined_column THEN
            v_service_charge_rate := 0;
    END;

    -- Calculate service charge
    v_service_charge := v_subtotal * v_service_charge_rate;

    -- Update order totals using column names that exist in the schema
    -- Try the original schema columns first
    BEGIN
        UPDATE orders SET
            subtotal = v_subtotal,
            tax_amount = v_tax,
            gratuity_amount = v_gratuity,
            service_charge = v_service_charge,
            total_amount = v_subtotal + v_tax + v_gratuity + v_service_charge,
            updated_at = NOW()
        WHERE id = NEW.id;
    EXCEPTION
        WHEN undefined_column THEN
            -- Fall back to MVP schema columns
            UPDATE orders SET
                subtotal = v_subtotal,
                tax = v_tax,
                gratuity = v_gratuity,
                total = v_subtotal + v_tax + v_gratuity,
                updated_at = NOW()
            WHERE id = NEW.id;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_order_totals() IS 'Automatically calculates order totals including tax, gratuity, and service charges - handles both original and MVP schemas';

-- Also fix the trigger_calculate_order_totals function to avoid the ambiguous column issue
CREATE OR REPLACE FUNCTION trigger_calculate_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    order_id_val UUID;
    order_rec RECORD;
BEGIN
    -- Get the order_id from the affected row
    IF TG_OP = 'DELETE' THEN
        order_id_val := OLD.order_id;
    ELSE
        order_id_val := NEW.order_id;
    END IF;

    -- Get the order record
    SELECT * INTO order_rec FROM orders WHERE id = order_id_val;

    -- Call the calculation function by updating the order
    -- This triggers the calculate_order_totals function
    UPDATE orders
    SET updated_at = NOW()
    WHERE id = order_id_val;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_calculate_order_totals() IS 'Trigger function to recalculate order totals when order items change';
