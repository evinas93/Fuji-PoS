// Export service for generating Excel files matching Month_Year_SALES format
import * as XLSX from 'xlsx';

export interface DailySalesData {
  date: string;
  togo_sales: number;
  dine_in_sales: number;
  tax_collected: number;
  gross_sale: number;
  gratuity_total: number;
  coupon_subtract: number;
  net_sale: number;
  tip_cr: number;
  tip_cash: number;
  before_earned: number;
  credt_total: number;
  deposited: number;
  cash: number;
  sc_merch: number;
  sc_owner: number;
  daily_earned: number;
  weekly_earned: number;
  lunch: number;
  credit_total: number;
  cash_deposited: number;
}

export interface MonthlySalesData {
  month: string;
  year: number;
  daily_sales: DailySalesData[];
  totals: {
    togo_sales: number;
    dine_in_sales: number;
    tax_collected: number;
    gross_sale: number;
    gratuity_total: number;
    coupon_subtract: number;
    net_sale: number;
    tip_cr: number;
    tip_cash: number;
    before_earned: number;
    credt_total: number;
    deposited: number;
    cash: number;
    sc_merch: number;
    sc_owner: number;
    daily_earned: number;
    weekly_earned: number;
    lunch: number;
    credit_total: number;
    cash_deposited: number;
  };
}

