import React, { useState, useEffect } from 'react';
import { useCreateOrder, useAddOrderItems } from '../../hooks/useOrders';
import { useMenu, useMenuCategories } from '../../hooks/useMenu';
import { useAuth } from '../../hooks/useAuth';
import type { OrderType, MenuItem } from '../../types/database';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import MenuItemCard from '../menu/MenuItemCard';
import MenuCategoryTabs from '../menu/MenuCategoryTabs';

interface OrderCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (orderId: string) => void;
}

interface CartItem {
  item_id: string;
  quantity: number;
  modifiers: Array<{ id: string; name: string; price: number }>;
  special_instructions?: string;
}

export default function OrderCreationForm({
  isOpen,
  onClose,
  onOrderCreated,
}: OrderCreationFormProps) {
  const { user } = useAuth();
  const { data: menuItems, isLoading: menuLoading } = useMenu();
  const { data: categories, isLoading: categoriesLoading } = useMenuCategories();
  const createOrder = useCreateOrder();
  const addOrderItems = useAddOrderItems();

  // Form state
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => {
    const menuItem = menuItems?.find((mi) => mi.id === item.item_id);
    if (!menuItem) return sum;

    const basePrice = menuItem.base_price;
    const modifierCost = item.modifiers.reduce((modSum, mod) => modSum + mod.price, 0);
    const itemTotal = (basePrice + modifierCost) * item.quantity;
    return sum + itemTotal;
  }, 0);

  const taxRate = 0.08; // 8% tax
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setOrderType('dine_in');
      setTableNumber('');
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      setCart([]);
      setSelectedCategory(null);
    }
  }, [isOpen]);

  const handleAddToCart = (menuItem: MenuItem) => {
    const existingItem = cart.find((item) => item.item_id === menuItem.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.item_id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          item_id: menuItem.id,
          quantity: 1,
          modifiers: [],
          special_instructions: '',
        },
      ]);
    }
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.item_id !== itemId));
    } else {
      setCart(cart.map((item) => (item.item_id === itemId ? { ...item, quantity } : item)));
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.item_id !== itemId));
  };

  const handleCreateOrder = async () => {
    if (!user?.id) return;

    try {
      // Create the order
      const { data: order, error: orderError } = await createOrder.mutateAsync({
        order_type: orderType,
        table_id: orderType === 'dine_in' && tableNumber ? tableNumber : undefined,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        server_id: user.id,
        notes: notes || undefined,
      });

      if (orderError) throw orderError;

      // Add items to the order
      if (cart.length > 0) {
        const { error: itemsError } = await addOrderItems.mutateAsync({
          orderId: order.id,
          items: cart,
        });

        if (itemsError) throw itemsError;
      }

      // Success - close modal and notify parent
      onOrderCreated?.(order.id);
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      // TODO: Show error toast
    }
  };

  const filteredMenuItems =
    menuItems?.filter((item) => !selectedCategory || item.category_id === selectedCategory) || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Order" size="xl">
      <div className="flex h-[700px]">
        {/* Left Panel - Menu Selection */}
        <div className="flex-1 border-r border-gray-200 pr-4 flex flex-col">
          {/* Order Type and Customer Info - Fixed Header */}
          <div className="flex-shrink-0 mb-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={orderType === 'dine_in' ? 'primary' : 'secondary'}
                onClick={() => setOrderType('dine_in')}
                size="sm"
              >
                Dine In
              </Button>
              <Button
                variant={orderType === 'take_out' ? 'primary' : 'secondary'}
                onClick={() => setOrderType('take_out')}
                size="sm"
              >
                Take Out
              </Button>
            </div>

            {orderType === 'dine_in' && (
              <Input
                label="Table Number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Enter table number"
                className="mb-2"
              />
            )}

            <Input
              label="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name (optional)"
              className="mb-2"
            />

            <Input
              label="Customer Phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone number (optional)"
              className="mb-4"
            />
          </div>

          {/* Category Tabs - Fixed */}
          <div className="flex-shrink-0 mb-4">
            <MenuCategoryTabs
              categories={categories || []}
              activeCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              showAllOption={true}
            />
          </div>

          {/* Menu Items - Scrollable Area */}
          <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg custom-scrollbar">
            {menuLoading || categoriesLoading ? (
              <div className="text-center py-8">Loading menu...</div>
            ) : (
              <div className="p-3 space-y-2" style={{ minHeight: '500px' }}>
                {filteredMenuItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No items found in this category
                  </div>
                ) : (
                  <>
                    {filteredMenuItems.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onAddToCart={() => handleAddToCart(item)}
                        showAddButton={true}
                        compact={true}
                      />
                    ))}
                    {/* Add some extra content to ensure scrolling */}
                    <div className="h-20 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                      Scroll to see more items
                    </div>
                    <div className="h-20 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                      More items below
                    </div>
                    <div className="h-20 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                      Keep scrolling
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Cart and Totals */}
        <div className="w-80 pl-4 flex flex-col">
          <h3 className="text-lg font-semibold mb-4 flex-shrink-0">Order Items</h3>

          <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-lg custom-scrollbar">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No items in cart</div>
            ) : (
              <div className="p-3 space-y-2 min-h-full">
                {cart.map((cartItem) => {
                  const menuItem = menuItems?.find((mi) => mi.id === cartItem.item_id);
                  if (!menuItem) return null;

                  return (
                    <div key={cartItem.item_id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{menuItem.name}</h4>
                          {cartItem.modifiers.length > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              {cartItem.modifiers.map((mod) => mod.name).join(', ')}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(cartItem.item_id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(cartItem.item_id, cartItem.quantity - 1)
                            }
                            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium w-8 text-center">
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(cartItem.item_id, cartItem.quantity + 1)
                            }
                            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-sm font-medium">
                          $
                          {(
                            (menuItem.base_price +
                              cartItem.modifiers.reduce((sum, mod) => sum + mod.price, 0)) *
                            cartItem.quantity
                          ).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Notes - Fixed */}
          <div className="flex-shrink-0 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions..."
              className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
              rows={2}
            />
          </div>

          {/* Totals - Fixed */}
          <div className="flex-shrink-0 border-t pt-4 mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>Tax (8%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons - Fixed */}
          <div className="flex-shrink-0 flex gap-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateOrder}
              disabled={cart.length === 0 || createOrder.isPending}
              className="flex-1"
            >
              {createOrder.isPending ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
