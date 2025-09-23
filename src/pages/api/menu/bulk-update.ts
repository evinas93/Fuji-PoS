// Bulk update API endpoint for menu management
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../server/config/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const supabase = createServerSupabaseClient(req, res);

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
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

  // Only managers and admins can perform bulk operations
  if (!['admin', 'manager'].includes(userRole)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const { operation, category_id, ...operationData } = req.body;

  try {
    let result;
    let count = 0;

    switch (operation) {
      case 'price_update':
        result = await handleBulkPriceUpdate(supabase, category_id, operationData);
        count = result.count;
        break;

      case 'availability_update':
        result = await handleBulkAvailabilityUpdate(supabase, category_id, operationData);
        count = result.count;
        break;

      case 'reorder_items':
        result = await handleBulkReorder(supabase, category_id);
        count = result.count;
        break;

      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json({
      message: `Bulk operation completed successfully`,
      count,
      operation
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleBulkPriceUpdate(supabase: any, categoryId: string, data: {
  price_multiplier: number;
  price_adjustment: number;
}) {
  const { price_multiplier, price_adjustment } = data;

  if (!price_multiplier || price_multiplier <= 0) {
    return { error: 'Price multiplier must be greater than 0' };
  }

  // Build the update query
  let query = supabase
    .from('menu_items')
    .update({
      base_price: supabase.raw(`(base_price * ${price_multiplier}) + ${price_adjustment}`),
      glass_price: supabase.raw(`CASE WHEN glass_price IS NOT NULL THEN (glass_price * ${price_multiplier}) + ${price_adjustment} ELSE glass_price END`),
      bottle_price: supabase.raw(`CASE WHEN bottle_price IS NOT NULL THEN (bottle_price * ${price_multiplier}) + ${price_adjustment} ELSE bottle_price END`),
      lunch_price: supabase.raw(`CASE WHEN lunch_price IS NOT NULL THEN (lunch_price * ${price_multiplier}) + ${price_adjustment} ELSE lunch_price END`),
      dinner_price: supabase.raw(`CASE WHEN dinner_price IS NOT NULL THEN (dinner_price * ${price_multiplier}) + ${price_adjustment} ELSE dinner_price END`),
      updated_at: new Date().toISOString()
    });

  // Apply category filter if specified
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  // Only update available items
  query = query.eq('is_available', true);

  const { data, error, count } = await query.select('id', { count: 'exact' });

  if (error) {
    return { error: error.message };
  }

  return { count: count || 0 };
}

async function handleBulkAvailabilityUpdate(supabase: any, categoryId: string, data: {
  is_available: boolean;
}) {
  const { is_available } = data;

  // Build the update query
  let query = supabase
    .from('menu_items')
    .update({
      is_available,
      updated_at: new Date().toISOString()
    });

  // Apply category filter if specified
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error, count } = await query.select('id', { count: 'exact' });

  if (error) {
    return { error: error.message };
  }

  return { count: count || 0 };
}

async function handleBulkReorder(supabase: any, categoryId: string) {
  // Get all items in the category ordered alphabetically
  let query = supabase
    .from('menu_items')
    .select('id, name')
    .order('name');

  // Apply category filter if specified
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data: items, error: fetchError } = await query;

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!items || items.length === 0) {
    return { count: 0 };
  }

  // Update display order for each item
  const updates = items.map((item: any, index: number) => ({
    id: item.id,
    display_order: index + 1,
    updated_at: new Date().toISOString()
  }));

  // Use upsert to update multiple records
  const { data, error, count } = await supabase
    .from('menu_items')
    .upsert(updates, { onConflict: 'id' })
    .select('id', { count: 'exact' });

  if (error) {
    return { error: error.message };
  }

  return { count: count || 0 };
}
