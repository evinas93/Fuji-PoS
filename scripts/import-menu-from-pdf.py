#!/usr/bin/env python3
"""
Fuji Restaurant POS System - Menu Import from PDF
Extracts menu items from FUJI_menu.pdf and imports them into Supabase
"""

import os
import sys
import re
import json
from pathlib import Path
from typing import List, Dict, Optional, Tuple

# Add the parent directory to the path to import from project root
sys.path.append(str(Path(__file__).parent.parent))

try:
    import PyPDF2
    import pandas as pd
    from supabase import create_client, Client
    from dotenv import load_dotenv
except ImportError as e:
    print(f"❌ Missing required package: {e}")
    print("📦 Please install requirements: pip install -r scripts/requirements.txt")
    sys.exit(1)

# Load environment variables
load_dotenv(Path(__file__).parent.parent / '.env.local')

class MenuImporter:
    def __init__(self):
        """Initialize the menu importer with Supabase connection"""
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            print("❌ Missing Supabase credentials in .env.local")
            print("Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
            sys.exit(1)
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
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

    def parse_menu_text(self, text: str) -> List[Dict]:
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
                            'name': item_name,
                            'category': current_category,
                            'category_type': current_category_type,
                            'base_price': price,
                            'glass_price': glass_price,
                            'bottle_price': bottle_price,
                            'lunch_price': lunch_price,
                            'dinner_price': dinner_price,
                            'description': '',
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

    def get_or_create_categories(self, menu_items: List[Dict]) -> Dict[str, str]:
        """Get existing categories or create new ones, return category_id mapping"""
        print("📂 Managing menu categories...")
        
        # Get unique categories from menu items
        categories = {}
        for item in menu_items:
            if item['category'] not in categories:
                categories[item['category']] = item['category_type']
        
        category_id_map = {}
        
        for category_name, category_type in categories.items():
            # Check if category already exists
            result = self.supabase.table('menu_categories').select('id').eq('name', category_name).execute()
            
            if result.data:
                category_id_map[category_name] = result.data[0]['id']
                print(f"   ✅ Using existing category: {category_name}")
            else:
                # Create new category
                category_data = {
                    'name': category_name,
                    'category_type': category_type,
                    'display_order': len(category_id_map) + 1,
                    'is_active': True,
                    'color': self._get_category_color(category_type)
                }
                
                result = self.supabase.table('menu_categories').insert(category_data).execute()
                
                if result.data:
                    category_id_map[category_name] = result.data[0]['id']
                    print(f"   🆕 Created new category: {category_name}")
                else:
                    print(f"   ❌ Failed to create category: {category_name}")
        
        return category_id_map

    def _get_category_color(self, category_type: str) -> str:
        """Get appropriate color for category type"""
        color_map = {
            'red_wine': '#722f37',
            'white_wine': '#f3e5ab',
            'blush_wine': '#ffc0cb',
            'plum_wine': '#8b4789',
            'domestic_beer': '#f28e1c',
            'imported_beer': '#ffd700',
            'sake': '#e6e6fa',
            'beverages': '#4169e1',
            'sushi_rolls': '#ff6347',
            'tempura_appetizer': '#ffa500',
            'lunch_specials': '#32cd32',
            'early_bird': '#ff69b4',
            'dinner': '#8b4513',
            'side_orders': '#9370db',
            'children_menu': '#00ced1'
        }
        return color_map.get(category_type, '#666666')

    def import_menu_items(self, menu_items: List[Dict], category_id_map: Dict[str, str]):
        """Import menu items to Supabase"""
        print("💾 Importing menu items to Supabase...")
        
        # Clear existing menu items (optional - comment out if you want to keep existing)
        print("🗑️  Clearing existing menu items...")
        delete_result = self.supabase.table('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print(f"   🗑️  Cleared {len(delete_result.data) if delete_result.data else 0} existing items")
        
        # Prepare items for insertion
        items_to_insert = []
        for item in menu_items:
            category_id = category_id_map.get(item['category'])
            if not category_id:
                print(f"   ⚠️  Skipping item '{item['name']}' - no category found")
                continue
            
            item_data = {
                'category_id': category_id,
                'name': item['name'],
                'description': item['description'],
                'base_price': item['base_price'],
                'glass_price': item.get('glass_price'),
                'bottle_price': item.get('bottle_price'),
                'lunch_price': item.get('lunch_price'),
                'dinner_price': item.get('dinner_price'),
                'preparation_time': item['preparation_time'],
                'is_available': item['is_available'],
                'is_featured': item['is_featured'],
                'display_order': len(items_to_insert) + 1
            }
            items_to_insert.append(item_data)
        
        # Insert items in batches
        batch_size = 50
        total_inserted = 0
        
        for i in range(0, len(items_to_insert), batch_size):
            batch = items_to_insert[i:i + batch_size]
            
            result = self.supabase.table('menu_items').insert(batch).execute()
            
            if result.data:
                total_inserted += len(result.data)
                print(f"   ✅ Inserted batch {i//batch_size + 1}: {len(result.data)} items")
            else:
                print(f"   ❌ Failed to insert batch {i//batch_size + 1}")
        
        print(f"🎉 Successfully imported {total_inserted} menu items!")

    def verify_import(self):
        """Verify the import was successful"""
        print("🔍 Verifying import...")
        
        # Check categories
        categories_result = self.supabase.table('menu_categories').select('*').execute()
        print(f"   📂 Categories: {len(categories_result.data) if categories_result.data else 0}")
        
        # Check menu items
        items_result = self.supabase.table('menu_items').select('*').execute()
        print(f"   🍽️  Menu items: {len(items_result.data) if items_result.data else 0}")
        
        # Show sample items
        if items_result.data:
            print("\n📋 Sample imported items:")
            for item in items_result.data[:5]:
                print(f"   • {item['name']} - ${item['base_price']}")
        
        return len(items_result.data) if items_result.data else 0

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
            
            # Step 3: Get or create categories
            category_id_map = self.get_or_create_categories(menu_items)
            
            # Step 4: Import menu items
            self.import_menu_items(menu_items, category_id_map)
            
            # Step 5: Verify import
            total_items = self.verify_import()
            
            print(f"\n🎉 Import completed successfully!")
            print(f"📊 Total items imported: {total_items}")
            print("🚀 Your POS system is ready to use!")
            
        except Exception as e:
            print(f"❌ Import failed: {e}")
            import traceback
            traceback.print_exc()

def main():
    """Main entry point"""
    importer = MenuImporter()
    importer.run_import()

if __name__ == "__main__":
    main()
