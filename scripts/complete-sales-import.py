#!/usr/bin/env python3
"""
Complete Sales Data Import Script for Fuji POS System
Exports ALL columns from Excel files for comprehensive reporting in Supabase
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import re
import os
import sys
import json

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

def clean_column_name(col_name):
    """Clean column names for database compatibility"""
    if pd.isna(col_name) or str(col_name).startswith('Unnamed:'):
        return f"unnamed_column_{str(col_name).split(':')[-1] if ':' in str(col_name) else 'unknown'}"

    # Convert to lowercase, replace spaces and special characters
    cleaned = str(col_name).lower()
    cleaned = re.sub(r'[^a-z0-9_]', '_', cleaned)
    cleaned = re.sub(r'_+', '_', cleaned)  # Replace multiple underscores with single
    cleaned = cleaned.strip('_')

    return cleaned

def export_complete_monthly_summary():
    """Export ALL columns from Grand_Totals_Sales_Summary.xlsx"""
    try:
        df = pd.read_excel('docs/reference/Grand_Totals_Sales_Summary.xlsx')

        # Clean column names
        df.columns = [clean_column_name(col) for col in df.columns]

        # Process each row
        monthly_summary_complete = []

        for idx, row in df.iterrows():
            if pd.isna(row['month']) or str(row['month']).strip() == 'MONTH':
                continue

            # Parse month/year
            month_str = str(row['month']).strip()
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
                        # Create record with ALL columns
                        record = {
                            'id': f"monthly_{year}_{month_map[month_name]:02d}",
                            'date': f"{year}-{month_map[month_name]:02d}-01",
                            'year': year,
                            'month': month_map[month_name],
                            'month_name': month_name,
                            'original_month_string': month_str
                        }

                        # Add all other columns with currency cleaning
                        for col in df.columns:
                            if col != 'month':  # Skip the month column we already processed
                                if col in ['no_of_days_closed', 'no_of_days_month']:
                                    # These are counts, not currency
                                    record[col] = int(row[col]) if not pd.isna(row[col]) and str(row[col]).replace('.', '').isdigit() else 0
                                else:
                                    # Most other columns are currency values
                                    record[col] = clean_currency(row[col])

                        monthly_summary_complete.append(record)

            except (ValueError, KeyError) as e:
                print(f"Skipping row with invalid month: {month_str} - {e}")
                continue

        # Convert to DataFrame and save
        df_complete = pd.DataFrame(monthly_summary_complete)
        df_complete.to_csv('data/monthly_summary_complete.csv', index=False)
        print(f"Processed {len(df_complete)} complete monthly summary records with {len(df_complete.columns)} columns")

        # Also create a column mapping file
        with open('data/monthly_summary_columns.json', 'w') as f:
            json.dump({
                'original_columns': list(df.columns),
                'cleaned_columns': list(df_complete.columns),
                'total_columns': len(df_complete.columns)
            }, f, indent=2)

        return df_complete

    except Exception as e:
        print(f"Error processing complete monthly summary: {e}")
        return None

def export_complete_daily_summary():
    """Export ALL columns from the monthly summary sheet (FEB 2022)"""
    try:
        df = pd.read_excel('docs/reference/Month_Year_SALES.xlsx', sheet_name='FEB 2022')

        # Clean column names
        df.columns = [clean_column_name(col) for col in df.columns]

        daily_summary_complete = []

        for idx, row in df.iterrows():
            # Skip header rows and empty rows
            if pd.isna(row['day']) or str(row['day']).strip() in ['DAY', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN', 'MON']:
                if not pd.isna(row['date']) and isinstance(row['date'], datetime):
                    # This is a valid data row
                    pass
                else:
                    continue

            try:
                # Extract date
                date_val = row['date']
                if pd.isna(date_val):
                    continue

                if isinstance(date_val, datetime):
                    record_date = date_val.strftime('%Y-%m-%d')
                else:
                    # Try to parse string date
                    continue

                # Create record with ALL columns
                record = {
                    'id': f"daily_{record_date.replace('-', '_')}",
                    'date': record_date
                }

                # Add all columns with appropriate cleaning
                for col in df.columns:
                    if col not in ['date']:  # Skip already processed columns
                        if col in ['day', 'day_1']:
                            # Day of week - keep as string
                            record[col] = str(row[col]) if not pd.isna(row[col]) else ''
                        elif 'unnamed' in col:
                            # Unnamed columns might be numeric
                            record[col] = clean_currency(row[col])
                        else:
                            # Most columns are currency values
                            record[col] = clean_currency(row[col])

                daily_summary_complete.append(record)

            except Exception as e:
                print(f"Error processing daily row: {e}")
                continue

        # Convert to DataFrame and save
        df_complete = pd.DataFrame(daily_summary_complete)
        if len(df_complete) > 0:
            df_complete.to_csv('data/daily_summary_complete.csv', index=False)
            print(f"Processed {len(df_complete)} complete daily summary records with {len(df_complete.columns)} columns")

            # Create column mapping
            with open('data/daily_summary_columns.json', 'w') as f:
                json.dump({
                    'original_columns': list(df.columns),
                    'cleaned_columns': list(df_complete.columns),
                    'total_columns': len(df_complete.columns)
                }, f, indent=2)

        return df_complete

    except Exception as e:
        print(f"Error processing complete daily summary: {e}")
        return None

def export_complete_transactions():
    """Export ALL transaction details from daily sheets"""
    try:
        xl_file = pd.ExcelFile('docs/reference/Month_Year_SALES.xlsx')

        transactions_complete = []
        transaction_id = 1

        for sheet_name in xl_file.sheet_names:
            if sheet_name == 'FEB 2022':  # Skip summary sheet
                continue

            # Process daily transaction sheets (2-1, 2-2, etc.)
            if sheet_name.startswith('2-'):
                try:
                    df = pd.read_excel('docs/reference/Month_Year_SALES.xlsx', sheet_name=sheet_name)

                    # Clean column names
                    df.columns = [clean_column_name(col) for col in df.columns]

                    # Get date from sheet name and first row
                    day = sheet_name.split('-')[1]
                    sheet_date = f"2022-02-{day.zfill(2)}"

                    # Process each transaction row
                    for idx, row in df.iterrows():
                        # Skip header rows
                        if pd.isna(row['transaction']) or str(row['transaction']).strip() in ['TRANSACTION', 'CASH/CR']:
                            continue

                        try:
                            # Create complete transaction record
                            record = {
                                'id': f"txn_{sheet_date.replace('-', '_')}_{transaction_id:03d}",
                                'date': sheet_date,
                                'sheet_name': sheet_name,
                                'row_index': idx
                            }

                            # Add ALL columns from the transaction
                            for col in df.columns:
                                if col not in ['date']:  # Skip processed columns
                                    if col in ['transaction']:
                                        # Transaction number - keep as string/number
                                        record[col] = str(row[col]) if not pd.isna(row[col]) else ''
                                    elif 'unnamed' in col:
                                        # Unnamed columns - could be various data
                                        record[col] = clean_currency(row[col]) if not pd.isna(row[col]) else 0.0
                                    else:
                                        # Most columns are currency
                                        record[col] = clean_currency(row[col])

                            # Only add record if it has meaningful data
                            if record.get('total', 0) > 0 or record.get('to_go_', 0) > 0 or record.get('dine_in', 0) > 0:
                                transactions_complete.append(record)
                                transaction_id += 1

                        except Exception as e:
                            print(f"Error processing transaction in {sheet_name}: {e}")
                            continue

                except Exception as e:
                    print(f"Error processing sheet {sheet_name}: {e}")
                    continue

        # Convert to DataFrame and save
        if transactions_complete:
            df_complete = pd.DataFrame(transactions_complete)
            df_complete.to_csv('data/transactions_complete.csv', index=False)
            print(f"Processed {len(df_complete)} complete transaction records with {len(df_complete.columns)} columns")

            # Create column mapping
            sample_sheet = pd.read_excel('docs/reference/Month_Year_SALES.xlsx', sheet_name='2-1')
            original_cols = [clean_column_name(col) for col in sample_sheet.columns]

            with open('data/transactions_columns.json', 'w') as f:
                json.dump({
                    'original_columns': original_cols,
                    'cleaned_columns': list(df_complete.columns),
                    'total_columns': len(df_complete.columns),
                    'sample_sheet': '2-1'
                }, f, indent=2)

            return df_complete

        return None

    except Exception as e:
        print(f"Error processing complete transactions: {e}")
        return None

def main():
    """Main execution function"""
    print("Starting COMPLETE sales data export process...")
    print("This will export ALL columns from both Excel files for comprehensive reporting")

    # Create output directory
    os.makedirs('data', exist_ok=True)

    # Export complete monthly summaries
    print("\nProcessing COMPLETE monthly sales summaries...")
    monthly_data = export_complete_monthly_summary()

    # Export complete daily summaries
    print("\nProcessing COMPLETE daily sales summaries...")
    daily_data = export_complete_daily_summary()

    # Export complete transaction details
    print("\nProcessing COMPLETE transaction details...")
    transaction_data = export_complete_transactions()

    # Summary
    print("\nCOMPLETE export process finished!")
    print("\nGenerated files:")

    if monthly_data is not None:
        print(f"  - data/monthly_summary_complete.csv ({len(monthly_data)} records, {len(monthly_data.columns)} columns)")
        print(f"  - data/monthly_summary_columns.json (column mapping)")

    if daily_data is not None:
        print(f"  - data/daily_summary_complete.csv ({len(daily_data)} records, {len(daily_data.columns)} columns)")
        print(f"  - data/daily_summary_columns.json (column mapping)")

    if transaction_data is not None:
        print(f"  - data/transactions_complete.csv ({len(transaction_data)} records, {len(transaction_data.columns)} columns)")
        print(f"  - data/transactions_columns.json (column mapping)")

    print("\nNext steps:")
    print("  1. Review the generated CSV files and JSON column mappings")
    print("  2. Create corresponding Supabase tables with all columns")
    print("  3. Import the complete datasets for comprehensive reporting")
    print("  4. Use the JSON files to understand original vs cleaned column names")

if __name__ == "__main__":
    main()