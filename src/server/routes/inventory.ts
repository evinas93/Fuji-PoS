// Basic inventory management routes
import { Router } from 'express';
import { z } from 'zod';
import { createSupabaseClient } from '../config/supabase';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { requireManager } from '../middleware/auth';

const router = Router();

// Validation schemas
const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  currentStock: z.number().min(0).default(0),
  minimumStock: z.number().min(0),
  maximumStock: z.number().min(0).optional(),
  costPerUnit: z.number().min(0).optional(),
  supplier: z.string().optional(),
});

const adjustmentSchema = z.object({
  adjustmentType: z.enum(['restock', 'usage', 'waste', 'correction']),
  quantityChange: z.number(), // Can be negative for usage/waste
  reason: z.string().min(1, 'Reason is required'),
  referenceOrderId: z.string().uuid().optional(),
});

const stockUpdateSchema = z.object({
  currentStock: z.number().min(0),
  reason: z.string().min(1, 'Reason is required'),
});

// GET /api/inventory/items
// Get all inventory items with optional filtering
router.get('/items', asyncHandler(async (req, res) => {
  const { category, lowStock } = req.query;
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  let query = supabaseClient
    .from('inventory_items')
    .select('*')
    .eq('active', true)
    .order('name');

  // Apply filters
  if (category) {
    query = query.eq('category', category as string);
  }

  if (lowStock === 'true') {
    // This will need to be handled with a raw query or computed field
    // For now, we'll fetch all items and filter client-side
    const { data: allItems, error } = await query;
    
    if (error) {
      throw new ValidationError(error.message);
    }

    const lowStockItems = allItems.filter(item => 
      item.current_stock <= item.minimum_stock
    );

    return res.json({
      inventoryItems: lowStockItems,
      count: lowStockItems.length,
      filter: 'lowStock',
    });
  }

  const { data: inventoryItems, error } = await query;

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    inventoryItems,
    count: inventoryItems.length,
  });
}));

// GET /api/inventory/items/:id
// Get a specific inventory item
router.get('/items/:id', asyncHandler(async (req, res) => {
  const itemId = req.params.id;
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: inventoryItem, error } = await supabaseClient
    .from('inventory_items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Inventory item not found');
    }
    throw new ValidationError(error.message);
  }

  // Get recent adjustments for this item
  const { data: adjustments } = await supabaseClient
    .from('inventory_adjustments')
    .select(`
      *,
      profiles:adjusted_by (
        username,
        first_name,
        last_name
      ),
      orders:reference_order_id (
        id,
        order_number
      )
    `)
    .eq('inventory_item_id', itemId)
    .order('created_at', { ascending: false })
    .limit(10);

  res.json({
    inventoryItem,
    recentAdjustments: adjustments || [],
  });
}));

// POST /api/inventory/items
// Create a new inventory item (manager only)
router.post('/items', requireManager, asyncHandler(async (req, res) => {
  const validatedData = inventoryItemSchema.parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: inventoryItem, error } = await supabaseClient
    .from('inventory_items')
    .insert({
      name: validatedData.name,
      category: validatedData.category,
      unit: validatedData.unit,
      current_stock: validatedData.currentStock,
      minimum_stock: validatedData.minimumStock,
      maximum_stock: validatedData.maximumStock || null,
      cost_per_unit: validatedData.costPerUnit || null,
      supplier: validatedData.supplier || null,
      active: true,
    })
    .select()
    .single();

  if (error) {
    throw new ValidationError(error.message);
  }

  // Create initial adjustment record if starting with stock
  if (validatedData.currentStock > 0) {
    await supabaseClient
      .from('inventory_adjustments')
      .insert({
        inventory_item_id: inventoryItem.id,
        adjustment_type: 'correction',
        quantity_change: validatedData.currentStock,
        reason: 'Initial inventory setup',
        adjusted_by: req.user!.id,
      });
  }

  res.status(201).json({
    message: 'Inventory item created successfully',
    inventoryItem,
  });
}));

// PUT /api/inventory/items/:id
// Update an inventory item (manager only)
router.put('/items/:id', requireManager, asyncHandler(async (req, res) => {
  const itemId = req.params.id;
  const validatedData = inventoryItemSchema.partial().parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  // Map validated data to database columns
  if (validatedData.name) updateData.name = validatedData.name;
  if (validatedData.category) updateData.category = validatedData.category;
  if (validatedData.unit) updateData.unit = validatedData.unit;
  if (validatedData.minimumStock !== undefined) updateData.minimum_stock = validatedData.minimumStock;
  if (validatedData.maximumStock !== undefined) updateData.maximum_stock = validatedData.maximumStock;
  if (validatedData.costPerUnit !== undefined) updateData.cost_per_unit = validatedData.costPerUnit;
  if (validatedData.supplier !== undefined) updateData.supplier = validatedData.supplier;

  const { data: inventoryItem, error } = await supabaseClient
    .from('inventory_items')
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Inventory item not found');
    }
    throw new ValidationError(error.message);
  }

  res.json({
    message: 'Inventory item updated successfully',
    inventoryItem,
  });
}));

