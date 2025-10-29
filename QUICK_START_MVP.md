# Fuji POS MVP - Quick Start Guide

## Overview

This MVP automates the sales data workflow from menu entry → order processing → sales reporting.

## Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

Create `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Database Migrations

Execute the SQL files in `supabase/migrations/` in your Supabase SQL editor:

1. `001_initial_schema.sql`
2. `002_functions_and_triggers.sql`
3. `003_sample_data.sql` (optional)

### 4. Start the Application

```bash
npm run dev
```

Open http://localhost:3000

## Workflow

### Phase 1: Menu Setup (One-Time)

1. Navigate to **Menu Management**
2. Click "Add Menu Item"
3. Enter details from Fuji menu PDF:
   - Item Name (e.g., "California Roll")
   - Category (e.g., "Sushi Rolls")
   - Base Price (e.g., 12.95)
   - Description (optional)
4. Repeat for all menu items
5. Save each item

**Time Investment**: ~30-60 minutes for full menu

### Phase 2: Daily Order Entry

1. Navigate to **New Order**
2. Search or browse menu items
3. Click items to add to cart
4. Adjust quantities using +/- buttons
5. Select:
   - **Order Type**: Dine-In or Take-Out
   - **Payment Method**: Cash or Credit
6. Review calculated totals:
   - Subtotal (sum of items)
   - Tax (8% of subtotal)
   - Gratuity (20% of subtotal + tax)
   - **Total** (subtotal + tax + gratuity)
7. Click **Complete Order**

**Time per Order**: ~1-2 minutes

### Phase 3: Sales Reporting

#### Daily Summary

1. Navigate to **Sales Reports** → **Daily Summary** tab
2. Select date
3. View breakdown:
   - To-Go Sales
   - Dine-In Sales
   - Tax Collected
   - Gratuity Total
   - Net Sale
   - Credit vs Cash totals

#### Monthly Export

1. Go to **Sales Reports** → **Monthly Export** tab
2. Select Month and Year
3. Click **Export to Excel (.xlsx)**
4. File downloads as: `January_2025_SALES.xlsx`
5. Format matches Month_Year_SALES structure (without $ signs)

**Columns in export:**

- date
- togo_sales
- dine_in_sales
- tax_collected
- gross_sale
- gratuity_total
- net_sale
- credit_total
- cash_deposited

#### Grand Totals Export

1. Go to **Sales Reports** → **Grand Totals** tab
2. View all-time summary across all months
3. Click **Export Grand Totals to Excel**
4. File downloads as: `Grand_Totals_Sales_Summary.xlsx`
5. Contains monthly breakdown + grand total row

## Key Formulas

The system automatically calculates:

```
Subtotal = Sum of (item_price × quantity)
Tax = Subtotal × 0.08 (8%)
Gratuity = (Subtotal + Tax) × 0.20 (20%)
Total = Subtotal + Tax + Gratuity

Gross Sale = To-Go Sales + Dine-In Sales
Net Sale = Gross Sale + Tax + Gratuity
```

## Tips

### Menu Management

- Use clear, descriptive names matching the PDF
- Add descriptions to help with order entry
- Keep base prices up-to-date
- Mark items unavailable instead of deleting

### Order Entry

- Use the search bar to quickly find items
- Double-check quantities before completing
- Review the total before confirming
- Choose correct order type for accurate reporting

### Reporting

- Export monthly reports at month-end
- Keep exported files in organized folders (e.g., `2025/January_2025_SALES.xlsx`)
- Generate grand totals quarterly or as needed
- Use CSV export if Excel isn't available

## Troubleshooting

### Issue: Menu items not showing

**Solution**: Ensure database migrations ran successfully. Check Supabase logs.

### Issue: Orders not saving

**Solution**:

- Check Supabase connection in browser console
- Verify environment variables are correct
- Check browser network tab for errors

### Issue: Export not downloading

**Solution**:

- Check browser pop-up blocker settings
- Try a different browser
- Ensure orders exist for the selected period

### Issue: Calculations seem wrong

**Solution**:

- Tax rate: 8% on subtotal
- Gratuity: 20% on (subtotal + tax)
- Verify menu item prices are correct

## Data Backup

**Important**: Regularly backup your data!

1. In Supabase, go to Database → Backups
2. Enable daily backups
3. Keep local copies of exported Excel files
4. Export grand totals monthly as backup

## Support

For technical issues:

1. Check browser console for errors (F12)
2. Review Supabase logs
3. Verify database schema is up-to-date
4. Check that all environment variables are set

## Next Steps (Future Enhancements)

After MVP is working smoothly, consider:

- Adding customer information tracking
- Implementing table management for dine-in
- Creating weekly/yearly report views
- Adding data visualization charts
- Implementing receipt printing
- Building inventory tracking

---

**Remember**: This MVP focuses on the core workflow. Keep it simple, get it working, then enhance based on actual usage patterns.
