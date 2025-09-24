#!/usr/bin/env python3
"""
Fuji Restaurant POS System - Simple Menu Import from PDF
Extracts menu items from FUJI_menu.pdf and creates a CSV for manual import
"""

import os
import sys
import re
import csv
from pathlib import Path

try:
    import PyPDF2
except ImportError:
    print("❌ PyPDF2 not installed. Run: pip install PyPDF2")
    sys.exit(1)

class SimpleMenuImporter:
    def __init__(self):
        """Initialize the menu importer"""
        self.pdf_path = Path(__file__).parent.parent / 'docs' / 'reference' / 'FUJI_menu.pdf'
        
        if not self.pdf_path.exists():
            print(f"❌ PDF file not found: {self.pdf_path}")
            sys.exit(1)

    def extract_text_from_pdf(self) -> str:
        """Extract text content from the FUJI menu PDF"""
        print("📄 Extracting text from FUJI_menu.pdf...")
        
        try:
            with open(self.pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ''
                
                for page_num, page in enumerate(reader.pages):
                    page_text = page.extract_text()
                    text += page_text + '\n'
                    print(f"   ✅ Processed page {page_num + 1}/{len(reader.pages)}")
                
                print(f"📝 Extracted {len(text)} characters from PDF")
                return text
                
        except Exception as e:
            print(f"❌ Error reading PDF: {e}")
            sys.exit(1)

    def parse_menu_text(self, text: str) -> list:
        """Parse extracted text to identify menu items and categories"""
        print("🔍 Parsing menu text for items and categories...")
        
        menu_items = []
        lines = text.split('\n')
        current_category = ''
        current_category_type = ''
        
        # Define category mappings based on the menu structure
        category_mappings = {
            'RED WINE': ('Red Wine', 'red_wine'),
            'WHITE WINE': ('White Wine', 'white_wine'),
            'BLUSH WINE': ('Blush Wine', 'blush_wine'),
            'PLUM WINE': ('Plum Wine', 'plum_wine'),
            'DOMESTIC BEER': ('Domestic Beer', 'domestic_beer'),
            'IMPORTED BEER': ('Imported Beer', 'imported_beer'),
            'SAKE': ('Sake', 'sake'),
            'SOFT DRINKS': ('Beverages', 'beverages'),
            'SUSHI ROLLS': ('Sushi Rolls', 'sushi_rolls'),
            'TEMPURA APPETIZER': ('Tempura Appetizer', 'tempura_appetizer'),
            'LUNCH SPECIALS': ('Lunch Specials', 'lunch_specials'),
            'EARLY BIRD SPECIALS': ('Early Bird Specials', 'early_bird'),
            'DINNER ENTREES': ('Dinner Entrées', 'dinner'),
            'SIDE ORDERS': ('Side Orders', 'side_orders'),
            'CHILDREN\'S MENU': ('Children\'s Menu', 'children_menu')
        }
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if this line is a category header
            category_found = False
            for pdf_category, (db_name, db_type) in category_mappings.items():
                if pdf_category in line.upper():
                    current_category = db_name
                    current_category_type = db_type
                    category_found = True
                    print(f"   📂 Found category: {current_category}")
                    break
            
            if category_found:
                continue
            
            # Parse menu items with prices
            price_patterns = [
                r'\$(\d+\.?\d*)',  # $12.00
                r'(\d+\.?\d*)\s*$',  # 12.00 at end of line
            ]
            
            for pattern in price_patterns:
                matches = re.findall(pattern, line)
                if matches:
                    price = float(matches[0])
                    
                    # Extract item name by removing price
                    item_name = re.sub(pattern, '', line).strip()
                    item_name = re.sub(r'\s+', ' ', item_name)  # Clean up whitespace
                    
                    if len(item_name) > 2 and current_category:  # Valid item name
                        # Determine if this is a glass/bottle price for beverages
                        glass_price = None
                        bottle_price = None
                        lunch_price = None
                        dinner_price = None
                        
                        if current_category_type in ['red_wine', 'white_wine', 'blush_wine', 'plum_wine', 'domestic_beer', 'imported_beer', 'sake']:
                            # For beverages, assume glass price first
                            glass_price = price
                        elif 'lunch' in item_name.lower() or current_category_type == 'lunch_specials':
                            lunch_price = price
                        elif current_category_type == 'dinner':
                            dinner_price = price
                        else:
                            # Default base price
                            pass
                        
                        menu_items.append({
                            'category': current_category,
                            'category_type': current_category_type,
                            'name': item_name,
                            'description': '',
                            'base_price': price,
                            'glass_price': glass_price,
                            'bottle_price': bottle_price,
                            'lunch_price': lunch_price,
                            'dinner_price': dinner_price,
                            'preparation_time': self._estimate_prep_time(item_name, current_category_type),
                            'is_available': True,
                            'is_featured': self._is_featured_item(item_name)
                        })
                        
                        print(f"   🍽️  Found item: {item_name} - ${price}")
                    break
        
        print(f"📊 Parsed {len(menu_items)} menu items")
        return menu_items

    def _estimate_prep_time(self, item_name: str, category_type: str) -> int:
        """Estimate preparation time based on item type"""
        item_lower = item_name.lower()
        
        if category_type in ['red_wine', 'white_wine', 'blush_wine', 'plum_wine', 'domestic_beer', 'imported_beer', 'sake', 'beverages']:
            return 0  # Instant
        elif 'sushi' in item_lower or 'roll' in item_lower:
            return 15  # Sushi preparation
        elif 'tempura' in item_lower:
            return 12  # Tempura cooking
        elif 'soup' in item_lower:
            return 8  # Soup heating
        elif 'salad' in item_lower:
            return 5  # Salad preparation
        elif 'rice' in item_lower or 'noodle' in item_lower:
            return 10  # Rice/noodle dishes
        else:
            return 15  # Default for other items

    def _is_featured_item(self, item_name: str) -> bool:
        """Determine if item should be featured based on name"""
        featured_keywords = ['special', 'chef', 'signature', 'house', 'favorite', 'popular']
        return any(keyword in item_name.lower() for keyword in featured_keywords)

    def save_to_csv(self, menu_items: list):
        """Save menu items to CSV file"""
        output_file = Path(__file__).parent.parent / 'data' / 'fuji_menu_items.csv'
        output_file.parent.mkdir(exist_ok=True)
        
        print(f"💾 Saving {len(menu_items)} items to {output_file}")
        
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = [
                'category', 'category_type', 'name', 'description', 'base_price',
                'glass_price', 'bottle_price', 'lunch_price', 'dinner_price',
                'preparation_time', 'is_available', 'is_featured'
            ]
            
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for item in menu_items:
                writer.writerow(item)
        
        print(f"✅ CSV file created: {output_file}")
        return output_file

    def create_import_instructions(self, csv_file: Path):
        """Create instructions for importing the CSV"""
        instructions_file = Path(__file__).parent.parent / 'scripts' / 'MENU_IMPORT_INSTRUCTIONS.md'
        
        instructions = f"""# FUJI Menu Import Instructions

## Generated Files

- **CSV File**: `{csv_file}`
- **Generated**: {Path(__file__).name}

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
cp {csv_file} data/

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
\\COPY menu_items FROM '{csv_file}' WITH CSV HEADER;
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
"""
        
        with open(instructions_file, 'w', encoding='utf-8') as f:
            f.write(instructions)
        
        print(f"📋 Import instructions created: {instructions_file}")

    def run_import(self):
        """Run the complete import process"""
        print("🚀 Starting FUJI menu import process...\n")
        
        try:
            # Step 1: Extract text from PDF
            text = self.extract_text_from_pdf()
            
            # Step 2: Parse menu items
            menu_items = self.parse_menu_text(text)
            
            if not menu_items:
                print("❌ No menu items found in PDF")
                return
            
            # Step 3: Save to CSV
            csv_file = self.save_to_csv(menu_items)
            
            # Step 4: Create import instructions
            self.create_import_instructions(csv_file)
            
            print(f"\n🎉 Import process completed!")
            print(f"📊 Total items extracted: {len(menu_items)}")
            print(f"📁 CSV file: {csv_file}")
            print(f"📋 Instructions: scripts/MENU_IMPORT_INSTRUCTIONS.md")
            print("\n🚀 Next steps:")
            print("1. Review the CSV file")
            print("2. Follow the import instructions")
            print("3. Test your POS system")
            
        except Exception as e:
            print(f"❌ Import failed: {e}")
            import traceback
            traceback.print_exc()

def main():
    """Main entry point"""
    importer = SimpleMenuImporter()
    importer.run_import()

if __name__ == "__main__":
    main()
