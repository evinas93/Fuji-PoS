# CLAUDE.md - Fuji Restaurant POS System

This document provides Claude with comprehensive context about the Fuji Restaurant Point of Sale (POS) System project for AI-assisted development.

---

## 🏪 Project Overview

**Project Name:** Fuji Restaurant Point of Sale (POS) System
**Version:** 1.0
**Timeline:** 20 weeks (September 2025 - February 2026)
**Client:** Fuji Restaurant Management
**Project Type:** Complete digital transformation from paper-based to modern POS system

### Current State (Problems to Solve)

- Manual paper-based ordering system
- Excel spreadsheet sales tracking
- Time-consuming order processing
- Manual calculation errors
- 30-minute end-of-day reconciliation process
- Limited visibility into real-time sales performance
- Inconsistent customer experience

### Target State (Solution Goals)

- Digital menu management with real-time updates
- Touch-optimized order processing interface
- Automated receipt generation and payment processing
- Real-time sales tracking and analytics dashboard
- Role-based user management system
- Kitchen display system integration
- Comprehensive reporting and business insights

---

## 👥 System Users & Roles

### Primary Users

- **Servers** - Order taking and payment processing
- **Cashiers** - Payment processing and receipt generation
- **Kitchen Staff** - Order viewing and preparation tracking
- **Managers** - Reporting, analytics, and system administration

### Secondary Users

- **Restaurant Owners** - Business analytics and financial reporting
- **Accounting Team** - Financial data export and reconciliation
- **Customers** - Receipt viewing and loyalty program interaction

---

## 🏗️ System Architecture

### Technology Stack Requirements

- **Frontend:** React/Next.js (touch-optimized for tablets)
- **Backend:** Node.js with TypeScript and Express.js RESTful APIs
- **Database:** Supabase (PostgreSQL with built-in auth, real-time, and API)
- **Payment Processing:** Integration with credit card processors (Stripe/Square)
- **Deployment:** Vercel/Netlify for frontend, Supabase for backend/database
- **Hardware:** iPad/Android tablets, thermal printers, POS terminals

### Core System Components

#### 1. Supabase Database Schema (Critical Tables)

```sql
-- Users (extends Supabase auth.users)
users: id (uuid), email, full_name, role, pin_code, hourly_rate, is_active, created_at, updated_at

-- Menu Items
menu_items: id (uuid), category_id, name, description, base_price, price_variations (jsonb), modifiers (jsonb), availability, special_flags (jsonb), created_at, updated_at

-- Categories
categories: id (uuid), name, display_order, active, created_at, updated_at

-- Orders
orders: id (uuid), order_date, type (dine_in/take_out), table_number, server_id (uuid), status, subtotal, tax, gratuity, total, payment_method, created_at, updated_at

-- Order Items
order_items: id (uuid), order_id (uuid), item_id (uuid), quantity, unit_price, modifiers (jsonb), special_instructions, created_at

-- Daily Sales Summary (materialized view)
daily_sales: date, togo_sales, dine_in_sales, tax_collected, gross_sale, gratuity_total, net_sale, credit_total, cash_deposited
```

#### 2. API Endpoints Structure (TypeScript/Express + Supabase)

```typescript
// Authentication (using Supabase Auth + React Query)
// Client-side authentication handled by:
// - useSignIn() hook
// - useSignOut() hook
// - useCurrentUser() hook
// - withAuth() HOC for route protection

// Menu Management
GET /api/menu/items
POST /api/menu/items
PUT /api/menu/items/:id
DELETE /api/menu/items/:id
GET /api/menu/categories
PUT /api/menu/items/:id/availability

// Order Processing
POST /api/orders (create order)
PUT /api/orders/:id (modify order)
GET /api/orders/active
GET /api/orders/:id
POST /api/orders/:id/payment
PUT /api/orders/:id/status

// Analytics & Reports
GET /api/analytics/daily
GET /api/analytics/trends
GET /api/analytics/real-time
GET /api/reports/sales/:date
GET /api/reports/export (CSV/PDF)
```

---

## 🎯 Business Requirements & Success Metrics

### Operational Targets

- **Order Processing Time:** Reduce from current to <30 seconds (40% improvement)
- **Payment Processing:** <45 seconds completion time
- **Daily Reconciliation:** <5 minutes (from 30 minutes)
- **System Uptime:** >99.9% during business hours
- **Order Accuracy:** >99% (reduce errors by 50%)

