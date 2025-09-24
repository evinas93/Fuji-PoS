// Menu item availability API endpoint for Fuji POS System
import type { NextApiRequest, NextApiResponse } from 'next';
import { MenuService } from '../../../lib/services/menu.service';
import { supabase } from '../../../server/config/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const menuService = new MenuService();

  // Check authentication
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

  // Only servers, managers, and admins can toggle availability
  if (!['admin', 'manager', 'server'].includes(userRole)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  switch (req.method) {
    case 'PUT':
      return handleToggleAvailability(req, res, menuService);

    default:
      res.setHeader('Allow', ['PUT']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

async function handleToggleAvailability(
  req: NextApiRequest,
  res: NextApiResponse,
  menuService: MenuService
) {
  try {
    const { id, is_available } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Menu item ID is required' });
    }

    if (typeof is_available !== 'boolean') {
      return res.status(400).json({ error: 'is_available must be a boolean value' });
    }

    const result = await menuService.toggleItemAvailability(id, is_available);

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(200).json({
      data: result.data,
      message: `Menu item ${is_available ? 'made available' : 'made unavailable'}`,
    });
  } catch (error) {
    console.error('Error toggling availability:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
