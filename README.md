# Fuji Restaurant Sales Data Automation MVP

A streamlined point-of-sale system designed to automate the workflow from menu management through order entry to sales reporting.

## Overview

This MVP focuses on automating the process of:

1. **Manual menu input** from Fuji menu (PDF) into the system
2. **Daily order entry** with automatic receipt total calculation
3. **Sales data aggregation** into Month_Year_SALES.xlsx format
4. **Grand totals reporting** across all months

## Key Features

### 1. Menu Management

- Add, edit, and delete menu items
- Simple pricing structure (base price only)
- Category organization
- Search and filter capabilities

### 2. Order Entry

- Simple order creation interface
- Item selection from menu
- Order type selection (Dine-In / Take-Out)
- Payment method tracking (Cash / Credit)
- **Flexible Tip Selection**:
  - Percentage-based tips (0%, 15%, 18%, 20%)
  - Custom dollar amount tips
  - Real-time tip calculation
- **Additional Transaction Fields**:
  - Tip Cash & Tip Credit tracking
  - Coupon/Discount subtraction
  - Service charge for merchant & owner
- Automatic calculation of:
  - Subtotal
  - Tax (8%)
  - Tip/Gratuity (customizable)
  - Total

### 3. Receipt Management

- **Automatic Receipt Popup**: Displays immediately after order completion
- **Receipt Modal**: Beautiful, itemized receipt display with:
  - All order items with quantities and prices
  - Modifiers and special instructions
  - Cost breakdown (subtotal, tax, tip, total)
  - Table number for dine-in orders
- **Print Support**: Browser print dialog and thermal printer formatting
- **Receipt Actions**: View, print, and reprint receipts anytime

### 4. Receipts Dashboard

- **Comprehensive Receipts List**: View all historical receipts
- **Advanced Filtering**:
  - Date range selection
  - Order number search
  - Order type filter (dine-in/take-out)
  - Payment method filter
- **Pagination**: 20 receipts per page with navigation
- **Quick Actions**: View, Print, Edit (Manager), Void (Manager)

### 5. Order Management (Manager Only)

- **Edit Completed Orders**:
  - Modify item quantities
  - Adjust prices
  - Remove items
  - Required reason for all changes
  - Full audit trail logging
- **Void Orders**:
  - Mark orders as void with required reason
  - Exclude from sales reports
  - Permanent audit log
- **Permission-Based Access**: Manager and Admin roles only

### 6. Sales Reporting & Export

- **Daily Summary**: View sales data for any specific day
- **Monthly Export**: Export sales data to Month_Year_SALES.xlsx format (without $ signs)
- **Grand Totals**: Aggregate all-time sales across all months to Grand_Totals_Sales_Summary.xlsx
- **Receipts Tab**: Access receipt management dashboard
- CSV export support

## Technology Stack

- **Frontend**: Next.js 14 with React 18 and TypeScript
- **Backend**: Node.js with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Export**: xlsx library for Excel generation
- **State Management**: TanStack Query (React Query)

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase account and project

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Fuji-PoS
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Run database migrations:

```bash
# Apply the SQL migrations in supabase/migrations/ to your Supabase project
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Menu Management

1. Navigate to "Menu Management" from the sidebar
2. Add menu items manually from the Fuji menu PDF
3. Set item names, descriptions, and base prices
4. Organize items by category

### Creating Orders

1. Navigate to "New Order" from the sidebar
2. Select menu items to add to cart
3. Adjust quantities as needed
4. Choose order type (Dine-In or Take-Out)
5. Select payment method (Cash or Credit)
6. **Select Tip Amount**:
   - Click "Percentage" and choose 0%, 15%, 18%, or 20%
   - OR Click "Custom Amount" and enter a specific dollar amount
7. (Optional) Enter additional transaction details:
   - Tip Cash / Tip Credit amounts
   - Coupon discount
   - Service charges
8. Review calculated totals (subtotal, tax, tip, total)
9. Click "Complete Order" to save
10. **Receipt popup appears automatically** - View, print, or close

### Viewing Reports

1. Navigate to "Sales Reports" from the sidebar
2. **Daily Summary Tab**: Select a date to view that day's sales breakdown
3. **Monthly Export Tab**:
   - Select month and year
   - Click "Export to Excel" to download Month_Year_SALES.xlsx
   - Format matches the required structure without $ formatting
4. **Grand Totals Tab**:
   - View all-time sales summary
   - Click "Export Grand Totals" to download Grand_Totals_Sales_Summary.xlsx
5. **Receipts Tab** (NEW):
   - View all completed orders
   - Filter by date range, order number, type, or payment method
   - View receipt details in modal
   - Print receipts
   - Edit orders (Manager only)
   - Void orders (Manager only)

### Managing Receipts

1. Navigate to "Sales Reports" → "Receipts" tab
2. Use filters to find specific receipts:
   - Set date range with start/end dates
   - Search by order number
   - Filter by order type (All, Dine-In, Take-Out)
   - Filter by payment method
3. Click "View" to see detailed receipt in modal
4. Click "Print" to open browser print dialog
5. (Manager Only) Click "Edit" to modify completed orders
6. (Manager Only) Click "Void" to mark orders as void

### Editing Orders (Manager Only)

1. From Receipts dashboard or order detail page, click "Edit"
2. Modify quantities, prices, or remove items
3. Provide a required reason for the changes
4. Click "Save Changes"
5. All changes are logged in audit trail

### Voiding Orders (Manager Only)

1. From Receipts dashboard, click "Void" on any order
2. Enter a required reason for voiding
3. Confirm void action
4. Order is marked as void and excluded from sales reports

## Data Flow

```
Fuji Menu (PDF)
    ↓ (Manual Entry)
Menu Items in System
    ↓
Daily Order Entry
    ↓
Receipt Totals Calculated
    ↓
Daily Sales Aggregation
    ↓
Monthly Export (Month_Year_SALES.xlsx)
    ↓
