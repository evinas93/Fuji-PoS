# Fuji POS Database Schema Documentation

This document describes the database schema for the Fuji Restaurant Point of Sale System built on Supabase (PostgreSQL).

## Overview

The database is designed to handle all aspects of restaurant operations including:

- User management with role-based access control
- Menu management with categories, items, and modifiers
- Order processing and tracking
- Payment processing
- Basic inventory tracking
- Analytics and reporting
- Audit logging

## Database Design Principles

1. **Normalization**: Tables are properly normalized to 3NF to reduce data redundancy
2. **ACID Compliance**: All transactions maintain atomicity, consistency, isolation, and durability
3. **Performance**: Strategic indexing for frequently queried columns
4. **Security**: Row Level Security (RLS) policies for data protection
5. **Audit Trail**: Complete logging of all significant changes
6. **Scalability**: Designed to handle restaurant operations efficiently

## Core Tables

### User Management

#### `profiles`

Extends Supabase auth.users with restaurant-specific information.

| Column     | Type         | Description                                  |
| ---------- | ------------ | -------------------------------------------- |
| id         | UUID         | Primary key, references auth.users(id)       |
| username   | VARCHAR(50)  | Unique username for login                    |
| role       | user_role    | User role: manager, server, cashier, kitchen |
| first_name | VARCHAR(100) | Employee's first name                        |
| last_name  | VARCHAR(100) | Employee's last name                         |
| status     | user_status  | Account status: active, inactive, suspended  |
| phone      | VARCHAR(20)  | Contact phone number                         |
| email      | VARCHAR(255) | Contact email                                |
| hire_date  | DATE         | Employee hire date                           |

**Indexes**: role, status, username

### Menu Management

#### `categories`

Menu categories for organizing items.

| Column        | Type         | Description                |
| ------------- | ------------ | -------------------------- |
| id            | UUID         | Primary key                |
| name          | VARCHAR(100) | Category name (unique)     |
| display_order | INTEGER      | Order for display          |
| active        | BOOLEAN      | Whether category is active |
| description   | TEXT         | Category description       |
| image_url     | TEXT         | Category image URL         |

#### `menu_items`

Individual menu items with pricing and metadata.

| Column           | Type          | Description                                    |
| ---------------- | ------------- | ---------------------------------------------- |
| id               | UUID          | Primary key                                    |
| category_id      | UUID          | Foreign key to categories                      |
| name             | VARCHAR(200)  | Item name                                      |
| description      | TEXT          | Item description                               |
| base_price       | DECIMAL(10,2) | Base price                                     |
| price_variations | JSONB         | Different pricing (glass/bottle, lunch/dinner) |
| modifiers        | JSONB         | Available modifiers                            |
| availability     | BOOLEAN       | Currently available                            |
| special_flags    | JSONB         | Special flags (spicy, vegetarian, etc.)        |
| allergen_info    | JSONB         | Allergen warnings                              |
| preparation_time | INTEGER       | Prep time in minutes                           |
| popularity_score | INTEGER       | Popularity metric                              |
| cost_price       | DECIMAL(10,2) | Cost for profit calculations                   |
| image_url        | TEXT          | Item image URL                                 |

**Indexes**: category_id, availability, name (full-text search)

#### `modifiers`

Available modifiers for menu items.

| Column           | Type          | Description                           |
| ---------------- | ------------- | ------------------------------------- |
| id               | UUID          | Primary key                           |
| name             | VARCHAR(100)  | Modifier name                         |
| category         | VARCHAR(50)   | Modifier category (sauce, size, etc.) |
| price_adjustment | DECIMAL(10,2) | Price change                          |
| required         | BOOLEAN       | Required modifier                     |
| active           | BOOLEAN       | Currently available                   |

#### `menu_item_modifiers`

Junction table linking menu items to available modifiers.

### Order Management

#### `tables`

Restaurant table information.

| Column       | Type        | Description           |
| ------------ | ----------- | --------------------- |
| id           | UUID        | Primary key           |
| table_number | INTEGER     | Table number (unique) |
| capacity     | INTEGER     | Seating capacity      |
| active       | BOOLEAN     | Table is active       |
| location     | VARCHAR(50) | Table location area   |

#### `orders`

Customer orders with complete financial calculations.

