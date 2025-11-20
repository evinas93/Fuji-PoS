# Fuji POS Project Context

**🚨 ALWAYS READ THIS FILE FIRST BEFORE MAKING ANY CODE CHANGES 🚨**

This file ensures Claude has proper context for the Fuji Restaurant POS project.

---

## 📋 Required Reading Before Any Development

### **1. Project Documentation Files**

- **Primary:** `README.md` - Complete feature overview, usage instructions, and setup guide
- **Technical:** `CLAUDE_IMPLEMENTATION.md` - Detailed implementation documentation for recent features
- **Requirements:** `fuji-pos-prd.md` - Original business requirements document
- **Database:** `DATABASE_SETUP_GUIDE.md` - Database setup and migration instructions
- **Deployment:** `DEPLOYMENT_GUIDE.md` - Production deployment guide

### **2. Quick Context Check**

```markdown
☐ Read README.md for current features and tech stack
☐ Check CLAUDE_IMPLEMENTATION.md for recent implementations
☐ Review PRD for business requirements
☐ Verify database schema in migrations files
☐ Confirm changes align with MVP scope
```

---

## 🎯 Project Overview

**Fuji Restaurant Sales Data Automation MVP**

A streamlined point-of-sale system designed to automate the workflow from menu management through order entry to sales reporting.

### **Current Status: Production-Ready MVP (2025)**

**Recently Implemented Features:**
- ✅ Receipt Management System with popup and dashboard
- ✅ Order Editing & Voiding (Manager only)
- ✅ Flexible Tip Selection (percentage and custom amount)
- ✅ Advanced Receipt Filtering & Pagination
- ✅ Print Support (browser & thermal printer)
- ✅ Full Audit Trail for order modifications

---

## 🏗️ Tech Stack

### **Frontend**
- Next.js 14 with React 18
- TypeScript for type safety
- Tailwind CSS for styling
- TanStack Query (React Query) for state management

### **Backend**
- Node.js with TypeScript
- Next.js API Routes
- Express server (port 3001)

### **Database**
- Supabase (PostgreSQL)
- Row Level Security (RLS) policies
- Database triggers for automatic calculations
- Real-time subscriptions

### **Export & Reporting**
- xlsx library for Excel generation
- CSV export support

---

## 📁 Project Structure

```
C:\Users\evina\OneDrive\Documents\repo\PoS2\Fuji-PoS\
├── README.md                           # Main project documentation
├── CLAUDE_IMPLEMENTATION.md            # Technical implementation details
├── claude.md                           # This file - project context
├── fuji-pos-prd.md                    # Product requirements
├── DATABASE_SETUP_GUIDE.md            # Database setup instructions
├── DEPLOYMENT_GUIDE.md                # Deployment guide
│
├── src/
│   ├── components/
│   │   ├── layout/                    # Header, Sidebar, Footer
│   │   ├── menu/                      # Menu management components
│   │   ├── orders/                    # Order entry components
│   │   │   ├── SimpleOrderForm.tsx    # Order creation with tip selection
│   │   │   ├── OrderEditModal.tsx     # Edit completed orders (Manager)
│   │   │   └── VoidOrderModal.tsx     # Void orders (Manager)
│   │   ├── receipts/                  # Receipt management (NEW)
│   │   │   ├── ReceiptModal.tsx       # Receipt display modal
│   │   │   └── ReceiptsDashboard.tsx  # Receipts list and management
│   │   ├── reports/                   # Sales reporting components
│   │   └── ui/                        # Reusable UI components
│   │
│   ├── hooks/                         # Custom React hooks
│   │   └── useRealtime.ts             # Real-time data subscriptions
│   │
│   ├── lib/
│   │   ├── supabase.ts                # Supabase client
│   │   └── services/                  # Service layer
│   │       ├── export.service.ts      # Excel export functionality
│   │       ├── receipt.service.ts     # Receipt management
│   │       ├── order.service.ts       # Order operations
│   │       └── analytics.service.ts   # Analytics and reporting
│   │
│   ├── pages/                         # Next.js pages
│   │   ├── api/
│   │   │   ├── orders/[id]/receipt.ts # Receipt API (JSON & HTML)
│   │   │   ├── receipts/index.ts      # Receipts list API
│   │   │   └── analytics/export.ts    # Export API
│   │   ├── menu/                      # Menu management page
│   │   ├── orders/
│   │   │   ├── new.tsx                # Create order
│   │   │   └── [id].tsx               # Order details
│   │   └── reports.tsx                # Sales reports (includes Receipts tab)
│   │
│   └── types/                         # TypeScript type definitions
│
├── supabase/
│   └── migrations/                    # Database migrations
│       ├── 001_initial_schema.sql
│       ├── 002_functions_and_triggers.sql
│       ├── 006_mvp_simplified_schema.sql
│       ├── 007_fix_daily_sales_trigger.sql
│       └── 008_fix_calculate_order_totals.sql
│
├── scripts/
│   └── apply-migration.ts             # Database migration utility
│
└── data/                              # Sample data and templates
```

