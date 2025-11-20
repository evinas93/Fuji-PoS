// Order management routes
import { Router } from 'express';
import { z } from 'zod';
import { createSupabaseClient } from '../config/supabase';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { requireServerOrManager, requireKitchenOrManager } from '../middleware/auth';

const router = Router();

// Validation schemas
const createOrderSchema = z.object({
  type: z.enum(['dine_in', 'take_out']),
  tableId: z.string().uuid().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  partySize: z.number().int().min(1).max(20).default(1),
  specialInstructions: z.string().optional(),
  tipCash: z.number().min(0).default(0),
  tipCr: z.number().min(0).default(0),
  couponSubtract: z.number().min(0).default(0),
  scMerch: z.number().min(0).default(0),
  scOwner: z.number().min(0).default(0),
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    quantity: z.number().int().min(1),
    appliedModifiers: z.array(z.object({
      id: z.string().uuid(),
      name: z.string(),
      price: z.number(),
    })).default([]),
    specialInstructions: z.string().optional(),
  })).min(1, 'Order must have at least one item'),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled']),
  cancelledReason: z.string().optional(),
});

const addOrderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1),
  appliedModifiers: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    price: z.number(),
  })).default([]),
  specialInstructions: z.string().optional(),
});

// GET /api/orders
// Get orders with optional filtering
router.get('/', asyncHandler(async (req, res) => {
  const { 
    status, 
    date, 
    type, 
    server_id, 
    limit = '50',
    offset = '0' 
  } = req.query;

  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  let query = supabaseClient
    .from('orders')
    .select(`
      *,
      profiles:server_id (
        id,
        username,
        first_name,
        last_name
      ),
      tables:table_id (
        id,
        table_number,
        capacity
      ),
      order_items (
        *,
        menu_items:menu_item_id (
          id,
          name,
          base_price
        )
      ),
      payments (
        id,
        payment_method,
        payment_status,
        amount
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (status) {
    query = query.eq('status', status as string);
  }

  if (date) {
    query = query.eq('order_date', date as string);
  }

  if (type) {
    query = query.eq('type', type as string);
  }

  if (server_id) {
    query = query.eq('server_id', server_id as string);
  }

  // Apply pagination
  const limitNum = parseInt(limit as string, 10);
  const offsetNum = parseInt(offset as string, 10);
  query = query.range(offsetNum, offsetNum + limitNum - 1);

  const { data: orders, error, count } = await query;

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    orders,
    count,
    pagination: {
      limit: limitNum,
      offset: offsetNum,
      total: count || 0,
    },
  });
}));

// GET /api/orders/active
// Get all active orders (pending, preparing, ready)
router.get('/active', asyncHandler(async (req, res) => {
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: orders, error } = await supabaseClient
    .from('orders')
    .select(`
      *,
      profiles:server_id (
        id,
        username,
        first_name,
        last_name
      ),
      tables:table_id (
        id,
        table_number,
        capacity
      ),
      order_items (
        *,
        menu_items:menu_item_id (
          id,
          name,
          base_price,
          preparation_time
        )
      )
    `)
    .in('status', ['pending', 'preparing', 'ready'])
    .order('created_at', { ascending: true });

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    orders,
    count: orders.length,
  });
}));

// GET /api/orders/:id
// Get a specific order
router.get('/:id', asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: order, error } = await supabaseClient
    .from('orders')
    .select(`
      *,
      profiles:server_id (
        id,
        username,
        first_name,
        last_name
      ),
      tables:table_id (
        id,
        table_number,
        capacity,
        location
      ),
      order_items (
        *,
        menu_items:menu_item_id (
          id,
          name,
          description,
          base_price,
          allergen_info
        )
      ),
      payments (
        *
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Order not found');
    }
    throw new ValidationError(error.message);
  }

  res.json({ order });
}));

