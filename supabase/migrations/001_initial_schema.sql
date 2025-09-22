-- =====================================================
-- Fuji Restaurant POS System - Supabase Database Schema
-- Version: 1.0
-- Database: PostgreSQL (Supabase)
-- =====================================================

-- =====================================================
-- ENABLE EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- For exclusion constraints

-- =====================================================
-- CUSTOM TYPES
-- =====================================================
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');
CREATE TYPE order_type AS ENUM ('dine_in', 'take_out');
CREATE TYPE payment_method AS ENUM ('cash', 'credit', 'debit', 'gift_card');
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'server', 'cashier', 'kitchen', 'viewer');
CREATE TYPE item_category AS ENUM (
    'red_wine', 'white_wine', 'blush_wine', 'plum_wine',
    'domestic_beer', 'imported_beer', 'sake', 'beverages',
    'sushi_rolls', 'tempura_appetizer', 'lunch_specials',
    'early_bird', 'dinner', 'side_orders', 'children_menu'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table with Supabase Auth integration
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'server',
    pin_code TEXT, -- For quick POS login
    hourly_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu categories for organization
CREATE TABLE menu_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category_type item_category NOT NULL,
    display_order INT NOT NULL,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items table
CREATE TABLE menu_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    glass_price DECIMAL(10,2), -- For beverages
    bottle_price DECIMAL(10,2), -- For beverages
    lunch_price DECIMAL(10,2), -- For lunch specials
    dinner_price DECIMAL(10,2), -- For dinner items
    cost DECIMAL(10,2), -- For profit calculation
    tax_exempt BOOLEAN DEFAULT false,
    preparation_time INT DEFAULT 15, -- In minutes
    calories INT,
    spicy_level INT CHECK (spicy_level >= 0 AND spicy_level <= 5),
    is_raw BOOLEAN DEFAULT false, -- For sushi/raw items
    is_vegetarian BOOLEAN DEFAULT false,
    is_gluten_free BOOLEAN DEFAULT false,
    allergens JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    display_order INT,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modifiers for menu items (sauces, cooking preferences, etc.)
CREATE TABLE modifiers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    modifier_group TEXT, -- e.g., 'sauces', 'cooking_temp', 'sides'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link items to available modifiers
CREATE TABLE item_modifiers (
    item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    modifier_id UUID REFERENCES modifiers(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    PRIMARY KEY (item_id, modifier_id)
);

-- Tables/seating management
CREATE TABLE restaurant_tables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_number INT UNIQUE NOT NULL,
    section TEXT,
    seats INT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_occupied BOOLEAN DEFAULT false,
    current_order_id UUID,
    occupied_at TIMESTAMPTZ,
    server_id UUID REFERENCES users(id)
);

-- Orders table
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number SERIAL UNIQUE NOT NULL,
    order_date DATE DEFAULT CURRENT_DATE,
    order_type order_type NOT NULL,
    status order_status DEFAULT 'pending',
    table_id UUID REFERENCES restaurant_tables(id),
    customer_name TEXT,
    customer_phone TEXT,
    server_id UUID REFERENCES users(id),
    cashier_id UUID REFERENCES users(id),
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_reason TEXT,
    tax_rate DECIMAL(5,4) DEFAULT 0.08, -- 8% default
    tax_amount DECIMAL(10,2) DEFAULT 0,
    gratuity_rate DECIMAL(5,4),
    gratuity_amount DECIMAL(10,2) DEFAULT 0,
    service_charge_rate DECIMAL(5,4) DEFAULT 0.035, -- 3.5% for credit
    service_charge DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    change_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    is_void BOOLEAN DEFAULT false,
    void_reason TEXT,
    void_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items detail
CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES menu_items(id),
    item_name TEXT NOT NULL, -- Denormalized for historical accuracy
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    modifiers JSONB DEFAULT '[]'::jsonb,
    special_instructions TEXT,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    status order_status DEFAULT 'pending',
    sent_to_kitchen_at TIMESTAMPTZ,
    prepared_at TIMESTAMPTZ,
    served_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table (supports split payments)
CREATE TABLE payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    payment_method payment_method NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    card_last_four TEXT,
    transaction_id TEXT,
    processor_response JSONB,
    processed_by UUID REFERENCES users(id),
    is_void BOOLEAN DEFAULT false,
    void_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily sales summary
CREATE TABLE daily_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sales_date DATE UNIQUE NOT NULL,
    day_of_week TEXT NOT NULL,
    opening_time TIME,
    closing_time TIME,
    total_orders INT DEFAULT 0,
    dine_in_orders INT DEFAULT 0,
    take_out_orders INT DEFAULT 0,
    cancelled_orders INT DEFAULT 0,
    gross_sales DECIMAL(12,2) DEFAULT 0,
    net_sales DECIMAL(12,2) DEFAULT 0,
    dine_in_sales DECIMAL(12,2) DEFAULT 0,
    take_out_sales DECIMAL(12,2) DEFAULT 0,
    food_sales DECIMAL(12,2) DEFAULT 0,
    beverage_sales DECIMAL(12,2) DEFAULT 0,
    lunch_sales DECIMAL(12,2) DEFAULT 0,
    dinner_sales DECIMAL(12,2) DEFAULT 0,
    total_discounts DECIMAL(12,2) DEFAULT 0,
    total_tax DECIMAL(12,2) DEFAULT 0,
    total_gratuity DECIMAL(12,2) DEFAULT 0,
    total_service_charges DECIMAL(12,2) DEFAULT 0,
    cash_sales DECIMAL(12,2) DEFAULT 0,
    credit_sales DECIMAL(12,2) DEFAULT 0,
    cash_tips DECIMAL(12,2) DEFAULT 0,
    credit_tips DECIMAL(12,2) DEFAULT 0,
    cash_deposited DECIMAL(12,2) DEFAULT 0,
    credit_deposited DECIMAL(12,2) DEFAULT 0,
    is_closed BOOLEAN DEFAULT false,
    close_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shift management
CREATE TABLE shifts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    clock_in TIMESTAMPTZ NOT NULL,
    clock_out TIMESTAMPTZ,
    break_start TIMESTAMPTZ,
    break_end TIMESTAMPTZ,
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_tips DECIMAL(12,2) DEFAULT 0,
    cash_tips DECIMAL(12,2) DEFAULT 0,
    credit_tips DECIMAL(12,2) DEFAULT 0,
    tip_out DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory tracking (basic)
CREATE TABLE inventory_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    current_quantity DECIMAL(10,2) DEFAULT 0,
    reorder_point DECIMAL(10,2),
    last_restocked TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link menu items to inventory
CREATE TABLE menu_item_ingredients (
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity_used DECIMAL(10,4) NOT NULL,
    PRIMARY KEY (menu_item_id, inventory_item_id)
);

-- System settings
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for tracking important changes
CREATE TABLE audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_server ON orders(server_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_status ON order_items(status);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_daily_sales_date ON daily_sales(sales_date);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_shifts_user_date ON shifts(user_id, shift_date);

-- Full text search on menu items
CREATE INDEX idx_menu_items_search ON menu_items USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Audit log indexes
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_changed_at ON audit_log(changed_at);
CREATE INDEX idx_audit_log_changed_by ON audit_log(changed_by);

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- Current day sales overview
CREATE VIEW today_sales AS
SELECT 
    COUNT(DISTINCT o.id) as order_count,
    COUNT(DISTINCT CASE WHEN o.order_type = 'dine_in' THEN o.id END) as dine_in_count,
    COUNT(DISTINCT CASE WHEN o.order_type = 'take_out' THEN o.id END) as take_out_count,
    COALESCE(SUM(o.total_amount), 0) as total_sales,
    COALESCE(AVG(o.total_amount), 0) as average_ticket,
    COALESCE(SUM(o.tax_amount), 0) as total_tax,
    COALESCE(SUM(o.gratuity_amount), 0) as total_gratuity,
    COALESCE(SUM(o.discount_amount), 0) as total_discounts
FROM orders o
WHERE o.order_date = CURRENT_DATE
    AND o.status != 'cancelled'
    AND NOT o.is_void;

-- Top selling items
CREATE VIEW top_selling_items AS
SELECT 
    mi.id,
    mi.name,
    mi.category_id,
    mc.name as category_name,
    COUNT(DISTINCT oi.id) as times_ordered,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.total_price) as total_revenue,
    AVG(oi.total_price) as avg_price
FROM order_items oi
JOIN menu_items mi ON oi.item_id = mi.id
JOIN menu_categories mc ON mi.category_id = mc.id
JOIN orders o ON oi.order_id = o.id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
    AND o.status = 'completed'
    AND NOT o.is_void
GROUP BY mi.id, mi.name, mi.category_id, mc.name
ORDER BY total_quantity DESC;

-- Server performance
CREATE VIEW server_performance AS
SELECT 
    u.id,
    u.full_name,
    DATE(o.created_at) as shift_date,
    COUNT(DISTINCT o.id) as orders_served,
    SUM(o.total_amount) as total_sales,
    AVG(o.total_amount) as avg_ticket,
    SUM(o.gratuity_amount) as total_gratuity,
    AVG(EXTRACT(EPOCH FROM (o.completed_at - o.created_at))/60) as avg_service_time_minutes
FROM users u
JOIN orders o ON u.id = o.server_id
WHERE o.status = 'completed'
    AND NOT o.is_void
    AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, u.full_name, DATE(o.created_at);

-- Hourly sales pattern
CREATE VIEW hourly_sales AS
SELECT 
    EXTRACT(HOUR FROM created_at) as hour,
    COUNT(*) as order_count,
    SUM(total_amount) as total_sales,
    AVG(total_amount) as avg_ticket
FROM orders
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
    AND status = 'completed'
    AND NOT is_void
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;

COMMENT ON TABLE users IS 'User profiles extending Supabase auth with role-based access and POS-specific fields';
COMMENT ON TABLE menu_items IS 'Restaurant menu items with comprehensive pricing and dietary information';
COMMENT ON TABLE orders IS 'Customer orders with complete financial calculations and status tracking';
COMMENT ON TABLE order_items IS 'Individual items within orders with modifiers and preparation tracking';
COMMENT ON TABLE payments IS 'Payment processing records supporting multiple payment methods';
COMMENT ON TABLE daily_sales IS 'Aggregated daily sales data for reporting and analytics';
COMMENT ON TABLE shifts IS 'Employee shift tracking with sales and tip information';
COMMENT ON TABLE audit_log IS 'Audit trail for all significant database changes';