// Menu modifiers API endpoints for Fuji POS System
import type { NextApiRequest, NextApiResponse } from 'next';
import { MenuService } from '../../../lib/services/menu.service';
import { supabase } from '../../../server/config/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const menuService = new MenuService();

  // For GET requests, allow unauthenticated access to view modifiers
  if (req.method === 'GET') {
    return handleGetModifiers(req, res, menuService);
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
      return handleCreateModifier(req, res, menuService);

    case 'PUT':
      if (!['admin', 'manager'].includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return handleUpdateModifier(req, res, supabase);

    case 'DELETE':
      if (!['admin', 'manager'].includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return handleDeleteModifier(req, res, supabase);

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

async function handleGetModifiers(
  req: NextApiRequest,
  res: NextApiResponse,
  menuService: MenuService
) {
  try {
    const { item_id } = req.query;

    let result;

    if (item_id && typeof item_id === 'string') {
      // Get modifiers for a specific item
      result = await menuService.getItemModifiers(item_id);
    } else {
      // Get all modifiers grouped by category
      result = await menuService.getModifiers();
    }

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(200).json({ data: result.data });
  } catch (error) {
    console.error('Error fetching modifiers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateModifier(
  req: NextApiRequest,
  res: NextApiResponse,
  menuService: MenuService
) {
  try {
    const { name, price, modifier_group } = req.body;

    // Validate required fields
    if (!name || price === undefined || !modifier_group) {
      return res.status(400).json({
        error: 'Missing required fields: name, price, modifier_group',
      });
    }

    // Validate price is not negative
    if (price < 0) {
      return res.status(400).json({
        error: 'Price cannot be negative',
      });
    }

    const result = await menuService.createModifier({
      name,
      price: parseFloat(price),
      modifier_group,
    });

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(201).json({
      data: result.data,
      message: 'Modifier created successfully',
    });
  } catch (error) {
    console.error('Error creating modifier:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleUpdateModifier(req: NextApiRequest, res: NextApiResponse, supabase: any) {
  try {
    const { id, ...updateData } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Modifier ID is required' });
    }

    // Validate price if provided
    if (updateData.price !== undefined && updateData.price < 0) {
      return res.status(400).json({
        error: 'Price cannot be negative',
      });
    }

    const { data, error } = await supabase
      .from('modifiers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      data,
      message: 'Modifier updated successfully',
    });
  } catch (error) {
    console.error('Error updating modifier:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDeleteModifier(req: NextApiRequest, res: NextApiResponse, supabase: any) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Modifier ID is required' });
    }

    // Check if modifier is linked to any items
    const { data: itemModifiers, error: itemsError } = await supabase
      .from('item_modifiers')
      .select('id')
      .eq('modifier_id', id)
      .limit(1);

    if (itemsError) {
      return res.status(400).json({ error: itemsError.message });
    }

    if (itemModifiers && itemModifiers.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete modifier that is linked to menu items. Remove from items first.',
      });
    }

    const { error } = await supabase.from('modifiers').delete().eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: 'Modifier deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting modifier:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
