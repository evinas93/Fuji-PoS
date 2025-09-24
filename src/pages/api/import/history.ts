import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

interface ImportHistoryRecord {
  id: string;
  created_at: string;
  user_id: string;
  action: string;
  table_name: string;
  details: {
    fileName: string;
    importType: string;
    totalRows: number;
    processedRows: number;
    errors: number;
  };
  user_name?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - missing token' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check user role (only managers/admins can view import history)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['manager', 'admin'].includes(profile.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { page = 1, limit = 50, type } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build query for import history
    let query = supabase
      .from('audit_log')
      .select(`
        id,
        created_at,
        user_id,
        action,
        table_name,
        details,
        profiles!inner(full_name)
      `)
      .eq('action', 'csv_import')
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    // Filter by import type if specified
    if (type && typeof type === 'string') {
      query = query.eq('details->importType', type);
    }

    const { data: history, error: historyError } = await query;

    if (historyError) {
      return res.status(500).json({ error: historyError.message });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('audit_log')
      .select('id', { count: 'exact' })
      .eq('action', 'csv_import');

    if (type && typeof type === 'string') {
      countQuery = countQuery.eq('details->importType', type);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      return res.status(500).json({ error: countError.message });
    }

    // Format response
    const formattedHistory: ImportHistoryRecord[] = history.map((record: any) => ({
      id: record.id,
      created_at: record.created_at,
      user_id: record.user_id,
      action: record.action,
      table_name: record.table_name,
      details: record.details,
      user_name: record.profiles?.full_name || 'Unknown User'
    }));

    return res.status(200).json({
      history: formattedHistory,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });

  } catch (error) {
    console.error('Import history error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}