| Column                | Type          | Description                                     |
| --------------------- | ------------- | ----------------------------------------------- |
| id                    | UUID          | Primary key                                     |
| order_number          | VARCHAR(20)   | Human-readable order number                     |
| order_date            | DATE          | Order date                                      |
| order_time            | TIMESTAMPTZ   | Order timestamp                                 |
| type                  | order_type    | dine_in or take_out                             |
| status                | order_status  | pending, preparing, ready, completed, cancelled |
| table_id              | UUID          | Foreign key to tables                           |
| table_number          | INTEGER       | Denormalized for quick access                   |
| server_id             | UUID          | Foreign key to profiles                         |
| customer_name         | VARCHAR(200)  | Customer name (take-out)                        |
| customer_phone        | VARCHAR(20)   | Customer phone (take-out)                       |
| party_size            | INTEGER       | Number of people                                |
| subtotal              | DECIMAL(10,2) | Order subtotal                                  |
| tax_rate              | DECIMAL(5,4)  | Applied tax rate                                |
| tax_amount            | DECIMAL(10,2) | Tax amount                                      |
| gratuity_rate         | DECIMAL(5,4)  | Gratuity rate                                   |
| gratuity_amount       | DECIMAL(10,2) | Gratuity amount                                 |
| service_charge_rate   | DECIMAL(5,4)  | Service charge rate                             |
| service_charge_amount | DECIMAL(10,2) | Service charge amount                           |
| discount_amount       | DECIMAL(10,2) | Applied discounts                               |
| total_amount          | DECIMAL(10,2) | Final total                                     |
| special_instructions  | TEXT          | Order notes                                     |
| estimated_ready_time  | TIMESTAMPTZ   | Estimated completion                            |
| completed_at          | TIMESTAMPTZ   | Actual completion time                          |
| cancelled_reason      | TEXT          | Cancellation reason                             |

**Indexes**: order_date, status, server_id, table_id, created_at, order_number

#### `order_items`

Individual items within orders.

| Column               | Type          | Description                   |
| -------------------- | ------------- | ----------------------------- |
| id                   | UUID          | Primary key                   |
| order_id             | UUID          | Foreign key to orders         |
| menu_item_id         | UUID          | Foreign key to menu_items     |
| quantity             | INTEGER       | Item quantity                 |
| unit_price           | DECIMAL(10,2) | Price per unit                |
| total_price          | DECIMAL(10,2) | Total item price              |
| applied_modifiers    | JSONB         | Applied modifiers with prices |
| special_instructions | TEXT          | Item-specific notes           |
| status               | order_status  | Item status                   |
| sent_to_kitchen_at   | TIMESTAMPTZ   | When sent to kitchen          |
| completed_at         | TIMESTAMPTZ   | When completed                |

**Indexes**: order_id, menu_item_id, status

### Payment Processing

#### `payments`

Payment records for orders.

| Column                   | Type           | Description                          |
| ------------------------ | -------------- | ------------------------------------ |
| id                       | UUID           | Primary key                          |
| order_id                 | UUID           | Foreign key to orders                |
| payment_method           | payment_method | cash, credit, debit, split           |
| payment_status           | payment_status | pending, completed, failed, refunded |
| amount                   | DECIMAL(10,2)  | Payment amount                       |
| stripe_payment_intent_id | VARCHAR(255)   | Stripe payment ID                    |
| transaction_reference    | VARCHAR(255)   | Transaction reference                |
| authorization_code       | VARCHAR(50)    | Auth code                            |
| last_four                | VARCHAR(4)     | Last 4 digits of card                |
| cash_received            | DECIMAL(10,2)  | Cash received                        |
| change_given             | DECIMAL(10,2)  | Change given                         |
| processed_at             | TIMESTAMPTZ    | Processing timestamp                 |
| processed_by             | UUID           | Who processed payment                |
| refund_amount            | DECIMAL(10,2)  | Refund amount                        |
| refund_reason            | TEXT           | Refund reason                        |
| refunded_at              | TIMESTAMPTZ    | Refund timestamp                     |
| refunded_by              | UUID           | Who processed refund                 |

**Indexes**: order_id, payment_status, payment_method, created_at

### Inventory Management

#### `inventory_items`

Basic inventory tracking.

| Column            | Type          | Description         |
| ----------------- | ------------- | ------------------- |
| id                | UUID          | Primary key         |
| name              | VARCHAR(200)  | Item name           |
| category          | VARCHAR(100)  | Item category       |
| unit              | VARCHAR(20)   | Unit of measure     |
| current_stock     | DECIMAL(10,2) | Current stock level |
| minimum_stock     | DECIMAL(10,2) | Reorder point       |
| maximum_stock     | DECIMAL(10,2) | Maximum stock       |
| cost_per_unit     | DECIMAL(10,2) | Cost per unit       |
| supplier          | VARCHAR(200)  | Supplier name       |
| last_restocked_at | TIMESTAMPTZ   | Last restock time   |
| active            | BOOLEAN       | Item is active      |

#### `inventory_adjustments`

Inventory adjustment tracking.

| Column             | Type          | Description                       |
| ------------------ | ------------- | --------------------------------- |
| id                 | UUID          | Primary key                       |
| inventory_item_id  | UUID          | Foreign key to inventory_items    |
| adjustment_type    | VARCHAR(50)   | restock, usage, waste, correction |
| quantity_change    | DECIMAL(10,2) | Quantity change (+/-)             |
| reason             | TEXT          | Adjustment reason                 |
| reference_order_id | UUID          | Related order (if usage)          |
| adjusted_by        | UUID          | Who made adjustment               |

### Analytics and Reporting

#### `daily_sales`

Daily sales summary for reporting.

