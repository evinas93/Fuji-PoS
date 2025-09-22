// System management and configuration routes
import { Router } from 'express';
import { z } from 'zod';
import { createSupabaseClient, supabase } from '../config/supabase';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { requireManager } from '../middleware/auth';

const router = Router();

// Validation schemas
const systemSettingSchema = z.object({
  key: z.string().min(1, 'Setting key is required'),
  value: z.string(),
  description: z.string().optional(),
});

const bulkSettingsSchema = z.record(z.string());

const userUpdateSchema = z.object({
  username: z.string().min(3).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['manager', 'server', 'cashier', 'kitchen']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  phone: z.string().optional(),
});

// GET /api/system/settings
// Get all system settings
router.get('/settings', requireManager, asyncHandler(async (req, res) => {
  const { data: settings, error } = await supabase
    .from('system_settings')
    .select('*')
    .order('key');

  if (error) {
    throw new ValidationError(error.message);
  }

  // Convert to key-value pairs for easier frontend use
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = {
      value: setting.value,
      description: setting.description,
      updated_at: setting.updated_at,
      updated_by: setting.updated_by,
    };
    return acc;
  }, {} as Record<string, any>);

  res.json({
    settings: settingsMap,
    count: settings.length,
  });
}));

// GET /api/system/settings/:key
// Get a specific system setting
router.get('/settings/:key', requireManager, asyncHandler(async (req, res) => {
  const settingKey = req.params.key;

  const { data: setting, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('key', settingKey)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Setting not found');
    }
    throw new ValidationError(error.message);
  }

  res.json({ setting });
}));

// PUT /api/system/settings/:key
// Update a system setting
router.put('/settings/:key', requireManager, asyncHandler(async (req, res) => {
  const settingKey = req.params.key;
  const { value, description } = z.object({
    value: z.string(),
    description: z.string().optional(),
  }).parse(req.body);

  const { data: setting, error } = await supabase
    .from('system_settings')
    .upsert({
      key: settingKey,
      value,
      description: description || null,
      updated_by: req.user!.id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    message: 'Setting updated successfully',
    setting,
  });
}));

// POST /api/system/settings
// Create a new system setting
router.post('/settings', requireManager, asyncHandler(async (req, res) => {
  const { key, value, description } = systemSettingSchema.parse(req.body);

  const { data: setting, error } = await supabase
    .from('system_settings')
    .insert({
      key,
      value,
      description: description || null,
      updated_by: req.user!.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new ValidationError('Setting key already exists');
    }
    throw new ValidationError(error.message);
  }

  res.status(201).json({
    message: 'Setting created successfully',
    setting,
  });
}));

// PUT /api/system/settings
// Bulk update system settings
router.put('/settings', requireManager, asyncHandler(async (req, res) => {
  const settings = bulkSettingsSchema.parse(req.body);
  
  const updates = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_by: req.user!.id,
    updated_at: new Date().toISOString(),
  }));

  const { data: updatedSettings, error } = await supabase
    .from('system_settings')
    .upsert(updates)
    .select();

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    message: `${updates.length} settings updated successfully`,
    settings: updatedSettings,
  });
}));

// DELETE /api/system/settings/:key
// Delete a system setting
router.delete('/settings/:key', requireManager, asyncHandler(async (req, res) => {
  const settingKey = req.params.key;

  const { error } = await supabase
    .from('system_settings')
    .delete()
    .eq('key', settingKey);

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    message: 'Setting deleted successfully',
  });
}));

// GET /api/system/users
// Get all user profiles (manager only)
router.get('/users', requireManager, asyncHandler(async (req, res) => {
  const { role, status } = req.query;
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  let query = supabaseClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters
  if (role) {
    query = query.eq('role', role as string);
  }

  if (status) {
    query = query.eq('status', status as string);
  }

  const { data: users, error } = await query;

  if (error) {
    throw new ValidationError(error.message);
  }

  // Remove sensitive information
  const sanitizedUsers = users.map(user => ({
    ...user,
    // Keep all fields as they're not sensitive in profiles table
  }));

  res.json({
    users: sanitizedUsers,
    count: users.length,
  });
}));

// GET /api/system/users/:id
// Get a specific user profile
router.get('/users/:id', requireManager, asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: user, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('User not found');
    }
    throw new ValidationError(error.message);
  }

  res.json({ user });
}));

// PUT /api/system/users/:id
// Update a user profile (manager only)
router.put('/users/:id', requireManager, asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const validatedData = userUpdateSchema.parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  // Map validated data to database columns
  if (validatedData.username) updateData.username = validatedData.username;
  if (validatedData.firstName) updateData.first_name = validatedData.firstName;
  if (validatedData.lastName) updateData.last_name = validatedData.lastName;
  if (validatedData.role) updateData.role = validatedData.role;
  if (validatedData.status) updateData.status = validatedData.status;
  if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;

  const { data: user, error } = await supabaseClient
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('User not found');
    }
    if (error.code === '23505') {
      throw new ValidationError('Username already exists');
    }
    throw new ValidationError(error.message);
  }

  res.json({
    message: 'User updated successfully',
    user,
  });
}));

