# 🗄️ Database Setup Guide - Fuji POS System

## 📋 **Complete Setup Instructions**

### **Step 1: Create Supabase Project**

1. **Go to Supabase Dashboard**
   - Visit: [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign up/Login with your account

2. **Create New Project**
   - Click "New Project"
   - Choose your organization
   - Enter project details:
     - **Name:** `fuji-pos-system`
     - **Database Password:** Generate a strong password (save it!)
     - **Region:** Choose closest to your location
     - **Pricing Plan:** Free tier is sufficient

3. **Wait for Project Creation**
   - Project creation takes 2-3 minutes
   - You'll see a progress indicator

### **Step 2: Get Database Credentials**

Once your project is ready:

1. **Go to Project Settings**
   - Click the gear icon (⚙️) in the left sidebar
   - Select "API" from the settings menu

2. **Copy Your Credentials**
   - **Project URL:** Copy the URL (looks like: `https://xxxxx.supabase.co`)
   - **Anon Key:** Copy the "anon public" key
   - **Service Role Key:** Copy the "service_role" key (keep this secret!)

### **Step 3: Configure Environment Variables**

1. **Create Environment File**
   ```bash
   # Copy the example file
   cp config/env.local.example .env.local
   ```

2. **Edit .env.local**
   Replace the placeholder values with your actual Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   
   # Generate a random session secret
   SESSION_SECRET=your-super-secret-session-key-here
   ```

### **Step 4: Run Database Migrations**

1. **Go to SQL Editor**
   - In your Supabase dashboard, click "SQL Editor" in the left sidebar

2. **Run Migration Files in Order**
   
   **Migration 1: Core Schema**
   ```sql
   -- Copy and paste the entire content of:
   -- supabase/migrations/001_initial_schema.sql
   ```
   Click "Run" to execute.

   **Migration 2: Functions & Triggers**
   ```sql
   -- Copy and paste the entire content of:
   -- supabase/migrations/002_functions_and_triggers.sql
   ```
   Click "Run" to execute.

   **Migration 3: Sample Data & RLS**
   ```sql
   -- Copy and paste the entire content of:
   -- supabase/migrations/003_sample_data.sql
   ```
   Click "Run" to execute.

   **Migration 4: Search Functions**
   ```sql
   -- Copy and paste the entire content of:
   -- supabase/migrations/004_menu_search_function.sql
   ```
   Click "Run" to execute.

3. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - `users`
     - `menu_categories`
     - `menu_items`
     - `modifiers`
     - `item_modifiers`
     - `orders`
     - `order_items`
     - `payments`
     - And more...

### **Step 5: Setup Sample Data**

1. **Run the Setup Script**
   ```bash
   node scripts/setup-database.js
   ```

2. **Verify Data Insertion**
   - Check the "Table Editor" to see sample data
   - You should see categories, menu items, and modifiers

### **Step 6: Test the Application**

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Open Browser**
   - Go to: [http://localhost:3000](http://localhost:3000)
   - Navigate to `/menu` to see the menu management system

3. **Test Features**
   - ✅ View menu items
   - ✅ Filter by categories
   - ✅ Search functionality
   - ✅ Add/edit menu items (if logged in as manager)
   - ✅ Toggle availability
   - ✅ Category management

### **Step 7: Create Test Users**

1. **Go to Authentication**
   - In Supabase dashboard, click "Authentication" → "Users"

2. **Create Test Users**
   - Click "Add user"
   - Create users with different roles:
     - **Manager:** `manager@fuji.com` (role: manager)
     - **Server:** `server@fuji.com` (role: server)
     - **Cashier:** `cashier@fuji.com` (role: cashier)

3. **Update User Profiles**
   ```sql
   -- Run this in SQL Editor to set user roles
   UPDATE users SET role = 'manager' WHERE email = 'manager@fuji.com';
   UPDATE users SET role = 'server' WHERE email = 'server@fuji.com';
   UPDATE users SET role = 'cashier' WHERE email = 'cashier@fuji.com';
   ```

## 🧪 **Testing Checklist**

### **API Endpoints Testing**
- [ ] `GET /api/menu/items` - Returns menu items
- [ ] `GET /api/menu/categories` - Returns categories
- [ ] `GET /api/menu/modifiers` - Returns modifiers
- [ ] `POST /api/menu/items` - Creates new menu item (manager only)
- [ ] `PUT /api/menu/items` - Updates menu item (manager only)
- [ ] `PUT /api/menu/availability` - Toggles availability (server+)

### **Frontend Components Testing**
- [ ] Menu browser loads and displays items
- [ ] Category tabs work and filter items
- [ ] Search functionality finds items
- [ ] Menu item cards display correctly
- [ ] Admin controls appear for managers
- [ ] Availability toggles work
- [ ] Form submissions work

### **Database Functions Testing**
- [ ] Search function returns relevant results
- [ ] Price calculation functions work
- [ ] Bulk update operations work
- [ ] RLS policies restrict access properly

## 🔧 **Troubleshooting**

### **Common Issues**

1. **"Invalid API key" Error**
   - Check that your environment variables are correct
   - Ensure you're using the right keys (anon vs service_role)

2. **"Table doesn't exist" Error**
   - Make sure you ran all migration files in order
   - Check the SQL Editor for any error messages

3. **"Permission denied" Error**
   - Verify RLS policies are set up correctly
   - Make sure you're authenticated with the right user role

4. **"Connection failed" Error**
   - Check your internet connection
   - Verify the Supabase URL is correct

### **Debug Mode**

Enable debug logging by setting:
```env
ENABLE_DEBUG_LOGGING=true
```

This will show detailed logs in the browser console and server logs.

## 📊 **Database Schema Overview**

```
Users & Authentication
├── users (extends Supabase auth.users)
├── profiles (user profiles with roles)

Menu System
├── menu_categories (wine, sushi, dinner, etc.)
├── menu_items (individual menu items)
├── modifiers (sauces, additions, etc.)
├── item_modifiers (links items to modifiers)

Order System
├── restaurant_tables (table management)
├── orders (customer orders)
├── order_items (items within orders)
├── payments (payment records)

Analytics & Reporting
├── daily_sales (aggregated daily data)
├── shifts (employee shift tracking)
├── audit_log (change tracking)
```

## 🎯 **Next Steps After Setup**

1. **Test All Features** - Verify everything works as expected
2. **Add More Sample Data** - Create realistic menu items
3. **Configure Restaurant Settings** - Set tax rates, gratuity, etc.
4. **Train Staff** - Show them how to use the system
5. **Go Live** - Start using for real orders!

## 📞 **Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase documentation
3. Check the browser console for errors
4. Verify all environment variables are set correctly

---

**🎉 Once setup is complete, your Fuji POS Menu Management System will be ready for production use!**
