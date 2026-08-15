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

  async cancelBooking(bookingId: number, userId: number, isAdmin: boolean = false) {
    const lookup = await pool.query(
      `SELECT b.*, f.departure_date, f.departure_time
       FROM bookings b
       JOIN flights f ON b.flight_id = f.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (lookup.rows.length === 0) {
      throw new Error('Booking not found');
    }

    const booking = lookup.rows[0];

    if (!isAdmin && booking.user_id !== userId) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'confirmed') {
      throw new Error('Booking not found or already cancelled');
    }

    if (!isAdmin) {
      const departureAt = new Date(`${booking.departure_date}T${booking.departure_time}:00`);
      const cutoff = new Date(departureAt.getTime() - 24 * 60 * 60 * 1000);
      if (new Date() > cutoff) {
        throw new Error('This booking departs in under 24 hours, which is past the free-cancellation window');
      }
    }

    const result = await pool.query(
      `UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [bookingId]
    );

    const updated = result.rows[0];
    await this.releaseSeats(updated.id, updated.flight_id);
    return updated;
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
      `SELECT b.*, f.airline, f.origin, f.destination, f.departure_date, f.departure_time,
              (SELECT COUNT(*) FROM passengers p WHERE p.booking_id = b.id) as passenger_count
       FROM bookings b
       JOIN flights f ON b.flight_id = f.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  async getAllBookings(filters: {
    status?: string | undefined;
    date?: string | undefined;
    route?: string | undefined;
    page?: number;
    limit?: number;
  }) {
    const { status, date, route, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];

    if (status) {
      values.push(status);
      conditions.push(`b.status = $${values.length}`);
    }
    if (date) {
      values.push(date);
      conditions.push(`f.departure_date = $${values.length}`);
    }
    if (route) {
      values.push(`%${route.replace(/[^a-zA-Z]/g, '').toUpperCase()}%`);
      conditions.push(`UPPER(f.origin || f.destination) LIKE $${values.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rowsResult = await pool.query(
      `SELECT b.*, f.airline, f.origin, f.destination, f.departure_date,
              u.email as user_email,
              (SELECT COUNT(*) FROM passengers p WHERE p.booking_id = b.id) as passenger_count
       FROM bookings b
       JOIN flights f ON b.flight_id = f.id
       JOIN users u ON b.user_id = u.id
       ${where}
       ORDER BY b.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM bookings b
       JOIN flights f ON b.flight_id = f.id
       ${where}`,
      values
    );

    return {
      bookings: rowsResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  }

  async getDashboardStats() {
    const [bookingsToday, revenueToday, statusCounts, seatsSold] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM bookings WHERE date(created_at) = date('now')`, []),
      pool.query(
        `SELECT COALESCE(SUM(total_price), 0) as revenue FROM bookings WHERE status = 'confirmed' AND date(created_at) = date('now')`,
        []
      ),
      pool.query(`SELECT status, COUNT(*) as count FROM bookings GROUP BY status`, []),
      pool.query(`SELECT COALESCE(SUM(total_seats - seats_available), 0) as sold FROM flights`, []),
    ]);

    const counts: Record<string, number> = {};
    for (const row of statusCounts.rows) {
      counts[row.status] = parseInt(row.count);
    }
    const totalBookings = Object.values(counts).reduce((sum, n) => sum + n, 0);
    const cancellationRate = totalBookings > 0 ? ((counts.cancelled || 0) / totalBookings) * 100 : 0;

    return {
      bookingsToday: parseInt(bookingsToday.rows[0].count),
      revenueToday: revenueToday.rows[0].revenue,
      cancellationRate: Math.round(cancellationRate * 10) / 10,
      seatsSold: parseInt(seatsSold.rows[0].sold),
    };
  }
}
