import pool from '../config/database';
import { BookingService } from './bookingService';

const bookingService = new BookingService();

export class PaymentService {
  async createPaymentIntent(bookingId: number, amount: number, email: string) {
    // Mock Stripe payment intent creation - no side effects, purely visual on the payment step
    return {
      id: `pi_mock_${Math.random().toString(36).substr(2, 9)}`,
      client_secret: `pi_mock_${Math.random().toString(36).substr(2, 9)}_secret`,
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: { bookingId },
      receipt_email: email,
      status: 'requires_confirmation',
    };
  }

  async confirmPayment(bookingId: number, userId: number) {
    const mockPaymentIntentId = `pi_mock_${Math.random().toString(36).substr(2, 9)}`;
    return bookingService.confirmBooking(bookingId, userId, mockPaymentIntentId);
  }

  async declinePayment(bookingId: number, userId: number) {
    return bookingService.declineBooking(bookingId, userId);
  }

  async refundPayment(bookingId: number) {
    const booking = await pool.query(
      'SELECT stripe_payment_intent_id, total_price FROM bookings WHERE id = $1',
      [bookingId]
    );

    if (booking.rows.length === 0) {
      throw new Error('Booking not found');
    }

    const mockRefundId = `re_mock_${Math.random().toString(36).substr(2, 9)}`;

    await pool.query(
      `INSERT INTO refunds (booking_id, stripe_refund_id, amount, status)
       VALUES ($1, $2, $3, 'completed')`,
      [bookingId, mockRefundId, booking.rows[0].total_price]
    );

    return { id: mockRefundId, status: 'succeeded' };
  }
}
