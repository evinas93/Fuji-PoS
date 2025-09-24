#!/usr/bin/env python3
"""
Sales Data Import Script for Fuji POS System
Converts Excel sales data to clean CSV files for Supabase import
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import re
import os
import sys

def clean_currency(value):
    """Remove $ signs and convert to float"""
    if pd.isna(value) or value == '' or value == 0:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    # Remove $ and commas, handle parentheses for negative values
    cleaned = str(value).replace('$', '').replace(',', '').strip()
    if cleaned.startswith('(') and cleaned.endswith(')'):
        cleaned = '-' + cleaned[1:-1]
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def process_monthly_summary():
    """Process Grand_Totals_Sales_Summary.xlsx for daily_sales table"""
    try:
        df = pd.read_excel('docs/reference/Grand_Totals_Sales_Summary.xlsx')

        # Clean up the data
        daily_sales = []

        for _, row in df.iterrows():
            if pd.isna(row['MONTH']) or row['MONTH'] == 'MONTH':
                continue

            # Parse month/year
            month_str = str(row['MONTH']).strip()
            if not month_str or month_str.lower() == 'nan':
                continue

            try:
                # Handle formats like "JAN 2021", "FEB 2022", etc.
                month_parts = month_str.split()
                if len(month_parts) >= 2:
                    month_name = month_parts[0]
                    year = int(month_parts[1])

                    # Convert month name to number
                    month_map = {
                        'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUN': 6,
                        'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12
                    }

                    if month_name in month_map:
                        # Use first day of month as date
                        date = f"{year}-{month_map[month_name]:02d}-01"

                        daily_sales.append({
                            'date': date,
                            'togo_sales': clean_currency(row['TOGO']),
                            'dine_in_sales': clean_currency(row['DINE IN']),
                            'tax_collected': clean_currency(row['TAX']),
                            'gross_sale': clean_currency(row['GROSS SALE']),
                            'gratuity_total': clean_currency(row['GRATUITY']),
                            'net_sale': clean_currency(row['NET SALE']),
                            'credit_total': clean_currency(row['CREDT TOTAL']),
                            'cash_deposited': clean_currency(row['CASH '])
                        })
            except (ValueError, KeyError) as e:
                print(f"Skipping row with invalid month: {month_str} - {e}")
                continue

        # Convert to DataFrame and save
        df_clean = pd.DataFrame(daily_sales)
        df_clean.to_csv('data/monthly_sales_summary.csv', index=False)
        print(f"Processed {len(df_clean)} monthly summary records")
        return df_clean

    except Exception as e:
        print(f"Error processing monthly summary: {e}")
        return None

def process_detailed_transactions():
    """Process Month_Year_SALES.xlsx for orders and order_items tables"""
    try:
        xl_file = pd.ExcelFile('docs/reference/Month_Year_SALES.xlsx')

        orders = []
        order_items = []
        order_id_counter = 1

        for sheet_name in xl_file.sheet_names:
            if sheet_name == 'FEB 2022':  # Skip summary sheet
                continue

            # Process daily transaction sheets (2-1, 2-2, etc.)
            if sheet_name.startswith('2-'):
                try:
                    df = pd.read_excel('docs/reference/Month_Year_SALES.xlsx', sheet_name=sheet_name)

                    # Get date from first row
                    date_row = df.iloc[0] if len(df) > 0 else None
                    if date_row is None:
                        continue

                    # Extract date
                    date_val = None
                    if 'DATE' in df.columns and not pd.isna(df.iloc[0]['DATE']):
                        date_val = df.iloc[0]['DATE']

                    if date_val and isinstance(date_val, datetime):
                        order_date = date_val.strftime('%Y-%m-%d')
                    else:
                        # Fallback: parse from sheet name
                        day = sheet_name.split('-')[1]
                        order_date = f"2022-02-{day.zfill(2)}"

                    # Process transactions (skip header rows)
                    transaction_rows = df[df['TRANSACTION'].notna() &
                                        (df['TRANSACTION'] != 'TRANSACTION') &
                                        (df['TRANSACTION'] != 'CASH/CR')].copy()

                    for _, row in transaction_rows.iterrows():
                        try:
                            # Calculate amounts
                            togo_amount = clean_currency(row.get('TO GO ', 0))
                            dinein_amount = clean_currency(row.get('DINE IN', 0))
                            total_amount = clean_currency(row.get('TOTAL', 0))
                            service_charge = clean_currency(row.get('SERVICE', 0))
                            receipt_total = clean_currency(row.get('RECEIPT ', 0))

                            if total_amount <= 0:
                                continue

                            # Determine order type
                            order_type = 'take_out' if togo_amount > 0 else 'dine_in'
                            subtotal = togo_amount + dinein_amount if (togo_amount + dinein_amount) > 0 else total_amount

                            # Calculate tax and gratuity (reverse engineer from receipt total)
                            tax = max(0, total_amount - subtotal) if subtotal > 0 else 0
                            gratuity = max(0, receipt_total - total_amount - service_charge) if receipt_total > total_amount else 0

                            # Create order record
                            order = {
                                'id': f"ord_{order_id_counter:06d}",
                                'order_date': order_date,
                                'type': order_type,
                                'table_number': None if order_type == 'take_out' else np.random.randint(1, 20),
                                'server_id': 'srv_001',  # Default server for historical data
                                'status': 'completed',
                                'subtotal': round(subtotal, 2),
                                'tax': round(tax, 2),
                                'gratuity': round(gratuity, 2),
                                'total': round(receipt_total if receipt_total > 0 else total_amount, 2),
                                'payment_method': 'credit' if service_charge > 0 else 'cash'
                            }
                            orders.append(order)

                            # Create sample order items (since we don't have item details)
                            # Generate 1-4 items per order based on subtotal
                            num_items = min(4, max(1, int(subtotal / 20)))
                            item_price = subtotal / num_items

                            for item_idx in range(num_items):
                                order_item = {
                                    'id': f"oit_{order_id_counter:06d}_{item_idx:02d}",
                                    'order_id': order['id'],
                                    'item_id': f"menu_item_{(item_idx % 10) + 1:02d}",  # Cycle through sample items
                                    'quantity': 1,
                                    'unit_price': round(item_price, 2),
                                    'modifiers': '{}',
                                    'special_instructions': ''
                                }
                                order_items.append(order_item)

                            order_id_counter += 1

                        except Exception as e:
                            print(f"Error processing transaction in {sheet_name}: {e}")
                            continue

                except Exception as e:
                    print(f"Error processing sheet {sheet_name}: {e}")
                    continue

        # Save to CSV files
        orders_df = pd.DataFrame(orders)
        order_items_df = pd.DataFrame(order_items)

        orders_df.to_csv('data/historical_orders.csv', index=False)
        order_items_df.to_csv('data/historical_order_items.csv', index=False)

        print(f"Processed {len(orders_df)} orders and {len(order_items_df)} order items")
        return orders_df, order_items_df

    except Exception as e:
        print(f"Error processing detailed transactions: {e}")
        return None, None

def main():
    """Main execution function"""
    print("Starting sales data import process...")

    # Create output directory
    os.makedirs('data', exist_ok=True)

    # Process monthly summaries
    print("\nProcessing monthly sales summaries...")
    monthly_data = process_monthly_summary()

    # Process detailed transactions
    print("\nProcessing detailed transactions...")
    orders_data, items_data = process_detailed_transactions()

    # Summary
    print("\nImport process complete!")
    print("\nGenerated files:")
    if monthly_data is not None:
        print(f"  - data/monthly_sales_summary.csv ({len(monthly_data)} records)")
    if orders_data is not None:
        print(f"  - data/historical_orders.csv ({len(orders_data)} records)")
    if items_data is not None:
        print(f"  - data/historical_order_items.csv ({len(items_data)} records)")

    print("\nNext steps:")
    print("  1. Review the generated CSV files")
    print("  2. Import to Supabase using the generated SQL scripts")
    print("  3. Verify data integrity in your database")

if __name__ == "__main__":
    main()