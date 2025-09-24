// Menu items API endpoints for Fuji POS System
import type { NextApiRequest, NextApiResponse } from 'next';
import { MenuService } from '../../../lib/services/menu.service';
import { supabase } from '../../../server/config/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const menuService = new MenuService();

  // For GET requests, allow unauthenticated access to view menu items
  if (req.method === 'GET') {
    return handleGetMenuItems(req, res, menuService);
  }

  // For other methods, check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get user role for authorization
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = userProfile?.role;

  switch (req.method) {
    case 'POST':
      if (!['admin', 'manager'].includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return handleCreateMenuItem(req, res, menuService);

    case 'PUT':
      if (!['admin', 'manager'].includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return handleUpdateMenuItem(req, res, menuService);

    case 'DELETE':
      if (!['admin', 'manager'].includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return handleDeleteMenuItem(req, res, menuService);

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

async function handleGetMenuItems(
  req: NextApiRequest,
  res: NextApiResponse,
  menuService: MenuService
) {
  try {
    const { category, search, available, featured } = req.query;

    let result;

    if (search && typeof search === 'string') {
      // Search functionality
      result = await menuService.searchItems(search);
    } else if (featured === 'true') {
      // Get featured items
      result = await menuService.getFeaturedItems();
    } else if (category && typeof category === 'string') {
      // Get items by category
      result = await menuService.getMenuItemsByCategory(category);
    } else {
      // Get all items with optional filtering
      const categoryType = category as any;
      result = await menuService.getMenuItems(categoryType);
    }

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    // Apply additional filters if needed
    let items = result.data || [];

    if (available !== undefined) {
      const isAvailable = available === 'true';
      items = items.filter((item: any) => item.is_available === isAvailable);
    }

    return res.status(200).json({ data: items });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateMenuItem(
  req: NextApiRequest,
  res: NextApiResponse,
  menuService: MenuService
) {
  try {
    const menuItemData = req.body;

    // Validate required fields
    if (!menuItemData.name || !menuItemData.category_id || !menuItemData.base_price) {
      return res.status(400).json({
        error: 'Missing required fields: name, category_id, base_price',
      });
    }

    // Validate price is positive
    if (menuItemData.base_price <= 0) {
      return res.status(400).json({
        error: 'Base price must be greater than 0',
      });
    }

    const result = await menuService.addMenuItem(menuItemData);

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(201).json({
      data: result.data,
      message: 'Menu item created successfully',
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleUpdateMenuItem(
  req: NextApiRequest,
  res: NextApiResponse,
  menuService: MenuService
) {
  try {
    const { id, ...updateData } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Menu item ID is required' });
    }

    // Validate price if provided
    if (updateData.base_price !== undefined && updateData.base_price <= 0) {
      return res.status(400).json({
        error: 'Base price must be greater than 0',
      });
    }

    const result = await menuService.updateMenuItem(id, updateData);

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(200).json({
      data: result.data,
      message: 'Menu item updated successfully',
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDeleteMenuItem(
  req: NextApiRequest,
  res: NextApiResponse,
  menuService: MenuService
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Menu item ID is required' });
    }

    const result = await menuService.deleteMenuItem(id);

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(200).json({
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
