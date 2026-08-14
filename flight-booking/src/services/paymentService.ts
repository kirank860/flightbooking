import Stripe from 'stripe';
import pool from '../config/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export class PaymentService {
  async createPaymentIntent(bookingId: number, amount: number, email: string) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: { bookingId },
      receipt_email: email,
    });

    return paymentIntent;
  }

  async handleWebhook(event: Stripe.Event) {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata.bookingId;

      await pool.query(
        `UPDATE bookings 
         SET status = 'confirmed', stripe_payment_intent_id = $1
         WHERE id = $2`,
        [paymentIntent.id, bookingId]
      );
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata.bookingId;

      await pool.query(
        `UPDATE bookings SET status = 'cancelled' WHERE id = $1`,
        [bookingId]
      );
    }
  }

  async refundPayment(bookingId: number) {
    const booking = await pool.query(
      'SELECT stripe_payment_intent_id, total_price FROM bookings WHERE id = $1',
      [bookingId]
    );

    if (booking.rows.length === 0) {
      throw new Error('Booking not found');
    }

    const refund = await stripe.refunds.create({
      payment_intent: booking.rows[0].stripe_payment_intent_id,
    });

    await pool.query(
      `INSERT INTO refunds (booking_id, stripe_refund_id, amount, status)
       VALUES ($1, $2, $3, 'completed')`,
      [bookingId, refund.id, booking.rows[0].total_price]
    );

    return refund;
  }
}