| Column             | Type          | Description              |
| ------------------ | ------------- | ------------------------ |
| date               | DATE          | Sales date (primary key) |
| day_of_week        | INTEGER       | Day of week (0=Sunday)   |
| total_orders       | INTEGER       | Total order count        |
| dine_in_orders     | INTEGER       | Dine-in order count      |
| take_out_orders    | INTEGER       | Take-out order count     |
| gross_sales        | DECIMAL(10,2) | Gross sales amount       |
| dine_in_sales      | DECIMAL(10,2) | Dine-in sales            |
| take_out_sales     | DECIMAL(10,2) | Take-out sales           |
| tax_collected      | DECIMAL(10,2) | Tax collected            |
| gratuity_total     | DECIMAL(10,2) | Total gratuity           |
| service_charges    | DECIMAL(10,2) | Service charges          |
| cash_sales         | DECIMAL(10,2) | Cash sales               |
| credit_sales       | DECIMAL(10,2) | Credit sales             |
| average_ticket     | DECIMAL(10,2) | Average ticket size      |
| average_party_size | DECIMAL(4,2)  | Average party size       |
| servers_worked     | INTEGER       | Number of servers        |

**Indexes**: date, day_of_week

### System Tables

#### `audit_log`

Audit trail for all significant changes.

| Column     | Type         | Description             |
| ---------- | ------------ | ----------------------- |
| id         | UUID         | Primary key             |
| table_name | VARCHAR(100) | Table that was changed  |
| record_id  | UUID         | Record that was changed |
| action     | VARCHAR(20)  | INSERT, UPDATE, DELETE  |
| old_values | JSONB        | Before values           |
| new_values | JSONB        | After values            |
| changed_by | UUID         | User who made change    |
| changed_at | TIMESTAMPTZ  | When change occurred    |
| ip_address | INET         | IP address              |
| user_agent | TEXT         | User agent              |

**Indexes**: table_name + record_id, changed_at, changed_by

#### `system_settings`

System configuration settings.

| Column      | Type         | Description               |
| ----------- | ------------ | ------------------------- |
| key         | VARCHAR(100) | Setting key (primary key) |
| value       | TEXT         | Setting value             |
| description | TEXT         | Setting description       |
| updated_by  | UUID         | Who last updated          |
| updated_at  | TIMESTAMPTZ  | When last updated         |

## Database Functions

### Utility Functions

- `generate_order_number()`: Generates sequential order numbers (YYMMDD###)
- `calculate_order_totals()`: Calculates tax, gratuity, and totals
- `calculate_order_item_total()`: Calculates item totals with modifiers
- `update_daily_sales()`: Updates daily sales summaries
- `update_menu_item_popularity()`: Updates item popularity scores

### Business Logic Functions

- `complete_order(order_uuid)`: Completes an order and updates all related data
- `cancel_order(order_uuid, reason)`: Cancels an order with reason
- `get_dashboard_stats(date)`: Returns dashboard statistics for a date

## Triggers

### Automatic Calculations

- Order totals are calculated automatically when orders are updated
- Order item totals include modifier prices
- Daily sales are updated when orders change status

### Audit Logging

- All changes to orders, payments, menu items, and profiles are logged
- Includes before/after values and user information

### Data Integrity

- Updated timestamps are maintained automatically
- Menu item popularity is updated when items are ordered
- Basic inventory tracking when items are used

## Security (Row Level Security)

### Policies

- Users can only view their own profile
- Managers can view all profiles and manage system data
- Staff can view menu items and active orders
- Kitchen staff can view and update order status
- Audit logs are read-only except for system triggers

### Access Control

- Role-based permissions using Supabase Auth
- Fine-grained control over data access
- API endpoints respect RLS policies

## Performance Considerations

### Indexing Strategy

- Primary keys and foreign keys are automatically indexed
- Additional indexes on frequently queried columns
- Composite indexes for complex queries
- Full-text search on menu item names

### Query Optimization

- Denormalized fields for common queries (table_number in orders)
- Materialized daily sales for reporting
- Efficient joins using proper foreign key relationships

## Data Types and Constraints

### Custom Types

- Enums for status fields ensure data consistency
- JSONB for flexible data structures (modifiers, variations)
- Proper decimal precision for monetary values

### Constraints

- Check constraints for positive values (prices, quantities)
- Foreign key constraints maintain referential integrity
- Unique constraints prevent duplicates
- Not null constraints for required fields

## Migration Strategy

The database schema is managed through Supabase migrations:

1. `001_initial_schema.sql` - Core tables and relationships
2. `002_functions_and_triggers.sql` - Business logic and automation
3. `003_sample_data.sql` - Sample data for development/testing

Future migrations should:

- Be backwards compatible when possible
- Include proper rollback procedures
- Update type definitions and documentation
- Consider performance impact of changes

## Backup and Recovery

- Supabase handles automated backups
- Point-in-time recovery available
- Export capabilities for data portability
- Audit logs provide change history for recovery

This schema provides a solid foundation for the Fuji Restaurant POS System with room for future enhancements and scalability.