// POST /api/inventory/items/:id/adjust
// Adjust inventory levels (manager only)
router.post('/items/:id/adjust', requireManager, asyncHandler(async (req, res) => {
  const itemId = req.params.id;
  const validatedData = adjustmentSchema.parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  // Get current inventory item
  const { data: inventoryItem, error: itemError } = await supabaseClient
    .from('inventory_items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (itemError || !inventoryItem) {
    throw new NotFoundError('Inventory item not found');
  }

  const newStock = inventoryItem.current_stock + validatedData.quantityChange;

  if (newStock < 0) {
    throw new ValidationError('Adjustment would result in negative stock');
  }

  // Update inventory level
  const { data: updatedItem, error: updateError } = await supabaseClient
    .from('inventory_items')
    .update({
      current_stock: newStock,
      ...(validatedData.adjustmentType === 'restock' && { 
        last_restocked_at: new Date().toISOString() 
      }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();

  if (updateError) {
    throw new ValidationError(updateError.message);
  }

  // Create adjustment record
  const { data: adjustment, error: adjustmentError } = await supabaseClient
    .from('inventory_adjustments')
    .insert({
      inventory_item_id: itemId,
      adjustment_type: validatedData.adjustmentType,
      quantity_change: validatedData.quantityChange,
      reason: validatedData.reason,
      reference_order_id: validatedData.referenceOrderId || null,
      adjusted_by: req.user!.id,
    })
    .select(`
      *,
      profiles:adjusted_by (
        username,
        first_name,
        last_name
      )
    `)
    .single();

  if (adjustmentError) {
    throw new ValidationError(adjustmentError.message);
  }

  res.json({
    message: 'Inventory adjustment recorded successfully',
    inventoryItem: updatedItem,
    adjustment,
  });
}));

// PATCH /api/inventory/items/:id/stock
// Direct stock update (manager only)
router.patch('/items/:id/stock', requireManager, asyncHandler(async (req, res) => {
  const itemId = req.params.id;
  const { currentStock, reason } = stockUpdateSchema.parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  // Get current stock level
  const { data: inventoryItem, error: itemError } = await supabaseClient
    .from('inventory_items')
    .select('current_stock')
    .eq('id', itemId)
    .single();

  if (itemError || !inventoryItem) {
    throw new NotFoundError('Inventory item not found');
  }

  const quantityChange = currentStock - inventoryItem.current_stock;

  // Update stock level
  const { data: updatedItem, error: updateError } = await supabaseClient
    .from('inventory_items')
    .update({
      current_stock: currentStock,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();

  if (updateError) {
    throw new ValidationError(updateError.message);
  }

  // Create adjustment record
  if (quantityChange !== 0) {
    await supabaseClient
      .from('inventory_adjustments')
      .insert({
        inventory_item_id: itemId,
        adjustment_type: 'correction',
        quantity_change: quantityChange,
        reason,
        adjusted_by: req.user!.id,
      });
  }

  res.json({
    message: 'Stock level updated successfully',
    inventoryItem: updatedItem,
    quantityChange,
  });
}));

// GET /api/inventory/adjustments
// Get inventory adjustments with optional filtering
router.get('/adjustments', requireManager, asyncHandler(async (req, res) => {
  const { 
    itemId, 
    adjustmentType, 
    startDate, 
    endDate,
    limit = '50',
    offset = '0'
  } = req.query;

  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  let query = supabaseClient
    .from('inventory_adjustments')
    .select(`
      *,
      inventory_items:inventory_item_id (
        id,
        name,
        category
      ),
      profiles:adjusted_by (
        id,
        username,
        first_name,
        last_name
      ),
      orders:reference_order_id (
        id,
        order_number
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (itemId) {
    query = query.eq('inventory_item_id', itemId as string);
  }

  if (adjustmentType) {
    query = query.eq('adjustment_type', adjustmentType as string);
  }

  if (startDate) {
    query = query.gte('created_at', `${startDate}T00:00:00`);
  }

  if (endDate) {
    query = query.lte('created_at', `${endDate}T23:59:59`);
  }

  // Apply pagination
  const limitNum = parseInt(limit as string, 10);
  const offsetNum = parseInt(offset as string, 10);
  query = query.range(offsetNum, offsetNum + limitNum - 1);

  const { data: adjustments, error, count } = await query;

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    adjustments,
    count,
    pagination: {
      limit: limitNum,
      offset: offsetNum,
      total: count || 0,
    },
  });
}));

// GET /api/inventory/low-stock
// Get items with low stock levels
router.get('/low-stock', asyncHandler(async (req, res) => {
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: allItems, error } = await supabaseClient
    .from('inventory_items')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) {
    throw new ValidationError(error.message);
  }

  // Filter items where current stock <= minimum stock
  const lowStockItems = allItems
    .filter(item => item.current_stock <= item.minimum_stock)
    .map(item => ({
      ...item,
      stockDeficit: item.minimum_stock - item.current_stock,
    }));

  res.json({
    lowStockItems,
    count: lowStockItems.length,
    totalItems: allItems.length,
  });
}));

// GET /api/inventory/categories
// Get unique inventory categories
router.get('/categories', asyncHandler(async (req, res) => {
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: categories, error } = await supabaseClient
    .from('inventory_items')
    .select('category')
    .eq('active', true);

  if (error) {
    throw new ValidationError(error.message);
  }

  const uniqueCategories = [...new Set(categories.map(item => item.category))];

  res.json({
    categories: uniqueCategories,
    count: uniqueCategories.length,
  });
}));

export default router;

