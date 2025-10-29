// React hooks for sales reporting and aggregation
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { DailySalesData, MonthlySalesData } from '../lib/services/export.service';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';

// Type for order data from database
interface OrderData {
  subtotal?: number;
  tax_amount?: number;
  tax?: number;
  gratuity_amount?: number;
  gratuity?: number;
  total_amount?: number;
  total?: number;
  order_type?: string;
  payment_method?: string;
  created_at?: string;
}

/**
 * Hook to get daily sales summary from orders
 */
export function useDailySales(date: Date) {
  return useQuery({
    queryKey: ['dailySales', format(date, 'yyyy-MM-dd')],
    queryFn: async (): Promise<DailySalesData> => {
      const dateStr = format(date, 'yyyy-MM-dd');

      // Query orders for the specific date
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', `${dateStr}T00:00:00`)
        .lte('created_at', `${dateStr}T23:59:59`)
        .in('status', ['completed']);

      if (error) throw error;

      // Aggregate data
      let togoSales = 0;
      let dineInSales = 0;
      let taxCollected = 0;
      let gratuityTotal = 0;
      let creditTotal = 0;
      let cashTotal = 0;

      (orders as OrderData[] | null)?.forEach((order) => {
        const subtotal = order.subtotal || 0;
        // Handle both schema versions
        const tax = order.tax_amount || order.tax || 0;
        const gratuity = order.gratuity_amount || order.gratuity || 0;
        const total = order.total_amount || order.total || 0;

        // Categorize by order type
        if (order.order_type === 'take_out') {
          togoSales += subtotal;
        } else {
          dineInSales += subtotal;
        }

        taxCollected += tax;
        gratuityTotal += gratuity;

        // Categorize by payment method
        if (order.payment_method === 'credit' || order.payment_method === 'debit') {
          creditTotal += total;
        } else if (order.payment_method === 'cash') {
          cashTotal += total;
        }
      });

      const grossSale = togoSales + dineInSales;
      const netSale = grossSale + taxCollected + gratuityTotal;

      return {
        date: dateStr,
        togo_sales: togoSales,
        dine_in_sales: dineInSales,
        tax_collected: taxCollected,
        gross_sale: grossSale,
        gratuity_total: gratuityTotal,
        net_sale: netSale,
        credit_total: creditTotal,
        cash_deposited: cashTotal,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get monthly sales aggregated by day
 */
export function useMonthlySales(year: number, month: number) {
  return useQuery({
    queryKey: ['monthlySales', year, month],
    queryFn: async (): Promise<MonthlySalesData> => {
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));

      // Query all orders for the month
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', format(startDate, "yyyy-MM-dd'T'00:00:00"))
        .lte('created_at', format(endDate, "yyyy-MM-dd'T'23:59:59"))
        .in('status', ['completed']);

      if (error) throw error;

      // Get all days in the month
      const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

      // Initialize daily sales data
      const dailySalesMap = new Map<string, DailySalesData>();
      daysInMonth.forEach((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        dailySalesMap.set(dateStr, {
          date: dateStr,
          togo_sales: 0,
          dine_in_sales: 0,
          tax_collected: 0,
          gross_sale: 0,
          gratuity_total: 0,
          net_sale: 0,
          credit_total: 0,
          cash_deposited: 0,
        });
      });

      // Aggregate orders by day
      (orders as OrderData[] | null)?.forEach((order) => {
        const orderDate = format(parseISO(order.created_at || ''), 'yyyy-MM-dd');
        const dailyData = dailySalesMap.get(orderDate);

        if (dailyData) {
          const subtotal = order.subtotal || 0;
          // Handle both schema versions
          const tax = order.tax_amount || order.tax || 0;
          const gratuity = order.gratuity_amount || order.gratuity || 0;
          const total = order.total_amount || order.total || 0;

          if (order.order_type === 'take_out') {
            dailyData.togo_sales += subtotal;
          } else {
            dailyData.dine_in_sales += subtotal;
          }

          dailyData.tax_collected += tax;
          dailyData.gratuity_total += gratuity;
          dailyData.gross_sale = dailyData.togo_sales + dailyData.dine_in_sales;
          dailyData.net_sale =
            dailyData.gross_sale + dailyData.tax_collected + dailyData.gratuity_total;

          if (order.payment_method === 'credit' || order.payment_method === 'debit') {
            dailyData.credit_total += total;
          } else if (order.payment_method === 'cash') {
            dailyData.cash_deposited += total;
          }
        }
      });

      const daily_sales = Array.from(dailySalesMap.values());

      // Calculate monthly totals
      const totals = daily_sales.reduce(
        (acc, day) => ({
          togo_sales: acc.togo_sales + day.togo_sales,
          dine_in_sales: acc.dine_in_sales + day.dine_in_sales,
          tax_collected: acc.tax_collected + day.tax_collected,
          gross_sale: acc.gross_sale + day.gross_sale,
          gratuity_total: acc.gratuity_total + day.gratuity_total,
          net_sale: acc.net_sale + day.net_sale,
          credit_total: acc.credit_total + day.credit_total,
          cash_deposited: acc.cash_deposited + day.cash_deposited,
        }),
        {
          togo_sales: 0,
          dine_in_sales: 0,
          tax_collected: 0,
          gross_sale: 0,
          gratuity_total: 0,
          net_sale: 0,
          credit_total: 0,
          cash_deposited: 0,
        }
      );

      return {
        month: format(startDate, 'MMMM'),
        year,
        daily_sales,
        totals,
      };
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to get all-time sales data for grand totals
 */
export function useAllTimeSales() {
  return useQuery({
    queryKey: ['allTimeSales'],
    queryFn: async (): Promise<MonthlySalesData[]> => {
      // Get all completed orders
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by month/year
      const monthlyDataMap = new Map<
        string,
        {
          orders: OrderData[];
          year: number;
          month: number;
          monthName: string;
        }
      >();

      (orders as OrderData[] | null)?.forEach((order) => {
        const orderDate = parseISO(order.created_at || '');
        const year = orderDate.getFullYear();
        const month = orderDate.getMonth() + 1;
        const key = `${year}-${month.toString().padStart(2, '0')}`;

        if (!monthlyDataMap.has(key)) {
          monthlyDataMap.set(key, {
            orders: [],
            year,
            month,
            monthName: format(orderDate, 'MMMM'),
          });
        }

        monthlyDataMap.get(key)!.orders.push(order);
      });

      // Convert to MonthlySalesData format
      const monthlySalesData: MonthlySalesData[] = [];

      for (const [, monthData] of monthlyDataMap) {
        const daysMap = new Map<string, DailySalesData>();

        monthData.orders.forEach((order) => {
          const dateStr = format(parseISO(order.created_at || ''), 'yyyy-MM-dd');

          if (!daysMap.has(dateStr)) {
            daysMap.set(dateStr, {
              date: dateStr,
              togo_sales: 0,
              dine_in_sales: 0,
              tax_collected: 0,
              gross_sale: 0,
              gratuity_total: 0,
              net_sale: 0,
              credit_total: 0,
              cash_deposited: 0,
            });
          }

          const dailyData = daysMap.get(dateStr)!;
          const subtotal = order.subtotal || 0;
          // Handle both schema versions
          const tax = order.tax_amount || order.tax || 0;
          const gratuity = order.gratuity_amount || order.gratuity || 0;
          const total = order.total_amount || order.total || 0;

          if (order.order_type === 'take_out') {
            dailyData.togo_sales += subtotal;
          } else {
            dailyData.dine_in_sales += subtotal;
          }

          dailyData.tax_collected += tax;
          dailyData.gratuity_total += gratuity;
          dailyData.gross_sale = dailyData.togo_sales + dailyData.dine_in_sales;
          dailyData.net_sale =
            dailyData.gross_sale + dailyData.tax_collected + dailyData.gratuity_total;

          if (order.payment_method === 'credit' || order.payment_method === 'debit') {
            dailyData.credit_total += total;
          } else if (order.payment_method === 'cash') {
            dailyData.cash_deposited += total;
          }
        });

        const daily_sales = Array.from(daysMap.values());
        const totals = daily_sales.reduce(
          (acc, day) => ({
            togo_sales: acc.togo_sales + day.togo_sales,
            dine_in_sales: acc.dine_in_sales + day.dine_in_sales,
            tax_collected: acc.tax_collected + day.tax_collected,
            gross_sale: acc.gross_sale + day.gross_sale,
            gratuity_total: acc.gratuity_total + day.gratuity_total,
            net_sale: acc.net_sale + day.net_sale,
            credit_total: acc.credit_total + day.credit_total,
            cash_deposited: acc.cash_deposited + day.cash_deposited,
          }),
          {
            togo_sales: 0,
            dine_in_sales: 0,
            tax_collected: 0,
            gross_sale: 0,
            gratuity_total: 0,
            net_sale: 0,
            credit_total: 0,
            cash_deposited: 0,
          }
        );

        monthlySalesData.push({
          month: monthData.monthName,
          year: monthData.year,
          daily_sales,
          totals,
        });
      }

      return monthlySalesData;
    },
    staleTime: 15 * 60 * 1000,
  });
}