### Financial Targets

- **Average Ticket Increase:** 15% through intelligent upselling
- **Transaction Volume:** 10% increase
- **Labor Cost Reduction:** 10%
- **ROI Achievement:** Within 12 months
- **Credit Card Error Reduction:** 95%

### User Adoption Targets

- **Staff Training Completion:** 100% before go-live
- **User Satisfaction:** >4.0/5.0 rating
- **Support Tickets:** <5 per week post-launch
- **System Adoption:** 100% within 30 days

---

## 🍽️ Menu & Pricing Structure

### Menu Categories

- **Beverages:** Red Wine (5), White Wine (4), Blush Wine (3), Plum Wine (2), Domestic Beer (5), Imported Beer (3), Sake (3), Soft Drinks (7)
- **Food:** Sushi Rolls (11), Tempura Appetizers (3), Lunch Specials (10+), Early Bird Specials (3), Dinner Entrées (25+), Side Orders (6), Children's Menu (3)

### Pricing Rules

- **Price Variations:** Glass/Bottle for wines, Lunch/Dinner pricing
- **Modifiers:** Sauce options, cooking preferences, portion sizes
- **Automatic Charges:** Split plate charges, service charges
- **Tax Rate:** Configurable by jurisdiction
- **Gratuity:** 20% automatic for parties of 2 or more
- **Service Charge:** 3.5% for credit card payments

---

## 💳 Payment Processing Requirements

### Payment Methods

- Cash payments with change calculation
- Credit/debit card processing (PCI DSS compliant)
- Split payments between multiple methods
- Partial payment handling
- Refund processing with manager approval

### Calculation Engine

```
Order Total Calculation:
1. Subtotal = Sum of (item_price × quantity) + modifiers
2. Tax = Subtotal × tax_rate
3. Gratuity = (Subtotal + Tax) × 0.20 (if party ≥ 2)
4. Service Charge = Total × 0.035 (if credit card)
5. Final Total = Subtotal + Tax + Gratuity + Service_Charge - Discounts
```

### Receipt Requirements

- Restaurant name and contact information
- Date, time, server name, table number
- Itemized list with quantities and prices
- Subtotal, tax, gratuity, discounts, final total
- Payment method and change (if cash)
- Thank you message and allergen warnings

---

## 📊 Analytics & Reporting Requirements

### Real-Time Dashboard Metrics

- Current day sales total
- Active orders count
- Average ticket size
- Top selling items (Top 10)
- Server performance metrics
- Payment method breakdown
- Hourly sales trends

### Historical Reports

- Daily sales summaries
- Weekly performance comparisons
- Monthly trend analysis
- Year-over-year comparisons
- Custom date range reports
- Category performance analysis
- Item profitability reports

### Export Requirements

- CSV/Excel export for all reports
- PDF generation for formal reports
- QuickBooks integration for accounting
- Automated email delivery of daily reports
- API endpoints for external system integration

---

## 🔒 Security & Compliance Requirements

### Security Measures

- **PCI DSS Compliance:** For payment processing (handled by Stripe)
- **Supabase Row Level Security (RLS):** Database-level access control
- **Role-Based Access Control:** Manager/Server/Cashier/Kitchen roles via Supabase Auth
- **Password Requirements:** Supabase Auth with customizable password policies
- **Session Management:** JWT tokens with configurable expiration
- **Audit Trail:** All transactions logged with Supabase built-in audit features
- **Data Encryption:** SSL/TLS for transmission, AES-256 encryption at rest (Supabase default)

### Compliance Requirements

- **Tax Compliance:** Automatic tax rate updates, audit trail
- **Food Safety:** Allergen warnings, raw food disclaimers
- **Accessibility:** WCAG 2.1 Level AA compliance
- **Data Privacy:** Customer data protection, retention policies

---

## 🖥️ User Interface Specifications

### Design Principles

- **Touch-First Design:** 44x44 pixel minimum touch targets
- **Clear Visual Hierarchy:** Primary and secondary actions distinct
- **Responsive Layout:** Works on tablets (primary) and desktop
- **Color Coding:** Consistent status indicators (pending/preparing/ready)
- **Progressive Disclosure:** Advanced features hidden until needed

### Key Screen Layouts

#### Order Screen Layout

