import React, { useState, useEffect } from 'react';
import { useRealtime } from '../../hooks/useRealtime';
import { Button } from '../ui/Button';

interface KitchenNotificationsProps {
  onNewOrder?: (order: any) => void;
  onOrderUpdate?: (order: any) => void;
}

export default function KitchenNotifications({ onNewOrder, onOrderUpdate }: KitchenNotificationsProps) {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'new_order' | 'order_update' | 'item_ready';
    message: string;
    timestamp: Date;
    orderId?: string;
    itemId?: string;
  }>>([]);

  const { subscribe, unsubscribe } = useRealtime();

  useEffect(() => {
    // Subscribe to order changes
    const orderSubscription = subscribe('orders', (payload) => {
      if (payload.eventType === 'INSERT') {
        const newNotification = {
          id: `new-${payload.new.id}`,
          type: 'new_order' as const,
          message: `New order #${payload.new.order_number} received`,
          timestamp: new Date(),
          orderId: payload.new.id
        };
        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
        onNewOrder?.(payload.new);
      } else if (payload.eventType === 'UPDATE') {
        const newNotification = {
          id: `update-${payload.new.id}`,
          type: 'order_update' as const,
          message: `Order #${payload.new.order_number} status updated to ${payload.new.status}`,
          timestamp: new Date(),
          orderId: payload.new.id
        };
        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
        onOrderUpdate?.(payload.new);
      }
    });

    // Subscribe to order item changes
    const itemSubscription = subscribe('order_items', (payload) => {
      if (payload.eventType === 'UPDATE' && payload.new.status === 'ready') {
        const newNotification = {
          id: `ready-${payload.new.id}`,
          type: 'item_ready' as const,
          message: `${payload.new.item_name} is ready for pickup`,
          timestamp: new Date(),
          orderId: payload.new.order_id,
          itemId: payload.new.id
        };
        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
      }
    });

    return () => {
      unsubscribe(orderSubscription);
      unsubscribe(itemSubscription);
    };
  }, [subscribe, unsubscribe, onNewOrder, onOrderUpdate]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'order_update':
        return (
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'item_ready':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_order':
        return 'border-l-blue-500 bg-blue-50';
      case 'order_update':
        return 'border-l-orange-500 bg-orange-50';
      case 'item_ready':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">
            Kitchen Notifications ({notifications.length})
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={clearAllNotifications}
          >
            Clear All
          </Button>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 border-l-4 ${getNotificationColor(notification.type)} hover:bg-gray-50 transition-colors`}
            >
              <div className="flex items-start">
                {getNotificationIcon(notification.type)}
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {notification.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