---

## 🎯 Core Features

### **1. Menu Management**
- Add, edit, and delete menu items
- Simple pricing structure (base price only)
- Category organization
- Search and filter capabilities

### **2. Order Entry**
- Simple order creation interface
- Item selection from menu
- Order type selection (Dine-In / Take-Out)
- Payment method tracking (Cash / Credit / Debit / Gift Card)
- **Flexible Tip Selection:**
  - Percentage-based tips (0%, 15%, 18%, 20%)
  - Custom dollar amount tips
  - Real-time tip calculation
- **Additional Transaction Fields:**
  - Tip Cash & Tip Credit tracking
  - Coupon/Discount subtraction
  - Service charge for merchant & owner
- Automatic calculation of Subtotal, Tax (8%), Tip, and Total

### **3. Receipt Management**
- **Automatic Receipt Popup:** Displays immediately after order completion
- **Receipt Modal:** Beautiful, itemized receipt display with:
  - All order items with quantities and prices
  - Modifiers and special instructions
  - Cost breakdown (subtotal, tax, tip, total)
  - Table number for dine-in orders
- **Print Support:** Browser print dialog and thermal printer formatting
- **Receipt Actions:** View, print, and reprint receipts anytime

### **4. Receipts Dashboard**
- **Comprehensive Receipts List:** View all historical receipts
- **Advanced Filtering:**
  - Date range selection
  - Order number search
  - Order type filter (dine-in/take-out)
  - Payment method filter
- **Pagination:** 20 receipts per page with navigation
- **Quick Actions:** View, Print, Edit (Manager), Void (Manager)

### **5. Order Management (Manager Only)**
- **Edit Completed Orders:**
  - Modify item quantities
  - Adjust prices
  - Remove items
  - Required reason for all changes
  - Full audit trail logging
- **Void Orders:**
  - Mark orders as void with required reason
  - Exclude from sales reports
  - Permanent audit log
- **Permission-Based Access:** Manager and Admin roles only

### **6. Sales Reporting & Export**
- **Daily Summary:** View sales data for any specific day
- **Monthly Export:** Export sales data to Month_Year_SALES.xlsx format (without $ signs)
- **Grand Totals:** Aggregate all-time sales across all months to Grand_Totals_Sales_Summary.xlsx
- **Receipts Tab:** Access receipt management dashboard
- CSV export support

---

## 💾 Database Schema

### **Core Tables**

#### `menu_items`
- id (uuid)
- category_id (uuid)
- name (text)
- description (text)
- base_price (numeric)
- is_available (boolean)
- created_at, updated_at (timestamp)

#### `orders`
- id (uuid)
- order_number (serial, unique)
- order_type (enum: 'dine_in' | 'take_out')
- subtotal (numeric)
- tax_rate, tax_amount (numeric)
- gratuity_rate, gratuity_amount (numeric)
- total_amount (numeric)
- payment_method (enum: 'cash' | 'credit' | 'debit' | 'gift_card')
- status (enum: 'pending', 'completed', 'cancelled', etc.)
- is_void (boolean)
- void_reason (text)
- void_by (uuid)
- server_id, cashier_id (uuid)
- **tip_cash, tip_cr** (numeric) - Cash and credit tip tracking
- **coupon_subtract** (numeric) - Coupon discount amount
- **sc_merch, sc_owner** (numeric) - Service charges
- created_at, completed_at, updated_at (timestamp)

