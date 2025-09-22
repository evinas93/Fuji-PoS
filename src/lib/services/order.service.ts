// Order management service for Fuji POS System
import { supabase } from '../supabase';
import type { Order, OrderInsert, OrderItem, OrderItemInsert, OrderType, OrderStatus } from '../../types/database';

export class OrderService {
  // Create new order
  async createOrder(orderData: {
    order_type: OrderType;
    table_id?: string;
    customer_name?: string;
    customer_phone?: string;
    server_id: string;
    notes?: string;
  }) {
    try {
      // Start transaction by creating order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_type: orderData.order_type,
          table_id: orderData.table_id || null,
          customer_name: orderData.customer_name || null,
          customer_phone: orderData.customer_phone || null,
          server_id: orderData.server_id,
          notes: orderData.notes || null,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) return { data: null, error: orderError };

      // If dine-in, mark table as occupied
      if (orderData.table_id) {
        await supabase
          .from('restaurant_tables')
          .update({
            is_occupied: true,
            current_order_id: order.id,
            occupied_at: new Date().toISOString(),
            server_id: orderData.server_id
          })
          .eq('id', orderData.table_id);
      }

      return { data: order, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Add items to order
  async addOrderItems(orderId: string, items: Array<{
    item_id: string;
    quantity: number;
    modifiers?: Array<{ id: string; name: string; price: number }>;
    special_instructions?: string;
  }>) {
    try {
      // Fetch menu item details for pricing
      const itemIds = items.map(i => i.item_id);
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, name, base_price, glass_price, bottle_price, lunch_price, dinner_price')
        .in('id', itemIds);

      if (menuError) return { data: null, error: menuError };

      // Prepare order items
      const orderItems = items.map((item): any => {
        const menuItem = menuItems?.find(mi => mi.id === item.item_id);
        if (!menuItem) {
          throw new Error(`Menu item ${item.item_id} not found`);
        }

        // Calculate base unit price (this could be enhanced with time-based pricing)
        const unitPrice = menuItem.base_price;
        
        // Calculate modifier costs
        const modifierCost = item.modifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0;
        const totalPrice = (unitPrice + modifierCost) * item.quantity;

        return {
          order_id: orderId,
          item_id: item.item_id,
          item_name: menuItem.name,
          quantity: item.quantity,
          unit_price: unitPrice,
          modifiers: item.modifiers || [],
          special_instructions: item.special_instructions || null,
          discount_amount: 0,
          tax_amount: 0,
          total_price: totalPrice,
          status: 'pending' as OrderStatus,
          sent_to_kitchen_at: null,
          prepared_at: null,
          served_at: null
        };
      });

      const { data, error } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select(`
          *,
          menu_items:item_id (
            name,
            preparation_time,
            allergens
          )
        `);

      if (error) return { data: null, error };

      // Trigger order total recalculation (handled by database trigger)
      await supabase
        .from('orders')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', orderId);

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Send order to kitchen
  async sendToKitchen(orderId: string) {
    try {
      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) return { error: orderError };

      // Update all items status (this triggers kitchen notification via database trigger)
      const { error: itemsError } = await supabase
        .from('order_items')
        .update({ status: 'confirmed' })
        .eq('order_id', orderId);

      return { error: itemsError };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // Get active orders
  async getActiveOrders(serverId?: string, status?: OrderStatus[]) {
    let query = supabase
      .from('orders')
      .select(`
        *,
        restaurant_tables (
          table_number,
          section,
          seats
        ),
        order_items (
          id,
          item_name,
          quantity,
          modifiers,
          status,
          special_instructions,
          sent_to_kitchen_at,
          prepared_at,
          menu_items:item_id (
            preparation_time,
            allergens,
            spicy_level
          )
        ),
        users!orders_server_id_fkey (
          full_name,
          role
        )
      `)
      .in('status', status || ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: false });

    if (serverId) {
      query = query.eq('server_id', serverId);
    }

    const { data, error } = await query;
    return { data, error };
  }

  // Get specific order with full details
  async getOrder(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant_tables (
          table_number,
          section,
          seats
        ),
        order_items (
          *,
          menu_items:item_id (
            name,
            base_price,
            preparation_time,
            allergens,
            spicy_level
          )
        ),
        users!orders_server_id_fkey (
          full_name,
          role
        ),
        payments (
          id,
          payment_method,
          amount,
          tip_amount,
          created_at
        )
      `)
      .eq('id', orderId)
      .single();

    return { data, error };
  }

  // Update order item status (for kitchen)
  async updateItemStatus(itemId: string, status: OrderStatus) {
    const statusField = this.getStatusTimestampField(status);
    
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (statusField) {
      updateData[statusField] = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('order_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    return { data, error };
  }

  // Update entire order status
  async updateOrderStatus(orderId: string, status: OrderStatus, options: {
    cancelled_reason?: string;
    completed_by?: string;
  } = {}) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      if (options.completed_by) {
        updateData.cashier_id = options.completed_by;
      }
    }

    if (status === 'cancelled' && options.cancelled_reason) {
      updateData.void_reason = options.cancelled_reason;
      updateData.is_void = true;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    // Also update all order items status
    if (!error) {
      await supabase
        .from('order_items')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'completed' && { served_at: new Date().toISOString() })
        })
        .eq('order_id', orderId);

      // Free up table if order is completed or cancelled
      if (status === 'completed' || status === 'cancelled') {
        await this.freeUpTable(orderId);
      }
    }

    return { data, error };
  }

  // Cancel order
  async cancelOrder(orderId: string, reason: string, cancelledBy: string) {
    return this.updateOrderStatus(orderId, 'cancelled', {
      cancelled_reason: reason
    });
  }

  // Remove item from order (before sending to kitchen)
  async removeOrderItem(itemId: string) {
    // Check if item has been sent to kitchen
    const { data: item, error: checkError } = await supabase
      .from('order_items')
      .select('status, order_id')
      .eq('id', itemId)
      .single();

    if (checkError) return { error: checkError };

    if (item.status !== 'pending') {
      return { error: new Error('Cannot remove item that has been sent to kitchen') };
    }

    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);

    if (!error) {
      // Trigger order total recalculation
      await supabase
        .from('orders')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', item.order_id);
    }

    return { error };
  }

  // Transfer order to different table
  async transferOrder(orderId: string, newTableId: string) {
    // Get current table info
    const { data: order } = await supabase
      .from('orders')
      .select('table_id')
      .eq('id', orderId)
      .single();

    if (order?.table_id) {
      // Free up current table
      await supabase
        .from('restaurant_tables')
        .update({
          is_occupied: false,
          current_order_id: null,
          occupied_at: null,
          server_id: null
        })
        .eq('id', order.table_id);
    }

    // Update order with new table
    const { data, error } = await supabase
      .from('orders')
      .update({
        table_id: newTableId,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (!error) {
      // Mark new table as occupied
      await supabase
        .from('restaurant_tables')
        .update({
          is_occupied: true,
          current_order_id: orderId,
          occupied_at: new Date().toISOString()
        })
        .eq('id', newTableId);
    }

    return { data, error };
  }

  // Get order preparation time estimate
  async getOrderEstimate(orderId: string) {
    const { data: items, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        menu_items:item_id (
          preparation_time
        )
      `)
      .eq('order_id', orderId);

    if (error || !items) return { estimatedTime: 0, error };

    // Calculate total prep time (considering parallel preparation)
    const maxPrepTime = Math.max(...items.map((item: any) => {
      const prepTime = Array.isArray(item.menu_items) 
        ? item.menu_items[0]?.preparation_time 
        : item.menu_items?.preparation_time;
      return (prepTime || 15) * item.quantity;
    }));

    return { estimatedTime: maxPrepTime, error: null };
  }

  // Private helper methods
  private getStatusTimestampField(status: OrderStatus): string | null {
    switch (status) {
      case 'preparing':
        return 'sent_to_kitchen_at';
      case 'ready':
        return 'prepared_at';
      case 'completed':
        return 'served_at';
      default:
        return null;
    }
  }

  private async freeUpTable(orderId: string) {
    const { data: order } = await supabase
      .from('orders')
      .select('table_id')
      .eq('id', orderId)
      .single();

    if (order?.table_id) {
      await supabase
        .from('restaurant_tables')
        .update({
          is_occupied: false,
          current_order_id: null,
          occupied_at: null,
          server_id: null
        })
        .eq('id', order.table_id);
    }
  }

  // Split order into multiple orders
  async splitOrder(orderId: string, itemGroups: Array<{
    items: string[]; // order_item IDs
    table_id?: string;
    customer_name?: string;
  }>) {
    try {
      // Get original order details
      const { data: originalOrder, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !originalOrder) {
        return { data: null, error: orderError || new Error('Order not found') };
      }

      const newOrders = [];

      for (const group of itemGroups) {
        // Create new order for this group
        const { data: newOrder, error: createError } = await supabase
          .from('orders')
          .insert({
            order_type: originalOrder.order_type,
            table_id: group.table_id || originalOrder.table_id,
            customer_name: group.customer_name || originalOrder.customer_name,
            customer_phone: originalOrder.customer_phone,
            server_id: originalOrder.server_id,
            status: originalOrder.status
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        // Move items to new order
        const { error: moveError } = await supabase
          .from('order_items')
          .update({ order_id: newOrder.id })
          .in('id', group.items);

        if (moveError) {
          throw moveError;
        }

        newOrders.push(newOrder);
      }

      // Delete original order if it has no items left
      const { count } = await supabase
        .from('order_items')
        .select('id', { count: 'exact' })
        .eq('order_id', orderId);

      if (count === 0) {
        await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);
      }

      return { data: newOrders, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Get kitchen queue (orders ready for preparation)
  async getKitchenQueue() {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        item_name,
        quantity,
        modifiers,
        special_instructions,
        status,
        sent_to_kitchen_at,
        prepared_at,
        created_at,
        orders!inner (
          id,
          order_number,
          order_type,
          table_id,
          customer_name,
          restaurant_tables (
            table_number,
            section
          )
        ),
        menu_items:item_id (
          preparation_time,
          spicy_level,
          allergens
        )
      `)
      .in('status', ['confirmed', 'preparing'])
      .order('created_at', { ascending: true });

    return { data, error };
  }

  // Get order history for a server or date range
  async getOrderHistory(filters: {
    server_id?: string;
    start_date?: string;
    end_date?: string;
    status?: OrderStatus[];
    limit?: number;
    offset?: number;
  } = {}) {
    let query = supabase
      .from('orders')
      .select(`
        *,
        restaurant_tables (
          table_number,
          section
        ),
        users!orders_server_id_fkey (
          full_name
        ),
        order_items (
          item_name,
          quantity,
          total_price
        ),
        payments (
          payment_method,
          amount
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.server_id) {
      query = query.eq('server_id', filters.server_id);
    }

    if (filters.start_date) {
      query = query.gte('order_date', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('order_date', filters.end_date);
    }

    if (filters.status) {
      query = query.in('status', filters.status);
    }

    // Apply pagination
    if (filters.limit) {
      const offset = filters.offset || 0;
      query = query.range(offset, offset + filters.limit - 1);
    }

    const { data, error, count } = await query;
    
    return { 
      data, 
      error, 
      pagination: {
        total: count || 0,
        limit: filters.limit || 50,
        offset: filters.offset || 0
      }
    };
  }

  // Calculate order totals manually (for verification)
  calculateOrderTotals(orderItems: OrderItem[], options: {
    tax_rate?: number;
    gratuity_rate?: number;
    service_charge_rate?: number;
    discount_amount?: number;
  } = {}) {
    const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
    const discountedSubtotal = subtotal - (options.discount_amount || 0);
    
    const taxAmount = discountedSubtotal * (options.tax_rate || 0.08);
    const gratuityAmount = discountedSubtotal * (options.gratuity_rate || 0);
    const serviceChargeAmount = discountedSubtotal * (options.service_charge_rate || 0);
    
    const totalAmount = discountedSubtotal + taxAmount + gratuityAmount + serviceChargeAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountedSubtotal: Math.round(discountedSubtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      gratuityAmount: Math.round(gratuityAmount * 100) / 100,
      serviceChargeAmount: Math.round(serviceChargeAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }

  // Apply discount to order
  async applyDiscount(orderId: string, discountAmount: number, reason: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({
        discount_amount: discountAmount,
        discount_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    return { data, error };
  }

  // Get estimated wait time for new orders
  async getEstimatedWaitTime() {
    const { data: activeItems, error } = await supabase
      .from('order_items')
      .select(`
        menu_items:item_id (
          preparation_time
        )
      `)
      .in('status', ['confirmed', 'preparing']);

    if (error || !activeItems) {
      return { estimatedTime: 15, error }; // Default 15 minutes
    }

    // Calculate average prep time of items currently being prepared
    const avgPrepTime = activeItems.reduce((sum, item: any) => {
      const prepTime = Array.isArray(item.menu_items) 
        ? item.menu_items[0]?.preparation_time 
        : item.menu_items?.preparation_time;
      return sum + (prepTime || 15);
    }, 0) / Math.max(activeItems.length, 1);

    return { estimatedTime: Math.ceil(avgPrepTime), error: null };
  }
}

