import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  const { id, format } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).end('Order ID is required');
  }

  const responseFormat = format === 'json' ? 'json' : 'html';

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(
        `
        id,
        order_number,
        order_date,
        order_type,
        table_id,
        subtotal,
        discount_amount,
        tax_amount,
        gratuity_amount,
        service_charge,
        total_amount,
        created_at,
        order_items (
          item_name,
          quantity,
          unit_price,
          total_price,
          modifiers
        ),
        restaurant_tables (
          table_number
        ),
        users!orders_server_id_fkey (
          full_name
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).end('Order not found');
    }

    // If JSON format requested, return raw data
    if (responseFormat === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({
        success: true,
        data: order
      });
    }

    // Otherwise, generate HTML receipt
    const fmt = (n: number) => (typeof n === 'number' ? n.toFixed(2) : '0.00');
    const created = new Date(order.created_at).toLocaleString();

    const itemsHtml = (order.order_items || [])
      .map((it: any) => {
        const mods = (it.modifiers || []).map((m: any) => m.name).join(', ');
        return `
          <tr>
            <td>${it.item_name}${mods ? ` <span style="color:#555">(${mods})</span>` : ''}</td>
            <td style="text-align:center">${it.quantity}</td>
            <td style="text-align:right">$${fmt(it.unit_price)}</td>
            <td style="text-align:right">$${fmt(it.total_price)}</td>
          </tr>`;
      })
      .join('');

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt #${order.order_number || order.id.slice(0, 8)}</title>
  <style>
    body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 16px; }
    .header { text-align: center; margin-bottom: 12px; }
    .muted { color: #666; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { padding: 6px 4px; border-bottom: 1px solid #eee; font-size: 14px; }
    .totals td { border: 0; }
    .right { text-align: right; }
    .print { margin-top: 16px; }
  </style>
</head>
<body onload="window.print()">
  <div class="header">
    <h2>Fuji Restaurant</h2>
    <div class="muted">Order #${order.order_number || order.id.slice(0, 8)} · ${created}</div>
    <div class="muted">${order.order_type === 'dine_in' ? `Table ${order.restaurant_tables?.table_number || order.table_id || '-'}` : 'Take Out'}</div>
    <div class="muted">Server: ${order.users?.full_name || 'Unknown'}</div>
  </div>

  <table>
    <thead>
      <tr><th>Item</th><th>Qty</th><th class="right">Unit</th><th class="right">Total</th></tr>
    </thead>
    <tbody>
      ${itemsHtml || '<tr><td colspan="4" class="muted">No items</td></tr>'}
    </tbody>
  </table>

  <table class="totals" style="margin-top: 12px">
    <tr><td>Subtotal</td><td class="right">$${fmt(order.subtotal || 0)}</td></tr>
    ${order.discount_amount > 0 ? `<tr><td>Discount</td><td class="right">-$${fmt(order.discount_amount)}</td></tr>` : ''}
    <tr><td>Tax</td><td class="right">$${fmt(order.tax_amount || 0)}</td></tr>
    ${order.gratuity_amount > 0 ? `<tr><td>Gratuity</td><td class="right">$${fmt(order.gratuity_amount)}</td></tr>` : ''}
    ${order.service_charge > 0 ? `<tr><td>Service Charge</td><td class="right">$${fmt(order.service_charge)}</td></tr>` : ''}
    <tr><td style="font-weight:600">Total</td><td class="right" style="font-weight:600">$${fmt(order.total_amount || 0)}</td></tr>
  </table>

  <div class="header" style="margin-top:16px">
    <div class="muted">Thank you!</div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(html);
  } catch (e: any) {
    return res.status(500).end('Internal server error');
  }
}
