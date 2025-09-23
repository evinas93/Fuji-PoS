import React, { useState } from 'react';
import { useActiveOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import OrderCreationForm from '../../components/orders/OrderCreationForm';
import { Button } from '../../components/ui/Button';
import { Layout } from '../../components/layout/Layout';
import { PermissionGuard } from '../../components/ui/PermissionGuard';

export default function OrdersPage() {
  const { user } = useAuth();
  const { data: activeOrders, isLoading, error } = useActiveOrders(user?.id);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);

  const handleOrderCreated = (orderId: string) => {
    console.log('Order created:', orderId);
    // TODO: Navigate to order details or show success message
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading orders...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error loading orders: {error.message}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600">Manage active orders and create new ones</p>
          </div>
          
          <PermissionGuard allowedRoles={['server', 'manager', 'cashier']}>
            <Button
              variant="primary"
              onClick={() => setIsCreateOrderOpen(true)}
              className="flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Order
            </Button>
          </PermissionGuard>
        </div>

        {/* Active Orders */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Orders ({activeOrders?.length || 0})
          </h2>
          
          {activeOrders?.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Orders</h3>
              <p className="text-gray-600 mb-4">Create your first order to get started</p>
              <Button
                variant="primary"
                onClick={() => setIsCreateOrderOpen(true)}
              >
                Create Order
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrders?.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>

        {/* Order Creation Modal */}
        <OrderCreationForm
          isOpen={isCreateOrderOpen}
          onClose={() => setIsCreateOrderOpen(false)}
          onOrderCreated={handleOrderCreated}
        />
      </div>
    </Layout>
  );
}

// Order Card Component
function OrderCard({ order }: { order: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            Order #{order.order_number}
          </h3>
          <p className="text-sm text-gray-600">
            {formatOrderType(order.order_type)} • {formatTableInfo(order)}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-600 mb-1">
          Server: {order.users?.full_name || 'Unknown'}
        </p>
        <p className="text-sm text-gray-600">
          Created: {new Date(order.created_at).toLocaleTimeString()}
        </p>
      </div>

      {/* Order Items */}
      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700 mb-1">Items:</p>
        <div className="space-y-1">
          {order.order_items?.slice(0, 3).map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.quantity}x {item.item_name}
              </span>
              <span className="font-medium">
                ${item.total_price.toFixed(2)}
              </span>
            </div>
          ))}
          {order.order_items?.length > 3 && (
            <p className="text-xs text-gray-500">
              +{order.order_items.length - 3} more items
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="text-lg font-semibold text-gray-900">
          ${order.total_amount.toFixed(2)}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            View
          </Button>
          <Button variant="primary" size="sm">
            Manage
          </Button>
        </div>
      </div>
    </div>
  );
}

