// Menu management routes
import { Router } from 'express';
import { z } from 'zod';
import { createSupabaseClient } from '../config/supabase';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { requireManager, requireServerOrManager } from '../middleware/auth';

const router = Router();

// Validation schemas
const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  displayOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

const menuItemSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  basePrice: z.number().min(0, 'Base price must be non-negative'),
  priceVariations: z.record(z.number()).optional(),
  availability: z.boolean().optional(),
  specialFlags: z.array(z.string()).optional(),
  allergenInfo: z.array(z.string()).optional(),
  preparationTime: z.number().int().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
});

const modifierSchema = z.object({
  name: z.string().min(1, 'Modifier name is required'),
  category: z.string().min(1, 'Modifier category is required'),
  priceAdjustment: z.number().default(0),
  required: z.boolean().default(false),
  active: z.boolean().default(true),
});

// GET /api/menu/categories
// Get all menu categories
router.get('/categories', asyncHandler(async (req, res) => {
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: categories, error } = await supabaseClient
    .from('menu_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    categories,
    count: categories.length,
  });
}));

// POST /api/menu/categories
// Create a new category (manager only)
router.post('/categories', requireManager, asyncHandler(async (req, res) => {
  const validatedData = categorySchema.parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: category, error } = await supabaseClient
    .from('categories')
    .insert({
      name: validatedData.name,
      display_order: validatedData.displayOrder || 0,
      active: validatedData.active ?? true,
      description: validatedData.description || null,
      image_url: validatedData.imageUrl || null,
    })
    .select()
    .single();

  if (error) {
    throw new ValidationError(error.message);
  }

  res.status(201).json({
    message: 'Category created successfully',
    category,
  });
}));

// PUT /api/menu/categories/:id
// Update a category (manager only)
router.put('/categories/:id', requireManager, asyncHandler(async (req, res) => {
  const categoryId = req.params.id;
  const validatedData = categorySchema.partial().parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: category, error } = await supabaseClient
    .from('categories')
    .update({
      ...(validatedData.name && { name: validatedData.name }),
      ...(validatedData.displayOrder !== undefined && { display_order: validatedData.displayOrder }),
      ...(validatedData.active !== undefined && { active: validatedData.active }),
      ...(validatedData.description !== undefined && { description: validatedData.description }),
      ...(validatedData.imageUrl !== undefined && { image_url: validatedData.imageUrl }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', categoryId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Category not found');
    }
    throw new ValidationError(error.message);
  }

  res.json({
    message: 'Category updated successfully',
    category,
  });
}));

// DELETE /api/menu/categories/:id
// Delete a category (manager only)
router.delete('/categories/:id', requireManager, asyncHandler(async (req, res) => {
  const categoryId = req.params.id;
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  // Check if category has menu items
  const { count } = await supabaseClient
    .from('menu_items')
    .select('id', { count: 'exact' })
    .eq('category_id', categoryId);

  if (count && count > 0) {
    throw new ValidationError('Cannot delete category that contains menu items');
  }

  const { error } = await supabaseClient
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    message: 'Category deleted successfully',
  });
}));

// GET /api/menu/items
// Get all menu items with optional filtering
router.get('/items', asyncHandler(async (req, res) => {
  const { category, available, search } = req.query;
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  let query = supabaseClient
    .from('menu_items')
    .select(`
      *,
      categories:category_id (
        id,
        name,
        display_order
      )
    `);

  // Apply filters
  if (category) {
    query = query.eq('category_id', category as string);
  }

  if (available !== undefined) {
    query = query.eq('availability', available === 'true');
  }

  if (search) {
    query = query.textSearch('name', search as string);
  }

  const { data: menuItems, error } = await query.order('name');

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    menuItems,
    count: menuItems.length,
  });
}));

// GET /api/menu/items/:id
// Get a specific menu item
router.get('/items/:id', asyncHandler(async (req, res) => {
  const itemId = req.params.id;
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: menuItem, error } = await supabaseClient
    .from('menu_items')
    .select(`
      *,
      categories:category_id (
        id,
        name,
        display_order
      )
    `)
    .eq('id', itemId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Menu item not found');
    }
    throw new ValidationError(error.message);
  }

  res.json({ menuItem });
}));

