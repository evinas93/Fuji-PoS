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
    console.error('Order Kitchen API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, orderId: string) {
  const { error } = await orderService.sendToKitchen(orderId);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ message: 'Order sent to kitchen successfully' });
}

