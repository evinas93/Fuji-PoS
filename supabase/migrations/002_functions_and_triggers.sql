-- Fuji Restaurant POS System - Functions and Triggers
-- This migration creates database functions, triggers, and stored procedures

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate order totals
CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal DECIMAL(10,2);
    v_tax DECIMAL(10,2);
    v_gratuity DECIMAL(10,2);
    v_service_charge DECIMAL(10,2);
    v_party_size INT;
BEGIN
    -- Calculate subtotal from order items
    SELECT COALESCE(SUM(total_price), 0) INTO v_subtotal
    FROM order_items
    WHERE order_id = NEW.id;
    
    -- Apply discount
    v_subtotal := v_subtotal - COALESCE(NEW.discount_amount, 0);
    
    -- Calculate tax
    v_tax := v_subtotal * NEW.tax_rate;
    
    -- Auto-apply gratuity for parties of 2+
    IF NEW.order_type = 'dine_in' THEN
        SELECT COUNT(DISTINCT oi.id) INTO v_party_size
        FROM order_items oi
        WHERE oi.order_id = NEW.id;
        
        IF v_party_size >= 2 AND NEW.gratuity_rate IS NULL THEN
            NEW.gratuity_rate := 0.20; -- 20% gratuity
        END IF;
    END IF;
    
    v_gratuity := v_subtotal * COALESCE(NEW.gratuity_rate, 0);
    
    -- Calculate service charge for credit payments (will be updated on payment)
    v_service_charge := 0;
    
    -- Update order totals
    UPDATE orders SET
        subtotal = v_subtotal,
        tax_amount = v_tax,
        gratuity_amount = v_gratuity,
        service_charge = v_service_charge,
        total_amount = v_subtotal + v_tax + v_gratuity + v_service_charge,
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate on order items change
CREATE OR REPLACE FUNCTION trigger_calculate_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    order_rec RECORD;
BEGIN
    -- Get the order_id from the affected row
    IF TG_OP = 'DELETE' THEN
        order_rec.id := OLD.order_id;
    ELSE
        order_rec.id := NEW.order_id;
    END IF;
    
    -- Trigger the calculation function
    PERFORM calculate_order_totals() FROM orders WHERE id = order_rec.id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_order_totals
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_order_totals();

-- Function to notify kitchen of new orders
CREATE OR REPLACE FUNCTION notify_kitchen_new_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Send real-time notification to kitchen display
    PERFORM pg_notify(
        'kitchen_orders',
        json_build_object(
            'action', 'new_order',
            'order_id', NEW.order_id,
            'item_id', NEW.id,
            'item_name', NEW.item_name,
            'quantity', NEW.quantity,
            'modifiers', NEW.modifiers,
            'special_instructions', NEW.special_instructions,
            'table_number', (
                SELECT t.table_number 
                FROM orders o 
                JOIN restaurant_tables t ON o.table_id = t.id 
                WHERE o.id = NEW.order_id
            ),
            'order_type', (SELECT order_type FROM orders WHERE id = NEW.order_id),
            'created_at', NEW.created_at
        )::text
    );
    
    -- Mark as sent to kitchen
    UPDATE order_items 
    SET sent_to_kitchen_at = NOW() 
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for kitchen notifications
CREATE TRIGGER trigger_notify_kitchen
AFTER INSERT ON order_items
FOR EACH ROW
WHEN (NEW.status = 'confirmed')
EXECUTE FUNCTION notify_kitchen_new_order();

