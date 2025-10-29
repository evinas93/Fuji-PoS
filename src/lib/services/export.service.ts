// Export service for generating Excel files matching Month_Year_SALES format
import * as XLSX from 'xlsx';

export interface DailySalesData {
  date: string;
  togo_sales: number;
  dine_in_sales: number;
  tax_collected: number;
  gross_sale: number;
  gratuity_total: number;
  net_sale: number;
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
    net_sale: number;
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

    // Prepare data rows (without $ signs)
    const rows = data.daily_sales.map((day) => ({
      date: day.date,
      togo_sales: Number(day.togo_sales.toFixed(2)),
      dine_in_sales: Number(day.dine_in_sales.toFixed(2)),
      tax_collected: Number(day.tax_collected.toFixed(2)),
      gross_sale: Number(day.gross_sale.toFixed(2)),
      gratuity_total: Number(day.gratuity_total.toFixed(2)),
      net_sale: Number(day.net_sale.toFixed(2)),
      credit_total: Number(day.credit_total.toFixed(2)),
      cash_deposited: Number(day.cash_deposited.toFixed(2)),
    }));

    // Add totals row
    rows.push({
      date: 'TOTAL',
      togo_sales: Number(data.totals.togo_sales.toFixed(2)),
      dine_in_sales: Number(data.totals.dine_in_sales.toFixed(2)),
      tax_collected: Number(data.totals.tax_collected.toFixed(2)),
      gross_sale: Number(data.totals.gross_sale.toFixed(2)),
      gratuity_total: Number(data.totals.gratuity_total.toFixed(2)),
      net_sale: Number(data.totals.net_sale.toFixed(2)),
      credit_total: Number(data.totals.credit_total.toFixed(2)),
      cash_deposited: Number(data.totals.cash_deposited.toFixed(2)),
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

    // Prepare summary rows
    const rows = monthlyData.map((month) => ({
      month: `${month.month} ${month.year}`,
      togo_sales: Number(month.totals.togo_sales.toFixed(2)),
      dine_in_sales: Number(month.totals.dine_in_sales.toFixed(2)),
      tax_collected: Number(month.totals.tax_collected.toFixed(2)),
      gross_sale: Number(month.totals.gross_sale.toFixed(2)),
      gratuity_total: Number(month.totals.gratuity_total.toFixed(2)),
      net_sale: Number(month.totals.net_sale.toFixed(2)),
      credit_total: Number(month.totals.credit_total.toFixed(2)),
      cash_deposited: Number(month.totals.cash_deposited.toFixed(2)),
    }));

    // Calculate grand totals across all months
    const grandTotal = {
      month: 'GRAND TOTAL',
      togo_sales: Number(monthlyData.reduce((sum, m) => sum + m.totals.togo_sales, 0).toFixed(2)),
      dine_in_sales: Number(
        monthlyData.reduce((sum, m) => sum + m.totals.dine_in_sales, 0).toFixed(2)
      ),
      tax_collected: Number(
        monthlyData.reduce((sum, m) => sum + m.totals.tax_collected, 0).toFixed(2)
      ),
      gross_sale: Number(monthlyData.reduce((sum, m) => sum + m.totals.gross_sale, 0).toFixed(2)),
      gratuity_total: Number(
        monthlyData.reduce((sum, m) => sum + m.totals.gratuity_total, 0).toFixed(2)
      ),
      net_sale: Number(monthlyData.reduce((sum, m) => sum + m.totals.net_sale, 0).toFixed(2)),
      credit_total: Number(
        monthlyData.reduce((sum, m) => sum + m.totals.credit_total, 0).toFixed(2)
      ),
      cash_deposited: Number(
        monthlyData.reduce((sum, m) => sum + m.totals.cash_deposited, 0).toFixed(2)
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
      togo_sales: Number(day.togo_sales.toFixed(2)),
      dine_in_sales: Number(day.dine_in_sales.toFixed(2)),
      tax_collected: Number(day.tax_collected.toFixed(2)),
      gross_sale: Number(day.gross_sale.toFixed(2)),
      gratuity_total: Number(day.gratuity_total.toFixed(2)),
      net_sale: Number(day.net_sale.toFixed(2)),
      credit_total: Number(day.credit_total.toFixed(2)),
      cash_deposited: Number(day.cash_deposited.toFixed(2)),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');

    const filename = `${data.month}_${data.year}_SALES.csv`;
    XLSX.writeFile(wb, filename, { bookType: 'csv' });
  }
}
