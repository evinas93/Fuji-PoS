// Analytics and reporting routes
import { Router } from 'express';
import { z } from 'zod';
import { createSupabaseClient } from '../config/supabase';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
import { requireManager } from '../middleware/auth';

const router = Router();

// Validation schemas
const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format (YYYY-MM-DD)'),
});

const dashboardQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
});

// GET /api/analytics/dashboard
// Get real-time dashboard data
router.get('/dashboard', asyncHandler(async (req, res) => {
  const { date } = dashboardQuerySchema.parse(req.query);
  const targetDate = date || new Date().toISOString().split('T')[0];
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  try {
    // Use the database function for dashboard stats
    const { data: dashboardData, error: dashboardError } = await supabaseClient
      .rpc('get_dashboard_stats', { target_date: targetDate });

    if (dashboardError) {
      throw new ValidationError(dashboardError.message);
    }

    res.json({
      date: targetDate,
      stats: dashboardData,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    throw new ValidationError('Failed to fetch dashboard statistics');
  }
}));

// GET /api/analytics/sales-summary
// Get sales summary for a date range
router.get('/sales-summary', requireManager, asyncHandler(async (req, res) => {
  const { startDate, endDate } = dateRangeSchema.parse(req.query);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: salesSummary, error } = await supabaseClient
    .from('daily_sales')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    throw new ValidationError(error.message);
  }

  // Calculate totals
  const totals = salesSummary.reduce((acc, day) => ({
    totalOrders: acc.totalOrders + day.total_orders,
    grossSales: acc.grossSales + day.gross_sales,
    taxCollected: acc.taxCollected + day.tax_collected,
    gratuityTotal: acc.gratuityTotal + day.gratuity_total,
    serviceCharges: acc.serviceCharges + day.service_charges,
    cashSales: acc.cashSales + day.cash_sales,
    creditSales: acc.creditSales + day.credit_sales,
  }), {
    totalOrders: 0,
    grossSales: 0,
    taxCollected: 0,
    gratuityTotal: 0,
    serviceCharges: 0,
    cashSales: 0,
    creditSales: 0,
  });

  const avgTicket = totals.totalOrders > 0 ? totals.grossSales / totals.totalOrders : 0;

  res.json({
    dateRange: { startDate, endDate },
    dailySales: salesSummary,
    totals: {
      ...totals,
      averageTicket: Math.round(avgTicket * 100) / 100,
    },
    count: salesSummary.length,
  });
}));

// GET /api/analytics/top-items
// Get top selling items for a date range
router.get('/top-items', asyncHandler(async (req, res) => {
  const { startDate, endDate } = dateRangeSchema.parse(req.query);
  const { limit = '10' } = req.query;
  const limitNum = parseInt(limit as string, 10);

  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: topItems, error } = await supabaseClient
    .from('order_items')
    .select(`
      menu_item_id,
      menu_items:menu_item_id (
        id,
        name,
        base_price,
        categories:category_id (
          name
        )
      ),
      quantity,
      total_price,
      orders:order_id!inner (
        order_date,
        status
      )
    `)
    .gte('orders.order_date', startDate)
    .lte('orders.order_date', endDate)
    .eq('orders.status', 'completed');

  if (error) {
    throw new ValidationError(error.message);
  }

  // Aggregate data by menu item
  const itemStats = topItems.reduce((acc: any, item: any) => {
    const itemId = item.menu_item_id;
    if (!acc[itemId]) {
      acc[itemId] = {
        id: itemId,
        name: item.menu_items?.name || 'Unknown Item',
        category: item.menu_items?.categories?.name || 'Unknown Category',
        basePrice: item.menu_items?.base_price || 0,
        totalQuantity: 0,
        totalRevenue: 0,
        orderCount: 0,
      };
    }
    acc[itemId].totalQuantity += item.quantity;
    acc[itemId].totalRevenue += item.total_price;
    acc[itemId].orderCount += 1;
    return acc;
  }, {});

  // Convert to array and sort by quantity
  const sortedItems = Object.values(itemStats)
    .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
    .slice(0, limitNum);

  res.json({
    dateRange: { startDate, endDate },
    topItems: sortedItems,
    count: sortedItems.length,
  });
}));

