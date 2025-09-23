import { NextApiRequest, NextApiResponse } from 'next';
import { OrderService } from '../../../../lib/services/order.service';

const orderService = new OrderService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { id } = query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    switch (method) {
      case 'POST':
        return await handlePost(req, res, id);
      default:
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Order Items API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, orderId: string) {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is required and cannot be empty' });
  }

  // Validate each item
  for (const item of items) {
    if (!item.item_id || !item.quantity || item.quantity <= 0) {
      return res.status(400).json({ 
        error: 'Each item must have item_id and quantity > 0' 
      });
    }
  }

  const { data, error } = await orderService.addOrderItems(orderId, items);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json({ data });
}

