-- =====================================================
-- Fuji Restaurant POS System - Sample Data
-- =====================================================

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY users_view_all ON users FOR SELECT
    USING (true);

CREATE POLICY users_manage_self ON users FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY users_admin_all ON users
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'manager')
        )
    );

-- Menu items - everyone can view
CREATE POLICY menu_view_all ON menu_items FOR SELECT
    USING (true);

CREATE POLICY menu_manage ON menu_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'manager')
        )
    );

-- Orders - servers can manage their own, managers see all
CREATE POLICY orders_view_own ON orders FOR SELECT
    USING (
        server_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'manager', 'kitchen', 'cashier')
        )
    );

CREATE POLICY orders_create ON orders FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'manager', 'server', 'cashier')
        )
    );

CREATE POLICY orders_update_own ON orders FOR UPDATE
    USING (
        server_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'manager', 'cashier')
        )
    );

-- Daily sales - managers only
CREATE POLICY daily_sales_view ON daily_sales FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'manager', 'viewer')
        )
    );

CREATE POLICY daily_sales_manage ON daily_sales FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'manager')
        )
    );

-- Inventory - kitchen and managers
CREATE POLICY inventory_view ON inventory_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'manager', 'kitchen')
        )
    );

CREATE POLICY inventory_manage ON inventory_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'manager')
        )
    );

-- =====================================================
-- REAL-TIME SUBSCRIPTIONS SETUP
-- =====================================================