// DELETE /api/system/users/:id
// Delete a user (manager only)
router.delete('/users/:id', requireManager, asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Prevent managers from deleting themselves
  if (userId === req.user!.id) {
    throw new ValidationError('Cannot delete your own account');
  }

  // Delete from auth.users (this will cascade to profiles due to foreign key)
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);

  if (authError) {
    throw new ValidationError(authError.message);
  }

  res.json({
    message: 'User deleted successfully',
  });
}));

// GET /api/system/tables
// Get all restaurant tables
router.get('/tables', asyncHandler(async (req, res) => {
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: tables, error } = await supabaseClient
    .from('tables')
    .select('*')
    .order('table_number');

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    tables,
    count: tables.length,
  });
}));

// POST /api/system/tables
// Create a new table (manager only)
router.post('/tables', requireManager, asyncHandler(async (req, res) => {
  const { tableNumber, capacity, location } = z.object({
    tableNumber: z.number().int().min(1),
    capacity: z.number().int().min(1).max(20).default(4),
    location: z.string().optional(),
  }).parse(req.body);

  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: table, error } = await supabaseClient
    .from('tables')
    .insert({
      table_number: tableNumber,
      capacity,
      location: location || null,
      active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new ValidationError('Table number already exists');
    }
    throw new ValidationError(error.message);
  }

  res.status(201).json({
    message: 'Table created successfully',
    table,
  });
}));

// PUT /api/system/tables/:id
// Update a table (manager only)
router.put('/tables/:id', requireManager, asyncHandler(async (req, res) => {
  const tableId = req.params.id;
  const { tableNumber, capacity, location, active } = z.object({
    tableNumber: z.number().int().min(1).optional(),
    capacity: z.number().int().min(1).max(20).optional(),
    location: z.string().optional(),
    active: z.boolean().optional(),
  }).parse(req.body);

  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (tableNumber) updateData.table_number = tableNumber;
  if (capacity) updateData.capacity = capacity;
  if (location !== undefined) updateData.location = location;
  if (active !== undefined) updateData.active = active;

  const { data: table, error } = await supabaseClient
    .from('tables')
    .update(updateData)
    .eq('id', tableId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Table not found');
    }
    if (error.code === '23505') {
      throw new ValidationError('Table number already exists');
    }
    throw new ValidationError(error.message);
  }

  res.json({
    message: 'Table updated successfully',
    table,
  });
}));

// GET /api/system/audit-log
// Get audit log entries (manager only)
router.get('/audit-log', requireManager, asyncHandler(async (req, res) => {
  const {
    tableName,
    action,
    startDate,
    endDate,
    limit = '100',
    offset = '0',
  } = req.query;

  let query = supabase
    .from('audit_log')
    .select(`
      *,
      profiles:changed_by (
        id,
        username,
        first_name,
        last_name
      )
    `)
    .order('changed_at', { ascending: false });

  // Apply filters
  if (tableName) {
    query = query.eq('table_name', tableName as string);
  }

  if (action) {
    query = query.eq('action', action as string);
  }

  if (startDate) {
    query = query.gte('changed_at', `${startDate}T00:00:00`);
  }

  if (endDate) {
    query = query.lte('changed_at', `${endDate}T23:59:59`);
  }

  // Apply pagination
  const limitNum = parseInt(limit as string, 10);
  const offsetNum = parseInt(offset as string, 10);
  query = query.range(offsetNum, offsetNum + limitNum - 1);

  const { data: auditLog, error, count } = await query;

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    auditLog,
    count,
    pagination: {
      limit: limitNum,
      offset: offsetNum,
      total: count || 0,
    },
  });
}));

// GET /api/system/status
// Get system status and health information
router.get('/status', asyncHandler(async (req, res) => {
  try {
    // Test database connection
    const { data: dbTest } = await supabase
      .from('system_settings')
      .select('key')
      .limit(1);

    // Get system settings
    const { data: settings } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['restaurant_name', 'tax_rate', 'gratuity_rate']);

    const settingsMap = (settings || []).reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    // Get counts
    const [ordersCount, menuItemsCount, usersCount] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('menu_items').select('id', { count: 'exact' }).eq('availability', true),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('status', 'active'),
    ]);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbTest ? 'connected' : 'error',
      settings: settingsMap,
      stats: {
        activeOrders: ordersCount.count || 0,
        availableMenuItems: menuItemsCount.count || 0,
        activeUsers: usersCount.count || 0,
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error('System status error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
    });
  }
}));

export default router;

