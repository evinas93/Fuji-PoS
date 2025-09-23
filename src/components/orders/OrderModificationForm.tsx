import React, { useState, useEffect } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { useAddOrderItems, useRemoveOrderItem } from '../../hooks/useOrders';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import MenuItemCard from '../menu/MenuItemCard';
import MenuCategoryTabs from '../menu/MenuCategoryTabs';
import type { OrderItem, MenuItem } from '../../types/database';

interface OrderModificationFormProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    status: string;
    order_items: OrderItem[];
  };
  onOrderUpdated?: () => void;
}

interface CartItem {
  item_id: string;
  quantity: number;
  modifiers: Array<{ id: string; name: string; price: number }>;
  special_instructions?: string;
}

export default function OrderModificationForm({ 
  isOpen, 
  onClose, 
  order, 
  onOrderUpdated 
}: OrderModificationFormProps) {
  const { data: menuItems } = useMenu();
  const addOrderItems = useAddOrderItems();
  const removeOrderItem = useRemoveOrderItem();

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAddingItems, setIsAddingItems] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory('');
      setCart([]);
      setIsAddingItems(false);
    }
  }, [isOpen]);

  const canModifyOrder = order.status === 'pending' || order.status === 'confirmed';
  
  if (!canModifyOrder) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Order Modification" size="lg">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Order Cannot Be Modified
          </h3>
          <p className="text-gray-600 mb-4">
            This order has already been sent to the kitchen and cannot be modified.
          </p>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  const handleAddToCart = (menuItem: MenuItem) => {
    const existingItem = cart.find(item => item.item_id === menuItem.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.item_id === menuItem.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        item_id: menuItem.id,
        quantity: 1,
        modifiers: [],
        special_instructions: ''
      }]);
    }
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.item_id !== itemId));
    } else {
      setCart(cart.map(item => 
        item.item_id === itemId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.item_id !== itemId));
  };

  const handleRemoveExistingItem = async (itemId: string) => {
    try {
      await removeOrderItem.mutateAsync(itemId);
      onOrderUpdated?.();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleAddItems = async () => {
    if (cart.length === 0) return;

    try {
      await addOrderItems.mutateAsync({
        orderId: order.id,
        items: cart
      });
      setCart([]);
      onOrderUpdated?.();
    } catch (error) {
      console.error('Error adding items:', error);
    }
  };

  const filteredMenuItems = menuItems?.filter(item => 
    !selectedCategory || item.category_id === selectedCategory
  ) || [];

  const subtotal = cart.reduce((sum, item) => {
    const menuItem = menuItems?.find(mi => mi.id === item.item_id);
    if (!menuItem) return sum;
    
    const basePrice = menuItem.base_price;
    const modifierCost = item.modifiers.reduce((modSum, mod) => modSum + mod.price, 0);
    const itemTotal = (basePrice + modifierCost) * item.quantity;
    return sum + itemTotal;
  }, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modify Order" size="xl">
      <div className="flex h-[600px]">
        {/* Left Panel - Current Order Items */}
        <div className="flex-1 border-r border-gray-200 pr-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Order Items</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.item_name}</h4>
                    <p className="text-xs text-gray-600">Qty: {item.quantity} • ${item.unit_price.toFixed(2)} each</p>
                    {item.special_instructions && (
                      <p className="text-xs text-gray-500 italic">"{item.special_instructions}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">${item.total_price.toFixed(2)}</span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveExistingItem(item.id)}
                      disabled={removeOrderItem.isPending}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <Button
              variant={isAddingItems ? "secondary" : "primary"}
              onClick={() => setIsAddingItems(!isAddingItems)}
              className="w-full"
            >
              {isAddingItems ? 'Cancel Adding Items' : 'Add More Items'}
            </Button>
          </div>
        </div>

        {/* Right Panel - Add Items */}
        {isAddingItems && (
          <div className="w-80 pl-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Items</h3>
            
            <MenuCategoryTabs
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              className="mb-4"
            />

            <div className="h-64 overflow-y-auto mb-4">
              {filteredMenuItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={() => handleAddToCart(item)}
                  showAddButton={true}
                  compact={true}
                />
              ))}
            </div>

            {/* New Items Cart */}
            {cart.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">New Items</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {cart.map((cartItem) => {
                    const menuItem = menuItems?.find(mi => mi.id === cartItem.item_id);
                    if (!menuItem) return null;

                    return (
                      <div key={cartItem.item_id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <span className="font-medium">{menuItem.name}</span>
                          <span className="text-gray-600 ml-2">x{cartItem.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            ${((menuItem.base_price + cartItem.modifiers.reduce((sum, mod) => sum + mod.price, 0)) * cartItem.quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleRemoveFromCart(cartItem.item_id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleAddItems}
                    disabled={addOrderItems.isPending}
                    className="w-full"
                  >
                    {addOrderItems.isPending ? 'Adding...' : 'Add Items to Order'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

