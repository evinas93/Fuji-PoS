// Analytics and reporting service for Fuji POS System
import { supabase } from '../supabase';
import type { DailySales } from '../../types/database';

export class AnalyticsService {
  // Get today's sales overview using the database view
  async getTodaySales() {
    const { data, error } = await supabase
      .from('today_sales')
      .select('*')
      .single();

    return { data, error };
  }

  // Get hourly sales pattern using the database view
  async getHourlySales(date?: string) {
    const { data, error } = await supabase
      .from('hourly_sales')
      .select('*')
      .order('hour');

    return { data, error };
  }

  // Get top selling items using the database view
  async getTopSellingItems(limit = 10) {
    const { data, error } = await supabase
      .from('top_selling_items')
      .select('*')
      .limit(limit);

    return { data, error };
  }

  // Get server performance using the database view
  async getServerPerformance(dateRange?: { start: string; end: string }) {
    let query = supabase
      .from('server_performance')
      .select('*');

    if (dateRange) {
      query = query
        .gte('shift_date', dateRange.start)
        .lte('shift_date', dateRange.end);
    }

    const { data, error } = await query.order('total_sales', { ascending: false });
    return { data, error };
  }

  // Generate end-of-day report using database function
  async generateEndOfDayReport(date?: string) {
    const reportDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .rpc('generate_end_of_day_report', { report_date: reportDate });

    return { data: data?.[0] || null, error };
  }

  // Get sales trend analysis
  async getSalesTrend(days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_sales')
      .select('sales_date, gross_sales, net_sales, total_orders, dine_in_sales, take_out_sales')
      .gte('sales_date', startDate)
      .order('sales_date');

    return { data, error };
  }

  // Get category performance analysis
  async getCategoryPerformance(dateRange?: { start: string; end: string }) {
    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = dateRange?.end || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        total_price,
        menu_items:item_id (
          category_id,
          menu_categories:category_id (
            id,
            name,
            category_type
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

    if (error) return { data: null, error };

    // Aggregate by category
    const categoryStats = data.reduce((acc: any, item: any) => {
      const categoryId = item.menu_items?.category_id;
      const categoryName = item.menu_items?.menu_categories?.name || 'Unknown';
      const categoryType = item.menu_items?.menu_categories?.category_type;
      
      if (!acc[categoryId]) {
        acc[categoryId] = {
          id: categoryId,
          name: categoryName,
          type: categoryType,
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
    const categoryPerformance = Object.values(categoryStats)
      .map((category: any) => ({
        ...category,
        uniqueItems: category.itemCount.size,
        averageItemRevenue: category.itemCount.size > 0 
          ? Math.round((category.totalRevenue / category.itemCount.size) * 100) / 100 
          : 0,
        itemCount: undefined, // Remove Set object
      }))
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

    return { data: categoryPerformance, error: null };
  }

  // Get dashboard statistics using database function
  async getDashboardStats(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .rpc('get_dashboard_stats', { target_date: targetDate });

    return { data, error };
  }

  // Get real-time metrics for live dashboard
  async getRealtimeMetrics() {
    const today = new Date().toISOString().split('T')[0];

    // Get current day active orders
    const { data: activeOrders, error: activeError } = await supabase
      .from('orders')
      .select('id, total_amount, status')
      .eq('order_date', today)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready']);

    // Get today's completed orders
    const { data: completedOrders, error: completedError } = await supabase
      .from('orders')
      .select('total_amount, gratuity_amount, order_type')
      .eq('order_date', today)
      .eq('status', 'completed');

    // Get current shift servers
    const { data: activeShifts, error: shiftsError } = await supabase
      .from('shifts')
      .select(`
        user_id,
        users (
          full_name,
          role
        )
      `)
      .eq('shift_date', today)
      .is('clock_out', null);

    if (activeError || completedError || shiftsError) {
      return { 
        data: null, 
        error: activeError || completedError || shiftsError 
      };
    }

    // Calculate metrics
    const totalSales = completedOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
    const totalGratuity = completedOrders?.reduce((sum, order) => sum + (order.gratuity_amount || 0), 0) || 0;
    const avgTicket = completedOrders?.length > 0 ? totalSales / completedOrders.length : 0;
    
    const dineInOrders = completedOrders?.filter(o => o.order_type === 'dine_in').length || 0;
    const takeOutOrders = completedOrders?.filter(o => o.order_type === 'take_out').length || 0;

    return {
      data: {
        activeOrders: activeOrders?.length || 0,
        completedOrders: completedOrders?.length || 0,
        totalSales: Math.round(totalSales * 100) / 100,
        averageTicket: Math.round(avgTicket * 100) / 100,
        totalGratuity: Math.round(totalGratuity * 100) / 100,
        dineInOrders,
        takeOutOrders,
        activeStaff: activeShifts?.length || 0,
        serversOnDuty: activeShifts?.filter((shift: any) => 
          shift.users?.role === 'server'
        ).length || 0
      },
      error: null
    };
  }

  // Get sales comparison (today vs previous periods)
  async getSalesComparison() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: salesData, error } = await supabase
      .from('daily_sales')
      .select('sales_date, gross_sales, total_orders')
      .in('sales_date', [today, yesterday, lastWeek]);

    if (error) return { data: null, error };

    const todaySales = salesData.find(d => d.sales_date === today);
    const yesterdaySales = salesData.find(d => d.sales_date === yesterday);
    const lastWeekSales = salesData.find(d => d.sales_date === lastWeek);

    const comparison = {
      today: {
        sales: todaySales?.gross_sales || 0,
        orders: todaySales?.total_orders || 0
      },
      yesterday: {
        sales: yesterdaySales?.gross_sales || 0,
        orders: yesterdaySales?.total_orders || 0,
        salesChange: todaySales && yesterdaySales 
          ? ((todaySales.gross_sales - yesterdaySales.gross_sales) / yesterdaySales.gross_sales) * 100
          : 0,
        ordersChange: todaySales && yesterdaySales
          ? ((todaySales.total_orders - yesterdaySales.total_orders) / yesterdaySales.total_orders) * 100
          : 0
      },
      lastWeek: {
        sales: lastWeekSales?.gross_sales || 0,
        orders: lastWeekSales?.total_orders || 0,
        salesChange: todaySales && lastWeekSales
          ? ((todaySales.gross_sales - lastWeekSales.gross_sales) / lastWeekSales.gross_sales) * 100
          : 0,
        ordersChange: todaySales && lastWeekSales
          ? ((todaySales.total_orders - lastWeekSales.total_orders) / lastWeekSales.total_orders) * 100
          : 0
      }
    };

    return { data: comparison, error: null };
  }

  // Get peak hours analysis
  async getPeakHoursAnalysis(days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total_amount, order_type')
      .gte('order_date', startDate)
      .eq('status', 'completed');

    if (error) return { data: null, error };

    // Group by hour
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      orderCount: 0,
      totalSales: 0,
      dineInCount: 0,
      takeOutCount: 0,
      averageTicket: 0
    }));

    data.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      hourlyData[hour].orderCount += 1;
      hourlyData[hour].totalSales += order.total_amount;
      
      if (order.order_type === 'dine_in') {
        hourlyData[hour].dineInCount += 1;
      } else {
        hourlyData[hour].takeOutCount += 1;
      }
    });

