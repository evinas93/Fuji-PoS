# FUJI Menu Import Instructions

## Generated Files

- **CSV File**: `C:\Users\User\OneDrive\Documents\repo\PoS\data\fuji_menu_items.csv`
- **Generated**: import-menu-simple.py

## Import Options

### Option 1: Use Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to Table Editor → menu_categories
3. First, create the categories manually or use the existing ones
4. Navigate to Table Editor → menu_items
5. Click "Insert" → "Import data from CSV"
6. Upload the generated CSV file
7. Map the columns correctly:
   - category → (create category_id manually)
   - name → name
   - base_price → base_price
   - etc.

### Option 2: Use Node.js Import Script

```bash
# Copy the CSV to the data directory
cp C:\Users\User\OneDrive\Documents\repo\PoS\data\fuji_menu_items.csv data/

# Run the existing import script
node scripts/import-data-only.js
```

### Option 3: Manual SQL Import

```sql
-- First create categories (run once)
INSERT INTO menu_categories (name, category_type, display_order, is_active) VALUES
('Red Wine', 'red_wine', 1, true),
('White Wine', 'white_wine', 2, true),
('Sushi Rolls', 'sushi_rolls', 3, true);
-- ... add all categories

-- Then import menu items using COPY command
\COPY menu_items FROM 'C:\Users\User\OneDrive\Documents\repo\PoS\data\fuji_menu_items.csv' WITH CSV HEADER;
```

## Next Steps

1. Review the generated CSV file for accuracy
2. Choose your preferred import method
3. Test the imported data in your POS system
4. Verify menu items appear correctly in the application

## Troubleshooting

- If categories don't exist, create them first
- Check for any special characters in item names
- Verify price formatting (should be decimal numbers)
- Ensure all required fields are populated
