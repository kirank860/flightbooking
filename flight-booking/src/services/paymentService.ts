import Stripe from 'stripe';
import pool from '../config/database';
import getStripe from '../config/stripe';
import { BookingService } from './bookingService';

const bookingService = new BookingService();

export class PaymentService {
  async createPaymentIntent(bookingId: number, userId: number, amount: number, email: string): Promise<Stripe.PaymentIntent> {
    return getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'aed',
      receipt_email: email,
      metadata: { bookingId: String(bookingId), userId: String(userId) },
      // Card-only: the frontend uses CardElement, not the redirect-capable
      // PaymentElement, so redirect-based methods need to stay off (they'd
      // otherwise require a return_url).
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    });
  }

  // Client calls this right after Stripe.js's stripe.confirmCardPayment() resolves, so the
  // UI can move on immediately. We don't just trust the client's word that it
  // succeeded — we re-fetch the PaymentIntent from Stripe and check its real
  // status before touching the booking. The webhook handler performs the same
  // confirmBooking() call independently as the source-of-truth backstop (e.g.
  // if the browser closes before this call fires). In practice the webhook
  // often wins that race (confirmed by testing - it can land before this
  // client call even starts), so a "not pending anymore" failure here is
  // treated as success rather than surfaced as an error, as long as the
  // booking really did land on 'confirmed'.
  async confirmPayment(bookingId: number, userId: number, paymentIntentId: string) {
    const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);

    if (intent.metadata.bookingId !== String(bookingId) || intent.metadata.userId !== String(userId)) {
      throw new Error('Payment does not match this booking');
    }
    if (intent.status !== 'succeeded') {
      throw new Error('Payment has not succeeded yet');
    }

    try {
      return await bookingService.confirmBooking(bookingId, userId, paymentIntentId);
    } catch (error) {
      const alreadyConfirmed = await bookingService.getConfirmedBooking(bookingId, userId);
      if (alreadyConfirmed) return alreadyConfirmed;
      throw error;
    }
  }

  async declinePayment(bookingId: number, userId: number) {
    try {
      return await bookingService.declineBooking(bookingId, userId);
    } catch (error) {
      const alreadyFailed = await bookingService.getFailedBooking(bookingId, userId);
      if (alreadyFailed) return alreadyFailed;
      throw error;
    }
  }

  async refundPayment(bookingId: number): Promise<Stripe.Refund | { id: null; status: 'not_applicable' }> {
    const booking = await pool.query(
      'SELECT stripe_payment_intent_id, total_price FROM bookings WHERE id = $1',
      [bookingId]
    );

    if (booking.rows.length === 0) {
      throw new Error('Booking not found');
    }

    const paymentIntentId = booking.rows[0].stripe_payment_intent_id;

    // Bookings cancelled before payment was ever confirmed (still 'pending' or
    // already 'payment_failed') have no charge to refund.
    if (!paymentIntentId) {
      return { id: null, status: 'not_applicable' };
    }

    const refund = await getStripe().refunds.create({ payment_intent: paymentIntentId });

    await pool.query(
      `INSERT INTO refunds (booking_id, stripe_refund_id, amount, status)
       VALUES ($1, $2, $3, $4)`,
      [bookingId, refund.id, booking.rows[0].total_price, refund.status]
    );

    return refund;
  }

  // Authoritative confirm/decline path, called from the webhook route once
  // Stripe itself reports the outcome server-to-server.
  async handlePaymentIntentSucceeded(paymentIntentId: string, bookingId: number, userId: number) {
    await bookingService.confirmBooking(bookingId, userId, paymentIntentId);
  }

  async handlePaymentIntentFailed(bookingId: number, userId: number) {
    await bookingService.declineBooking(bookingId, userId);
  }
}
