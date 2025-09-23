import { NextApiRequest, NextApiResponse } from 'next';
import { OrderService } from '../../../lib/services/order.service';

const orderService = new OrderService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Orders API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { server_id, status } = req.query;

  const { data, error } = await orderService.getActiveOrders(
    server_id as string,
    status ? (Array.isArray(status) ? status as any[] : [status]) as any[] : undefined
  );

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ data });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { order_type, table_id, customer_name, customer_phone, server_id, notes } = req.body;

  // Validate required fields
  if (!order_type || !server_id) {
    return res.status(400).json({ 
      error: 'Missing required fields: order_type and server_id are required' 
    });
  }

  const { data, error } = await orderService.createOrder({
    order_type,
    table_id,
    customer_name,
    customer_phone,
    server_id,
    notes
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json({ data });
}

