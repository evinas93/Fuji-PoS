-- =====================================================
-- Fuji Restaurant POS System - Menu Search Function
-- =====================================================

-- Function for searching menu items with full-text search
CREATE OR REPLACE FUNCTION search_menu_items(search_term TEXT)
RETURNS TABLE (
    id UUID,
    category_id UUID,
    sku TEXT,
    name TEXT,
    description TEXT,
    base_price DECIMAL(10,2),
    glass_price DECIMAL(10,2),
    bottle_price DECIMAL(10,2),
    lunch_price DECIMAL(10,2),
    dinner_price DECIMAL(10,2),
    cost DECIMAL(10,2),
    tax_exempt BOOLEAN,
    preparation_time INT,
    calories INT,
    spicy_level INT,
    is_raw BOOLEAN,
    is_vegetarian BOOLEAN,
    is_gluten_free BOOLEAN,
    allergens JSONB,
    image_url TEXT,
    display_order INT,
    is_available BOOLEAN,
    is_featured BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    menu_categories JSONB,
    item_modifiers JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mi.id,
        mi.category_id,
        mi.sku,
        mi.name,
        mi.description,
        mi.base_price,
        mi.glass_price,
        mi.bottle_price,
        mi.lunch_price,
        mi.dinner_price,
        mi.cost,
        mi.tax_exempt,
        mi.preparation_time,
        mi.calories,
        mi.spicy_level,
        mi.is_raw,
        mi.is_vegetarian,
        mi.is_gluten_free,
        mi.allergens,
        mi.image_url,
        mi.display_order,
        mi.is_available,
        mi.is_featured,
        mi.created_at,
        mi.updated_at,
        to_jsonb(mc.*) as menu_categories,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'is_required', im.is_required,
                        'is_default', im.is_default,
                        'modifier', to_jsonb(m.*)
                    )
                )
                FROM item_modifiers im
                JOIN modifiers m ON im.modifier_id = m.id
                WHERE im.item_id = mi.id
                AND m.is_active = true
            ),
            '[]'::jsonb
        ) as item_modifiers
    FROM menu_items mi
    LEFT JOIN menu_categories mc ON mi.category_id = mc.id
    WHERE 
        mi.is_available = true
        AND (
            mi.name ILIKE '%' || search_term || '%'
            OR mi.description ILIKE '%' || search_term || '%'
            OR mc.name ILIKE '%' || search_term || '%'
            OR to_tsvector('english', mi.name || ' ' || COALESCE(mi.description, '')) 
               @@ plainto_tsquery('english', search_term)
        )
    ORDER BY 
        CASE 
            WHEN mi.name ILIKE search_term || '%' THEN 1
            WHEN mi.name ILIKE '%' || search_term || '%' THEN 2
            ELSE 3
        END,
        mi.display_order,
        mi.name;
END;
$$;

-- Function for bulk updating menu item prices
CREATE OR REPLACE FUNCTION bulk_update_menu_prices(
    category_id_param UUID DEFAULT NULL,
    price_multiplier DECIMAL DEFAULT 1.0,
    price_adjustment DECIMAL DEFAULT 0.0
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    UPDATE menu_items
    SET 
        base_price = (base_price * price_multiplier) + price_adjustment,
        glass_price = CASE 
            WHEN glass_price IS NOT NULL THEN (glass_price * price_multiplier) + price_adjustment
            ELSE glass_price
        END,
        bottle_price = CASE 
            WHEN bottle_price IS NOT NULL THEN (bottle_price * price_multiplier) + price_adjustment
            ELSE bottle_price
        END,
        lunch_price = CASE 
            WHEN lunch_price IS NOT NULL THEN (lunch_price * price_multiplier) + price_adjustment
            ELSE lunch_price
        END,
        dinner_price = CASE 
            WHEN dinner_price IS NOT NULL THEN (dinner_price * price_multiplier) + price_adjustment
            ELSE dinner_price
        END,
        updated_at = NOW()
    WHERE 
        (category_id_param IS NULL OR category_id = category_id_param)
        AND is_available = true;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

-- Function for getting menu item pricing context
CREATE OR REPLACE FUNCTION get_menu_item_price(
    item_id_param UUID,
    time_period TEXT DEFAULT NULL,
    serving_type TEXT DEFAULT NULL
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    item_record menu_items%ROWTYPE;
    calculated_price DECIMAL(10,2);
BEGIN
    -- Get the menu item
    SELECT * INTO item_record
    FROM menu_items
    WHERE id = item_id_param;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Calculate price based on context
    IF serving_type = 'bottle' AND item_record.bottle_price IS NOT NULL THEN
        calculated_price := item_record.bottle_price;
    ELSIF serving_type = 'glass' AND item_record.glass_price IS NOT NULL THEN
        calculated_price := item_record.glass_price;
    ELSIF time_period = 'lunch' AND item_record.lunch_price IS NOT NULL THEN
        calculated_price := item_record.lunch_price;
    ELSIF time_period = 'dinner' AND item_record.dinner_price IS NOT NULL THEN
        calculated_price := item_record.dinner_price;
    ELSE
        -- Default to base price
        calculated_price := item_record.base_price;
    END IF;
    
    RETURN calculated_price;
END;
$$;

-- Function for calculating item total with modifiers
CREATE OR REPLACE FUNCTION calculate_item_total(
    item_id_param UUID,
    quantity_param INT,
    modifier_ids UUID[] DEFAULT '{}',
    time_period TEXT DEFAULT NULL,
    serving_type TEXT DEFAULT NULL
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    base_price DECIMAL(10,2);
    modifier_total DECIMAL(10,2) := 0;
    total DECIMAL(10,2);
    modifier_id UUID;
BEGIN
    -- Get base price
    base_price := get_menu_item_price(item_id_param, time_period, serving_type);
    
    -- Calculate modifier costs
    IF array_length(modifier_ids, 1) > 0 THEN
        FOREACH modifier_id IN ARRAY modifier_ids
        LOOP
            SELECT COALESCE(modifier_total + price, modifier_total)
            INTO modifier_total
            FROM modifiers
            WHERE id = modifier_id AND is_active = true;
        END LOOP;
    END IF;
    
    -- Calculate total
    total := (base_price + modifier_total) * quantity_param;
    
    RETURN total;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION search_menu_items(TEXT) IS 'Search menu items using full-text search with category and modifier relationships';
COMMENT ON FUNCTION bulk_update_menu_prices(UUID, DECIMAL, DECIMAL) IS 'Bulk update menu item prices by category with multiplier and adjustment';
COMMENT ON FUNCTION get_menu_item_price(UUID, TEXT, TEXT) IS 'Get menu item price based on time period and serving type context';
COMMENT ON FUNCTION calculate_item_total(UUID, INT, UUID[], TEXT, TEXT) IS 'Calculate total price for menu item with modifiers and quantity';
