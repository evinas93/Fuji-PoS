# Fuji Restaurant POS - Project Structure

This document outlines the complete folder structure for the Fuji Restaurant POS system built with **TypeScript + Next.js + Supabase**.

---

## 📁 Root Directory Structure

```
fuji-pos/
├── 📁 src/                          # Source code
├── 📁 supabase/                     # Supabase configuration and migrations
├── 📁 public/                       # Static assets
├── 📁 docs/                         # Documentation
├── 📁 tests/                        # Test files
├── 📁 scripts/                      # Build and utility scripts
├── 📁 config/                       # Configuration files
├── 📁 .vscode/                      # VS Code settings
├── 📁 .taskmaster/                  # TaskMaster AI files
├── 📄 package.json                  # Dependencies and scripts
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 next.config.js                # Next.js configuration
├── 📄 tailwind.config.js            # Tailwind CSS configuration
├── 📄 .env.local                    # Environment variables
├── 📄 .env.example                  # Environment template
├── 📄 .gitignore                    # Git ignore rules
├── 📄 README.md                     # Project overview
├── 📄 CLAUDE.md                     # Claude AI context
├── 📄 chat_log.md                   # Development progress log
└── 📄 PROJECT_STRUCTURE.md          # This file
```

---

## 🎯 Detailed Structure by Category

### 📂 `/src` - Source Code

