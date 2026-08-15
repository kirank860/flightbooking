import { Request, Response } from 'express';
import Stripe from 'stripe';
import getStripe from '../config/stripe';
import { PaymentService } from '../services/paymentService';

const paymentService = new PaymentService();

function bookingIds(intent: Stripe.PaymentIntent): { bookingId: number; userId: number } {
  const bookingId = parseInt(intent.metadata.bookingId ?? '');
  const userId = parseInt(intent.metadata.userId ?? '');
  if (Number.isNaN(bookingId) || Number.isNaN(userId)) {
    throw new Error(`Payment intent ${intent.id} is missing bookingId/userId metadata`);
  }
  return { bookingId, userId };
}

export async function stripeWebhookHandler(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'];
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, signature as string, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error: any) {
    console.error('Stripe webhook signature verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const { bookingId, userId } = bookingIds(intent);
      await paymentService.handlePaymentIntentSucceeded(intent.id, bookingId, userId);
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const { bookingId, userId } = bookingIds(intent);
      await paymentService.handlePaymentIntentFailed(bookingId, userId);
    }
  } catch (error: any) {
    // "already processed" happens when the client's own confirm call (or a
    // duplicate webhook delivery, which Stripe does by design) beat us here -
    // the booking's guarded status transition already made this a no-op.
    if (!/already processed/.test(error.message)) {
      console.error('Stripe webhook handling error:', error.message);
    }
  }

  res.json({ received: true });
}