export class ExportService {
  /**
   * Export daily sales to Month_Year_SALES format
   */
  exportMonthlyReport(data: MonthlySalesData): void {
    const wb = XLSX.utils.book_new();

    // Prepare data rows (without $ signs) - matching Excel column order
    const rows = data.daily_sales.map((day) => ({
      date: day.date,
      togo: Number((day.togo_sales || 0).toFixed(2)),
      dine_in: Number((day.dine_in_sales || 0).toFixed(2)),
      tax: Number((day.tax_collected || 0).toFixed(2)),
      gross_sale: Number((day.gross_sale || 0).toFixed(2)),
      gratuity: Number((day.gratuity_total || 0).toFixed(2)),
      coupon_subtract: Number((day.coupon_subtract || 0).toFixed(2)),
      net_sale: Number((day.net_sale || 0).toFixed(2)),
      tip_cr: Number((day.tip_cr || 0).toFixed(2)),
      tip_cash: Number((day.tip_cash || 0).toFixed(2)),
      before_earned: Number((day.before_earned || 0).toFixed(2)),
      credt_total: Number((day.credt_total || day.credit_total || 0).toFixed(2)),
      deposited: Number((day.deposited || 0).toFixed(2)),
      cash: Number((day.cash || 0).toFixed(2)),
      sc_merch: Number((day.sc_merch || 0).toFixed(2)),
      sc_owner: Number((day.sc_owner || 0).toFixed(2)),
      daily_earned: Number((day.daily_earned || 0).toFixed(2)),
      weekly_earned: Number((day.weekly_earned || 0).toFixed(2)),
      lunch: Number((day.lunch || 0).toFixed(2)),
      credit_total: Number((day.credit_total || 0).toFixed(2)),
      cash_deposited: Number((day.cash_deposited || 0).toFixed(2)),
    }));

    // Add totals row
    rows.push({
      date: 'TOTAL',
      togo: Number((data.totals.togo_sales || 0).toFixed(2)),
      dine_in: Number((data.totals.dine_in_sales || 0).toFixed(2)),
      tax: Number((data.totals.tax_collected || 0).toFixed(2)),
      gross_sale: Number((data.totals.gross_sale || 0).toFixed(2)),
      gratuity: Number((data.totals.gratuity_total || 0).toFixed(2)),
      coupon_subtract: Number((data.totals.coupon_subtract || 0).toFixed(2)),
      net_sale: Number((data.totals.net_sale || 0).toFixed(2)),
      tip_cr: Number((data.totals.tip_cr || 0).toFixed(2)),
      tip_cash: Number((data.totals.tip_cash || 0).toFixed(2)),
      before_earned: Number((data.totals.before_earned || 0).toFixed(2)),
      credt_total: Number((data.totals.credt_total || data.totals.credit_total || 0).toFixed(2)),
      deposited: Number((data.totals.deposited || 0).toFixed(2)),
      cash: Number((data.totals.cash || 0).toFixed(2)),
      sc_merch: Number((data.totals.sc_merch || 0).toFixed(2)),
      sc_owner: Number((data.totals.sc_owner || 0).toFixed(2)),
      daily_earned: Number((data.totals.daily_earned || 0).toFixed(2)),
      weekly_earned: Number((data.totals.weekly_earned || 0).toFixed(2)),
      lunch: Number((data.totals.lunch || 0).toFixed(2)),
      credit_total: Number((data.totals.credit_total || 0).toFixed(2)),
      cash_deposited: Number((data.totals.cash_deposited || 0).toFixed(2)),
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');

    // Generate filename: Month_Year_SALES.xlsx
    const filename = `${data.month}_${data.year}_SALES.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  /**
   * Export grand totals across all months
   */
  exportGrandTotals(monthlyData: MonthlySalesData[]): void {
    const wb = XLSX.utils.book_new();

    // Prepare summary rows - matching Excel column order
    const rows = monthlyData.map((month) => ({
      month: `${month.month} ${month.year}`,
      togo: Number((month.totals.togo_sales || 0).toFixed(2)),
      dine_in: Number((month.totals.dine_in_sales || 0).toFixed(2)),
      tax: Number((month.totals.tax_collected || 0).toFixed(2)),
      gross_sale: Number((month.totals.gross_sale || 0).toFixed(2)),
      gratuity: Number((month.totals.gratuity_total || 0).toFixed(2)),
      coupon_subtract: Number((month.totals.coupon_subtract || 0).toFixed(2)),
      net_sale: Number((month.totals.net_sale || 0).toFixed(2)),
      tip_cr: Number((month.totals.tip_cr || 0).toFixed(2)),
      tip_cash: Number((month.totals.tip_cash || 0).toFixed(2)),
      before_earned: Number((month.totals.before_earned || 0).toFixed(2)),
      credt_total: Number((month.totals.credt_total || month.totals.credit_total || 0).toFixed(2)),
      deposited: Number((month.totals.deposited || 0).toFixed(2)),
      cash: Number((month.totals.cash || 0).toFixed(2)),
      sc_merch: Number((month.totals.sc_merch || 0).toFixed(2)),
      sc_owner: Number((month.totals.sc_owner || 0).toFixed(2)),
      daily_earned: Number((month.totals.daily_earned || 0).toFixed(2)),
      weekly_earned: Number((month.totals.weekly_earned || 0).toFixed(2)),
      lunch: Number((month.totals.lunch || 0).toFixed(2)),
      credit_total: Number((month.totals.credit_total || 0).toFixed(2)),
      cash_deposited: Number((month.totals.cash_deposited || 0).toFixed(2)),
    }));

    // Calculate grand totals across all months
    const grandTotal = {
      month: 'GRAND TOTAL',
      togo: Number(monthlyData.reduce((sum, m) => sum + (m.totals.togo_sales || 0), 0).toFixed(2)),
      dine_in: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.dine_in_sales || 0), 0).toFixed(2)
      ),
      tax: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.tax_collected || 0), 0).toFixed(2)
      ),
      gross_sale: Number(monthlyData.reduce((sum, m) => sum + (m.totals.gross_sale || 0), 0).toFixed(2)),
      gratuity: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.gratuity_total || 0), 0).toFixed(2)
      ),
      coupon_subtract: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.coupon_subtract || 0), 0).toFixed(2)
      ),
      net_sale: Number(monthlyData.reduce((sum, m) => sum + (m.totals.net_sale || 0), 0).toFixed(2)),
      tip_cr: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.tip_cr || 0), 0).toFixed(2)
      ),
      tip_cash: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.tip_cash || 0), 0).toFixed(2)
      ),
      before_earned: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.before_earned || 0), 0).toFixed(2)
      ),
      credt_total: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.credt_total || m.totals.credit_total || 0), 0).toFixed(2)
      ),
      deposited: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.deposited || 0), 0).toFixed(2)
      ),
      cash: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.cash || 0), 0).toFixed(2)
      ),
      sc_merch: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.sc_merch || 0), 0).toFixed(2)
      ),
      sc_owner: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.sc_owner || 0), 0).toFixed(2)
      ),
      daily_earned: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.daily_earned || 0), 0).toFixed(2)
      ),
      weekly_earned: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.weekly_earned || 0), 0).toFixed(2)
      ),
      lunch: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.lunch || 0), 0).toFixed(2)
      ),
      credit_total: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.credit_total || 0), 0).toFixed(2)
      ),
      cash_deposited: Number(
        monthlyData.reduce((sum, m) => sum + (m.totals.cash_deposited || 0), 0).toFixed(2)
      ),
    };

    rows.push(grandTotal);

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Grand Totals');

    const filename = `Grand_Totals_Sales_Summary.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  /**
   * Export CSV format for compatibility
   */
  exportMonthlyCSV(data: MonthlySalesData): void {
    const wb = XLSX.utils.book_new();

    const rows = data.daily_sales.map((day) => ({
      date: day.date,
      togo: Number((day.togo_sales || 0).toFixed(2)),
      dine_in: Number((day.dine_in_sales || 0).toFixed(2)),
      tax: Number((day.tax_collected || 0).toFixed(2)),
      gross_sale: Number((day.gross_sale || 0).toFixed(2)),
      gratuity: Number((day.gratuity_total || 0).toFixed(2)),
      coupon_subtract: Number((day.coupon_subtract || 0).toFixed(2)),
      net_sale: Number((day.net_sale || 0).toFixed(2)),
      tip_cr: Number((day.tip_cr || 0).toFixed(2)),
      tip_cash: Number((day.tip_cash || 0).toFixed(2)),
      before_earned: Number((day.before_earned || 0).toFixed(2)),
      credt_total: Number((day.credt_total || day.credit_total || 0).toFixed(2)),
      deposited: Number((day.deposited || 0).toFixed(2)),
      cash: Number((day.cash || 0).toFixed(2)),
      sc_merch: Number((day.sc_merch || 0).toFixed(2)),
      sc_owner: Number((day.sc_owner || 0).toFixed(2)),
      daily_earned: Number((day.daily_earned || 0).toFixed(2)),
      weekly_earned: Number((day.weekly_earned || 0).toFixed(2)),
      lunch: Number((day.lunch || 0).toFixed(2)),
      credit_total: Number((day.credit_total || 0).toFixed(2)),
      cash_deposited: Number((day.cash_deposited || 0).toFixed(2)),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');

    const filename = `${data.month}_${data.year}_SALES.csv`;
    XLSX.writeFile(wb, filename, { bookType: 'csv' });
  }
}