```
src/
├── 📁 components/                   # React components
│   ├── 📁 ui/                      # Reusable UI components
│   │   ├── Button.tsx              # Custom button component
│   │   ├── Input.tsx               # Form input component
│   │   ├── Card.tsx                # Card layout component
│   │   ├── Modal.tsx               # Modal dialog component
│   │   ├── Loading.tsx             # Loading spinner component
│   │   ├── ErrorBoundary.tsx       # Error handling component
│   │   └── index.ts                # Export all UI components
│   │
│   ├── 📁 forms/                   # Form components
│   │   ├── LoginForm.tsx           # User login form
│   │   ├── MenuItemForm.tsx        # Menu item creation/edit
│   │   ├── OrderForm.tsx           # Order creation form
│   │   ├── PaymentForm.tsx         # Payment processing form
│   │   └── UserProfileForm.tsx     # User profile management
│   │
│   ├── 📁 layout/                  # Layout components
│   │   ├── Header.tsx              # Main navigation header
│   │   ├── Sidebar.tsx             # Role-based sidebar navigation
│   │   ├── Footer.tsx              # Application footer
│   │   ├── Layout.tsx              # Main layout wrapper
│   │   └── AuthLayout.tsx          # Authentication pages layout
│   │
│   ├── 📁 dashboard/               # Dashboard components
│   │   ├── SalesMetrics.tsx        # Real-time sales display
│   │   ├── ActiveOrders.tsx        # Current orders overview
│   │   ├── ServerPerformance.tsx   # Staff performance metrics
│   │   ├── SalesTrends.tsx         # Sales trend charts
│   │   └── QuickActions.tsx        # Manager quick action buttons
│   │
│   ├── 📁 menu/                    # Menu management components
│   │   ├── MenuGrid.tsx            # Menu items grid display
│   │   ├── CategoryTabs.tsx        # Menu category navigation
│   │   ├── MenuItem.tsx            # Individual menu item card
│   │   ├── MenuItemModal.tsx       # Menu item details/edit modal
│   │   ├── PriceVariations.tsx     # Price variations (glass/bottle)
│   │   ├── ModifierSelection.tsx   # Item modifiers selection
│   │   └── MenuSearch.tsx          # Menu search functionality
│   │
│   ├── 📁 orders/                  # Order management components
│   │   ├── OrderEntry.tsx          # Order creation interface
│   │   ├── OrderSummary.tsx        # Order summary display
│   │   ├── OrderItem.tsx           # Individual order item
│   │   ├── TableSelector.tsx       # Table selection component
│   │   ├── OrderModifications.tsx  # Order editing interface
│   │   ├── OrderStatus.tsx         # Order status display
│   │   └── OrderHistory.tsx        # Order history view
│   │
│   ├── 📁 payments/                # Payment processing components
│   │   ├── PaymentProcessor.tsx    # Payment processing interface
│   │   ├── PaymentMethods.tsx      # Payment method selection
│   │   ├── CashPayment.tsx         # Cash payment handling
│   │   ├── CardPayment.tsx         # Credit card processing
│   │   ├── SplitPayment.tsx        # Split payment functionality
│   │   ├── ReceiptPreview.tsx      # Receipt preview/print
│   │   └── PaymentSummary.tsx      # Payment completion summary
│   │
│   ├── 📁 kitchen/                 # Kitchen display components
│   │   ├── KitchenDisplay.tsx      # Main kitchen display
│   │   ├── OrderQueue.tsx          # Order queue display
│   │   ├── OrderTicket.tsx         # Individual order ticket
│   │   ├── PrepTimer.tsx           # Preparation time tracking
│   │   └── OrderStatusUpdate.tsx   # Status update controls
│   │
│   └── 📁 reports/                 # Reporting components
│       ├── SalesReport.tsx         # Sales reporting interface
│       ├── DateRangePicker.tsx     # Date range selection
│       ├── ReportFilters.tsx       # Report filtering options
│       ├── ExportOptions.tsx       # Data export functionality
│       ├── AnalyticsCharts.tsx     # Data visualization charts
│       └── ReportViewer.tsx        # Report display component
│
├── 📁 pages/                       # Next.js pages (App Router)
│   ├── 📁 api/                     # API routes
│   │   ├── 📁 auth/                # Authentication endpoints
│   │   │   ├── signin.ts           # User sign in
│   │   │   ├── signup.ts           # User registration
│   │   │   ├── signout.ts          # User sign out
│   │   │   └── user.ts             # Current user info
│   │   │
│   │   ├── 📁 menu/                # Menu management APIs
│   │   │   ├── items.ts            # Menu items CRUD
│   │   │   ├── categories.ts       # Menu categories
│   │   │   └── [id]/
│   │   │       ├── index.ts        # Single menu item
│   │   │       └── availability.ts # Item availability toggle
│   │   │
│   │   ├── 📁 orders/              # Order management APIs
│   │   │   ├── index.ts            # Orders CRUD
│   │   │   ├── active.ts           # Active orders
│   │   │   └── [id]/
│   │   │       ├── index.ts        # Single order
│   │   │       ├── payment.ts      # Order payment
│   │   │       └── status.ts       # Order status update
│   │   │
│   │   ├── 📁 payments/            # Payment processing APIs
│   │   │   ├── process.ts          # Process payment
│   │   │   ├── refund.ts           # Process refund
│   │   │   └── stripe-webhook.ts   # Stripe webhook handler
│   │   │
│   │   ├── 📁 analytics/           # Analytics APIs
│   │   │   ├── daily.ts            # Daily sales data
│   │   │   ├── trends.ts           # Sales trends
│   │   │   ├── real-time.ts        # Real-time metrics
│   │   │   └── export.ts           # Data export
│   │   │
│   │   └── 📁 reports/             # Reporting APIs
│   │       ├── sales.ts            # Sales reports
│   │       ├── performance.ts      # Staff performance
│   │       └── export/
│   │           ├── csv.ts          # CSV export
│   │           └── pdf.ts          # PDF export
│   │
│   ├── 📁 auth/                    # Authentication pages
│   │   ├── login.tsx               # Login page
│   │   ├── register.tsx            # User registration
│   │   └── forgot-password.tsx     # Password reset
│   │
│   ├── 📁 dashboard/               # Dashboard pages
│   │   ├── index.tsx               # Main dashboard
│   │   ├── analytics.tsx           # Analytics dashboard
│   │   └── settings.tsx            # System settings
│   │
│   ├── 📁 menu/                    # Menu management pages
│   │   ├── index.tsx               # Menu overview
│   │   ├── items.tsx               # Menu items management
│   │   ├── categories.tsx          # Category management
│   │   └── [id].tsx                # Menu item details
│   │
│   ├── 📁 orders/                  # Order management pages
│   │   ├── index.tsx               # Orders overview
│   │   ├── new.tsx                 # Create new order
│   │   ├── active.tsx              # Active orders
│   │   ├── history.tsx             # Order history
│   │   └── [id].tsx                # Order details
│   │
│   ├── 📁 payments/                # Payment pages
│   │   ├── index.tsx               # Payment processing
│   │   ├── success.tsx             # Payment success
│   │   ├── failed.tsx              # Payment failure
│   │   └── refund.tsx              # Refund processing
│   │
│   ├── 📁 kitchen/                 # Kitchen pages
│   │   ├── display.tsx             # Kitchen display system
│   │   └── orders.tsx              # Kitchen order management
│   │
│   ├── 📁 reports/                 # Reporting pages
│   │   ├── index.tsx               # Reports overview
│   │   ├── sales.tsx               # Sales reports
│   │   ├── analytics.tsx           # Analytics reports
│   │   └── export.tsx              # Export functionality
│   │
│   ├── _app.tsx                    # App component wrapper
│   ├── _document.tsx               # Custom document
│   ├── index.tsx                   # Home page
│   └── 404.tsx                     # 404 error page
│
├── 📁 lib/                         # Utility libraries
│   ├── supabase.ts                 # Supabase client configuration
│   ├── auth.ts                     # Authentication helpers
│   ├── database.ts                 # Database query helpers
│   ├── payments.ts                 # Payment processing utilities
│   ├── calculations.ts             # Business logic calculations
│   ├── validations.ts              # Data validation schemas
│   ├── constants.ts                # Application constants
│   ├── permissions.ts              # Role-based permissions
│   └── utils.ts                    # General utility functions
│
├── 📁 types/                       # TypeScript type definitions
│   ├── index.ts                    # Export all types
│   ├── database.ts                 # Database schema types
│   ├── api.ts                      # API request/response types
│   ├── auth.ts                     # Authentication types
│   ├── menu.ts                     # Menu-related types
│   ├── orders.ts                   # Order-related types
│   ├── payments.ts                 # Payment-related types
│   ├── reports.ts                  # Reporting types
│   └── common.ts                   # Common/shared types
│
├── 📁 hooks/                       # Custom React hooks
│   ├── useAuth.ts                  # Authentication hook
│   ├── useSupabase.ts              # Supabase client hook
│   ├── useOrders.ts                # Order management hook
│   ├── useMenu.ts                  # Menu management hook
│   ├── usePayments.ts              # Payment processing hook
│   ├── useAnalytics.ts             # Analytics data hook
│   ├── useRealTime.ts              # Real-time subscriptions
│   └── useLocalStorage.ts          # Local storage hook
│
├── 📁 utils/                       # Utility functions
│   ├── formatting.ts               # Data formatting utilities
│   ├── calculations.ts             # Business calculation functions
│   ├── validation.ts               # Input validation functions
│   ├── date.ts                     # Date manipulation utilities
│   ├── currency.ts                 # Currency formatting
│   ├── export.ts                   # Data export utilities
│   └── print.ts                    # Printing utilities
│
└── 📁 styles/                      # Styling files
    ├── globals.css                 # Global styles
    ├── components.css              # Component-specific styles
    └── print.css                   # Print-specific styles
```