Grand Totals (Grand_Totals_Sales_Summary.xlsx)
```

## Excel Export Formats

### Month_Year_SALES.xlsx

Columns (values without $ signs):

- date
- togo_sales
- dine_in_sales
- tax_collected
- gross_sale
- gratuity_total
- net_sale
- credit_total
- cash_deposited

### Grand_Totals_Sales_Summary.xlsx

Aggregates monthly data with columns:

- month (e.g., "January 2024")
- togo_sales
- dine_in_sales
- tax_collected
- gross_sale
- gratuity_total
- net_sale
- credit_total
- cash_deposited

## Project Structure

```
Fuji-PoS/
├── src/
│   ├── components/
│   │   ├── layout/          # Layout components (Header, Sidebar, Footer)
│   │   ├── menu/            # Menu management components
│   │   ├── orders/          # Order entry components
│   │   │   ├── SimpleOrderForm.tsx       # Order creation with tip selection
│   │   │   ├── OrderEditModal.tsx        # Edit completed orders (Manager)
│   │   │   └── VoidOrderModal.tsx        # Void orders (Manager)
│   │   ├── receipts/        # Receipt management (NEW)
│   │   │   ├── ReceiptModal.tsx          # Receipt display modal
│   │   │   └── ReceiptsDashboard.tsx     # Receipts list and management
│   │   ├── reports/         # Sales reporting components
│   │   └── ui/              # Reusable UI components (Modal, Button, etc.)
│   ├── hooks/               # Custom React hooks
│   ├── lib/
│   │   └── services/        # Service layer
│   │       ├── export.service.ts         # Excel export functionality
│   │       └── receipt.service.ts        # Receipt management (NEW)
│   ├── pages/               # Next.js pages
│   │   ├── api/
│   │   │   ├── orders/[id]/receipt.ts   # Receipt API (supports JSON & HTML)
│   │   │   └── receipts/index.ts        # Receipts list API (NEW)
│   │   ├── menu/           # Menu management page
│   │   ├── orders/         # Order pages
│   │   │   ├── new.tsx    # Create order with tip selection
│   │   │   └── [id].tsx   # Order details with receipt actions
│   │   └── reports.tsx     # Sales reports page (includes Receipts tab)
│   └── types/              # TypeScript type definitions
├── supabase/
│   └── migrations/         # Database migrations
│       ├── 001_initial_schema.sql
│       ├── 002_functions_and_triggers.sql
│       ├── 006_mvp_simplified_schema.sql
│       ├── 007_fix_daily_sales_trigger.sql
│       └── 008_fix_calculate_order_totals.sql  # Order calculation fix
├── scripts/
│   └── apply-migration.ts  # Database migration utility
└── data/                   # Sample data and templates
```

## Database Schema

### Core Tables

#### menu_items

- id (uuid)
- category_id (uuid)
- name (text)
- description (text)
- base_price (numeric)
- is_available (boolean)
- created_at, updated_at (timestamp)

#### orders

- id (uuid)
- order_number (serial, unique)
- order_type (enum: 'dine_in' | 'take_out')
- subtotal (numeric)
- tax_rate, tax_amount (numeric)
- gratuity_rate, gratuity_amount (numeric)
- total_amount (numeric)
- payment_method (enum: 'cash' | 'credit' | 'debit', 'gift_card')
- status (enum: 'pending', 'completed', 'cancelled', etc.)
- is_void (boolean)
- void_reason (text)
- void_by (uuid)
- server_id, cashier_id (uuid)
- **tip_cash, tip_cr** (numeric) - NEW
- **coupon_subtract** (numeric) - NEW
- **sc_merch, sc_owner** (numeric) - NEW
- created_at, completed_at, updated_at (timestamp)

#### order_items

- id (uuid)
- order_id (uuid)
- item_id (uuid)
- quantity (integer)
- unit_price (numeric)
- item_name (text)
- total_price (numeric)
- created_at (timestamp)

## Development Commands

```bash
npm run dev          # Start Next.js development server
npm run dev:all      # Start both frontend (3000) and backend API (3001)
npm run build        # Build for production
npm run start        # Start production server
npm run server       # Start backend API server
npm run server:dev   # Start backend API in watch mode
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
```

## Running Database Migrations

To apply database migrations to fix known issues:

```bash
npm install --save-dev pg @types/pg  # Install PostgreSQL client
npx tsx scripts/apply-migration.ts 008_fix_calculate_order_totals.sql
```

Or apply migrations via Supabase dashboard SQL editor.

## Documentation

For more detailed information, see:

- **[DATABASE_SETUP_GUIDE.md](DATABASE_SETUP_GUIDE.md)** - Complete database setup and migration instructions
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Production deployment guide
- **[fuji-pos-prd.md](fuji-pos-prd.md)** - Product requirements document

## Recent Enhancements (2025)

### Receipt Management System
- ✅ Automatic receipt popup after order completion
- ✅ Beautiful receipt modal with itemized display
- ✅ Receipt management dashboard with filtering
- ✅ Print support (browser & thermal printer formatting)
- ✅ View and reprint historical receipts

### Order Management & Auditing
- ✅ Edit completed orders with required reason (Manager only)
- ✅ Void orders with audit trail (Manager only)
- ✅ Full change logging in audit_log table
- ✅ Permission-based access control

### Enhanced Order Entry
- ✅ Flexible tip selection (percentage or custom amount)
- ✅ Quick tip buttons (0%, 15%, 18%, 20%)
- ✅ Additional transaction tracking:
  - Tip Cash & Tip Credit
  - Coupon/Discount subtraction
  - Service charges (merchant & owner)
- ✅ Real-time total calculation

### Technical Improvements
- ✅ Fixed order calculation triggers
- ✅ Database migration utility
- ✅ Improved API endpoints with JSON support
- ✅ TypeScript type safety throughout

## Simplified from Full POS

This system focuses on core sales automation. Advanced features intentionally excluded:

- Kitchen display system
- Real-time order tracking for in-progress orders
- Advanced analytics and AI forecasting
- Full inventory management
- Split payments across multiple payment methods
- Customer relationship management (CRM)

## Contributing

This is an internal project for Fuji Restaurant. For questions or issues, contact the development team.

## License

MIT License - Copyright (c) 2025 Fuji Restaurant Development Team