-- Function to update daily sales
CREATE OR REPLACE FUNCTION update_daily_sales()
RETURNS TRIGGER AS $$
BEGIN
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
        NEW.order_date,
        TO_CHAR(NEW.order_date, 'Day'),
        1,
        CASE WHEN NEW.order_type = 'dine_in' THEN 1 ELSE 0 END,
        CASE WHEN NEW.order_type = 'take_out' THEN 1 ELSE 0 END,
        NEW.total_amount,
        CASE WHEN NEW.order_type = 'dine_in' THEN NEW.total_amount ELSE 0 END,
        CASE WHEN NEW.order_type = 'take_out' THEN NEW.total_amount ELSE 0 END,
        NEW.tax_amount,
        NEW.gratuity_amount,
        NEW.discount_amount
    )
    ON CONFLICT (sales_date)
    DO UPDATE SET
        total_orders = daily_sales.total_orders + 1,
        dine_in_orders = daily_sales.dine_in_orders + 
            CASE WHEN NEW.order_type = 'dine_in' THEN 1 ELSE 0 END,
        take_out_orders = daily_sales.take_out_orders + 
            CASE WHEN NEW.order_type = 'take_out' THEN 1 ELSE 0 END,
        gross_sales = daily_sales.gross_sales + NEW.total_amount,
        dine_in_sales = daily_sales.dine_in_sales + 
            CASE WHEN NEW.order_type = 'dine_in' THEN NEW.total_amount ELSE 0 END,
        take_out_sales = daily_sales.take_out_sales + 
            CASE WHEN NEW.order_type = 'take_out' THEN NEW.total_amount ELSE 0 END,
        total_tax = daily_sales.total_tax + NEW.tax_amount,
        total_gratuity = daily_sales.total_gratuity + NEW.gratuity_amount,
        total_discounts = daily_sales.total_discounts + NEW.discount_amount,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update daily sales
CREATE TRIGGER trigger_update_daily_sales
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION update_daily_sales();

-- Function for inventory deduction
CREATE OR REPLACE FUNCTION deduct_inventory()
RETURNS TRIGGER AS $$
DECLARE
    ingredient RECORD;
BEGIN
    -- Deduct inventory for each ingredient
    FOR ingredient IN
        SELECT mii.inventory_item_id, mii.quantity_used * NEW.quantity as total_used
        FROM menu_item_ingredients mii
        WHERE mii.menu_item_id = NEW.item_id
    LOOP
        UPDATE inventory_items
        SET current_quantity = current_quantity - ingredient.total_used,
            updated_at = NOW()
        WHERE id = ingredient.inventory_item_id;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for inventory management
