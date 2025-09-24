import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    const taxRate = typeof req.body?.tax_rate === 'number' ? req.body.tax_rate : 0.08;
    const gratuityRate = typeof req.body?.gratuity_rate === 'number' ? req.body.gratuity_rate : 0;
    const serviceChargeRate =
      typeof req.body?.service_charge_rate === 'number' ? req.body.service_charge_rate : 0;
    const discountAmount =
      typeof req.body?.discount_amount === 'number' ? req.body.discount_amount : 0;

    // Get all order items to calculate subtotal
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('total_price')
      .eq('order_id', id);

    if (itemsError) {
      return res.status(400).json({ error: itemsError.message });
    }

    const subtotal = (items || []).reduce(
      (sum: number, item: any) => sum + (item.total_price || 0),
      0
    );
    const discountedSubtotal = Math.max(subtotal - discountAmount, 0);

    const tax_amount = +(discountedSubtotal * taxRate).toFixed(2);
    const gratuity_amount = +(discountedSubtotal * gratuityRate).toFixed(2);
    const service_charge = +(discountedSubtotal * serviceChargeRate).toFixed(2);
    const total_amount = +(
      discountedSubtotal +
      tax_amount +
      gratuity_amount +
      service_charge
    ).toFixed(2);

    // Update order with calculated totals
    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update({
        subtotal: +subtotal.toFixed(2),
        discount_amount: +discountAmount.toFixed(2),
        tax_amount,
        gratuity_amount,
        service_charge,
        total_amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    return res.status(200).json({ data: updated });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal server error' });
  }
}