### 📂 `/supabase` - Database & Backend

```
supabase/
├── 📁 migrations/                  # Database migrations
│   ├── 001_initial_schema.sql     # Initial database schema
│   ├── 002_rls_policies.sql       # Row Level Security policies
│   ├── 003_menu_tables.sql        # Menu-related tables
│   ├── 004_order_tables.sql       # Order management tables
│   ├── 005_analytics_views.sql    # Analytics views and functions
│   └── 006_indexes.sql            # Performance indexes
│
├── 📁 functions/                   # Edge functions
│   ├── 📁 send-receipt/           # Email receipt function
│   │   ├── index.ts               # Receipt email logic
│   │   └── deno.json             # Deno configuration
│   │
│   ├── 📁 payment-webhook/        # Stripe webhook handler
│   │   ├── index.ts              # Webhook processing
│   │   └── deno.json             # Deno configuration
│   │
│   └── 📁 analytics-processor/    # Analytics processing
│       ├── index.ts              # Analytics calculations
│       └── deno.json             # Deno configuration
│
├── config.toml                    # Supabase configuration
├── seed.sql                       # Initial data seeding
└── types.ts                       # Generated database types
```

### 📂 `/public` - Static Assets

```
public/
├── 📁 images/                      # Image assets
│   ├── 📁 menu/                   # Menu item photos
│   ├── 📁 icons/                  # Application icons
│   ├── logo.png                   # Restaurant logo
│   └── favicon.ico                # Site favicon
│
├── 📁 receipts/                   # Receipt templates
│   ├── default-template.html      # Default receipt layout
│   └── thermal-template.html      # Thermal printer template
│
├── robots.txt                     # Search engine robots
└── manifest.json                  # PWA manifest
```