-- Create publication for real-time updates (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime FOR TABLE 
            orders,
            order_items,
            restaurant_tables,
            daily_sales;
    ELSE
        -- Add tables to existing publication
        ALTER PUBLICATION supabase_realtime ADD TABLE orders, order_items, restaurant_tables, daily_sales;
    END IF;
END $$;

-- =====================================================
-- SEED DATA FOR INITIAL SETUP
-- =====================================================

-- Insert menu categories
INSERT INTO menu_categories (name, category_type, display_order, color) VALUES
    ('Red Wine', 'red_wine', 1, '#722f37'),
    ('White Wine', 'white_wine', 2, '#f3e5ab'),
    ('Blush Wine', 'blush_wine', 3, '#ffc0cb'),
    ('Plum Wine', 'plum_wine', 4, '#8b4789'),
    ('Domestic Beer', 'domestic_beer', 5, '#f28e1c'),
    ('Imported Beer', 'imported_beer', 6, '#ffd700'),
    ('Sake', 'sake', 7, '#e6e6fa'),
    ('Beverages', 'beverages', 8, '#4169e1'),
    ('Sushi Rolls', 'sushi_rolls', 9, '#ff6347'),
    ('Tempura Appetizer', 'tempura_appetizer', 10, '#ffa500'),
    ('Lunch Specials', 'lunch_specials', 11, '#32cd32'),
    ('Early Bird', 'early_bird', 12, '#ff69b4'),
    ('Dinner', 'dinner', 13, '#8b4513'),
    ('Side Orders', 'side_orders', 14, '#9370db'),
    ('Children Menu', 'children_menu', 15, '#00ced1')
ON CONFLICT (name) DO NOTHING;

-- Insert common modifiers (only if they don't exist)
INSERT INTO modifiers (name, price, modifier_group)
SELECT 'Spicy Sauce', 1.50, 'sauces'
WHERE NOT EXISTS (SELECT 1 FROM modifiers WHERE name = 'Spicy Sauce' AND modifier_group = 'sauces');

INSERT INTO modifiers (name, price, modifier_group)
SELECT 'Teriyaki Sauce', 1.50, 'sauces'
WHERE NOT EXISTS (SELECT 1 FROM modifiers WHERE name = 'Teriyaki Sauce' AND modifier_group = 'sauces');

INSERT INTO modifiers (name, price, modifier_group)
SELECT 'Ginger (Fresh)', 1.50, 'sauces'
WHERE NOT EXISTS (SELECT 1 FROM modifiers WHERE name = 'Ginger (Fresh)' AND modifier_group = 'sauces');

INSERT INTO modifiers (name, price, modifier_group)
SELECT 'Extra Spicy', 0, 'spice_level'
WHERE NOT EXISTS (SELECT 1 FROM modifiers WHERE name = 'Extra Spicy' AND modifier_group = 'spice_level');

INSERT INTO modifiers (name, price, modifier_group)
SELECT 'Mild', 0, 'spice_level'
WHERE NOT EXISTS (SELECT 1 FROM modifiers WHERE name = 'Mild' AND modifier_group = 'spice_level');

INSERT INTO modifiers (name, price, modifier_group)
SELECT 'No Spice', 0, 'spice_level'
WHERE NOT EXISTS (SELECT 1 FROM modifiers WHERE name = 'No Spice' AND modifier_group = 'spice_level');

INSERT INTO modifiers (name, price, modifier_group)
SELECT 'Rare', 0, 'cooking_temp'
WHERE NOT EXISTS (SELECT 1 FROM modifiers WHERE name = 'Rare' AND modifier_group = 'cooking_temp');

INSERT INTO modifiers (name, price, modifier_group)
SELECT 'Medium Rare', 0, 'cooking_temp'
WHERE NOT EXISTS (SELECT 1 FROM modifiers WHERE name = 'Medium Rare' AND modifier_group = 'cooking_temp');

INSERT INTO modifiers (name, price, modifier_group)
SELECT 'Medium', 0, 'cooking_temp'
WHERE NOT EXISTS (SELECT 1 FROM modifiers WHERE name = 'Medium' AND modifier_group = 'cooking_temp');

INSERT INTO modifiers (name, price, modifier_group)
SELECT 'Medium Well', 0, 'cooking_temp'
WHERE NOT EXISTS (SELECT 1 FROM modifiers WHERE name = 'Medium Well' AND modifier_group = 'cooking_temp');

INSERT INTO modifiers (name, price, modifier_group)
SELECT 'Well Done', 0, 'cooking_temp'
WHERE NOT EXISTS (SELECT 1 FROM modifiers WHERE name = 'Well Done' AND modifier_group = 'cooking_temp');

INSERT INTO modifiers (name, price, modifier_group)
SELECT 'Chicken Fried Rice', 5.50, 'rice_upgrade'
WHERE NOT EXISTS (SELECT 1 FROM modifiers WHERE name = 'Chicken Fried Rice' AND modifier_group = 'rice_upgrade');

INSERT INTO modifiers (name, price, modifier_group)
SELECT 'Split Plate', 8.00, 'service'
WHERE NOT EXISTS (SELECT 1 FROM modifiers WHERE name = 'Split Plate' AND modifier_group = 'service');

-- Insert restaurant tables
INSERT INTO restaurant_tables (table_number, section, seats) VALUES
    (1, 'Main', 4), (2, 'Main', 4), (3, 'Main', 6),
    (4, 'Main', 2), (5, 'Main', 4), (6, 'Main', 8),
    (7, 'Patio', 4), (8, 'Patio', 4), (9, 'Patio', 6),
    (10, 'Bar', 2), (11, 'Bar', 2), (12, 'Bar', 4)
ON CONFLICT (table_number) DO NOTHING;

-- Insert sample menu items with new schema structure

-- Red Wines
INSERT INTO menu_items (category_id, name, description, base_price, glass_price, bottle_price, spicy_level, allergens, preparation_time, display_order) 
SELECT 
    mc.id,
    'Cabernet Sauvignon',
    'Full-bodied red wine with rich flavor and dark fruit notes',
    12.00,
    12.00,
    45.00,
    0,
    '["sulfites"]'::jsonb,
    0,
    1
FROM menu_categories mc WHERE mc.category_type = 'red_wine';

INSERT INTO menu_items (category_id, name, description, base_price, glass_price, bottle_price, spicy_level, allergens, preparation_time, display_order) 
SELECT 
    mc.id,
    'Merlot',
    'Smooth red wine with berry notes and soft tannins',
    11.00,
    11.00,
    42.00,
    0,
    '["sulfites"]'::jsonb,
    0,
    2
FROM menu_categories mc WHERE mc.category_type = 'red_wine';

INSERT INTO menu_items (category_id, name, description, base_price, glass_price, bottle_price, spicy_level, allergens, preparation_time, display_order) 
SELECT 
    mc.id,
    'Shiraz',
    'Bold red wine with spicy finish and peppery notes',
    10.00,
    10.00,
    38.00,
    0,
    '["sulfites"]'::jsonb,
    0,
    3
FROM menu_categories mc WHERE mc.category_type = 'red_wine';

-- White Wines
INSERT INTO menu_items (category_id, name, description, base_price, glass_price, bottle_price, spicy_level, allergens, preparation_time, display_order) 
SELECT 
    mc.id,
    'Chardonnay',
    'Crisp white wine with citrus notes and oak finish',
    10.00,
    10.00,
    38.00,
    0,
    '["sulfites"]'::jsonb,
    0,
    1
FROM menu_categories mc WHERE mc.category_type = 'white_wine';

INSERT INTO menu_items (category_id, name, description, base_price, glass_price, bottle_price, spicy_level, allergens, preparation_time, display_order) 
SELECT 
    mc.id,
    'Sauvignon Blanc',
    'Light white wine with tropical flavors and crisp acidity',
    9.50,
    9.50,
    36.00,
    0,
    '["sulfites"]'::jsonb,
    0,
    2
FROM menu_categories mc WHERE mc.category_type = 'white_wine';

-- Beers
INSERT INTO menu_items (category_id, name, description, base_price, glass_price, bottle_price, spicy_level, allergens, preparation_time, display_order) 
SELECT 
    mc.id,
    'Sapporo Premium',
    'Japanese premium lager beer with clean, crisp taste',
    4.50,
    3.50,
    4.50,
    0,
    '["gluten"]'::jsonb,
    0,
    1
FROM menu_categories mc WHERE mc.category_type = 'imported_beer';

INSERT INTO menu_items (category_id, name, description, base_price, glass_price, bottle_price, spicy_level, allergens, preparation_time, display_order) 
SELECT 
    mc.id,
    'Asahi Super Dry',
    'Extra dry Japanese beer with sharp, clean finish',
    4.25,
    3.25,
    4.25,
    0,
    '["gluten"]'::jsonb,
    0,
    2
FROM menu_categories mc WHERE mc.category_type = 'imported_beer';

-- Sushi Rolls
INSERT INTO menu_items (category_id, name, description, base_price, spicy_level, allergens, preparation_time, is_raw, display_order, cost) 
SELECT 
    mc.id,
    'California Roll',
    'Crab, avocado, and cucumber with sesame seeds',
    8.95,
    0,
    '["shellfish", "sesame"]'::jsonb,
    12,
    false,
    1,
    3.50
FROM menu_categories mc WHERE mc.category_type = 'sushi_rolls';

INSERT INTO menu_items (category_id, name, description, base_price, spicy_level, allergens, preparation_time, is_raw, display_order, cost) 
SELECT 
    mc.id,
    'Spicy Tuna Roll',
    'Spicy tuna with cucumber and avocado',
    9.95,
    3,
    '["fish", "sesame", "eggs"]'::jsonb,
    15,
    true,
    2,
    4.25
FROM menu_categories mc WHERE mc.category_type = 'sushi_rolls';

INSERT INTO menu_items (category_id, name, description, base_price, spicy_level, allergens, preparation_time, is_raw, display_order, cost) 
SELECT 
    mc.id,
    'Philadelphia Roll',
    'Fresh salmon, cream cheese, and cucumber',
    10.95,
    0,
    '["fish", "dairy", "sesame"]'::jsonb,
    12,
    true,
    3,
    4.75
FROM menu_categories mc WHERE mc.category_type = 'sushi_rolls';

INSERT INTO menu_items (category_id, name, description, base_price, spicy_level, allergens, preparation_time, is_raw, display_order, cost) 
SELECT 
    mc.id,
    'Dragon Roll',
    'Eel, cucumber, avocado topped with eel sauce',
    14.95,
    0,
    '["fish", "sesame"]'::jsonb,
    18,
    false,
    4,
    6.50
FROM menu_categories mc WHERE mc.category_type = 'sushi_rolls';

-- Appetizers
INSERT INTO menu_items (category_id, name, description, base_price, spicy_level, allergens, preparation_time, is_vegetarian, display_order, cost) 
SELECT 
    mc.id,
    'Shrimp Tempura',
    '6 pieces of crispy shrimp tempura with dipping sauce',
    8.95,
    0,
    '["shellfish", "gluten", "eggs"]'::jsonb,
    10,
    false,
    1,
    3.25
FROM menu_categories mc WHERE mc.category_type = 'tempura_appetizer';

INSERT INTO menu_items (category_id, name, description, base_price, spicy_level, allergens, preparation_time, is_vegetarian, display_order, cost) 
SELECT 
    mc.id,
    'Vegetable Tempura',
    'Mixed seasonal vegetable tempura with tempura sauce',
    6.95,
    0,
    '["gluten", "eggs"]'::jsonb,
    8,
    true,
    2,
    2.50
FROM menu_categories mc WHERE mc.category_type = 'tempura_appetizer';

INSERT INTO menu_items (category_id, name, description, base_price, spicy_level, allergens, preparation_time, is_vegetarian, display_order, cost) 
SELECT 
    mc.id,
    'Gyoza (Pork)',
    '6 pieces pan-fried pork dumplings with dipping sauce',
    7.95,
    0,
    '["gluten", "pork", "soy"]'::jsonb,
    12,
    false,
    3,
    2.75
FROM menu_categories mc WHERE mc.category_type = 'tempura_appetizer';

-- Lunch Specials
INSERT INTO menu_items (category_id, name, description, base_price, lunch_price, dinner_price, spicy_level, allergens, preparation_time, display_order, cost) 
SELECT 
    mc.id,
    'Chicken Teriyaki Bento',
    'Grilled chicken with teriyaki sauce, steamed rice, and salad',
    12.95,
    12.95,
    16.95,
    0,
    '["gluten", "sesame", "soy"]'::jsonb,
    15,
    1,
    5.25
FROM menu_categories mc WHERE mc.category_type = 'lunch_specials';

INSERT INTO menu_items (category_id, name, description, base_price, lunch_price, dinner_price, spicy_level, allergens, preparation_time, display_order, cost) 
SELECT 
    mc.id,
    'Salmon Teriyaki Bento',
    'Grilled salmon with teriyaki sauce, steamed rice, and salad',
    14.95,
    14.95,
    18.95,
    0,
    '["fish", "gluten", "sesame", "soy"]'::jsonb,
    18,
    2,
    6.50
FROM menu_categories mc WHERE mc.category_type = 'lunch_specials';

-- Dinner Entrées
INSERT INTO menu_items (category_id, name, description, base_price, dinner_price, spicy_level, allergens, preparation_time, display_order, cost) 
SELECT 
    mc.id,
    'Beef Teriyaki',
    'Grilled beef with teriyaki sauce and steamed vegetables',
    22.95,
    22.95,
    0,
    '["gluten", "sesame", "soy"]'::jsonb,
    20,
    1,
    8.75
FROM menu_categories mc WHERE mc.category_type = 'dinner';

INSERT INTO menu_items (category_id, name, description, base_price, dinner_price, spicy_level, allergens, preparation_time, is_vegetarian, display_order, cost) 
SELECT 
    mc.id,
    'Tempura Dinner',
    'Assorted tempura with steamed rice and miso soup',
    18.95,
    18.95,
    0,
    '["shellfish", "fish", "gluten", "eggs"]'::jsonb,
    15,
    false,
    2,
    7.25
FROM menu_categories mc WHERE mc.category_type = 'dinner';

-- Side Orders
INSERT INTO menu_items (category_id, name, description, base_price, spicy_level, allergens, preparation_time, is_vegetarian, display_order, cost) 
SELECT 
    mc.id,
    'Miso Soup',
    'Traditional soybean paste soup with tofu and scallions',
    2.95,
    0,
    '["soy"]'::jsonb,
    3,
    true,
    1,
    0.85
FROM menu_categories mc WHERE mc.category_type = 'side_orders';

INSERT INTO menu_items (category_id, name, description, base_price, spicy_level, allergens, preparation_time, is_vegetarian, is_gluten_free, display_order, cost) 
SELECT 
    mc.id,
    'Steamed Rice',
    'Bowl of perfectly steamed white rice',
    2.50,
    0,
    '[]'::jsonb,
    5,
    true,
    true,
    2,
    0.50
FROM menu_categories mc WHERE mc.category_type = 'side_orders';

-- Children's Menu
INSERT INTO menu_items (category_id, name, description, base_price, spicy_level, allergens, preparation_time, display_order, cost) 
SELECT 
    mc.id,
    'Kids Chicken Teriyaki',
    'Grilled chicken with rice (child portion)',
    7.95,
    0,
    '["gluten", "sesame", "soy"]'::jsonb,
    10,
    1,
    3.25
FROM menu_categories mc WHERE mc.category_type = 'children_menu';

INSERT INTO menu_items (category_id, name, description, base_price, spicy_level, allergens, preparation_time, display_order, cost) 
SELECT 
    mc.id,
    'Kids California Roll',
    'California roll (4 pieces) with edamame',
    5.95,
    0,
    '["shellfish", "sesame"]'::jsonb,
    8,
    2,
    2.25
FROM menu_categories mc WHERE mc.category_type = 'children_menu';

-- Link menu items to modifiers
-- Sushi rolls get sauce modifiers
INSERT INTO item_modifiers (item_id, modifier_id, is_required, is_default)
SELECT mi.id, m.id, false, false
FROM menu_items mi
CROSS JOIN modifiers m
WHERE mi.category_id IN (SELECT id FROM menu_categories WHERE category_type = 'sushi_rolls')
AND m.modifier_group = 'sauces'
ON CONFLICT (item_id, modifier_id) DO NOTHING;

-- Tempura gets cooking temp and sauce modifiers
INSERT INTO item_modifiers (item_id, modifier_id, is_required, is_default)
SELECT mi.id, m.id, false, false
FROM menu_items mi
CROSS JOIN modifiers m
WHERE mi.name LIKE '%Tempura%'
AND m.modifier_group IN ('cooking_temp', 'sauces')
ON CONFLICT (item_id, modifier_id) DO NOTHING;

-- Dinner items get cooking temp and rice upgrade options
INSERT INTO item_modifiers (item_id, modifier_id, is_required, is_default)
SELECT mi.id, m.id, false, false
FROM menu_items mi
CROSS JOIN modifiers m
WHERE mi.category_id IN (SELECT id FROM menu_categories WHERE category_type IN ('dinner', 'lunch_specials'))
AND m.modifier_group IN ('cooking_temp', 'rice_upgrade')
ON CONFLICT (item_id, modifier_id) DO NOTHING;

-- Insert sample inventory items
INSERT INTO inventory_items (name, unit, current_quantity, reorder_point) VALUES
-- Beverages
('Cabernet Sauvignon Bottles', 'bottles', 24, 6),
('Merlot Bottles', 'bottles', 18, 6),
('Chardonnay Bottles', 'bottles', 20, 6),
('Sapporo Premium Bottles', 'bottles', 48, 12),
('Asahi Super Dry Bottles', 'bottles', 36, 12),

-- Fresh Ingredients
('Fresh Salmon', 'pounds', 8.5, 2.0),
('Fresh Tuna', 'pounds', 6.0, 2.0),
('Crab Meat', 'pounds', 4.0, 1.0),
('Avocado', 'pieces', 24, 6),
('Cucumber', 'pieces', 15, 5),
('Cream Cheese', 'pounds', 3.0, 1.0),

-- Rice and Nori
('Sushi Rice', 'pounds', 25.0, 5.0),
('Nori Sheets', 'packages', 8, 2),

-- Supplies
('Take-out Containers', 'pieces', 150, 50),
('Receipt Paper', 'rolls', 12, 3),
('Chopsticks', 'packages', 8, 2),
('Soy Sauce Packets', 'boxes', 5, 1);

-- Link menu items to inventory ingredients
INSERT INTO menu_item_ingredients (menu_item_id, inventory_item_id, quantity_used)
SELECT 
    mi.id,
    ii.id,
    CASE 
        WHEN mi.name = 'California Roll' AND ii.name = 'Crab Meat' THEN 0.125
        WHEN mi.name = 'California Roll' AND ii.name = 'Avocado' THEN 0.25
        WHEN mi.name = 'California Roll' AND ii.name = 'Cucumber' THEN 0.125
        WHEN mi.name = 'California Roll' AND ii.name = 'Sushi Rice' THEN 0.2
        WHEN mi.name = 'California Roll' AND ii.name = 'Nori Sheets' THEN 1.0
        
        WHEN mi.name = 'Spicy Tuna Roll' AND ii.name = 'Fresh Tuna' THEN 0.15
        WHEN mi.name = 'Spicy Tuna Roll' AND ii.name = 'Avocado' THEN 0.25
        WHEN mi.name = 'Spicy Tuna Roll' AND ii.name = 'Cucumber' THEN 0.125
        WHEN mi.name = 'Spicy Tuna Roll' AND ii.name = 'Sushi Rice' THEN 0.2
        WHEN mi.name = 'Spicy Tuna Roll' AND ii.name = 'Nori Sheets' THEN 1.0
        
        WHEN mi.name = 'Philadelphia Roll' AND ii.name = 'Fresh Salmon' THEN 0.15
        WHEN mi.name = 'Philadelphia Roll' AND ii.name = 'Cream Cheese' THEN 0.1
        WHEN mi.name = 'Philadelphia Roll' AND ii.name = 'Cucumber' THEN 0.125
        WHEN mi.name = 'Philadelphia Roll' AND ii.name = 'Sushi Rice' THEN 0.2
        WHEN mi.name = 'Philadelphia Roll' AND ii.name = 'Nori Sheets' THEN 1.0
        ELSE 0
    END as quantity
FROM menu_items mi
CROSS JOIN inventory_items ii
WHERE mi.name IN ('California Roll', 'Spicy Tuna Roll', 'Philadelphia Roll')
AND (
    (mi.name = 'California Roll' AND ii.name IN ('Crab Meat', 'Avocado', 'Cucumber', 'Sushi Rice', 'Nori Sheets')) OR
    (mi.name = 'Spicy Tuna Roll' AND ii.name IN ('Fresh Tuna', 'Avocado', 'Cucumber', 'Sushi Rice', 'Nori Sheets')) OR
    (mi.name = 'Philadelphia Roll' AND ii.name IN ('Fresh Salmon', 'Cream Cheese', 'Cucumber', 'Sushi Rice', 'Nori Sheets'))
)
AND quantity > 0;

-- Insert initial system settings
INSERT INTO system_settings (key, value, description) VALUES
('restaurant_name', 'Fuji Restaurant', 'Restaurant name displayed on receipts and reports'),
('restaurant_address', '123 Main Street, Anytown, ST 12345', 'Restaurant address for receipts'),
('restaurant_phone', '(555) 123-4567', 'Restaurant phone number'),
('tax_rate', '0.0800', 'Default tax rate (8%)'),
('gratuity_rate', '0.2000', 'Default gratuity rate for parties of 2+ (20%)'),
('service_charge_rate', '0.0350', 'Credit card service charge rate (3.5%)'),
('split_plate_charge', '8.00', 'Charge for split plates'),
('currency_symbol', '$', 'Currency symbol'),
('timezone', 'America/New_York', 'Restaurant timezone'),
('business_hours_open', '11:00', 'Restaurant opening time'),
('business_hours_close', '22:00', 'Restaurant closing time'),
('receipt_header', 'Welcome to Fuji Restaurant', 'Header message on receipts'),
('receipt_footer', 'Thank you for dining with us!', 'Footer message on receipts'),
('allergen_warning', 'Please inform your server of any food allergies.', 'Allergen warning on receipts');

-- =====================================================
-- GRANTS FOR SUPABASE SERVICE ROLE
-- =====================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;