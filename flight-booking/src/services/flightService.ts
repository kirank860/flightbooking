import pool from '../config/database';

export class FlightService {
  async searchFlights(
    origin: string,
    destination: string,
    date: string,
    passengerCount: number,
    page: number = 1,
    limit: number = 10
  ) {
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, airline, origin, destination, departure_date, 
              departure_time, arrival_time, price, seats_available, total_seats
       FROM flights
       WHERE origin = $1 AND destination = $2 
             AND departure_date = $3 AND seats_available >= $4
       ORDER BY departure_time ASC
       LIMIT $5 OFFSET $6`,
      [origin, destination, date, passengerCount, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM flights
       WHERE origin = $1 AND destination = $2 
             AND departure_date = $3 AND seats_available >= $4`,
      [origin, destination, date, passengerCount]
    );

    return {
      flights: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  }

  async getPopularDestinations(limit: number = 6) {
    const result = await pool.query(
      `SELECT f.* FROM flights f
       INNER JOIN (
         SELECT origin, destination, MIN(price) as min_price
         FROM flights
         WHERE seats_available > 0
         GROUP BY origin, destination
       ) cheapest ON f.origin = cheapest.origin
                 AND f.destination = cheapest.destination
                 AND f.price = cheapest.min_price
       GROUP BY f.origin, f.destination
       ORDER BY f.price ASC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  async getFlightById(flightId: number) {
    const result = await pool.query(
      'SELECT * FROM flights WHERE id = $1',
      [flightId]
    );
    return result.rows[0];
  }

  async decrementSeats(flightId: number, count: number) {
    const result = await pool.query(
      `UPDATE flights 
       SET seats_available = seats_available - $1
       WHERE id = $2 AND seats_available >= $1
       RETURNING seats_available`,
      [count, flightId]
    );

    if (result.rows.length === 0) {
      throw new Error('Not enough seats available');
    }

    return result.rows[0];
  }

  async incrementSeats(flightId: number, count: number) {
    const result = await pool.query(
      `UPDATE flights
       SET seats_available = seats_available + $1
       WHERE id = $2
       RETURNING seats_available`,
      [count, flightId]
    );
    return result.rows[0];
  }

  async listAllFlights(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT * FROM flights ORDER BY departure_date ASC, departure_time ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) as count FROM flights', []);

    return {
      flights: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  }

  async createFlight(data: {
    airline: string;
    origin: string;
    destination: string;
    departure_date: string;
    departure_time: string;
    arrival_time: string;
    price: number;
    total_seats: number;
  }) {
    const result = await pool.query(
      `INSERT INTO flights (airline, origin, destination, departure_date, departure_time, arrival_time, price, total_seats, seats_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.airline,
        data.origin,
        data.destination,
        data.departure_date,
        data.departure_time,
        data.arrival_time,
        data.price,
        data.total_seats,
        data.total_seats,
      ]
    );
    return result.rows[0];
  }

  async updateFlight(flightId: number, data: Partial<{
    airline: string;
    origin: string;
    destination: string;
    departure_date: string;
    departure_time: string;
    arrival_time: string;
    price: number;
    total_seats: number;
    seats_available: number;
  }>) {
    const fields = Object.keys(data) as (keyof typeof data)[];
    if (fields.length === 0) {
      return this.getFlightById(flightId);
    }

    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = fields.map((field) => data[field]);

    const result = await pool.query(
      `UPDATE flights SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, flightId]
    );

    if (result.rows.length === 0) {
      throw new Error('Flight not found');
    }

    return result.rows[0];
  }

  async deleteFlight(flightId: number) {
    const activeBookings = await pool.query(
      `SELECT COUNT(*) as count FROM bookings WHERE flight_id = $1 AND status IN ('pending', 'confirmed')`,
      [flightId]
    );

    if (parseInt(activeBookings.rows[0].count) > 0) {
      throw new Error('Cannot delete a flight with active bookings');
    }

    const result = await pool.query('DELETE FROM flights WHERE id = $1 RETURNING id', [flightId]);

    if (result.rows.length === 0) {
      throw new Error('Flight not found');
    }
  }
}
