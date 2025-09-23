import { NextApiRequest, NextApiResponse } from 'next';
import { OrderService } from '../../../lib/services/order.service';

const orderService = new OrderService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { id } = query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res, id);
      case 'PUT':
        return await handlePut(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Order API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, orderId: string) {
  const { data, error } = await orderService.getOrder(orderId);

  if (error) {
    return res.status(404).json({ error: error.message });
  }

  return res.status(200).json({ data });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, orderId: string) {
  const { status, cancelled_reason, completed_by } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const { data, error } = await orderService.updateOrderStatus(orderId, status, {
    cancelled_reason,
    completed_by
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ data });
}

