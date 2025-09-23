# Fuji Restaurant POS System - Project Structure

## 📁 Root Directory
```
PoS/
├── 📄 README.md                    # Main project documentation
├── 📄 package.json                 # Node.js dependencies and scripts
├── 📄 package-lock.json           # Dependency lock file
├── 📄 next.config.js              # Next.js configuration
├── 📄 tailwind.config.js          # Tailwind CSS configuration
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 jest.config.js              # Jest testing configuration
├── 📄 jest.setup.js               # Jest setup file
├── 📄 postcss.config.js           # PostCSS configuration
├── 📄 .env.local                  # Environment variables (local)
└── 📄 opencode.json               # OpenCode configuration
```

## 📁 Source Code (`src/`)
```
src/
├── 📁 components/                 # React components
│   ├── 📁 auth/                   # Authentication components
│   │   └── 📄 withAuth.tsx        # HOC for route protection
│   ├── 📁 forms/                  # Form components
│   │   └── 📄 LoginForm.tsx       # User login form
│   ├── 📁 layout/                 # Layout components
│   │   ├── 📄 Layout.tsx          # Main layout wrapper
│   │   ├── 📄 Header.tsx          # Page header
│   │   ├── 📄 Sidebar.tsx         # Navigation sidebar
│   │   ├── 📄 Footer.tsx          # Page footer
│   │   └── 📄 AuthLayout.tsx      # Authentication layout
│   ├── 📁 menu/                   # Menu management components
│   │   ├── 📄 MenuManager.tsx     # Main menu manager
│   │   ├── 📄 MenuBrowser.tsx     # Menu browsing interface
│   │   ├── 📄 MenuCategoryTabs.tsx # Category navigation
│   │   ├── 📄 MenuItemCard.tsx    # Individual menu item card
│   │   ├── 📄 MenuItemForm.tsx    # Menu item form
│   │   ├── 📄 CategoryManager.tsx # Category management
│   │   ├── 📄 BulkOperations.tsx  # Bulk operations
│   │   └── 📄 index.ts           # Export barrel
│   ├── 📁 ui/                     # Reusable UI components
│   │   ├── 📄 Button.tsx          # Button component
│   │   ├── 📄 Input.tsx           # Input component
│   │   ├── 📄 Modal.tsx           # Modal component
│   │   ├── 📄 PermissionGuard.tsx # Permission-based rendering
│   │   └── 📄 SessionWarningModal.tsx # Session timeout warning
│   ├── 📁 dashboard/              # Dashboard components (empty)
│   ├── 📁 kitchen/                # Kitchen display components (empty)
│   ├── 📁 orders/                 # Order management components (empty)
│   ├── 📁 payments/               # Payment processing components (empty)
│   └── 📁 reports/                # Reporting components (empty)
├── 📁 hooks/                      # Custom React hooks
│   ├── 📄 useAuth.ts              # Authentication hooks
│   ├── 📄 useSession.ts           # Session management hooks
│   ├── 📄 useMenu.ts              # Menu data hooks
│   ├── 📄 useOrders.ts            # Order management hooks
│   ├── 📄 useAnalytics.ts         # Analytics hooks
│   └── 📄 useRealtime.ts          # Real-time data hooks
├── 📁 lib/                        # Library and utility code
│   ├── 📄 supabase.ts             # Supabase client configuration
│   ├── 📄 permissions.ts          # Permission system
│   └── 📁 services/               # Service layer
│       ├── 📄 auth.service.ts     # Authentication service
│       ├── 📄 menu.service.ts     # Menu management service
│       ├── 📄 order.service.ts    # Order management service
│       ├── 📄 analytics.service.ts # Analytics service
│       └── 📄 realtime.service.ts # Real-time service
├── 📁 pages/                      # Next.js pages
│   ├── 📄 _app.tsx                # App wrapper
│   ├── 📁 api/                    # API routes
│   │   └── 📁 menu/               # Menu API endpoints
│   │       ├── 📄 items.ts        # Menu items API
│   │       ├── 📄 categories.ts   # Categories API
│   │       ├── 📄 modifiers.ts    # Modifiers API
│   │       ├── 📄 availability.ts # Availability API
│   │       └── 📄 bulk-update.ts  # Bulk operations API
│   ├── 📁 auth/                   # Authentication pages
│   │   └── 📄 login.tsx           # Login page
│   ├── 📁 dashboard/              # Dashboard pages
│   │   └── 📄 index.tsx           # Main dashboard
│   ├── 📁 menu/                   # Menu management pages
│   │   └── 📄 index.tsx           # Menu management page
│   ├── 📁 kitchen/                # Kitchen display pages (empty)
│   ├── 📁 orders/                 # Order management pages (empty)
│   ├── 📁 payments/               # Payment processing pages (empty)
│   └── 📁 reports/                # Reporting pages (empty)
├── 📁 server/                     # Server-side code (legacy)
│   ├── 📄 index.ts                # Server entry point
│   ├── 📁 config/                 # Server configuration
│   ├── 📁 middleware/             # Server middleware
│   └── 📁 routes/                 # Server routes
├── 📁 styles/                     # Global styles
│   └── 📄 globals.css             # Global CSS styles
├── 📁 types/                      # TypeScript type definitions
│   ├── 📄 database.ts             # Database types
│   └── 📄 env.d.ts                # Environment types
└── 📁 utils/                      # Utility functions (empty)
```