CREATE TRIGGER trigger_deduct_inventory
AFTER UPDATE ON order_items
FOR EACH ROW
WHEN (NEW.status = 'preparing' AND OLD.status != 'preparing')
EXECUTE FUNCTION deduct_inventory();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changed_by_id UUID;
BEGIN
    -- Try to get the current user ID (if available)
    BEGIN
        SELECT auth.uid() INTO changed_by_id;
    EXCEPTION
        WHEN OTHERS THEN
            changed_by_id := NULL;
    END;
    
    -- Prepare old and new data
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);
    END IF;
    
    -- Insert audit log entry
    INSERT INTO audit_log (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_by,
        changed_at
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        old_data,
        new_data,
        changed_by_id,
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_daily_sales_updated_at
    BEFORE UPDATE ON daily_sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply audit log triggers to important tables
CREATE TRIGGER trg_orders_audit
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER trg_payments_audit
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER trg_menu_items_audit
    AFTER INSERT OR UPDATE OR DELETE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER trg_users_audit
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

-- =====================================================
-- HELPER FUNCTIONS FOR APPLICATION
-- =====================================================

-- Function to get available tables
CREATE OR REPLACE FUNCTION get_available_tables()
RETURNS TABLE (
    id UUID,
    table_number INT,
    section TEXT,
    seats INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.table_number, t.section, t.seats
    FROM restaurant_tables t
    WHERE t.is_active = true AND t.is_occupied = false
    ORDER BY t.table_number;
END;
$$ LANGUAGE plpgsql;

-- Function to search menu items
CREATE OR REPLACE FUNCTION search_menu_items(search_term TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category_name TEXT,
    base_price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mi.id,
        mi.name,
        mi.description,
        mc.name as category_name,
        mi.base_price
    FROM menu_items mi
    JOIN menu_categories mc ON mi.category_id = mc.id
    WHERE mi.is_available = true
        AND (
            mi.name ILIKE '%' || search_term || '%' OR
            mi.description ILIKE '%' || search_term || '%'
        )
    ORDER BY 
        CASE 
            WHEN mi.name ILIKE search_term || '%' THEN 1
            WHEN mi.name ILIKE '%' || search_term || '%' THEN 2
            ELSE 3
        END,
        mi.name;
END;
$$ LANGUAGE plpgsql;

-- Function for end of day report
CREATE OR REPLACE FUNCTION generate_end_of_day_report(report_date DATE)
RETURNS TABLE (
    total_orders INT,
    gross_sales DECIMAL,
    net_sales DECIMAL,
    cash_sales DECIMAL,
    credit_sales DECIMAL,
    total_tax DECIMAL,
    total_gratuity DECIMAL,
    total_discounts DECIMAL,
    top_items JSONB,
    server_summary JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH sales_data AS (
        SELECT * FROM daily_sales WHERE sales_date = report_date
    ),
    top_selling AS (
        SELECT json_agg(
            json_build_object(
                'name', mi.name,
                'quantity', SUM(oi.quantity),
                'revenue', SUM(oi.total_price)
            ) ORDER BY SUM(oi.quantity) DESC
        ) as items
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN menu_items mi ON oi.item_id = mi.id
        WHERE o.order_date = report_date AND o.status = 'completed'
        LIMIT 10
    ),
    server_data AS (
        SELECT json_agg(
            json_build_object(
                'name', u.full_name,
                'orders', COUNT(o.id),
                'sales', SUM(o.total_amount),
                'tips', SUM(o.gratuity_amount)
            ) ORDER BY SUM(o.total_amount) DESC
        ) as servers
        FROM orders o
        JOIN users u ON o.server_id = u.id
        WHERE o.order_date = report_date AND o.status = 'completed'
        GROUP BY u.id, u.full_name
    )
    SELECT 
        sd.total_orders,
        sd.gross_sales,
        sd.net_sales,
        sd.cash_sales,
        sd.credit_sales,
        sd.total_tax,
        sd.total_gratuity,
        sd.total_discounts,
        ts.items as top_items,
        srv.servers as server_summary
    FROM sales_data sd, top_selling ts, server_data srv;
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'date', target_date,
        'total_orders', COALESCE((
            SELECT COUNT(*) FROM orders 
            WHERE order_date = target_date
        ), 0),
        'active_orders', COALESCE((
            SELECT COUNT(*) FROM orders 
            WHERE order_date = target_date 
            AND status IN ('pending', 'confirmed', 'preparing', 'ready')
        ), 0),
        'completed_orders', COALESCE((
            SELECT COUNT(*) FROM orders 
            WHERE order_date = target_date 
            AND status = 'completed'
        ), 0),
        'total_sales', COALESCE((
            SELECT SUM(total_amount) FROM orders 
            WHERE order_date = target_date 
            AND status = 'completed'
        ), 0),
        'average_ticket', COALESCE((
            SELECT AVG(total_amount) FROM orders 
            WHERE order_date = target_date 
            AND status = 'completed'
        ), 0),
        'top_items', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'name', mi.name,
                    'quantity', item_stats.total_qty,
                    'revenue', item_stats.total_revenue
                )
            )
            FROM (
                SELECT 
                    oi.item_id,
                    SUM(oi.quantity) as total_qty,
                    SUM(oi.total_price) as total_revenue
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE o.order_date = target_date
                AND o.status = 'completed'
                GROUP BY oi.item_id
                ORDER BY total_qty DESC
                LIMIT 5
            ) item_stats
            JOIN menu_items mi ON item_stats.item_id = mi.id
        ), '[]'::json),
        'hourly_sales', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'hour', hour_stats.hour,
                    'orders', hour_stats.order_count,
                    'sales', hour_stats.sales_total
                )
            )
            FROM (
                SELECT 
                    EXTRACT(HOUR FROM created_at) as hour,
                    COUNT(*) as order_count,
                    SUM(total_amount) as sales_total
                FROM orders
                WHERE order_date = target_date
                AND status = 'completed'
                GROUP BY EXTRACT(HOUR FROM created_at)
                ORDER BY hour
            ) hour_stats
        ), '[]'::json)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_order_totals() IS 'Automatically calculates order totals including tax, gratuity, and service charges';
COMMENT ON FUNCTION update_daily_sales() IS 'Updates daily sales summary when orders are completed';
COMMENT ON FUNCTION get_dashboard_stats(DATE) IS 'Returns real-time dashboard statistics for a given date';
COMMENT ON FUNCTION generate_end_of_day_report(DATE) IS 'Generates comprehensive end-of-day report with sales and performance data';