#### `order_items`
- id (uuid)
- order_id (uuid)
- item_id (uuid)
- quantity (integer)
- unit_price (numeric)
- item_name (text)
- total_price (numeric)
- created_at (timestamp)

#### `audit_log`
- id (uuid)
- table_name (text)
- record_id (uuid)
- action (text)
- old_values (jsonb)
- new_values (jsonb)
- changed_by (uuid)
- created_at (timestamp)

---

## 📊 Critical Business Rules

### **Payment Calculations**

```typescript
// Subtotal calculation
Subtotal = Sum of (item_price × quantity)

// Tax calculation (8%)
Tax = Subtotal × 0.08

// Tip calculation (flexible)
// Option 1: Percentage-based
Tip = (Subtotal + Tax) × (tipPercentage / 100)

// Option 2: Custom amount
Tip = customTipAmount

// Final total
Total = Subtotal + Tax + Tip - Coupon + ServiceCharges
```

### **Service Calculations**

```typescript
// Additional tracking fields
tip_cash: number      // Cash tip amount
tip_cr: number        // Credit tip amount
coupon_subtract: number  // Coupon discount
sc_merch: number      // Service charge - merchant
sc_owner: number      // Service charge - owner
```

### **Order Status Flow**

```
pending → completed → [can be voided or edited by Manager]
```

---

## 🔒 User Roles & Permissions

### **Manager / Admin**
- Full system access
- Edit completed orders
- Void orders
- Access all reports
- User management

### **Server / Cashier**
- Create orders
- Process payments
- View receipts
- Basic reporting

### **Kitchen**
- View orders
- Update order status (if implemented)

---

## 🚨 Development Guardrails

### **NEVER Do These Without Context:**

- ❌ Change database schema without creating a migration file
- ❌ Modify payment calculations without validation
- ❌ Add features beyond MVP scope without approval
- ❌ Skip TypeScript type definitions
- ❌ Bypass permission guards for manager-only features

### **ALWAYS Do These:**

- ✅ Reference README.md for current features
- ✅ Check CLAUDE_IMPLEMENTATION.md for implementation details
- ✅ Create migration files for database changes
- ✅ Use service layer pattern for business logic
- ✅ Follow TypeScript type safety
- ✅ Implement proper error handling
- ✅ Add audit logging for sensitive operations
- ✅ Test against Supabase RLS policies
- ✅ Validate permission guards for protected features

---

## 🛠️ Development Commands

```bash
npm run dev          # Start Next.js development server (port 3000)
npm run dev:all      # Start both frontend (3000) and backend API (3001)
npm run build        # Build for production
npm run start        # Start production server
npm run server       # Start backend API server
npm run server:dev   # Start backend API in watch mode
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
```

---

## 🗄️ Database Migrations

### **Applying Migrations**

```bash
# Install PostgreSQL client
npm install --save-dev pg @types/pg

# Apply a specific migration
npx tsx scripts/apply-migration.ts 008_fix_calculate_order_totals.sql

# Or apply via Supabase dashboard SQL editor
```

### **Migration Files Location**
`supabase/migrations/`

### **Recent Migrations**
- `008_fix_calculate_order_totals.sql` - Fixed order_type field error in trigger function

---

## 📝 Service Layer Pattern

All business logic is encapsulated in service classes:

### **ReceiptService** (`src/lib/services/receipt.service.ts`)
- `getReceipt(orderId)` - Fetch single receipt with items
- `getReceipts(filters)` - Fetch filtered list of receipts
- `printReceipt(orderId)` - Open print dialog
- `formatForThermalPrinter(receipt)` - Generate thermal printer format

### **ExportService** (`src/lib/services/export.service.ts`)
- `exportMonthlyToExcel(month, year)` - Export Month_Year_SALES.xlsx
- `exportGrandTotals()` - Export Grand_Totals_Sales_Summary.xlsx

### **OrderService** (`src/lib/services/order.service.ts`)
- Order creation and management
- Calculation logic

