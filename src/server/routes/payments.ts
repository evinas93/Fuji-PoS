// Payment processing routes
import { Router } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { createSupabaseClient } from '../config/supabase';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { requireCashierOrManager } from '../middleware/auth';
import { getEnv } from '../config/env';

const router = Router();
const env = getEnv();
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Validation schemas
const createPaymentIntentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().min(0.5, 'Amount must be at least $0.50'),
  currency: z.string().default('usd'),
});

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  paymentMethodId: z.string(),
});

const cashPaymentSchema = z.object({
  orderId: z.string().uuid(),
  cashReceived: z.number().min(0, 'Cash received must be non-negative'),
});

const refundPaymentSchema = z.object({
  reason: z.string().min(1, 'Refund reason is required'),
  amount: z.number().min(0.01).optional(),
});

// POST /api/payments/create-intent
// Create Stripe payment intent for credit card payments
router.post('/create-intent', requireCashierOrManager, asyncHandler(async (req, res) => {
  const { orderId, amount, currency } = createPaymentIntentSchema.parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  // Verify order exists and is not already paid
  const { data: order, error: orderError } = await supabaseClient
    .from('orders')
    .select('id, total_amount, status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new NotFoundError('Order not found');
  }

  if (order.status === 'completed') {
    throw new ValidationError('Order is already completed');
  }

  // Check if there's already a completed payment for this order
  const { data: existingPayment } = await supabaseClient
    .from('payments')
    .select('id')
    .eq('order_id', orderId)
    .eq('payment_status', 'completed')
    .single();

  if (existingPayment) {
    throw new ValidationError('Order is already paid');
  }

  try {
    // Calculate service charge for credit card (3.5%)
    const serviceCharge = Math.round(amount * env.CREDIT_CARD_SERVICE_CHARGE);
    const totalAmount = amount + serviceCharge;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency,
      metadata: {
        orderId,
        serviceCharge: serviceCharge.toString(),
        originalAmount: amount.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create pending payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        order_id: orderId,
        payment_method: 'credit',
        payment_status: 'pending',
        amount: totalAmount,
        stripe_payment_intent_id: paymentIntent.id,
        processed_by: req.user!.id,
      })
      .select()
      .single();

    if (paymentError) {
      throw new ValidationError(paymentError.message);
    }

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      payment,
      serviceCharge,
      totalAmount,
    });
  } catch (error) {
    console.error('Stripe error:', error);
    throw new ValidationError('Failed to create payment intent');
  }
}));

// POST /api/payments/confirm
// Confirm credit card payment
router.post('/confirm', requireCashierOrManager, asyncHandler(async (req, res) => {
  const { paymentIntentId, paymentMethodId } = confirmPaymentSchema.parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  try {
    // Confirm the payment intent
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/payments/success`,
    });

    // Update payment record
    const updateData: any = {
      payment_status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
      processed_at: new Date().toISOString(),
      transaction_reference: paymentIntent.id,
    };

    // Get payment method details for last four digits
    if (paymentIntent.payment_method) {
      const paymentMethod = await stripe.paymentMethods.retrieve(
        paymentIntent.payment_method as string
      );
      if (paymentMethod.card) {
        updateData.last_four = paymentMethod.card.last4;
      }
    }

    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .update(updateData)
      .eq('stripe_payment_intent_id', paymentIntentId)
      .select()
      .single();

    if (paymentError) {
      throw new ValidationError(paymentError.message);
    }

    // If payment succeeded, update order status to completed
    if (paymentIntent.status === 'succeeded') {
      await supabaseClient
        .from('orders')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', payment.order_id);
    }

    res.json({
      message: paymentIntent.status === 'succeeded' ? 'Payment confirmed successfully' : 'Payment failed',
      payment,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
      },
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    throw new ValidationError('Payment confirmation failed');
  }
}));

// POST /api/payments/cash
// Process cash payment
router.post('/cash', requireCashierOrManager, asyncHandler(async (req, res) => {
  const { orderId, cashReceived } = cashPaymentSchema.parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  // Get order details
  const { data: order, error: orderError } = await supabaseClient
    .from('orders')
    .select('id, total_amount, status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new NotFoundError('Order not found');
  }

  if (order.status === 'completed') {
    throw new ValidationError('Order is already completed');
  }

  if (cashReceived < order.total_amount) {
    throw new ValidationError('Insufficient cash received');
  }

  const changeGiven = cashReceived - order.total_amount;

  // Create payment record
  const { data: payment, error: paymentError } = await supabaseClient
    .from('payments')
    .insert({
      order_id: orderId,
      payment_method: 'cash',
      payment_status: 'completed',
      amount: order.total_amount,
      cash_received: cashReceived,
      change_given: changeGiven,
      processed_at: new Date().toISOString(),
      processed_by: req.user!.id,
    })
    .select()
    .single();

  if (paymentError) {
    throw new ValidationError(paymentError.message);
  }

  // Update order status to completed
  await supabaseClient
    .from('orders')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  res.json({
    message: 'Cash payment processed successfully',
    payment,
    changeGiven,
  });
}));

// GET /api/payments/order/:orderId
// Get payments for a specific order
router.get('/order/:orderId', asyncHandler(async (req, res) => {
  const orderId = req.params.orderId;
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: payments, error } = await supabaseClient
    .from('payments')
    .select(`
      *,
      profiles:processed_by (
        id,
        username,
        first_name,
        last_name
      )
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    payments,
    count: payments.length,
  });
}));

