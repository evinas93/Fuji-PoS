import { NextApiRequest, NextApiResponse} from 'next';
import { receiptService } from '../../../lib/services/receipt.service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const {
      startDate,
      endDate,
      orderNumber,
      orderType,
      paymentMethod,
      page = '1',
      limit = '20'
    } = req.query;

    const filters = {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      orderNumber: orderNumber as string | undefined,
      orderType: orderType as 'dine_in' | 'take_out' | 'all' | undefined,
      paymentMethod: paymentMethod as string | undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    const { data, error, count } = await receiptService.getReceipts(filters);

    if (error) {
      console.error('Error fetching receipts:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch receipts',
      });
    }

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count,
        totalPages: Math.ceil(count / filters.limit),
      },
    });
  } catch (error) {
    console.error('Receipts API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