```
┌─────────────────────────────────────┐
│ [Logo] Table: 5    Server: John     │
├─────────────────────────────────────┤
│ Categories                          │
│ [Wine] [Beer] [Food] [Sushi]        │
├─────────────────────────────────────┤
│ Items              Order Summary    │
│ Shiraz $10/$30     2x Shiraz        │
│ Merlot $11/$35     1x Merlot        │
│                    1x Cal Roll      │
├─────────────────────────────────────┤
│ Subtotal: $85.00   [Send] [Pay]     │
└─────────────────────────────────────┘
```

#### Dashboard Layout

```
┌─────────────────────────────────────┐
│        Daily Sales Dashboard       │
├─────────────────────────────────────┤
│ Sales: $5,234  Orders: 127  Avg: $41│
├─────────────────────────────────────┤
│ Sales Trend: [████████████████████──]│
├─────────────────────────────────────┤
│ Top Items        Server Stats       │
│ 1. Cal Roll (45) John: $1,234      │
│ 2. Shiraz (38)   Mary: $987        │
└─────────────────────────────────────┘
```

---

## 🧪 Testing & Quality Requirements

### Testing Strategy

- **Unit Tests:** 90%+ code coverage for backend APIs
- **Integration Tests:** Complete order-to-payment workflows
- **User Acceptance Tests:** Real staff testing scenarios
- **Performance Tests:** 50 concurrent users, <2 second response times
- **Security Tests:** Penetration testing, vulnerability scans
- **Cross-Browser Tests:** Chrome, Safari, Edge compatibility

### Quality Gates

- All tests must pass before deployment
- Security scan with zero critical vulnerabilities
- Performance benchmarks must be met
- User acceptance criteria validated
- Code review approval required
- Manager sign-off on business requirements

---

## 🚀 Deployment & Launch Strategy

### Phased Implementation

1. **Phase 1 (Weeks 1-4):** Supabase setup, TypeScript backend foundation, database schema
2. **Phase 2 (Weeks 5-12):** Core development (menu, orders, payments with Stripe)
3. **Phase 3 (Weeks 13-16):** Advanced features (analytics, real-time updates, reporting)
4. **Phase 4 (Weeks 17-18):** Testing and quality assurance
5. **Phase 5 (Weeks 19-20):** Production deployment (Vercel + Supabase Pro)
6. **Phase 6 (Weeks 21-24):** Post-launch support and optimization

### Go-Live Requirements

- All staff training completed (100%)
- Production environment tested and validated
- Backup systems operational
- Support procedures established
- Rollback plan prepared and tested
- Stakeholder sign-off obtained

---

## ⚠️ Risk Assessment & Mitigation

### Technical Risks

- **Internet connectivity issues** → Implement offline mode with sync
- **Hardware failure** → Maintain backup devices on-site
- **Data breach** → Implement security best practices, PCI compliance
- **Performance degradation** → Regular monitoring and optimization

### Business Risks

- **Staff resistance to change** → Comprehensive training program
- **Budget overrun** → Phased implementation approach
- **Process disruption** → Parallel run period with fallback

### Operational Risks

- **Peak hour system failure** → Fallback to manual process, 24/7 support
- **Data migration errors** → Thorough testing and validation
- **Inadequate training** → Multiple training sessions, super-user program

---

## 📞 Support & Maintenance

### Support Structure

- **Tier 1:** In-house super users (basic troubleshooting)
- **Tier 2:** Vendor help desk (advanced issues)
- **Tier 3:** Development team (critical issues, updates)

### Maintenance Schedule

- **Daily:** Supabase automated backups, system health monitoring
- **Weekly:** Performance monitoring via Supabase dashboard, dependency updates
- **Monthly:** Feature deployments, user feedback review, database optimization
- **Quarterly:** Security audits, RLS policy review, disaster recovery tests

---

## 🎯 Success Criteria Summary

### Must-Have Features (MVP)

- ✅ Digital menu management with real-time updates
- ✅ Touch-optimized order processing
- ✅ Automated payment processing and receipt generation
- ✅ Role-based user authentication
- ✅ Basic sales reporting and analytics
- ✅ Kitchen display system integration

### Nice-to-Have Features (Future Phases)

- Online ordering system integration
- Customer-facing mobile app
- Advanced inventory management
- Marketing automation
- Multi-location support
- AI-powered sales insights

---

## ⚡ Supabase Configuration & TypeScript Types

### Supabase Project Setup

```typescript
// Environment Variables Required
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (server-side only)
```