// POST /api/menu/items
// Create a new menu item (manager only)
router.post('/items', requireManager, asyncHandler(async (req, res) => {
  const validatedData = menuItemSchema.parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: menuItem, error } = await supabaseClient
    .from('menu_items')
    .insert({
      category_id: validatedData.categoryId,
      name: validatedData.name,
      description: validatedData.description || null,
      base_price: validatedData.basePrice,
      price_variations: validatedData.priceVariations || {},
      availability: validatedData.availability ?? true,
      special_flags: validatedData.specialFlags || [],
      allergen_info: validatedData.allergenInfo || [],
      preparation_time: validatedData.preparationTime || null,
      cost_price: validatedData.costPrice || null,
      image_url: validatedData.imageUrl || null,
    })
    .select()
    .single();

  if (error) {
    throw new ValidationError(error.message);
  }

  res.status(201).json({
    message: 'Menu item created successfully',
    menuItem,
  });
}));

// PUT /api/menu/items/:id
// Update a menu item (manager only)
router.put('/items/:id', requireManager, asyncHandler(async (req, res) => {
  const itemId = req.params.id;
  const validatedData = menuItemSchema.partial().parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  // Map validated data to database columns
  if (validatedData.categoryId) updateData.category_id = validatedData.categoryId;
  if (validatedData.name) updateData.name = validatedData.name;
  if (validatedData.description !== undefined) updateData.description = validatedData.description;
  if (validatedData.basePrice !== undefined) updateData.base_price = validatedData.basePrice;
  if (validatedData.priceVariations !== undefined) updateData.price_variations = validatedData.priceVariations;
  if (validatedData.availability !== undefined) updateData.availability = validatedData.availability;
  if (validatedData.specialFlags !== undefined) updateData.special_flags = validatedData.specialFlags;
  if (validatedData.allergenInfo !== undefined) updateData.allergen_info = validatedData.allergenInfo;
  if (validatedData.preparationTime !== undefined) updateData.preparation_time = validatedData.preparationTime;
  if (validatedData.costPrice !== undefined) updateData.cost_price = validatedData.costPrice;
  if (validatedData.imageUrl !== undefined) updateData.image_url = validatedData.imageUrl;

  const { data: menuItem, error } = await supabaseClient
    .from('menu_items')
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Menu item not found');
    }
    throw new ValidationError(error.message);
  }

  res.json({
    message: 'Menu item updated successfully',
    menuItem,
  });
}));

// PATCH /api/menu/items/:id/availability
// Toggle item availability (servers and managers)
router.patch('/items/:id/availability', requireServerOrManager, asyncHandler(async (req, res) => {
  const itemId = req.params.id;
  const { available } = z.object({ available: z.boolean() }).parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: menuItem, error } = await supabaseClient
    .from('menu_items')
    .update({
      availability: available,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Menu item not found');
    }
    throw new ValidationError(error.message);
  }

  res.json({
    message: `Menu item ${available ? 'enabled' : 'disabled'} successfully`,
    menuItem,
  });
}));

// DELETE /api/menu/items/:id
// Delete a menu item (manager only)
router.delete('/items/:id', requireManager, asyncHandler(async (req, res) => {
  const itemId = req.params.id;
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { error } = await supabaseClient
    .from('menu_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    message: 'Menu item deleted successfully',
  });
}));

// GET /api/menu/modifiers
// Get all modifiers
router.get('/modifiers', asyncHandler(async (req, res) => {
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: modifiers, error } = await supabaseClient
    .from('modifiers')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    modifiers,
    count: modifiers.length,
  });
}));

// POST /api/menu/modifiers
// Create a new modifier (manager only)
router.post('/modifiers', requireManager, asyncHandler(async (req, res) => {
  const validatedData = modifierSchema.parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: modifier, error } = await supabaseClient
    .from('modifiers')
    .insert({
      name: validatedData.name,
      category: validatedData.category,
      price_adjustment: validatedData.priceAdjustment,
      required: validatedData.required,
      active: validatedData.active,
    })
    .select()
    .single();

  if (error) {
    throw new ValidationError(error.message);
  }

  res.status(201).json({
    message: 'Modifier created successfully',
    modifier,
  });
}));

export default router;
