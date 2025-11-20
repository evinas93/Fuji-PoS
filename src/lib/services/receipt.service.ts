// Receipt management service for Fuji POS System
import { supabase } from '../supabase';

export interface ReceiptData {
  id: string;
  order_number: number;
  order_date: string;
  order_type: 'dine_in' | 'take_out';
  table_id?: string;
  customer_name?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  gratuity_amount: number;
  service_charge: number;
  total_amount: number;
  payment_method?: string;
  status: string;
  created_at: string;
  order_items: Array<{
    id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    modifiers?: any;
    special_instructions?: string;
  }>;
  restaurant_tables?: {
    table_number: number;
  } | null;
  users?: {
    full_name: string;
  } | null;
}

export interface ReceiptFilters {
  startDate?: string;
  endDate?: string;
  orderNumber?: string;
  orderType?: 'dine_in' | 'take_out' | 'all';
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

export class ReceiptService {
  /**
   * Fetch receipt data for a single order
   */
  async getReceipt(orderId: string): Promise<{ data: ReceiptData | null; error: Error | null }> {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          restaurant_tables (table_number),
          users:server_id (full_name)
        `)
        .eq('id', orderId)
        .single();

      if (error) return { data: null, error };

      return { data: order as ReceiptData, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Fetch list of receipts with filters and pagination
   */
  async getReceipts(filters: ReceiptFilters = {}): Promise<{
    data: ReceiptData[] | null;
    error: Error | null;
    count: number;
  }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          restaurant_tables (table_number),
          users:server_id (full_name)
        `, { count: 'exact' })
        .eq('status', 'completed')
        .eq('is_void', false)
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply filters
      if (filters.startDate) {
        query = query.gte('order_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('order_date', filters.endDate);
      }
      if (filters.orderNumber) {
        query = query.eq('order_number', parseInt(filters.orderNumber));
      }
      if (filters.orderType && filters.orderType !== 'all') {
        query = query.eq('order_type', filters.orderType);
      }
      if (filters.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod);
      }

      const { data, error, count } = await query;

      if (error) return { data: null, error, count: 0 };

      return { data: data as ReceiptData[], error: null, count: count || 0 };
    } catch (error) {
      return { data: null, error: error as Error, count: 0 };
    }
  }

  /**
   * Log receipt print event to audit log
   */
  async logPrint(orderId: string, userId: string, printMethod: 'browser' | 'thermal' | 'pdf' = 'browser'): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('audit_log')
        .insert({
          table_name: 'orders',
          record_id: orderId,
          action: 'PRINT',
          new_values: { print_method: printMethod, printed_at: new Date().toISOString() },
          changed_by: userId
        });

      if (error) return { success: false, error };

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Trigger browser print for receipt
   */
  printReceipt(orderId: string): void {
    const printWindow = window.open(`/api/orders/${orderId}/receipt`, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  }

  /**
   * Format receipt data for thermal printer
   */
  formatForThermalPrinter(receipt: ReceiptData): string {
    const lines: string[] = [];

    // Header
    lines.push('================================');
    lines.push('      FUJI RESTAURANT');
    lines.push('================================');
    lines.push('');

    // Order info
    lines.push(`Order #${receipt.order_number}`);
    lines.push(`Type: ${receipt.order_type === 'dine_in' ? 'Dine In' : 'Take Out'}`);
    if (receipt.restaurant_tables) {
      lines.push(`Table: ${receipt.restaurant_tables.table_number}`);
    }
    if (receipt.users) {
      lines.push(`Server: ${receipt.users.full_name}`);
    }
    lines.push(`Date: ${new Date(receipt.created_at).toLocaleString()}`);
    lines.push('================================');
    lines.push('');

    // Items
    lines.push('ITEMS:');
    lines.push('--------------------------------');
    receipt.order_items.forEach(item => {
      lines.push(`${item.quantity}x ${item.item_name}`);
      lines.push(`   @ $${item.unit_price.toFixed(2)} = $${item.total_price.toFixed(2)}`);
      if (item.special_instructions) {
        lines.push(`   Note: ${item.special_instructions}`);
      }
    });
    lines.push('--------------------------------');
    lines.push('');

    // Totals
    lines.push(`Subtotal:        $${receipt.subtotal.toFixed(2)}`);
    if (receipt.discount_amount > 0) {
      lines.push(`Discount:       -$${receipt.discount_amount.toFixed(2)}`);
    }
    lines.push(`Tax (8%):         $${receipt.tax_amount.toFixed(2)}`);
    if (receipt.gratuity_amount > 0) {
      lines.push(`Gratuity (20%):   $${receipt.gratuity_amount.toFixed(2)}`);
    }
    if (receipt.service_charge > 0) {
      lines.push(`Service Charge:   $${receipt.service_charge.toFixed(2)}`);
    }
    lines.push('================================');
    lines.push(`TOTAL:           $${receipt.total_amount.toFixed(2)}`);
    lines.push('================================');
    lines.push('');
    lines.push('    Thank you for dining');
    lines.push('         with us!');
    lines.push('');

    return lines.join('\n');
  }
}

export const receiptService = new ReceiptService();
