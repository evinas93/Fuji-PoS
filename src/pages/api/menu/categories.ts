// Menu categories API endpoints for Fuji POS System
import type { NextApiRequest, NextApiResponse } from 'next';
import { MenuService } from '../../../lib/services/menu.service';
import { supabase } from '../../../server/config/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const menuService = new MenuService();

  // For GET requests, allow unauthenticated access to view categories
  if (req.method === 'GET') {
    return handleGetCategories(req, res, menuService);
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
      return handleCreateCategory(req, res, supabase);

    case 'PUT':
      if (!['admin', 'manager'].includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return handleUpdateCategory(req, res, supabase);

    case 'DELETE':
      if (!['admin', 'manager'].includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return handleDeleteCategory(req, res, supabase);

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

async function handleGetCategories(
  req: NextApiRequest,
  res: NextApiResponse,
  menuService: MenuService
) {
  try {
    const result = await menuService.getCategories();

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(200).json({ data: result.data });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateCategory(req: NextApiRequest, res: NextApiResponse, supabase: any) {
  try {
    const { name, category_type, display_order, icon, color } = req.body;

    // Validate required fields
    if (!name || !category_type) {
      return res.status(400).json({
        error: 'Missing required fields: name, category_type',
      });
    }

    // Get next display order if not provided
    let order = display_order;
    if (!order) {
      const { data: lastCategory } = await supabase
        .from('menu_categories')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      order = (lastCategory?.display_order || 0) + 1;
    }

    const { data, error } = await supabase
      .from('menu_categories')
      .insert({
        name,
        category_type,
        display_order: order,
        icon,
        color,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      data,
      message: 'Category created successfully',
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleUpdateCategory(req: NextApiRequest, res: NextApiResponse, supabase: any) {
  try {
    const { id, ...updateData } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    const { data, error } = await supabase
      .from('menu_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      data,
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDeleteCategory(req: NextApiRequest, res: NextApiResponse, supabase: any) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    // Check if category has items
    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (itemsError) {
      return res.status(400).json({ error: itemsError.message });
    }

    if (items && items.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete category with existing menu items. Move or delete items first.',
      });
    }

    const { error } = await supabase.from('menu_categories').delete().eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