### TypeScript Type Definitions

```typescript
// Database Types
export interface MenuItemType {
  id: string;
  category_id: string;
  name: string;
  description: string;
  base_price: number;
  price_variations: Record<string, number>;
  modifiers: ModifierType[];
  availability: boolean;
  special_flags: string[];
  created_at: string;
  updated_at: string;
}

export interface OrderType {
  id: string;
  order_date: string;
  type: 'dine_in' | 'take_out';
  table_number?: number;
  server_id: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  subtotal: number;
  tax: number;
  gratuity: number;
  total: number;
  payment_method?: 'cash' | 'credit' | 'debit';
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  role: 'manager' | 'server' | 'cashier' | 'kitchen';
  first_name: string;
  last_name: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}
```

### Supabase Row Level Security (RLS) Policies

```sql
-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Only managers can create/update menu items
CREATE POLICY "Managers can manage menu" ON menu_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'manager'
  )
);

-- Staff can view all menu items
CREATE POLICY "Staff can view menu" ON menu_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
  )
);
```

### Real-time Subscriptions Setup

```typescript
// Listen for order updates in kitchen
const subscription = supabase
  .channel('orders')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'orders',
    },
    (payload) => {
      console.log('Order updated:', payload);
      // Update UI with new order status
    }
  )
  .subscribe();
```

---

## 🔧 Development Setup & Demo Access

### Demo User Credentials

The system includes pre-configured demo users for testing (all verified and working):

| Email            | Password   | Role    | Access Level                   | Status    |
| ---------------- | ---------- | ------- | ------------------------------ | --------- |
| manager@fuji.com | manager123 | Manager | Full system access             | ✅ Active |
| server@fuji.com  | server123  | Server  | Order taking, basic reports    | ✅ Active |
| cashier@fuji.com | cashier123 | Cashier | Payment processing, orders     | ✅ Active |
| kitchen@fuji.com | kitchen123 | Kitchen | Kitchen display, order status  | ✅ Active |
| admin@fuji.com   | admin123   | Admin   | Complete system administration | ✅ Active |
| viewer@fuji.com  | viewer123  | Viewer  | Read-only access to reports    | ✅ Active |

### Setup Scripts Available

- `scripts/setup/create-demo-users.js` - Creates demo users in Supabase
- `scripts/setup/check-user-profiles.js` - Verifies user profiles exist
- `scripts/setup/test-auth.js` - Tests authentication flow
- `scripts/setup/setup-database.js` - Database setup and validation

### Development Commands

```bash
# Start development server (auto-detects available port)
npm run dev

# Create demo users (run once after database setup)
cd scripts/setup && node create-demo-users.js

# Test authentication flow
cd scripts/setup && node test-auth.js

# Debug authentication issues
# Visit: http://localhost:3003/debug-auth
```

### Common Issues & Solutions

1. **✅ RESOLVED: Login Loop Error**: Demo users not created
   - Solution: Run `create-demo-users.js` script (all 6 demo users now active)

2. **✅ RESOLVED: "Missing Error Components"**: Usually resolved by refresh
   - Solution: Check browser console for specific errors (ErrorBoundary now implemented)

3. **✅ RESOLVED: Database Connection Issues**: Environment variables not set
   - Solution: Verify `.env.local` has correct Supabase credentials (now properly configured)

4. **✅ RESOLVED: Server Startup Issues**: Express.js server not starting
   - Solution: Environment variables now properly configured, server starts successfully

5. **✅ RESOLVED: Test Coverage Issues**: Low test coverage
   - Solution: 64 unit tests now passing with comprehensive coverage of core components

---

## 📝 Development Notes for Claude

### Code Style Guidelines

- Follow modern TypeScript best practices with strict type checking
- Use consistent naming conventions (camelCase for variables, PascalCase for components/types)
- Implement proper error handling with custom error types and user-friendly messages
- Write comprehensive unit tests with Jest and React Testing Library (64 tests currently passing)
- Document all API endpoints with OpenAPI/Swagger
- Follow security best practices (never log sensitive data, use RLS policies)
- Use Supabase Row Level Security (RLS) policies for data access control
- Implement comprehensive error boundaries and debugging utilities
- Use React Query for server state management and caching
- Follow touch-first design principles for tablet optimization

### Current Architecture Implementation