// GET /api/analytics/sales-trends
// Get sales trends by hour, day of week, etc.
router.get('/sales-trends', requireManager, asyncHandler(async (req, res) => {
  const { startDate, endDate } = dateRangeSchema.parse(req.query);
  const { groupBy = 'day' } = req.query;
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  let query;
  
  if (groupBy === 'hour') {
    // Hourly trends
    query = supabaseClient
      .from('orders')
      .select('created_at, total_amount, status')
      .gte('order_date', startDate)
      .lte('order_date', endDate)
      .eq('status', 'completed');
  } else if (groupBy === 'day_of_week') {
    // Day of week trends
    query = supabaseClient
      .from('daily_sales')
      .select('day_of_week, gross_sales, total_orders')
      .gte('date', startDate)
      .lte('date', endDate);
  } else {
    // Daily trends (default)
    query = supabaseClient
      .from('daily_sales')
      .select('date, gross_sales, total_orders, average_ticket')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
  }

  const { data: trendsData, error } = await query;

  if (error) {
    throw new ValidationError(error.message);
  }

  let processedData;

  if (groupBy === 'hour') {
    // Group by hour of day
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      sales: 0,
      orders: 0,
    }));

    trendsData.forEach((order: any) => {
      const hour = new Date(order.created_at).getHours();
      hourlyData[hour].sales += order.total_amount;
      hourlyData[hour].orders += 1;
    });

    processedData = hourlyData;
  } else if (groupBy === 'day_of_week') {
    // Group by day of week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyData = Array.from({ length: 7 }, (_, day) => ({
      dayOfWeek: day,
      dayName: dayNames[day],
      sales: 0,
      orders: 0,
    }));

    trendsData.forEach((day: any) => {
      weeklyData[day.day_of_week].sales += day.gross_sales;
      weeklyData[day.day_of_week].orders += day.total_orders;
    });

    processedData = weeklyData;
  } else {
    processedData = trendsData;
  }

  res.json({
    dateRange: { startDate, endDate },
    groupBy,
    trends: processedData,
    count: processedData.length,
  });
}));

// GET /api/analytics/server-performance
// Get server performance metrics
router.get('/server-performance', requireManager, asyncHandler(async (req, res) => {
  const { startDate, endDate } = dateRangeSchema.parse(req.query);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: serverStats, error } = await supabaseClient
    .from('orders')
    .select(`
      server_id,
      profiles:server_id (
        id,
        username,
        first_name,
        last_name
      ),
      total_amount,
      gratuity_amount,
      status,
      order_date
    `)
    .gte('order_date', startDate)
    .lte('order_date', endDate)
    .eq('status', 'completed');

  if (error) {
    throw new ValidationError(error.message);
  }

  // Aggregate by server
  const serverPerformance = serverStats.reduce((acc: any, order: any) => {
    const serverId = order.server_id;
    if (!acc[serverId]) {
      acc[serverId] = {
        id: serverId,
        username: order.profiles?.username || 'Unknown',
        firstName: order.profiles?.first_name || '',
        lastName: order.profiles?.last_name || '',
        totalSales: 0,
        totalOrders: 0,
        totalGratuity: 0,
        averageTicket: 0,
      };
    }
    acc[serverId].totalSales += order.total_amount;
    acc[serverId].totalOrders += 1;
    acc[serverId].totalGratuity += order.gratuity_amount || 0;
    return acc;
  }, {});

  // Calculate averages and sort
  const sortedPerformance = Object.values(serverPerformance)
    .map((server: any) => ({
      ...server,
      averageTicket: server.totalOrders > 0 
        ? Math.round((server.totalSales / server.totalOrders) * 100) / 100 
        : 0,
    }))
    .sort((a: any, b: any) => b.totalSales - a.totalSales);

  res.json({
    dateRange: { startDate, endDate },
    serverPerformance: sortedPerformance,
    count: sortedPerformance.length,
  });
}));

// GET /api/analytics/category-performance
// Get category performance metrics
router.get('/category-performance', asyncHandler(async (req, res) => {
  const { startDate, endDate } = dateRangeSchema.parse(req.query);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: categoryStats, error } = await supabaseClient
    .from('order_items')
    .select(`
      quantity,
      total_price,
      menu_items:menu_item_id (
        category_id,
        categories:category_id (
          id,
          name
        )
      ),
      orders:order_id!inner (
        order_date,
        status
      )
    `)
    .gte('orders.order_date', startDate)
    .lte('orders.order_date', endDate)
    .eq('orders.status', 'completed');

  if (error) {
    throw new ValidationError(error.message);
  }

  // Aggregate by category
  const categoryPerformance = categoryStats.reduce((acc: any, item: any) => {
    const categoryId = item.menu_items?.category_id;
    const categoryName = item.menu_items?.categories?.name || 'Unknown Category';
    
    if (!acc[categoryId]) {
      acc[categoryId] = {
        id: categoryId,
        name: categoryName,
        totalQuantity: 0,
        totalRevenue: 0,
        itemCount: new Set(),
      };
    }
    
    acc[categoryId].totalQuantity += item.quantity;
    acc[categoryId].totalRevenue += item.total_price;
    acc[categoryId].itemCount.add(item.menu_items?.id);
    
    return acc;
  }, {});

  // Convert to array and calculate metrics
  const sortedCategories = Object.values(categoryPerformance)
    .map((category: any) => ({
      ...category,
      uniqueItems: category.itemCount.size,
      averageItemRevenue: category.itemCount.size > 0 
        ? Math.round((category.totalRevenue / category.itemCount.size) * 100) / 100 
        : 0,
      itemCount: undefined, // Remove Set object
    }))
    .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

  res.json({
    dateRange: { startDate, endDate },
    categoryPerformance: sortedCategories,
    count: sortedCategories.length,
  });
}));

export default router;

