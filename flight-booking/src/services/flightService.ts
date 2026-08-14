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
      `SELECT COUNT(*) FROM flights
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
}