- **Authentication**: Supabase Auth + React Query hooks with comprehensive RBAC
  - `AuthService` class handles all auth operations (sign in, sign out, PIN login, profile management)
  - `useAuth()`, `useCurrentUser()`, `usePermissions()` hooks for state management
  - Role-based access control (admin, manager, server, cashier, kitchen, viewer)
  - Session management with automatic timeout and warning system
- **State Management**: React Query for server state, Zustand for client state
- **UI Components**: Custom component library in `src/components/ui/` with touch optimization
- **Error Handling**: `ErrorBoundary` component + comprehensive error logging and user-friendly messages
- **Real-time**: Supabase subscriptions for live order updates and kitchen display
- **Testing**: Jest + React Testing Library with 64 passing unit tests
- **Debugging**: Debug pages, comprehensive logging, and development utilities

### Key Integration Points

- **Supabase Services:** ✅ Database (15+ tables), ✅ Auth (6 user roles), ✅ Real-time subscriptions, ⚠️ Storage (configured)
- **Payment Processors:** ⚠️ Stripe API integration (configured, needs implementation)
- **Kitchen Display:** ✅ Real-time order updates via Supabase subscriptions
- **AI Features:** ✅ Menu optimization and forecasting components implemented
- **Receipt Generation:** ✅ Automated totals calculation and receipt generation
- **Thermal Printer Integration:** ESC/POS protocol (planned)
- **Email/SMS:** Supabase Edge Functions with Twilio/SendGrid (planned)
- **File Storage:** Supabase Storage for menu images and receipts (planned)
- **Analytics:** Custom TypeScript functions with Supabase database functions (planned)

### Performance Considerations

- **Database:** Supabase automatic indexing + custom indexes for complex queries
- **Frontend:** Next.js optimization with bundle splitting and lazy loading
- **CDN:** Supabase CDN for static assets and images
- **Caching:** Supabase built-in caching + Redis for session data
- **Real-time:** Supabase real-time subscriptions for order updates
- **Mobile-first:** Responsive design with touch-optimized components
- **TypeScript:** Compile-time optimizations and tree-shaking

---

**Last Updated:** September 24, 2025
**Document Version:** 1.3
**Project Status:** Frontend UI System Complete - Production Ready Interface
**Recent Updates:**

- ✅ Fixed critical server startup issues and environment configuration
- ✅ Validated database integration and schema completeness
- ✅ Stabilized test suite (64/64 tests passing)
- ✅ Implemented comprehensive authentication system with RBAC
- ✅ Built foundational UI component library with touch optimization
- ✅ Added AI optimization components for menu and forecasting
- ✅ Created automated totals calculation and receipt generation
- ✅ Implemented real-time kitchen display system
- ✅ Added comprehensive error handling and debugging utilities
- ✅ **NEW:** Completed comprehensive CSV Data Import System with templates
- ✅ **NEW:** Finished complete Frontend User Interface Development
- ✅ **NEW:** Added 10+ production-ready UI components (Card, Badge, Dropdown, Toast, etc.)
- ✅ **NEW:** Enhanced touch-optimization for tablet POS terminals

**Current Working Features:**

- ✅ **Authentication System:** Complete user management with 6 role types (admin, manager, server, cashier, kitchen, viewer)
- ✅ **Database Integration:** Full Supabase integration with 15+ tables and sample data
- ✅ **Menu Management:** Complete CRUD operations with categories, items, modifiers, and pricing
- ✅ **Order Processing:** Full order lifecycle from creation to completion with real-time updates
- ✅ **Kitchen Display:** Real-time order updates and status tracking
- ✅ **Receipt Generation:** Automated totals calculation and receipt generation
- ✅ **Role-Based Access:** Comprehensive RBAC with permission guards and route protection
- ✅ **Session Management:** Automatic session timeout and warning system
- ✅ **Error Handling:** Comprehensive error boundaries and user-friendly error messages
- ✅ **Testing Framework:** 64 unit tests passing with Jest and React Testing Library
- ✅ **CSV Import System:** Complete data import with templates and validation
- ✅ **Frontend UI System:** Production-ready responsive interfaces for all modules
- ✅ **Design System:** Comprehensive component library with accessibility compliance
- ✅ **Touch Optimization:** Tablet-optimized interfaces with 44px minimum touch targets

**Next Priority Areas:**

- Testing and Quality Assurance (comprehensive test suite)
- Production deployment and monitoring
- Staff training and documentation
- Performance optimization and monitoring
- Advanced reporting enhancements
