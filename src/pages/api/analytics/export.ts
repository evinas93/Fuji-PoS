// Export API endpoint for analytics data
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createSupabaseClient } from '../../../server/config/supabase';
import { asyncHandler, ValidationError } from '../../../server/middleware/errorHandler';
import { requireAuth } from '../../../server/middleware/auth';

// Validation schema
const exportSchema = z.object({
  reportType: z.enum(['sales', 'analytics', 'profitability', 'servers']),
  format: z.enum(['csv', 'json', 'pdf']).default('json'),
  dateRange: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  filters: z.object({
    category: z.string().optional(),
    server: z.string().optional()
  }).optional()
});

const handler = asyncHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate request body
  const { reportType, format, dateRange, filters } = exportSchema.parse(req.body);

  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  let data;
  let filename;

  try {
    switch (reportType) {
      case 'sales':
        data = await exportSalesData(supabaseClient, dateRange);
        filename = `sales-report-${dateRange.start}-to-${dateRange.end}`;
        break;

      case 'analytics':
        data = await exportAnalyticsData(supabaseClient, dateRange);
        filename = `analytics-report-${dateRange.start}-to-${dateRange.end}`;
        break;

      case 'profitability':
        data = await exportProfitabilityData(supabaseClient, dateRange);
        filename = `profitability-report-${dateRange.start}-to-${dateRange.end}`;
        break;

      case 'servers':
        data = await exportServerData(supabaseClient, dateRange);
        filename = `server-report-${dateRange.start}-to-${dateRange.end}`;
        break;

      default:
        throw new ValidationError('Invalid report type');
    }

    // Format data based on requested format
    let responseData;
    let contentType;

    switch (format) {
      case 'csv':
        responseData = convertToCSV(data, reportType);
        contentType = 'text/csv';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        break;

      case 'json':
        responseData = JSON.stringify({
          reportType,
          dateRange,
          generatedAt: new Date().toISOString(),
          totalRecords: data.length,
          data
        }, null, 2);
        contentType = 'application/json';
        break;

      default:
        responseData = data;
        contentType = 'application/json';
    }

    res.setHeader('Content-Type', contentType);
    res.status(200).send(responseData);

  } catch (error) {
    console.error('Export error:', error);
    throw new ValidationError('Failed to export data');
  }
});

// Export sales data
async function exportSalesData(supabaseClient: any, dateRange: { start: string; end: string }) {
  const { data, error } = await supabaseClient
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
      )
    `)
    .gte('order_date', dateRange.start)
    .lte('order_date', dateRange.end)
    .eq('status', 'completed')
    .order('order_date')
    .order('created_at');

  if (error) throw error;
  return data;
}

// Export analytics data
async function exportAnalyticsData(supabaseClient: any, dateRange: { start: string; end: string }) {
  const { data, error } = await supabaseClient
    .from('daily_sales')
    .select('*')
    .gte('sales_date', dateRange.start)
    .lte('sales_date', dateRange.end)
    .order('sales_date');

  if (error) throw error;
  return data;
}

// Export profitability data
async function exportProfitabilityData(supabaseClient: any, dateRange: { start: string; end: string }) {
  const { data, error } = await supabaseClient
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

  if (error) throw error;

  // Calculate profit metrics
  return data.map(item => ({
    ...item,
    profit: item.base_price - (item.cost || 0),
    profitMargin: ((item.base_price - (item.cost || 0)) / item.base_price) * 100
  }));
}

// Export server data
async function exportServerData(supabaseClient: any, dateRange: { start: string; end: string }) {
  const { data, error } = await supabaseClient
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
    .gte('order_date', dateRange.start)
    .lte('order_date', dateRange.end)
    .eq('status', 'completed');

  if (error) throw error;

  // Aggregate by server
  const serverStats = data.reduce((acc: any, order: any) => {
    const serverId = order.server_id;
    if (!acc[serverId]) {
      acc[serverId] = {
        id: serverId,
        username: order.profiles?.username || 'Unknown',
        firstName: order.profiles?.first_name || '',
        lastName: order.profiles?.last_name || '',
        totalSales: 0,
        totalOrders: 0,
        totalGratuity: 0
      };
    }
    acc[serverId].totalSales += order.total_amount;
    acc[serverId].totalOrders += 1;
    acc[serverId].totalGratuity += order.gratuity_amount || 0;
    return acc;
  }, {});

  return Object.values(serverStats).map((server: any) => ({
    ...server,
    averageTicket: server.totalOrders > 0 ? server.totalSales / server.totalOrders : 0
  }));
}

// Convert data to CSV format
function convertToCSV(data: any[], reportType: string): string {
  if (!data.length) return '';

  let headers: string[] = [];
  let getRowData: (item: any) => string[] = () => [];

  switch (reportType) {
    case 'sales':
      headers = ['Order Number', 'Date', 'Type', 'Server', 'Table', 'Subtotal', 'Tax', 'Gratuity', 'Total', 'Status'];
      getRowData = (item) => [
        item.order_number || '',
        item.order_date || '',
        item.order_type || '',
        item.users?.full_name || '',
        item.restaurant_tables?.table_number || '',
        item.subtotal?.toString() || '0',
        item.tax_amount?.toString() || '0',
        item.gratuity_amount?.toString() || '0',
        item.total_amount?.toString() || '0',
        item.status || ''
      ];
      break;

    case 'analytics':
      headers = ['Date', 'Gross Sales', 'Net Sales', 'Total Orders', 'Tax Collected', 'Gratuity Total'];
      getRowData = (item) => [
        item.sales_date || item.date || '',
        item.gross_sales?.toString() || '0',
        item.net_sales?.toString() || '0',
        item.total_orders?.toString() || '0',
        item.tax_collected?.toString() || '0',
        item.gratuity_total?.toString() || '0'
      ];
      break;

    case 'profitability':
      headers = ['Item Name', 'Category', 'Price', 'Cost', 'Profit', 'Profit Margin %'];
      getRowData = (item) => [
        item.name || '',
        item.menu_categories?.name || '',
        item.base_price?.toString() || '0',
        item.cost?.toString() || '0',
        item.profit?.toString() || '0',
        item.profitMargin?.toFixed(2) || '0'
      ];
      break;

    case 'servers':
      headers = ['Server Name', 'Username', 'Total Sales', 'Total Orders', 'Average Ticket', 'Total Gratuity'];
      getRowData = (item) => [
        `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.username || '',
        item.username || '',
        item.totalSales?.toString() || '0',
        item.totalOrders?.toString() || '0',
        item.averageTicket?.toFixed(2) || '0',
        item.totalGratuity?.toString() || '0'
      ];
      break;

    default:
      headers = ['Data'];
      getRowData = (item) => [JSON.stringify(item)];
  }

  // Generate CSV
  const csvHeaders = headers.join(',');
  const csvRows = data.map(item => {
    const rowData = getRowData(item);
    return rowData.map(value =>
      typeof value === 'string' && value.includes(',')
        ? `"${value.replace(/"/g, '""')}"`
        : value
    ).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

export default requireAuth(handler);