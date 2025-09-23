import React, { useState, useEffect } from 'react';
import { useSplitOrder } from '../../hooks/useOrders';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

interface OrderSplitFormProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    order_number: number;
    order_type: string;
    order_items: Array<{
      id: string;
      item_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      special_instructions?: string;
    }>;
  };
  availableTables: Array<{
    id: string;
    table_number: number;
    section?: string;
    seats: number;
    is_occupied: boolean;
  }>;
  onOrderSplit?: () => void;
}

interface ItemGroup {
  id: string;
  items: string[];
  table_id?: string;
  customer_name?: string;
}

export default function OrderSplitForm({
  isOpen,
  onClose,
  order,
  availableTables,
  onOrderSplit
}: OrderSplitFormProps) {
  const splitOrder = useSplitOrder();
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Initialize with one group containing all items
  useEffect(() => {
    if (isOpen && order.order_items) {
      const allItemIds = order.order_items.map(item => item.id);
      setItemGroups([{
        id: 'group-1',
        items: allItemIds,
        table_id: order.order_type === 'dine_in' ? undefined : undefined,
        customer_name: ''
      }]);
      setSelectedItems(new Set(allItemIds));
    }
  }, [isOpen, order]);

  const handleAddGroup = () => {
    const newGroup: ItemGroup = {
      id: `group-${Date.now()}`,
      items: [],
      table_id: order.order_type === 'dine_in' ? undefined : undefined,
      customer_name: ''
    };
    setItemGroups([...itemGroups, newGroup]);
  };

  const handleRemoveGroup = (groupId: string) => {
    if (itemGroups.length <= 1) return;
    
    const groupToRemove = itemGroups.find(g => g.id === groupId);
    if (groupToRemove) {
      // Move items back to first group
      const firstGroup = itemGroups[0];
      const updatedFirstGroup = {
        ...firstGroup,
        items: [...firstGroup.items, ...groupToRemove.items]
      };
      
      setItemGroups([
        updatedFirstGroup,
        ...itemGroups.filter(g => g.id !== groupId && g.id !== firstGroup.id)
      ]);
    }
  };

  const handleMoveItem = (itemId: string, fromGroupId: string, toGroupId: string) => {
    const updatedGroups = itemGroups.map(group => {
      if (group.id === fromGroupId) {
        return {
          ...group,
          items: group.items.filter(id => id !== itemId)
        };
      } else if (group.id === toGroupId) {
        return {
          ...group,
          items: [...group.items, itemId]
        };
      }
      return group;
    });
    setItemGroups(updatedGroups);
  };

  const handleUpdateGroup = (groupId: string, updates: Partial<ItemGroup>) => {
    setItemGroups(groups => 
      groups.map(group => 
        group.id === groupId ? { ...group, ...updates } : group
      )
    );
  };

  const handleSplitOrder = async () => {
    // Validate that all items are assigned to groups
    const allItemIds = order.order_items.map(item => item.id);
    const assignedItemIds = itemGroups.flatMap(group => group.items);
    
    if (allItemIds.some(id => !assignedItemIds.includes(id))) {
      alert('All items must be assigned to a group');
      return;
    }

    // Validate that no group is empty
    if (itemGroups.some(group => group.items.length === 0)) {
      alert('All groups must have at least one item');
      return;
    }

    try {
      await splitOrder.mutateAsync({
        orderId: order.id,
        itemGroups: itemGroups.map(group => ({
          items: group.items,
          table_id: group.table_id,
          customer_name: group.customer_name
        }))
      });
      onOrderSplit?.();
      onClose();
    } catch (error) {
      console.error('Error splitting order:', error);
    }
  };

  const formatTableInfo = (table: any) => {
    const section = table.section ? ` (${table.section})` : '';
    return `Table ${table.table_number}${section}`;
  };

  const getItemById = (itemId: string) => {
    return order.order_items.find(item => item.id === itemId);
  };

  const getGroupTotal = (group: ItemGroup) => {
    return group.items.reduce((total, itemId) => {
      const item = getItemById(itemId);
      return total + (item?.total_price || 0);
    }, 0);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Split Order" size="xl">
      <div className="p-6">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Split Order #{order.order_number} into separate orders
          </p>
          <p className="text-sm text-gray-500">
            Drag items between groups or use the dropdown to move items
          </p>
        </div>

        <div className="space-y-4">
          {itemGroups.map((group, index) => (
            <div key={group.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">
                  Group {index + 1}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    ${getGroupTotal(group).toFixed(2)}
                  </span>
                  {itemGroups.length > 1 && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveGroup(group.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {order.order_type === 'dine_in' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Table Assignment
                    </label>
                    <select
                      value={group.table_id || ''}
                      onChange={(e) => handleUpdateGroup(group.id, { table_id: e.target.value || undefined })}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select table...</option>
                      {availableTables.map(table => (
                        <option key={table.id} value={table.id}>
                          {formatTableInfo(table)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name (Optional)
                  </label>
                  <Input
                    value={group.customer_name || ''}
                    onChange={(e) => handleUpdateGroup(group.id, { customer_name: e.target.value })}
                    placeholder="Customer name"
                    size="sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Items in this group:</h4>
                {group.items.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No items in this group</p>
                ) : (
                  <div className="space-y-1">
                    {group.items.map(itemId => {
                      const item = getItemById(itemId);
                      if (!item) return null;

                      return (
                        <div key={itemId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <span className="text-sm font-medium">{item.item_name}</span>
                            <span className="text-sm text-gray-600 ml-2">x{item.quantity}</span>
                            {item.special_instructions && (
                              <p className="text-xs text-gray-500 italic">"{item.special_instructions}"</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">${item.total_price.toFixed(2)}</span>
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleMoveItem(itemId, group.id, e.target.value);
                                }
                              }}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="">Move to...</option>
                              {itemGroups.map(otherGroup => (
                                otherGroup.id !== group.id && (
                                  <option key={otherGroup.id} value={otherGroup.id}>
                                    Group {itemGroups.indexOf(otherGroup) + 1}
                                  </option>
                                )
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          <Button
            variant="secondary"
            onClick={handleAddGroup}
            className="w-full"
          >
            Add Another Group
          </Button>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSplitOrder}
            disabled={splitOrder.isPending}
          >
            {splitOrder.isPending ? 'Splitting...' : 'Split Order'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

