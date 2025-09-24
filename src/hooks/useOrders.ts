// React hooks for order management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService } from '../lib/services/order.service';
import type { OrderType, OrderStatus } from '../types/database';

const orderService = new OrderService();

// Hook to get active orders
export function useActiveOrders(serverId?: string, status?: OrderStatus[]) {
  return useQuery({
    queryKey: ['activeOrders', serverId, status],
    queryFn: async () => {
      const { data, error } = await orderService.getActiveOrders(serverId, status);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    staleTime: 5000, // Consider data stale after 5 seconds
  });
}

// Hook to get kitchen queue
export function useKitchenQueue() {
  return useQuery({
    queryKey: ['kitchenQueue'],
    queryFn: async () => {
      const { data, error } = await orderService.getKitchenQueue();
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Kitchen needs frequent updates
    staleTime: 2000,
    enabled: true, // Always enabled - let the component handle auth checks
  });
}

// Hook to get specific order details
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await orderService.getOrder(orderId);
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to create new order
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: {
      order_type: OrderType;
      table_id?: string;
      customer_name?: string;
      customer_phone?: string;
      server_id: string;
      notes?: string;
    }) => {
      const { data, error } = await orderService.createOrder(orderData);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      queryClient.invalidateQueries({ queryKey: ['availableTables'] });
      queryClient.invalidateQueries({ queryKey: ['todaySales'] });
    },
  });
}

// Hook to add items to order
export function useAddOrderItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      items,
    }: {
      orderId: string;
      items: Array<{
        item_id: string;
        quantity: number;
        modifiers?: Array<{ id: string; name: string; price: number }>;
        special_instructions?: string;
      }>;
    }) => {
      const { data, error } = await orderService.addOrderItems(orderId, items);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
    },
  });
}

// Hook to send order to kitchen
export function useSendToKitchen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await orderService.sendToKitchen(orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchenQueue'] });
    },
  });
}

// Hook to update order item status (for kitchen)
export function useUpdateItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: OrderStatus }) => {
      const { data, error } = await orderService.updateItemStatus(itemId, status);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenQueue'] });
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
    },
  });
}

// Hook to update order status
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      options,
    }: {
      orderId: string;
      status: OrderStatus;
      options?: {
        cancelled_reason?: string;
        completed_by?: string;
      };
    }) => {
      const { data, error } = await orderService.updateOrderStatus(orderId, status, options);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchenQueue'] });
      queryClient.invalidateQueries({ queryKey: ['todaySales'] });
    },
  });
}

// Hook to cancel order
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
      cancelledBy,
    }: {
      orderId: string;
      reason: string;
      cancelledBy: string;
    }) => {
      const { data, error } = await orderService.cancelOrder(orderId, reason, cancelledBy);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchenQueue'] });
    },
  });
}

// Hook to remove item from order
export function useRemoveOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await orderService.removeOrderItem(itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });
}

// Hook to transfer order to different table
export function useTransferOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, newTableId }: { orderId: string; newTableId: string }) => {
      const { data, error } = await orderService.transferOrder(orderId, newTableId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      queryClient.invalidateQueries({ queryKey: ['availableTables'] });
    },
  });
}

// Hook to get order preparation estimate
export function useOrderEstimate(orderId: string) {
  return useQuery({
    queryKey: ['orderEstimate', orderId],
    queryFn: async () => {
      const { estimatedTime, error } = await orderService.getOrderEstimate(orderId);
      if (error) throw error;
      return estimatedTime;
    },
    enabled: !!orderId,
    staleTime: 2 * 60 * 1000,
  });
}

// Hook to get order history
export function useOrderHistory(
  filters: {
    server_id?: string;
    start_date?: string;
    end_date?: string;
    status?: OrderStatus[];
    limit?: number;
    offset?: number;
  } = {}
) {
  return useQuery({
    queryKey: ['orderHistory', filters],
    queryFn: async () => {
      const { data, error, pagination } = await orderService.getOrderHistory(filters);
      if (error) throw error;
      return { data, pagination };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to apply discount to order
export function useApplyDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      discountAmount,
      reason,
    }: {
      orderId: string;
      discountAmount: number;
      reason: string;
    }) => {
      const { data, error } = await orderService.applyDiscount(orderId, discountAmount, reason);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
    },
  });
}

// Hook to split order
export function useSplitOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      itemGroups,
    }: {
      orderId: string;
      itemGroups: Array<{
        items: string[];
        table_id?: string;
        customer_name?: string;
      }>;
    }) => {
      const { data, error } = await orderService.splitOrder(orderId, itemGroups);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      queryClient.invalidateQueries({ queryKey: ['availableTables'] });
    },
  });
}

// Hook to get estimated wait time for new orders
export function useEstimatedWaitTime() {
  return useQuery({
    queryKey: ['estimatedWaitTime'],
    queryFn: async () => {
      const { estimatedTime, error } = await orderService.getEstimatedWaitTime();
      if (error) throw error;
      return estimatedTime;
    },
    refetchInterval: 30000, // Update every 30 seconds
    staleTime: 15000, // Consider stale after 15 seconds
  });
}