// GET /api/payments/:id
// Get specific payment details
router.get('/:id', asyncHandler(async (req, res) => {
  const paymentId = req.params.id;
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  const { data: payment, error } = await supabaseClient
    .from('payments')
    .select(`
      *,
      orders:order_id (
        id,
        order_number,
        total_amount,
        type
      ),
      profiles:processed_by (
        id,
        username,
        first_name,
        last_name
      )
    `)
    .eq('id', paymentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Payment not found');
    }
    throw new ValidationError(error.message);
  }

  res.json({ payment });
}));

// POST /api/payments/:id/refund
// Process refund (manager only)
router.post('/:id/refund', requireCashierOrManager, asyncHandler(async (req, res) => {
  const paymentId = req.params.id;
  const { reason, amount } = refundPaymentSchema.parse(req.body);
  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  // Get payment details
  const { data: payment, error: paymentError } = await supabaseClient
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (paymentError || !payment) {
    throw new NotFoundError('Payment not found');
  }

  if (payment.payment_status !== 'completed') {
    throw new ValidationError('Can only refund completed payments');
  }

  const refundAmount = amount || payment.amount;

  if (refundAmount > payment.amount) {
    throw new ValidationError('Refund amount cannot exceed original payment amount');
  }

  try {
    let stripeRefund = null;

    // Process Stripe refund for credit card payments
    if (payment.payment_method === 'credit' && payment.stripe_payment_intent_id) {
      stripeRefund = await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          refund_reason: reason,
          processed_by: req.user!.id,
        },
      });
    }

    // Update payment record
    const { data: updatedPayment, error: updateError } = await supabaseClient
      .from('payments')
      .update({
        payment_status: refundAmount === payment.amount ? 'refunded' : 'completed',
        refund_amount: refundAmount,
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
        refunded_by: req.user!.id,
        ...(stripeRefund && { transaction_reference: stripeRefund.id }),
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (updateError) {
      throw new ValidationError(updateError.message);
    }

    res.json({
      message: 'Refund processed successfully',
      payment: updatedPayment,
      refundAmount,
      ...(stripeRefund && { stripeRefund }),
    });
  } catch (error) {
    console.error('Refund error:', error);
    throw new ValidationError('Failed to process refund');
  }
}));

// GET /api/payments
// Get payments with filtering
router.get('/', asyncHandler(async (req, res) => {
  const {
    date,
    payment_method,
    payment_status,
    limit = '50',
    offset = '0'
  } = req.query;

  const supabaseClient = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));

  let query = supabaseClient
    .from('payments')
    .select(`
      *,
      orders:order_id (
        id,
        order_number,
        order_date,
        type
      ),
      profiles:processed_by (
        id,
        username,
        first_name,
        last_name
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (date) {
    query = query.gte('created_at', `${date}T00:00:00`)
                 .lt('created_at', `${date}T23:59:59`);
  }

  if (payment_method) {
    query = query.eq('payment_method', payment_method as string);
  }

  if (payment_status) {
    query = query.eq('payment_status', payment_status as string);
  }

  // Apply pagination
  const limitNum = parseInt(limit as string, 10);
  const offsetNum = parseInt(offset as string, 10);
  query = query.range(offsetNum, offsetNum + limitNum - 1);

  const { data: payments, error, count } = await query;

  if (error) {
    throw new ValidationError(error.message);
  }

  res.json({
    payments,
    count,
    pagination: {
      limit: limitNum,
      offset: offsetNum,
      total: count || 0,
    },
  });
}));

export default router;

