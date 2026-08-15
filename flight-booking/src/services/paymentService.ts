import pool from '../config/database';

export class PaymentService {
  async createPaymentIntent(bookingId: number, amount: number, email: string) {
    // Mock Stripe payment intent creation
    const paymentIntent = {
      id: `pi_mock_${Math.random().toString(36).substr(2, 9)}`,
      client_secret: `pi_mock_${Math.random().toString(36).substr(2, 9)}_secret`,
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: { bookingId },
      receipt_email: email,
      status: 'succeeded', // Auto-succeed for local testing
    };

    // Auto-confirm the booking in the background for local testing
    setTimeout(async () => {
      try {
        await pool.query(
          `UPDATE bookings 
           SET status = 'confirmed', stripe_payment_intent_id = $1
           WHERE id = $2`,
          [paymentIntent.id, bookingId]
        );
      } catch (err) {
        console.error('Failed to auto-confirm mock booking:', err);
      }
    }, 1000);

    return paymentIntent;
  }

  async handleWebhook(event: any) {
    // Not needed for local mock since we auto-confirm
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
