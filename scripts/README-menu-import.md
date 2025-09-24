# FUJI Menu Import from PDF

This directory contains tools to import menu items from the FUJI_menu.pdf into your Supabase database.

## Quick Start

### 1. Setup Python Environment

```bash
# Make setup script executable and run it
chmod +x scripts/setup-python-import.sh
./scripts/setup-python-import.sh
```

### 2. Verify Environment Variables

Ensure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run the Import

```bash
python3 scripts/import-menu-from-pdf.py
```

## What the Import Does

The import process will:

1. **Extract text** from `docs/reference/FUJI_menu.pdf`
2. **Parse menu items** and categorize them automatically
3. **Create/update categories** in your Supabase database
4. **Import all menu items** with proper pricing and metadata
5. **Verify the import** and show summary statistics

## Menu Categories Detected

The script automatically detects and creates these categories:

- Red Wine, White Wine, Blush Wine, Plum Wine
- Domestic Beer, Imported Beer, Sake
- Beverages (Soft Drinks)
- Sushi Rolls, Tempura Appetizer
- Lunch Specials, Early Bird Specials
- Dinner Entrées, Side Orders
- Children's Menu

## Features

- **Smart Price Detection**: Automatically identifies glass/bottle prices for beverages
- **Preparation Time Estimation**: Assigns realistic prep times based on item type
- **Category Color Coding**: Assigns appropriate colors to each category
- **Featured Item Detection**: Marks special items as featured
- **Batch Processing**: Handles large menus efficiently
- **Error Handling**: Comprehensive error reporting and recovery

## Troubleshooting

### Common Issues

1. **Missing PDF file**: Ensure `docs/reference/FUJI_menu.pdf` exists
2. **Supabase credentials**: Verify your `.env.local` file is correct
3. **Python packages**: Run the setup script to install dependencies
4. **Permission errors**: Make sure the script is executable (`chmod +x`)

### Manual Verification

After import, you can verify the data:

```bash
# Test your menu system
node scripts/testing/test-menu-system.js

# Check database directly
node scripts/setup/check-user-profiles.js
```

## File Structure

```
scripts/
├── import-menu-from-pdf.py      # Main import script
├── requirements.txt             # Python dependencies
├── setup-python-import.sh      # Setup script
└── README-menu-import.md       # This file
```

## Advanced Usage

### Custom Category Mapping

Edit the `category_mappings` dictionary in the script to customize category detection.

### Price Logic Customization

Modify the `_estimate_prep_time()` and `_is_featured_item()` methods to customize business logic.

### Batch Size Adjustment

Change the `batch_size` variable in `import_menu_items()` to optimize for your database performance.

## Support

If you encounter issues:

1. Check the console output for detailed error messages
2. Verify your Supabase connection
3. Ensure the PDF file is readable
4. Check Python package versions in `requirements.txt`