## 📁 Configuration (`config/`)
```
config/
└── 📄 env.local.example           # Environment variables template
```

## 📁 Database (`supabase/`)
```
supabase/
├── 📄 config.toml                 # Supabase configuration
├── 📁 migrations/                 # Database migrations
│   ├── 📄 001_initial_schema.sql  # Initial database schema
│   ├── 📄 002_functions_and_triggers.sql # Database functions
│   ├── 📄 003_sample_data.sql     # Sample data
│   └── 📄 004_menu_search_function.sql # Menu search functions
└── 📁 functions/                  # Edge functions (empty)
```

## 📁 Scripts (`scripts/`)
```
scripts/
├── 📄 README.md                   # Scripts documentation
├── 📁 setup/                      # Initial setup scripts
│   ├── 📄 setup-database.js       # Main database setup
│   ├── 📄 run-migrations.js       # Migration instructions
│   ├── 📄 create-demo-users.js    # Demo users creation
│   └── 📄 insert-sample-data.js   # Sample data insertion
├── 📁 database/                   # Database management
│   ├── 📄 create-sales-tables.sql # Sales tables creation
│   └── 📄 import-excel-data.js    # Excel data import
└── 📁 testing/                    # Testing scripts
    ├── 📄 test-database-connection.js # Database connection test
    └── 📄 test-menu-system.js     # Menu system tests
```

## 📁 Documentation (`docs/`)
```
docs/
├── 📄 database-schema.md          # Database schema documentation
├── 📁 reference/                  # Reference materials
│   ├── 📄 FUJI_menu.pdf           # Original menu PDF
│   ├── 📄 Grand_Totals_Sales_Summary.xlsx # Sales summary data
│   └── 📄 Month_Year_SALES.xlsx   # Monthly sales data
├── 📄 DATABASE_SETUP_GUIDE.md     # Database setup instructions
├── 📄 fuji-pos-prd.md             # Product requirements document
├── 📄 fuji-pos-task-list.md       # Task list
├── 📄 project-checklist.md        # Project checklist
├── 📄 TESTING.md                  # Testing documentation
└── 📄 PROJECT_STRUCTURE.md        # This file
```

## 📁 Testing (`tests/`)
```
tests/
├── 📁 unit/                       # Unit tests
│   ├── 📁 components/             # Component tests
│   │   ├── 📄 LoginForm.test.tsx  # Login form tests
│   │   ├── 📄 MenuCategoryTabs.test.tsx # Category tabs tests
│   │   └── 📄 MenuItemCard.test.tsx # Menu item card tests
│   ├── 📁 hooks/                  # Hook tests (empty)
│   └── 📁 lib/                    # Library tests
│       └── 📄 permissions.test.ts # Permissions tests
├── 📁 integration/                # Integration tests (empty)
└── 📁 e2e/                        # End-to-end tests (empty)
```

## 📁 Public Assets (`public/`)
```
public/
├── 📁 icons/                      # Icon files (empty)
└── 📁 images/                     # Image files (empty)
```

## 📁 Dependencies (`node_modules/`)
```
node_modules/                       # Node.js dependencies (auto-generated)
```

## 🎯 Key Features Implemented

### ✅ Completed
- **Authentication System**: Complete user authentication with Supabase
- **Role-Based Access Control**: Manager, Server, Cashier, Kitchen roles
- **Menu Management**: Full CRUD operations for menu items and categories
- **Database Schema**: Complete PostgreSQL schema with all tables
- **API Endpoints**: RESTful APIs for menu management
- **UI Components**: Reusable components with Tailwind CSS
- **Session Management**: Timeout and security features
- **Demo Users**: Pre-configured test accounts

### 🚧 In Progress
- **Order Management**: Basic structure in place
- **Payment Processing**: Basic structure in place
- **Kitchen Display**: Basic structure in place
- **Reporting**: Basic structure in place

### 📋 Next Steps
1. Implement order management functionality
2. Add payment processing with Stripe integration
3. Build kitchen display system
4. Create reporting and analytics
5. Add inventory management
6. Implement real-time updates

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start

# Run database setup
node scripts/setup/setup-database.js

# Create demo users
node scripts/setup/create-demo-users.js
```

## 🌐 Access Points

- **Application**: http://localhost:3000
- **Login**: http://localhost:3000/auth/login
- **Dashboard**: http://localhost:3000/dashboard
- **Menu Management**: http://localhost:3000/menu

## 🔑 Demo Credentials

- **Manager**: manager@fuji.com / manager123
- **Server**: server@fuji.com / server123
- **Cashier**: cashier@fuji.com / cashier123
- **Kitchen**: kitchen@fuji.com / kitchen123