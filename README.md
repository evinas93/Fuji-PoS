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
- Automatic calculation of:
  - Subtotal
  - Tax (8%)
  - Gratuity (20%)
  - Total

### 3. Sales Reporting & Export

- **Daily Summary**: View sales data for any specific day
- **Monthly Export**: Export sales data to Month_Year_SALES.xlsx format (without $ signs)
- **Grand Totals**: Aggregate all-time sales across all months to Grand_Totals_Sales_Summary.xlsx
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
6. Review calculated totals (subtotal, tax, gratuity, total)
7. Click "Complete Order" to save

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
│   │   ├── reports/         # Sales reporting components
│   │   └── ui/              # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── lib/
│   │   └── services/        # Service layer (export, etc.)
│   ├── pages/               # Next.js pages
│   │   ├── menu/           # Menu management page
│   │   ├── orders/         # Order pages
│   │   └── reports.tsx     # Sales reports page
│   └── types/              # TypeScript type definitions
├── supabase/
│   └── migrations/         # Database migrations
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
- order_type (enum: 'dine_in' | 'take_out')
- subtotal (numeric)
- tax (numeric)
- gratuity (numeric)
- total (numeric)
- payment_method (enum: 'cash' | 'credit' | 'debit')
- status (enum: 'completed', etc.)
- server_id (uuid)
- created_at, updated_at (timestamp)

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
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm test             # Run tests
```

## Simplified from Full POS

This MVP is a stripped-down version focused solely on sales data automation. Features removed:

- Complex authentication and role-based access
- Kitchen display system
- Real-time order tracking
- Advanced analytics dashboard
- AI forecasting features
- Inventory management
- Split orders and complex payment processing
- Receipt printing
- Customer management

## Contributing

This is an internal project for Fuji Restaurant. For questions or issues, contact the development team.

## License

MIT License - Copyright (c) 2025 Fuji Restaurant Development Team