### **AnalyticsService** (`src/lib/services/analytics.service.ts`)
- Daily sales summaries
- Report generation

---

## 🎨 UI Component Patterns

### **Modal Pattern**
All modals use the shared `Modal` component with consistent props:
```typescript
<Modal
  isOpen={boolean}
  onClose={() => void}
  title={string}
  size="sm" | "md" | "lg" | "xl"
>
  {children}
</Modal>
```

### **Permission Guard Pattern**
Protected features use `PermissionGuard` wrapper:
```typescript
<PermissionGuard allowedRoles={['manager', 'admin']}>
  <Button>Edit Order</Button>
</PermissionGuard>
```

### **Button Variants**
```typescript
variant: 'primary' | 'secondary' | 'danger'
size: 'sm' | 'md' | 'lg'
isLoading: boolean
disabled: boolean
```

---

## 🔍 Quick Reference for Common Tasks

### **Adding a New Feature**
1. Check if it aligns with MVP scope (README.md)
2. Create necessary service methods
3. Build UI components using existing patterns
4. Add TypeScript interfaces/types
5. Implement permission guards if needed
6. Add audit logging if modifying sensitive data
7. Update documentation

### **Fixing a Bug**
1. Identify the affected component/service
2. Check CLAUDE_IMPLEMENTATION.md for context
3. Review database schema if data-related
4. Test fix against Supabase
5. Verify no TypeScript errors
6. Update migration if schema change needed

### **Database Schema Change**
1. Create new migration file in `supabase/migrations/`
2. Write SQL with proper naming convention
3. Test migration on development database
4. Apply using `scripts/apply-migration.ts`
5. Update TypeScript types
6. Update documentation

---

## 📚 Key Implementation References

### **Receipt Management System**
See `CLAUDE_IMPLEMENTATION.md` Section 1 for:
- ReceiptService implementation
- ReceiptModal component structure
- ReceiptsDashboard filtering logic
- API endpoint design

### **Order Management (Manager Only)**
See `CLAUDE_IMPLEMENTATION.md` Section 2 for:
- OrderEditModal implementation
- VoidOrderModal implementation
- Audit logging pattern
- Permission guard usage

### **Tip Selection System**
See `CLAUDE_IMPLEMENTATION.md` Section 3 for:
- Tip calculation logic
- UI toggle pattern
- State management approach

### **Database Fixes**
See `CLAUDE_IMPLEMENTATION.md` Section 4 for:
- Migration file structure
- Trigger function debugging
- Error resolution patterns

---

## 🎯 MVP Scope - What's Included

### **Core Automation Focus:**
1. Manual menu input from Fuji menu (PDF) into system
2. Daily order entry with automatic receipt total calculation
3. Sales data aggregation into Month_Year_SALES.xlsx format
4. Grand totals reporting across all months
5. Receipt management with filtering and printing
6. Order editing and voiding (Manager only)

### **Intentionally Excluded (Not MVP):**
- Kitchen display system
- Real-time order tracking for in-progress orders
- Advanced analytics and AI forecasting
- Full inventory management
- Split payments across multiple payment methods
- Customer relationship management (CRM)

---

## 💡 Tips for Claude Sessions

### **Session Startup:**
1. Read this file (claude.md) first
2. Check README.md for current features
3. Review CLAUDE_IMPLEMENTATION.md for recent changes
4. Verify environment is running (`npm run dev:all`)

### **During Development:**
- Keep README.md open for feature reference
- Reference CLAUDE_IMPLEMENTATION.md for patterns
- Check database schema in migrations files
- Test changes against Supabase
- Follow existing code patterns and service layer structure

### **Before Completion:**
- Ensure TypeScript compiles without errors
- Test feature in browser
- Update documentation if needed
- Verify permission guards work correctly
- Check audit logging is in place

---

## 🌐 Environment Setup

### **Required Environment Variables**
Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
```

### **Local Development**
```bash
npm install
npm run dev:all
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

---

**Last Updated:** January 2025
**Project Status:** Production-Ready MVP
**Current Phase:** Active Development with Recent Enhancements