    // Calculate averages
    hourlyData.forEach(hour => {
      hour.averageTicket = hour.orderCount > 0 
        ? Math.round((hour.totalSales / hour.orderCount) * 100) / 100 
        : 0;
    });

    return { data: hourlyData, error: null };
  }

  // Get menu item profitability analysis
  async getItemProfitability() {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        id,
        name,
        base_price,
        cost,
        category_id,
        menu_categories (
          name,
          category_type
        )
      `)
      .not('cost', 'is', null)
      .eq('is_available', true);

    if (error) return { data: null, error };

    const profitabilityData = data.map(item => {
      const profit = item.base_price - (item.cost || 0);
      const profitMargin = ((profit / item.base_price) * 100);
      
      return {
        ...item,
        profit: Math.round(profit * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
        profitPercentage: profitMargin
      };
    }).sort((a, b) => b.profitMargin - a.profitMargin);

    return { data: profitabilityData, error: null };
  }

  // Get waste and void analysis
  async getWasteAnalysis(dateRange?: { start: string; end: string }) {
    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = dateRange?.end || new Date().toISOString().split('T')[0];

    const { data: voidedOrders, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_date,
        total_amount,
        void_reason,
        order_items (
          item_name,
          quantity,
          total_price
        )
      `)
      .gte('order_date', startDate)
      .lte('order_date', endDate)
      .eq('is_void', true);

    if (error) return { data: null, error };

    const wasteAnalysis = {
      totalVoidedOrders: voidedOrders.length,
      totalVoidedValue: voidedOrders.reduce((sum, order) => sum + order.total_amount, 0),
      voidReasons: voidedOrders.reduce((acc: any, order) => {
        const reason = order.void_reason || 'No reason specified';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {}),
      mostVoidedItems: voidedOrders
        .flatMap(order => order.order_items)
        .reduce((acc: any, item) => {
          acc[item.item_name] = (acc[item.item_name] || 0) + item.quantity;
          return acc;
        }, {})
    };

    return { data: wasteAnalysis, error: null };
  }

  // Get customer analytics (based on order patterns)
  async getCustomerAnalytics(dateRange?: { start: string; end: string }) {
    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = dateRange?.end || new Date().toISOString().split('T')[0];

    const { data: orders, error } = await supabase
      .from('orders')
      .select('order_type, total_amount, gratuity_amount, created_at, customer_phone')
      .gte('order_date', startDate)
      .lte('order_date', endDate)
      .eq('status', 'completed');

    if (error) return { data: null, error };

    // Calculate metrics
    const totalOrders = orders.length;
    const dineInOrders = orders.filter(o => o.order_type === 'dine_in').length;
    const takeOutOrders = orders.filter(o => o.order_type === 'take_out').length;
    
    const avgTicketDineIn = dineInOrders > 0 
      ? orders.filter(o => o.order_type === 'dine_in')
              .reduce((sum, o) => sum + o.total_amount, 0) / dineInOrders
      : 0;
      
    const avgTicketTakeOut = takeOutOrders > 0
      ? orders.filter(o => o.order_type === 'take_out')
              .reduce((sum, o) => sum + o.total_amount, 0) / takeOutOrders
      : 0;

    // Repeat customers (based on phone number)
    const phoneNumbers = orders
      .filter(o => o.customer_phone)
      .map(o => o.customer_phone);
    
    const uniquePhones = new Set(phoneNumbers);
    const repeatCustomers = phoneNumbers.length - uniquePhones.size;

    const analytics = {
      totalOrders,
      dineInPercentage: Math.round((dineInOrders / totalOrders) * 100),
      takeOutPercentage: Math.round((takeOutOrders / totalOrders) * 100),
      averageTicketDineIn: Math.round(avgTicketDineIn * 100) / 100,
      averageTicketTakeOut: Math.round(avgTicketTakeOut * 100) / 100,
      repeatCustomerRate: uniquePhones.size > 0 
        ? Math.round((repeatCustomers / uniquePhones.size) * 100) 
        : 0,
      uniqueCustomers: uniquePhones.size,
      averageGratuity: orders.length > 0
        ? Math.round((orders.reduce((sum, o) => sum + (o.gratuity_amount || 0), 0) / orders.length) * 100) / 100
        : 0
    };

    return { data: analytics, error: null };
  }

  // Export data for external use (QuickBooks, Excel)
  async exportSalesData(dateRange: { start: string; end: string }, format: 'csv' | 'json' = 'json') {
    const { data: salesData, error } = await supabase
      .from('orders')
      .select(`
        order_number,
        order_date,
        order_type,
        status,
        subtotal,
        tax_amount,
        gratuity_amount,
        total_amount,
        users:server_id (full_name),
        restaurant_tables:table_id (table_number),
        order_items (
          item_name,
          quantity,
          unit_price,
          total_price
        ),
        payments (
          payment_method,
          amount
        )
      `)
      .gte('order_date', dateRange.start)
      .lte('order_date', dateRange.end)
      .eq('status', 'completed')
      .order('order_date')
      .order('created_at');

    if (error) return { data: null, error };

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = this.convertToCSV(salesData);
      return { data: csvData, error: null };
    }

    return { data: salesData, error: null };
  }

  // Private helper to convert data to CSV
  private convertToCSV(data: any[]): string {
    if (!data.length) return '';

    // Flatten the data structure for CSV export
    const flatData = data.map(order => ({
      order_number: order.order_number,
      order_date: order.order_date,
      order_type: order.order_type,
      server_name: order.users?.full_name || '',
      table_number: order.restaurant_tables?.table_number || '',
      subtotal: order.subtotal,
      tax_amount: order.tax_amount,
      gratuity_amount: order.gratuity_amount,
      total_amount: order.total_amount,
      payment_method: order.payments?.[0]?.payment_method || '',
      item_count: order.order_items?.length || 0,
      items: order.order_items?.map((item: any) => item.item_name).join('; ') || ''
    }));

    // Generate CSV headers
    const headers = Object.keys(flatData[0]).join(',');
    
    // Generate CSV rows
    const rows = flatData.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }

  // Get inventory impact analysis
  async getInventoryImpact(dateRange?: { start: string; end: string }) {
    const startDate = dateRange?.start || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = dateRange?.end || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        menu_items:item_id (
          name,
          menu_item_ingredients (
            quantity_used,
            inventory_items (
              name,
              unit,
              current_quantity,
              reorder_point
            )
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

    if (error) return { data: null, error };

    // Calculate inventory usage
    const inventoryUsage: Record<string, {
      name: string;
      unit: string;
      totalUsed: number;
      currentStock: number;
      reorderPoint: number;
      daysUntilReorder: number;
    }> = {};

    data.forEach((orderItem: any) => {
      orderItem.menu_items?.menu_item_ingredients?.forEach((ingredient: any) => {
        const item = ingredient.inventory_items;
        const totalUsed = ingredient.quantity_used * orderItem.quantity;
        
        if (!inventoryUsage[item.name]) {
          inventoryUsage[item.name] = {
            name: item.name,
            unit: item.unit,
            totalUsed: 0,
            currentStock: item.current_quantity,
            reorderPoint: item.reorder_point || 0,
            daysUntilReorder: 0
          };
        }
        
        inventoryUsage[item.name].totalUsed += totalUsed;
      });
    });

    // Calculate days until reorder needed
    const days = Math.max(1, (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    const usageData = Object.values(inventoryUsage).map(item => {
      const dailyUsage = item.totalUsed / days;
      const daysUntilReorder = dailyUsage > 0 
        ? Math.floor((item.currentStock - item.reorderPoint) / dailyUsage)
        : 999;
      
      return {
        ...item,
        dailyUsage: Math.round(dailyUsage * 100) / 100,
        daysUntilReorder: Math.max(0, daysUntilReorder)
      };
    }).sort((a, b) => a.daysUntilReorder - b.daysUntilReorder);

    return { data: usageData, error: null };
  }
}

