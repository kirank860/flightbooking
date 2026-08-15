import pool from '../config/database';
import { FlightService } from './flightService';

const flightService = new FlightService();

export class BookingService {
  async createBooking(
    userId: number,
    flightId: number,
    passengerCount: number,
    passengers: any[]
  ) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const flight = await client.query(
        'SELECT * FROM flights WHERE id = $1',
        [flightId]
      );

      if (flight.rows.length === 0) {
        throw new Error('Flight not found');
      }

      if (flight.rows[0].seats_available < passengerCount) {
        throw new Error('Not enough seats available');
      }

      await client.query(
        `UPDATE flights SET seats_available = seats_available - $1 WHERE id = $2`,
        [passengerCount, flightId]
      );

      const bookingResult = await client.query(
        `INSERT INTO bookings (user_id, flight_id, status, total_price) 
         VALUES ($1, $2, 'pending', $3)
         RETURNING *`,
        [
          userId,
          flightId,
          flight.rows[0].price * passengerCount,
        ]
      );

      const booking = bookingResult.rows[0];

      for (const passenger of passengers) {
        await client.query(
          `INSERT INTO passengers 
           (booking_id, full_name, date_of_birth, nationality, passport_number, email, contact_number)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            booking.id,
            passenger.full_name,
            passenger.date_of_birth,
            passenger.nationality,
            passenger.passport_number,
            passenger.email,
            passenger.contact_number,
          ]
        );
      }

      await client.query('COMMIT');
      return booking;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async confirmBooking(bookingId: number, userId: number, stripePaymentIntentId: string) {
    const result = await pool.query(
      `UPDATE bookings
       SET status = 'confirmed', stripe_payment_intent_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3 AND status = 'pending'
       RETURNING *`,
      [stripePaymentIntentId, bookingId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Booking not found or already processed');
    }

    return result.rows[0];
  }

  async declineBooking(bookingId: number, userId: number) {
    const result = await pool.query(
      `UPDATE bookings
       SET status = 'payment_failed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING *`,
      [bookingId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Booking not found or already processed');
    }

    const booking = result.rows[0];
    await this.releaseSeats(booking.id, booking.flight_id);
    return booking;
  }

  async cancelBooking(bookingId: number, userId: number) {
    const result = await pool.query(
      `UPDATE bookings
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND status = 'confirmed'
       RETURNING *`,
      [bookingId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Booking not found or already cancelled');
    }

    const booking = result.rows[0];
    await this.releaseSeats(booking.id, booking.flight_id);
    return booking;
  }

  private async releaseSeats(bookingId: number, flightId: number) {
    const passengers = await pool.query(
      'SELECT COUNT(*) as count FROM passengers WHERE booking_id = $1',
      [bookingId]
    );

    await flightService.incrementSeats(
      flightId,
      parseInt(passengers.rows[0].count)
    );
  }

  async getUserBookings(userId: number, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT b.*, f.airline, f.origin, f.destination, f.departure_date
       FROM bookings b
       JOIN flights f ON b.flight_id = f.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }
}