// POST /api/orders
// Create a new order
router.post('/', requireServerOrManager, asyncHandler(async (req, res) => {
  const validatedData = createOrderSchema.parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));
  const userId = req.user!.id;

  // Start a transaction by creating the order first
  const orderData: any = {
    type: validatedData.type,
    server_id: userId,
    party_size: validatedData.partySize,
    special_instructions: validatedData.specialInstructions || null,
    order_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    tip_cash: validatedData.tipCash || 0,
    tip_cr: validatedData.tipCr || 0,
    coupon_subtract: validatedData.couponSubtract || 0,
    sc_merch: validatedData.scMerch || 0,
    sc_owner: validatedData.scOwner || 0,
  };

  if (validatedData.type === 'dine_in' && validatedData.tableId) {
    orderData.table_id = validatedData.tableId;
    
    // Get table number for denormalization
    const { data: table } = await supabaseClient
      .from('tables')
      .select('table_number')
      .eq('id', validatedData.tableId)
      .single();
    
    if (table) {
      orderData.table_number = table.table_number;
    }
  } else if (validatedData.type === 'take_out') {
    orderData.customer_name = validatedData.customerName || null;
    orderData.customer_phone = validatedData.customerPhone || null;
  }

  // Create the order
  const { data: order, error: orderError } = await supabaseClient
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (orderError) {
    throw new ValidationError(orderError.message);
  }

  // Create order items
  const orderItems = [];
  for (const item of validatedData.items) {
    // Get menu item details for pricing
    const { data: menuItem, error: menuError } = await supabaseClient
      .from('menu_items')
      .select('base_price, name')
      .eq('id', item.menuItemId)
      .single();

    if (menuError || !menuItem) {
      throw new ValidationError(`Menu item ${item.menuItemId} not found`);
    }

    // Calculate unit price including modifiers
    const modifierTotal = item.appliedModifiers.reduce((sum, mod) => sum + mod.price, 0);
    const unitPrice = menuItem.base_price + modifierTotal;
    const totalPrice = unitPrice * item.quantity;

    orderItems.push({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      applied_modifiers: item.appliedModifiers,
      special_instructions: item.specialInstructions || null,
      status: 'pending',
    });
  }

  const { data: createdItems, error: itemsError } = await supabaseClient
    .from('order_items')
    .insert(orderItems)
    .select(`
      *,
      menu_items:menu_item_id (
        id,
        name,
        base_price
      )
    `);

  if (itemsError) {
    // Clean up the order if item creation fails
    await supabaseClient.from('orders').delete().eq('id', order.id);
    throw new ValidationError(itemsError.message);
  }

  // Trigger order total calculation by updating the order
  const { data: updatedOrder, error: updateError } = await supabaseClient
    .from('orders')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', order.id)
    .select()
    .single();

  if (updateError) {
    throw new ValidationError(updateError.message);
  }

  res.status(201).json({
    message: 'Order created successfully',
    order: {
      ...updatedOrder,
      order_items: createdItems,
    },
  });
}));

// PATCH /api/orders/:id/status
// Update order status
router.patch('/:id/status', requireServerOrManager, asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const { status, cancelledReason } = updateOrderStatusSchema.parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  if (status === 'cancelled' && cancelledReason) {
    updateData.cancelled_reason = cancelledReason;
  }

  const { data: order, error } = await supabaseClient
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Order not found');
    }
    throw new ValidationError(error.message);
  }

  // Also update all order items status
  await supabaseClient
    .from('order_items')
    .update({ 
      status,
      updated_at: new Date().toISOString(),
      ...(status === 'completed' && { completed_at: new Date().toISOString() })
    })
    .eq('order_id', orderId);

  res.json({
    message: `Order status updated to ${status}`,
    order,
  });
}));

// POST /api/orders/:id/items
// Add item to existing order
router.post('/:id/items', requireServerOrManager, asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const validatedData = addOrderItemSchema.parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  // Check if order exists and is modifiable
  const { data: order, error: orderError } = await supabaseClient
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single();

  if (orderError) {
    throw new NotFoundError('Order not found');
  }

  if (order.status === 'completed' || order.status === 'cancelled') {
    throw new ValidationError('Cannot modify completed or cancelled orders');
  }

  // Get menu item details
  const { data: menuItem, error: menuError } = await supabaseClient
    .from('menu_items')
    .select('base_price, name, availability')
    .eq('id', validatedData.menuItemId)
    .single();

  if (menuError || !menuItem) {
    throw new ValidationError('Menu item not found');
  }

  if (!menuItem.availability) {
    throw new ValidationError('Menu item is not available');
  }

  // Calculate pricing
  const modifierTotal = validatedData.appliedModifiers.reduce((sum, mod) => sum + mod.price, 0);
  const unitPrice = menuItem.base_price + modifierTotal;
  const totalPrice = unitPrice * validatedData.quantity;

  // Add the item
  const { data: orderItem, error: itemError } = await supabaseClient
    .from('order_items')
    .insert({
      order_id: orderId,
      menu_item_id: validatedData.menuItemId,
      quantity: validatedData.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      applied_modifiers: validatedData.appliedModifiers,
      special_instructions: validatedData.specialInstructions || null,
      status: 'pending',
    })
    .select(`
      *,
      menu_items:menu_item_id (
        id,
        name,
        base_price
      )
    `)
    .single();

  if (itemError) {
    throw new ValidationError(itemError.message);
  }

  // Trigger order total recalculation
  await supabaseClient
    .from('orders')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', orderId);

  res.status(201).json({
    message: 'Item added to order successfully',
    orderItem,
  });
}));

// Kitchen-specific routes
// PATCH /api/orders/:id/kitchen-status
// Update order status from kitchen perspective
router.patch('/:id/kitchen-status', requireKitchenOrManager, asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const { status } = z.object({ 
    status: z.enum(['preparing', 'ready']) 
  }).parse(req.body);
  
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'preparing') {
    // Mark items as sent to kitchen
    await supabaseClient
      .from('order_items')
      .update({ 
        sent_to_kitchen_at: new Date().toISOString(),
        status: 'preparing',
      })
      .eq('order_id', orderId);
  }

  if (status === 'ready') {
    // Set estimated ready time
    updateData.estimated_ready_time = new Date().toISOString();
  }

  const { data: order, error } = await supabaseClient
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    message: `Order marked as ${status}`,
    order,
  });
}));

export default router;

