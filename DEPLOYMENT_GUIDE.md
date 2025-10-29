# Fuji POS MVP - Deployment Guide

## Prerequisites

Before deploying, ensure you have:

- [ ] Supabase account (https://supabase.com)
- [ ] Vercel account (https://vercel.com) - Recommended for Next.js
- [ ] Git repository with the MVP code
- [ ] Access to Fuji menu PDF for data entry

## Step 1: Database Setup (Supabase)

### 1.1 Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization and name: "fuji-pos-mvp"
4. Set a strong database password (save this!)
5. Select region closest to your restaurant
6. Wait for project to initialize (~2 minutes)

### 1.2 Run Database Migrations

1. Go to SQL Editor in Supabase dashboard
2. Click "New Query"
3. Copy and paste contents of `supabase/migrations/006_mvp_simplified_schema.sql`
4. Click "Run" to execute
5. Verify tables created:
   - categories
   - menu_items
   - orders
   - order_items

### 1.3 Get API Credentials

1. Go to Project Settings → API
2. Copy these values (you'll need them):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Long string starting with `eyJ...`
   - **service_role key**: Different long string (keep secret!)

### 1.4 Configure Authentication (Optional for MVP)

For simplified MVP, you can:

- **Option A**: Disable RLS entirely (easiest for MVP)

  ```sql
  ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
  ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
  ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
  ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
  ```

- **Option B**: Use anonymous authentication
  - In Supabase dashboard: Authentication → Providers
  - Enable "Anonymous Sign-ins"
  - Users will be auto-authenticated

## Step 2: Deploy to Vercel

### 2.1 Connect Repository

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your Git repository
4. Select the repository with Fuji POS code

### 2.2 Configure Build Settings

Vercel should auto-detect Next.js settings:

- **Framework Preset**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 2.3 Add Environment Variables

In Vercel project settings, add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ.....your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ.....your-service-role-key
```

**Important**:

- Use your actual Supabase values from Step 1.3
- Double-check no typos or extra spaces

### 2.4 Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-5 minutes)
3. Vercel will provide a URL: `https://fuji-pos-mvp.vercel.app`
4. Click the URL to test

## Step 3: Verify Deployment

### 3.1 Check Pages Load

Visit these URLs (replace with your Vercel domain):

- https://your-app.vercel.app/ (should redirect)
- https://your-app.vercel.app/menu
- https://your-app.vercel.app/orders/new
- https://your-app.vercel.app/reports

### 3.2 Test Database Connection

1. Go to Menu Management page
2. Try to add a test menu item:
   - Name: "Test Item"
   - Category: Select any
   - Price: 10.00
3. Click Save
4. If successful, delete the test item
5. If it fails, check browser console (F12) for errors

### 3.3 Test Order Flow

1. Add at least 2 menu items (real items)
2. Go to New Order
3. Add items to cart
4. Select order type and payment method
5. Complete the order
6. Check if order saves (no error message)

### 3.4 Test Reporting

1. Go to Sales Reports
2. Check Daily Summary for today
3. Try exporting monthly report
4. Verify Excel file downloads

## Step 4: Initial Data Entry

### 4.1 Import Menu Items

**Time estimate**: 30-60 minutes

1. Open Fuji menu PDF
2. Go to Menu Management in deployed app
3. For each category (Beverages, Sushi, etc.):
   - Click "Add Menu Item"
   - Enter: Name, Category, Base Price, Description
   - Click Save
4. Verify items appear in the list

**Tip**: Start with most frequently ordered items first

### 4.2 Create Sample Orders (Optional)

To test reporting with real data:

1. Create 5-10 sample orders
2. Mix dine-in and take-out
3. Use different payment methods
4. Use different dates if possible

## Step 5: User Training

### 5.1 Share Access

- Send app URL to staff: `https://your-app.vercel.app`
- Bookmark on tablets/computers used for orders
- Add to mobile home screen (PWA-style)

### 5.2 Train on Workflow

1. **Menu Management** (managers only)
   - How to add items
   - How to update prices
   - How to mark items unavailable

2. **Order Entry** (all staff)
   - Finding menu items
   - Adding to cart
   - Selecting order type and payment
   - Completing orders

3. **Reports** (managers only)
   - Viewing daily summaries
   - Exporting monthly reports
   - Generating grand totals

Share the **QUICK_START_MVP.md** document with all users.

## Step 6: Ongoing Maintenance

### Daily

- [ ] Check orders are being saved correctly
- [ ] Verify no error messages

### Weekly

- [ ] Review order data for anomalies
- [ ] Ensure menu prices are current

### Monthly

- [ ] Export monthly report (first of the month)
- [ ] Archive export file in safe location
- [ ] Generate backup of database

### As Needed

- [ ] Add new menu items
- [ ] Update prices for existing items
- [ ] Mark seasonal items as unavailable

## Troubleshooting

### Issue: "Failed to fetch" errors

**Cause**: Supabase connection problem

**Solution**:

1. Check environment variables in Vercel
2. Verify Supabase project is running (not paused)
3. Check Supabase API keys are correct
4. Try redeploying in Vercel

### Issue: Menu items not saving

**Cause**: RLS policies blocking writes

**Solution**:

1. Go to Supabase SQL Editor
2. Run: `ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;`
3. Repeat for other tables
4. Or configure proper RLS policies

### Issue: Orders creating but not showing in reports

**Cause**: Status not set to 'completed'

**Solution**:

1. Check `orders` table in Supabase
2. Verify `status` column = 'completed'
3. Update code if needed to ensure status is set

### Issue: Excel export not working

**Cause**: Browser blocking download or no data

**Solution**:

1. Check browser pop-up blocker
2. Try different browser
3. Verify orders exist for selected period
4. Check browser console for errors

### Issue: Date/timezone issues in reports

**Cause**: Server timezone vs local timezone

**Solution**:

1. Ensure dates are stored in UTC
2. Convert to local time when displaying
3. May need to adjust queries in `useReports.ts`

## Security Considerations

### For MVP (Acceptable)

- ✅ Disabled RLS for simplicity
- ✅ Anonymous authentication
- ✅ HTTPS via Vercel
- ✅ Environment variables secure

### For Production (Future)

- ⚠️ Enable proper authentication
- ⚠️ Implement RLS policies by role
- ⚠️ Add audit logging
- ⚠️ Regular backups
- ⚠️ Access control by staff member
- ⚠️ PCI compliance for credit card data

## Backup Strategy

### Automated (Supabase)

1. Go to Database → Backups
2. Enable daily automatic backups
3. Set retention period (7-30 days)

### Manual (Recommended)

1. Export monthly reports as Excel files
2. Store in multiple locations:
   - Local computer
   - Cloud storage (Google Drive, Dropbox)
   - External hard drive
3. Keep at least 12 months of history

### Database Dump (Advanced)

```bash
# From Supabase dashboard: Database → Backups → Download
# Or use pg_dump if you have PostgreSQL tools
```

## Cost Estimation

### Supabase (Database)

- **Free Tier**: Good for MVP testing
  - 500MB database
  - 2GB bandwidth
  - 50MB file storage
- **Pro**: $25/month (upgrade when needed)

### Vercel (Hosting)

- **Free Tier**: Good for MVP
  - 100GB bandwidth
  - Unlimited deployments
- **Pro**: $20/month (upgrade for custom domain)

### Total MVP Cost

- **Development/Testing**: $0/month (both free tiers)
- **Light Production**: $0-25/month
- **Full Production**: $45/month (both pro tiers)

## Custom Domain (Optional)

### After Vercel Deployment

1. Buy domain (e.g., pos.fujirestaurant.com)
2. In Vercel: Settings → Domains
3. Add custom domain
4. Update DNS records as instructed
5. Wait for SSL certificate (automatic)

## Monitoring

### Supabase Monitoring

- Dashboard shows: requests/sec, CPU, memory
- Check periodically for spikes
- Review API logs for errors

### Vercel Monitoring

- Analytics tab shows: visitors, page views
- Functions tab shows: API response times
- Logs tab shows: build and runtime errors

## Rollback Plan

If deployment fails or has critical issues:

1. **Rollback in Vercel**:
   - Deployments → Find previous working version
   - Click "..." → "Promote to Production"

2. **Restore Database**:
   - Supabase Dashboard → Database → Backups
   - Select backup from before issues started
   - Click "Restore"

3. **Contact Support**:
   - Vercel: support@vercel.com
   - Supabase: support@supabase.com

## Success Checklist

Before going live with real operations:

- [ ] All pages load without errors
- [ ] Menu items can be added, edited, deleted
- [ ] Orders can be created and saved
- [ ] Daily summary shows correct data
- [ ] Monthly export downloads and opens in Excel
- [ ] Grand totals export works correctly
- [ ] Multiple staff members trained
- [ ] Backup strategy in place
- [ ] Contact info for support documented
- [ ] QUICK_START_MVP.md shared with team

## Support Contacts

### Technical Issues

- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support
- Next.js: https://nextjs.org/docs

### Internal

- Development Team: [your-email]
- Restaurant Manager: [manager-email]

---

**Next Steps After Deployment**:

1. Complete initial menu data entry
2. Train all staff on the system
3. Run parallel with existing system for 1 week
4. Transition fully to new system
5. Monitor for issues and gather feedback
6. Plan enhancements based on usage

**Estimated Timeline**:

- Database setup: 30 minutes
- Vercel deployment: 15 minutes
- Testing: 1 hour
- Menu data entry: 1-2 hours
- Staff training: 2-4 hours

**Total: ~1 day for full deployment and training**
