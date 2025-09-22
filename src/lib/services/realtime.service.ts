// Real-time service for Fuji POS System
import { supabase } from '../supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export class RealtimeService {
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  // Subscribe to kitchen orders for kitchen display
  subscribeToKitchenOrders(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('kitchen_orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_items',
          filter: 'status=eq.confirmed'
        },
        (payload) => {
          console.log('New kitchen order:', payload);
          callback(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'order_items'
        },
        (payload) => {
          console.log('Kitchen order update:', payload);
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions.set('kitchen_orders', subscription);
    return subscription;
  }

  // Subscribe to table status changes for server dashboard
  subscribeToTableStatus(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('table_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_tables'
        },
        (payload) => {
          console.log('Table status update:', payload);
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions.set('table_status', subscription);
    return subscription;
  }

  // Subscribe to daily sales updates for manager dashboard
  subscribeToDailySales(callback: (payload: any) => void) {
    const todayDate = new Date().toISOString().split('T')[0];
    
    const subscription = supabase
      .channel('daily_sales')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_sales',
          filter: `sales_date=eq.${todayDate}`
        },
        (payload) => {
          console.log('Daily sales update:', payload);
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions.set('daily_sales', subscription);
    return subscription;
  }

  // Real-time order tracking for servers
  subscribeToServerOrders(serverId: string, callback: (payload: any) => void) {
    const channelName = `server_orders_${serverId}`;
    
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `server_id=eq.${serverId}`
        },
        (payload) => {
          console.log('Server order update:', payload);
          callback(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        async (payload) => {
          // Check if this order item belongs to this server
          const newRecord = payload.new as any;
          if (newRecord?.order_id) {
            const { data: order } = await supabase
              .from('orders')
              .select('server_id')
              .eq('id', newRecord.order_id)
              .single();
            
            if (order?.server_id === serverId) {
              console.log('Server order item update:', payload);
              callback(payload);
            }
          }
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  // Subscribe to payment updates
  subscribeToPayments(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('payments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        (payload) => {
          console.log('Payment update:', payload);
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions.set('payments', subscription);
    return subscription;
  }

  // Subscribe to order status changes for specific order
  subscribeToOrder(orderId: string, callback: (payload: any) => void) {
    const channelName = `order_${orderId}`;
    
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('Order status update:', payload);
          callback(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          console.log('Order item update:', payload);
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  // Listen for PostgreSQL notifications (custom notifications from triggers)
  subscribeToNotifications(channel: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel(`notifications_${channel}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders' // This is a placeholder, actual notifications come from pg_notify
      }, (payload) => {
        callback(payload);
      })
      .subscribe();

    this.subscriptions.set(`notifications_${channel}`, subscription);
    return subscription;
  }

  // Broadcast custom events to other connected clients
  async broadcastEvent(channel: string, event: string, payload: any) {
    const channelInstance = this.subscriptions.get(channel) || 
      supabase.channel(channel);

    const response = await channelInstance.send({
      type: 'broadcast',
      event,
      payload
    });

    return { error: null }; // Simplified error handling
  }

  // Subscribe to broadcast events
  subscribeToBroadcast(channel: string, event: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel(channel)
      .on('broadcast', { event }, (payload) => {
        console.log(`Broadcast ${event}:`, payload);
        callback(payload);
      })
      .subscribe();

    this.subscriptions.set(`broadcast_${channel}_${event}`, subscription);
    return subscription;
  }

  // Get channel status
  getChannelStatus(channelName: string) {
    const channel = this.subscriptions.get(channelName);
    return channel ? {
      state: channel.state,
      topic: channel.topic,
      joinedAt: null // Simplified - joinedAt property may not be available
    } : null;
  }

  // List all active subscriptions
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.entries()).map(([name, channel]) => ({
      name,
      state: channel.state,
      topic: channel.topic,
      joinedAt: null // Simplified - joinedAt property may not be available
    }));
  }

  // Unsubscribe from a specific channel
  unsubscribe(channelName: string) {
    const subscription = this.subscriptions.get(channelName);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(channelName);
      console.log(`Unsubscribed from ${channelName}`);
    }
  }

  // Cleanup all subscriptions
  cleanup() {
    console.log(`Cleaning up ${this.subscriptions.size} subscriptions`);
    this.subscriptions.forEach((subscription, name) => {
      supabase.removeChannel(subscription);
      console.log(`Unsubscribed from ${name}`);
    });
    this.subscriptions.clear();
  }

  // Health check for real-time connection
  async healthCheck() {
    try {
      const testChannel = supabase.channel('health_check');
      
      return new Promise<{ connected: boolean; latency?: number }>((resolve) => {
        const startTime = Date.now();
        
        testChannel
          .on('broadcast', { event: 'ping' }, () => {
            const latency = Date.now() - startTime;
            testChannel.unsubscribe();
            resolve({ connected: true, latency });
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await testChannel.send({
                type: 'broadcast',
                event: 'ping',
                payload: { timestamp: startTime }
              });
            }
          });

        // Timeout after 5 seconds
        setTimeout(() => {
          testChannel.unsubscribe();
          resolve({ connected: false });
        }, 5000);
      });
    } catch (error) {
      console.error('Real-time health check failed:', error);
      return { connected: false };
    }
  }
}

