// Simplified order creation form for MVP
import React, { useState } from 'react';
import { useMenu } from '../../hooks/useMenu';
import type { MenuItem, OrderType, PaymentMethod } from '../../types/database';
import { supabase } from '../../lib/supabase';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

interface Order {
  id: string;
}

interface SimpleOrderFormProps {
  onOrderCompleted?: () => void;
}

export const SimpleOrderForm: React.FC<SimpleOrderFormProps> = ({ onOrderCompleted }) => {
  const { data: menuItems, isLoading } = useMenu();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Tax and gratuity rates
  const TAX_RATE = 0.08; // 8%
  const GRATUITY_RATE = 0.2; // 20% for parties of 2+

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.base_price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const gratuity = (subtotal + tax) * GRATUITY_RATE; // Calculate gratuity on subtotal + tax
  const total = subtotal + tax + gratuity;

  const addToCart = (menuItem: MenuItem) => {
    const existingItem = cart.find((item) => item.menuItem.id === menuItem.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.menuItem.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { menuItem, quantity: 1 }]);
    }
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.menuItem.id !== menuItemId));
    } else {
      setCart(cart.map((item) => (item.menuItem.id === menuItemId ? { ...item, quantity } : item)));
    }
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter((item) => item.menuItem.id !== menuItemId));
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      alert('Please add items to the order');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        alert('You must be logged in to create an order. Please log in first.');
        setIsSubmitting(false);
        return;
      }

      // Verify user exists in users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        alert('User profile not found. Please contact an administrator.');
        console.error('User profile error:', profileError);
        setIsSubmitting(false);
        return;
      }

      // Create order with correct column names (Original schema)
      const orderResponse = await supabase
        .from('orders')
        .insert({
          order_type: orderType,
          status: 'completed',
          server_id: user.id,
          cashier_id: user.id,
          subtotal: subtotal,
          tax_rate: TAX_RATE,
          tax_amount: tax,
          gratuity_rate: GRATUITY_RATE,
          gratuity_amount: gratuity,
          total_amount: total,
          amount_paid: total,
        })
        .select()
        .single();

      const orderData = orderResponse.data as Order | null;
      const orderError = orderResponse.error;

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw orderError;
      }

      if (!orderData) {
        throw new Error('Order creation failed: no data returned');
      }

      const order = orderData;

      // Add order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        item_id: item.menuItem.id,
        quantity: item.quantity,
        unit_price: item.menuItem.base_price,
        item_name: item.menuItem.name,
        total_price: item.menuItem.base_price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) throw itemsError;

      // Success - reset form
      setCart([]);
      setOrderType('dine_in');
      setPaymentMethod('cash');
      alert('Order completed successfully!');
      onOrderCompleted?.();
    } catch (error) {
      console.error('Error creating order:', error);

      // Provide more specific error messages
      let errorMessage = 'Error creating order. Please try again.';

      if (error && typeof error === 'object') {
        const err = error as { message?: string; code?: string };
        if (err.message) {
          errorMessage = `Error: ${err.message}`;
        } else if (err.code === 'PGRST301') {
          errorMessage =
            'Database error: Please ensure you are logged in and have the correct permissions.';
        } else if (err.code === '23503') {
          errorMessage = 'Invalid user ID. Please log out and log in again.';
        }
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMenuItems = (menuItems || []).filter((item: MenuItem) => {
    const search = searchTerm.toLowerCase();
    const nameMatch = item.name?.toLowerCase().includes(search) ?? false;
    const descMatch = item.description?.toLowerCase().includes(search) ?? false;
    return nameMatch || descMatch;
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading menu...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Side - Menu Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Menu Items</h2>

        {/* Search */}
        <input
          type="text"
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:ring-blue-500 focus:border-blue-500"
        />

        {/* Menu Items Grid */}
        <div className="max-h-[600px] overflow-y-auto space-y-2">
          {filteredMenuItems.map((item: MenuItem) => (
            <div
              key={item.id}
              className="flex justify-between items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
              onClick={() => addToCart(item)}
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.name || ''}</div>
                {item.description && (
                  <div className="text-sm text-gray-600">{item.description || ''}</div>
                )}
              </div>
              <div className="text-lg font-bold text-blue-600 ml-4">
                {(item.base_price || 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Order Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

        {/* Order Type and Payment */}
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`flex-1 px-4 py-2 rounded-md font-medium ${
                  orderType === 'dine_in'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Dine In
              </button>
              <button
                onClick={() => setOrderType('take_out')}
                className={`flex-1 px-4 py-2 rounded-md font-medium ${
                  orderType === 'take_out'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Take Out
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 px-4 py-2 rounded-md font-medium ${
                  paymentMethod === 'cash'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod('credit')}
                className={`flex-1 px-4 py-2 rounded-md font-medium ${
                  paymentMethod === 'credit'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Credit
              </button>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items in cart. Click on menu items to add.
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.menuItem.name}</div>
                    <div className="text-sm text-gray-600">
                      {item.menuItem.base_price.toFixed(2)} each
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.menuItem.id)}
                      className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    >
                      ×
                    </button>
                  </div>
                  <div className="ml-4 font-medium text-gray-900 w-20 text-right">
                    {(item.menuItem.base_price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Receipt Totals */}
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal:</span>
            <span className="font-medium">{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Tax (8%):</span>
            <span className="font-medium">{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Gratuity (20%):</span>
            <span className="font-medium">{gratuity.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-300">
            <span>Total:</span>
            <span>{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmitOrder}
          disabled={cart.length === 0 || isSubmitting}
          className={`w-full mt-6 px-6 py-3 rounded-md font-medium text-white ${
            cart.length === 0 || isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Processing...' : 'Complete Order'}
        </button>
      </div>
    </div>
  );
};
