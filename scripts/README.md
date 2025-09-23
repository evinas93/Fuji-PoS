# Fuji Restaurant POS System - Scripts

This directory contains utility scripts for setting up, testing, and maintaining the Fuji Restaurant POS System.

## 📁 Directory Structure

```
scripts/
├── 📁 setup/                      # Initial setup and configuration scripts
│   ├── 📄 setup-database.js       # Main database setup script
│   ├── 📄 run-migrations.js       # Display migration instructions
│   ├── 📄 create-demo-users.js    # Create demo user accounts
│   └── 📄 insert-sample-data.js   # Insert sample menu data
├── 📁 database/                   # Database management scripts
│   ├── 📄 create-sales-tables.sql # Create sales data tables
│   └── 📄 import-excel-data.js    # Import data from Excel files
├── 📁 testing/                    # Testing and validation scripts
│   ├── 📄 test-database-connection.js # Test database connectivity
│   └── 📄 test-menu-system.js     # Test menu system functionality
└── 📄 README.md                   # This file
```

## 🚀 Quick Start

### 1. Initial Setup
```bash
# Run the main setup script
node scripts/setup/setup-database.js

# Create demo users
node scripts/setup/create-demo-users.js
```

### 2. Database Management
```bash
# Test database connection
node scripts/testing/test-database-connection.js

# Import sales data from Excel
node scripts/database/import-excel-data.js
```

### 3. Testing
```bash
# Test menu system
node scripts/testing/test-menu-system.js
```

## 📋 Setup Scripts (`setup/`)

### `setup-database.js`
Main database setup script that:
- Tests database connectivity
- Verifies schema and data
- Provides setup status

**Usage:**
```bash
node scripts/setup/setup-database.js
```

### `run-migrations.js`
Displays migration instructions for manual execution in Supabase SQL Editor.

**Usage:**
```bash
node scripts/setup/run-migrations.js
```

### `create-demo-users.js`
Creates demo user accounts for testing:
- Manager: manager@fuji.com / manager123
- Server: server@fuji.com / server123
- Cashier: cashier@fuji.com / cashier123
- Kitchen: kitchen@fuji.com / kitchen123

**Usage:**
```bash
node scripts/setup/create-demo-users.js
```

### `insert-sample-data.js`
Inserts sample menu data including:
- Menu categories
- Menu items
- Modifiers
- Restaurant tables

**Usage:**
```bash
node scripts/setup/insert-sample-data.js
```

## 🗄️ Database Scripts (`database/`)

### `create-sales-tables.sql`
SQL script to create sales data tables:
- `grand_totals` - Grand totals sales summary
- `monthly_sales` - Monthly/yearly sales data

**Usage:**
Run in Supabase SQL Editor before importing Excel data.

### `import-excel-data.js`
Imports sales data from Excel files:
- `Grand_Totals_Sales_Summary.xlsx`
- `Month_Year_SALES.xlsx`

**Usage:**
```bash
node scripts/database/import-excel-data.js
```

## 🧪 Testing Scripts (`testing/`)

### `test-database-connection.js`
Tests database connectivity and verifies:
- Supabase connection
- Schema existence
- Sample data availability

**Usage:**
```bash
node scripts/testing/test-database-connection.js
```

### `test-menu-system.js`
Tests the menu management system functionality.

**Usage:**
```bash
node scripts/testing/test-menu-system.js
```

## 📝 Prerequisites

Before running any scripts, ensure you have:

1. **Environment Variables**: `.env.local` file with Supabase credentials
2. **Database Setup**: Supabase project created and migrations run
3. **Dependencies**: All npm packages installed (`npm install`)

## 🔧 Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📚 Documentation

- **Project Structure**: See `PROJECT_STRUCTURE.md` in project root
- **Database Setup**: See `docs/DATABASE_SETUP_GUIDE.md`
- **API Documentation**: See `docs/database-schema.md`

## 🆘 Troubleshooting

### Common Issues

1. **"Invalid supabaseUrl"**: Check your `.env.local` file
2. **"Connection failed"**: Verify Supabase project is active
3. **"Table not found"**: Run migrations first
4. **"User already exists"**: Demo users may already be created

### Getting Help

1. Check the console output for specific error messages
2. Verify your Supabase project settings
3. Ensure all migrations have been run
4. Check the project documentation

## 🔄 Script Execution Order

For a complete setup, run scripts in this order:

1. `setup/run-migrations.js` → Run migrations in Supabase
2. `setup/setup-database.js` → Verify setup
3. `setup/insert-sample-data.js` → Add sample data
4. `setup/create-demo-users.js` → Create demo users
5. `database/import-excel-data.js` → Import sales data (optional)
6. `testing/test-database-connection.js` → Verify everything works
