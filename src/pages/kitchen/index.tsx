import React, { useState } from 'react';
import { useKitchenQueue, useUpdateItemStatus } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Layout } from '../../components/layout/Layout';
import { PermissionGuard } from '../../components/ui/PermissionGuard';
import KitchenNotifications from '../../components/orders/KitchenNotifications';
import PreparationTimeEstimator from '../../components/orders/PreparationTimeEstimator';

export default function KitchenPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { data: kitchenQueue, isLoading, error } = useKitchenQueue();
  const updateItemStatus = useUpdateItemStatus();
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'preparing'>('all');

  // Debug logging
  console.log('Kitchen Page Debug:', {
    user,
    isAuthenticated,
    authLoading,
    kitchenQueue,
    isLoading,
    error,
  });

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">You must be logged in to access the kitchen display.</p>
          <Button onClick={() => (window.location.href = '/auth/login')}>Go to Login</Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading kitchen queue...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error loading kitchen queue: {error.message}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </Layout>
    );
  }

  const filteredItems =
    kitchenQueue?.filter((item) => filter === 'all' || item.status === filter) || [];

  const handleUpdateItemStatus = async (itemId: string, status: string) => {
    try {
      await updateItemStatus.mutateAsync({
        itemId,
        status: status as any,
      });
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatOrderType = (type: string) => {
    return type === 'dine_in' ? 'Dine In' : 'Take Out';
  };

  const formatTableInfo = (order: any) => {
    if (order.order_type === 'take_out') {
      return order.customer_name ? `Customer: ${order.customer_name}` : 'Take Out';
    }

    if (order.restaurant_tables) {
      return `Table ${order.restaurant_tables.table_number}`;
    }

    return 'No table assigned';
  };

  const getPreparationTime = (item: any) => {
    const prepTime = Array.isArray(item.menu_items)
      ? item.menu_items[0]?.preparation_time
      : item.menu_items?.preparation_time;
    return prepTime || 15; // Default 15 minutes
  };

  const getSpicyLevel = (item: any) => {
    const spicyLevel = Array.isArray(item.menu_items)
      ? item.menu_items[0]?.spicy_level
      : item.menu_items?.spicy_level;
    return spicyLevel || 0;
  };

  const getAllergens = (item: any) => {
    const allergens = Array.isArray(item.menu_items)
      ? item.menu_items[0]?.allergens
      : item.menu_items?.allergens;
    return allergens || [];
  };

  return (
    <PermissionGuard allowedRoles={['kitchen', 'manager']}>
      <Layout>
        <KitchenNotifications />
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
              <p className="text-gray-600">Manage food preparation and order status</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'secondary'}
                onClick={() => setFilter('all')}
                size="sm"
              >
                All ({kitchenQueue?.length || 0})
              </Button>
              <Button
                variant={filter === 'confirmed' ? 'primary' : 'secondary'}
                onClick={() => setFilter('confirmed')}
                size="sm"
              >
                New ({kitchenQueue?.filter((item) => item.status === 'confirmed').length || 0})
              </Button>
              <Button
                variant={filter === 'preparing' ? 'primary' : 'secondary'}
                onClick={() => setFilter('preparing')}
                size="sm"
              >
                Preparing ({kitchenQueue?.filter((item) => item.status === 'preparing').length || 0}
                )
              </Button>
            </div>
          </div>

          {/* Preparation Time Estimator */}
          <div className="mb-6">
            <PreparationTimeEstimator showCurrentWait={true} />
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Items in Queue</h3>
              <p className="text-gray-600">All caught up! New orders will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <KitchenItemCard
                  key={item.id}
                  item={item}
                  onUpdateStatus={handleUpdateItemStatus}
                  getStatusColor={getStatusColor}
                  formatOrderType={formatOrderType}
                  formatTableInfo={formatTableInfo}
                  getPreparationTime={getPreparationTime}
                  getSpicyLevel={getSpicyLevel}
                  getAllergens={getAllergens}
                />
              ))}
            </div>
          )}
        </div>
      </Layout>
    </PermissionGuard>
  );
}

// Kitchen Item Card Component
function KitchenItemCard({
  item,
  onUpdateStatus,
  getStatusColor,
  formatOrderType,
  formatTableInfo,
  getPreparationTime,
  getSpicyLevel,
  getAllergens,
}: {
  item: any;
  onUpdateStatus: (itemId: string, status: string) => void;
  getStatusColor: (status: string) => string;
  formatOrderType: (type: string) => string;
  formatTableInfo: (order: any) => string;
  getPreparationTime: (item: any) => number;
  getSpicyLevel: (item: any) => number;
  getAllergens: (item: any) => any[];
}) {
  const prepTime = getPreparationTime(item);
  const spicyLevel = getSpicyLevel(item);
  const allergens = getAllergens(item);

  const canStartPreparing = item.status === 'confirmed';
  const canMarkReady = item.status === 'preparing';

  return (
    <div className={`bg-white rounded-lg border-2 p-4 ${getStatusColor(item.status)}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{item.item_name}</h3>
          <p className="text-sm text-gray-600">
            Order #{item.orders.order_number} • {formatOrderType(item.orders.order_type)}
          </p>
          <p className="text-sm text-gray-600">{formatTableInfo(item.orders)}</p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Quantity:</span>
          <span className="font-medium">{item.quantity}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Prep Time:</span>
          <span className="font-medium">{prepTime} min</span>
        </div>
        {spicyLevel > 0 && (
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Spice Level:</span>
            <span className="font-medium">
              {'🌶️'.repeat(spicyLevel)} ({spicyLevel}/5)
            </span>
          </div>
        )}
        {allergens.length > 0 && (
          <div className="text-sm">
            <span className="text-gray-600">Allergens:</span>
            <span className="font-medium text-red-600 ml-1">{allergens.join(', ')}</span>
          </div>
        )}
      </div>

      {item.modifiers && item.modifiers.length > 0 && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-1">Modifiers:</p>
          <div className="text-sm text-gray-700">
            {item.modifiers.map((mod: any, index: number) => (
              <span key={index}>
                {mod.name}
                {index < item.modifiers.length - 1 && ', '}
              </span>
            ))}
          </div>
        </div>
      )}

      {item.special_instructions && (
        <div className="mb-3">
          <p className="text-sm text-gray-600">Special Instructions:</p>
          <p className="text-sm text-gray-700 italic bg-yellow-50 p-2 rounded">
            "{item.special_instructions}"
          </p>
        </div>
      )}

      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Added: {new Date(item.created_at).toLocaleTimeString()}
        </div>
        <div className="flex gap-2">
          {canStartPreparing && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onUpdateStatus(item.id, 'preparing')}
            >
              Start
            </Button>
          )}
          {canMarkReady && (
            <Button variant="success" size="sm" onClick={() => onUpdateStatus(item.id, 'ready')}>
              Ready
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
