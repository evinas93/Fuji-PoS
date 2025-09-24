// React hooks for real-time functionality
import { useEffect, useCallback, useRef } from 'react';
import { RealtimeService } from '../lib/services/realtime.service';

// Simple useRealtime hook for basic subscription management
export function useRealtime() {
  const realtimeService = useRef<RealtimeService>();

  useEffect(() => {
    realtimeService.current = new RealtimeService();
    return () => {
      realtimeService.current?.cleanup();
    };
  }, []);

  const subscribe = useCallback((table: string, callback: (payload: any) => void) => {
    if (!realtimeService.current) return null;
    
    const subscription = realtimeService.current.subscribeToKitchenOrders(callback);
    return subscription;
  }, []);

  const unsubscribe = useCallback((subscription: any) => {
    if (realtimeService.current && subscription) {
      realtimeService.current.unsubscribe('kitchen_orders');
    }
  }, []);

  return { subscribe, unsubscribe };
}

// Hook for kitchen orders real-time updates
export function useKitchenOrders(onNewOrder: (order: any) => void) {
  const realtimeService = useRef<RealtimeService>();

  useEffect(() => {
    realtimeService.current = new RealtimeService();
    
    const subscription = realtimeService.current.subscribeToKitchenOrders((payload) => {
      console.log('New kitchen order:', payload);
      onNewOrder(payload.new);
    });

    return () => {
      realtimeService.current?.unsubscribe('kitchen_orders');
    };
  }, [onNewOrder]);

  return realtimeService.current;
}

// Hook for table status updates
export function useTableStatus(onTableUpdate: (table: any) => void) {
  const realtimeService = useRef<RealtimeService>();

  useEffect(() => {
    realtimeService.current = new RealtimeService();
    
    const subscription = realtimeService.current.subscribeToTableStatus((payload) => {
      console.log('Table status update:', payload);
      onTableUpdate(payload.new);
    });

    return () => {
      realtimeService.current?.unsubscribe('table_status');
    };
  }, [onTableUpdate]);

  return realtimeService.current;
}

// Hook for daily sales real-time updates
export function useDailySales(onSalesUpdate: (sales: any) => void) {
  const realtimeService = useRef<RealtimeService>();

  useEffect(() => {
    realtimeService.current = new RealtimeService();
    
    const subscription = realtimeService.current.subscribeToDailySales((payload) => {
      console.log('Daily sales update:', payload);
      onSalesUpdate(payload.new);
    });

    return () => {
      realtimeService.current?.unsubscribe('daily_sales');
    };
  }, [onSalesUpdate]);

  return realtimeService.current;
}

// Hook for server-specific order updates
export function useServerOrders(serverId: string, onOrderUpdate: (order: any) => void) {
  const realtimeService = useRef<RealtimeService>();

  useEffect(() => {
    if (!serverId) return;

    realtimeService.current = new RealtimeService();
    
    const subscription = realtimeService.current.subscribeToServerOrders(serverId, (payload) => {
      console.log('Server order update:', payload);
      onOrderUpdate(payload);
    });

    return () => {
      realtimeService.current?.unsubscribe(`server_orders_${serverId}`);
    };
  }, [serverId, onOrderUpdate]);

  return realtimeService.current;
}

// Hook for payment updates
export function usePaymentUpdates(onPaymentUpdate: (payment: any) => void) {
  const realtimeService = useRef<RealtimeService>();

  useEffect(() => {
    realtimeService.current = new RealtimeService();
    
    const subscription = realtimeService.current.subscribeToPayments((payload) => {
      console.log('Payment update:', payload);
      onPaymentUpdate(payload);
    });

    return () => {
      realtimeService.current?.unsubscribe('payments');
    };
  }, [onPaymentUpdate]);

  return realtimeService.current;
}

// Hook for specific order real-time tracking
export function useOrderTracking(orderId: string, onOrderChange: (data: any) => void) {
  const realtimeService = useRef<RealtimeService>();

  useEffect(() => {
    if (!orderId) return;

    realtimeService.current = new RealtimeService();
    
    const subscription = realtimeService.current.subscribeToOrder(orderId, (payload) => {
      console.log('Order tracking update:', payload);
      onOrderChange(payload);
    });

    return () => {
      realtimeService.current?.unsubscribe(`order_${orderId}`);
    };
  }, [orderId, onOrderChange]);

  return realtimeService.current;
}

// Hook for custom broadcast events
export function useBroadcast(channel: string, event: string, onEvent: (payload: any) => void) {
  const realtimeService = useRef<RealtimeService>();

  const broadcast = useCallback(async (payload: any) => {
    if (realtimeService.current) {
      const { error } = await realtimeService.current.broadcastEvent(channel, event, payload);
      if (error) {
        console.error('Broadcast error:', error);
      }
    }
  }, [channel, event]);

  useEffect(() => {
    realtimeService.current = new RealtimeService();
    
    const subscription = realtimeService.current.subscribeToBroadcast(channel, event, (payload) => {
      console.log(`Broadcast ${event}:`, payload);
      onEvent(payload.payload);
    });

    return () => {
      realtimeService.current?.unsubscribe(`broadcast_${channel}_${event}`);
    };
  }, [channel, event, onEvent]);

  return { broadcast, realtimeService: realtimeService.current };
}

// Hook for connection health monitoring
export function useRealtimeHealth() {
  const realtimeService = useRef<RealtimeService>();

  const checkHealth = useCallback(async () => {
    if (!realtimeService.current) {
      realtimeService.current = new RealtimeService();
    }
    
    return await realtimeService.current.healthCheck();
  }, []);

  const getActiveSubscriptions = useCallback(() => {
    return realtimeService.current?.getActiveSubscriptions() || [];
  }, []);

  const cleanup = useCallback(() => {
    realtimeService.current?.cleanup();
  }, []);

  return {
    checkHealth,
    getActiveSubscriptions,
    cleanup,
    realtimeService: realtimeService.current
  };
}

// Hook for notification sounds in kitchen
export function useKitchenNotifications() {
  const audioRef = useRef<HTMLAudioElement>();

  useEffect(() => {
    // Preload notification sound
    audioRef.current = new Audio('/sounds/new-order.mp3');
    audioRef.current.preload = 'auto';
  }, []);

  const playNewOrderSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to beginning
      audioRef.current.play().catch(error => {
        console.warn('Could not play notification sound:', error);
      });
    }
  }, []);

  const playOrderReadySound = useCallback(() => {
    // Different sound for order ready
    const readyAudio = new Audio('/sounds/order-ready.mp3');
    readyAudio.play().catch(error => {
      console.warn('Could not play ready sound:', error);
    });
  }, []);

  // Hook into kitchen orders
  useKitchenOrders(useCallback((order) => {
    if (order.status === 'confirmed') {
      playNewOrderSound();
    } else if (order.status === 'ready') {
      playOrderReadySound();
    }
  }, [playNewOrderSound, playOrderReadySound]));

  return {
    playNewOrderSound,
    playOrderReadySound
  };
}