### 📂 `/docs` - Documentation

```
docs/
├── 📁 api/                        # API documentation
│   ├── authentication.md          # Auth API docs
│   ├── menu-management.md         # Menu API docs
│   ├── order-processing.md        # Orders API docs
│   └── payments.md                # Payments API docs
│
├── 📁 deployment/                 # Deployment guides
│   ├── production.md              # Production deployment
│   ├── staging.md                 # Staging environment
│   └── local-development.md       # Local setup guide
│
├── 📁 user-guides/                # User documentation
│   ├── manager-guide.md           # Manager user guide
│   ├── server-guide.md            # Server user guide
│   ├── cashier-guide.md           # Cashier user guide
│   └── kitchen-guide.md           # Kitchen staff guide
│
└── 📁 technical/                  # Technical documentation
    ├── architecture.md            # System architecture
    ├── database-schema.md         # Database documentation
    ├── security.md                # Security measures
    └── performance.md             # Performance optimization
```

### 📂 `/tests` - Testing

```
tests/
├── 📁 unit/                       # Unit tests
│   ├── 📁 components/             # Component tests
│   ├── 📁 hooks/                  # Hook tests
│   ├── 📁 utils/                  # Utility function tests
│   └── 📁 lib/                    # Library tests
│
├── 📁 integration/                # Integration tests
│   ├── 📁 api/                    # API integration tests
│   ├── 📁 database/               # Database tests
│   └── 📁 auth/                   # Authentication tests
│
├── 📁 e2e/                        # End-to-end tests
│   ├── order-flow.spec.ts         # Complete order process
│   ├── payment-flow.spec.ts       # Payment processing
│   ├── kitchen-flow.spec.ts       # Kitchen workflow
│   └── reporting.spec.ts          # Report generation
│
├── setup.ts                       # Test setup configuration
├── helpers.ts                     # Test utility functions
└── fixtures/                      # Test data fixtures
```

### 📂 `/scripts` - Automation Scripts

```
scripts/
├── build.sh                       # Production build script
├── deploy.sh                      # Deployment script
├── seed-db.ts                     # Database seeding script
├── generate-types.ts              # Type generation script
├── backup-db.sh                   # Database backup script
└── migrate.ts                     # Database migration runner
```

### 📂 `/config` - Configuration Files

```
config/
├── database.ts                    # Database configuration
├── auth.ts                        # Authentication settings
├── payments.ts                    # Payment processor settings
├── email.ts                       # Email service configuration
└── analytics.ts                   # Analytics configuration
```

---

## 🔧 Key Configuration Files

### `package.json`

```json
{
  "name": "fuji-restaurant-pos",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "test:e2e": "playwright test",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:reset": "supabase db reset"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `.env.example`

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Email Configuration (via Supabase Edge Functions)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🎯 Development Workflow

### 1. **Initial Setup**

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start Supabase locally
npx supabase start

# Run database migrations
npx supabase db reset

# Start development server
npm run dev
```

### 2. **Database Development**

```bash
# Create new migration
npx supabase migration new migration_name

# Apply migrations
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript --local > supabase/types.ts
```

### 3. **Testing Workflow**

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

---

## 🚀 Deployment Structure

### **Vercel (Frontend)**

- Automatic deployment from main branch
- Environment variables configured in Vercel dashboard
- Next.js optimizations enabled

### **Supabase (Backend/Database)**

- Production database with Row Level Security
- Edge Functions for serverless backend logic
- Real-time subscriptions for live updates

### **External Services**

- **Stripe:** Payment processing
- **SendGrid/Twilio:** Email/SMS notifications
- **Vercel Analytics:** Performance monitoring

---

This folder structure follows Next.js 13+ App Router conventions while maintaining clear separation of concerns for the restaurant POS system. Each directory serves a specific purpose aligned with the business requirements outlined in the PRD and technical specifications in CLAUDE.md.

**Last Updated:** September 22, 2025
**Corresponds to:** TaskMaster Task #1 - Project Foundation Setup
