import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

interface RouteDef {
  origin: string;
  destination: string;
  airlines: string[];
  basePrice: number;
  durationMins: number;
}

// Realistic long-haul/regional network anchored on a few major hubs.
// Return legs are listed separately since price/duration/airline mix isn't symmetric in practice.
const ROUTES: RouteDef[] = [
  { origin: 'DXB', destination: 'JFK', airlines: ['Emirates', 'Qatar Airways'], basePrice: 1150, durationMins: 840 },
  { origin: 'JFK', destination: 'DXB', airlines: ['Emirates', 'Etihad Airways'], basePrice: 1180, durationMins: 780 },
  { origin: 'DXB', destination: 'LHR', airlines: ['Etihad Airways', 'British Airways'], basePrice: 780, durationMins: 435 },
  { origin: 'LHR', destination: 'DXB', airlines: ['British Airways', 'Emirates'], basePrice: 820, durationMins: 405 },
  { origin: 'DXB', destination: 'MLE', airlines: ['FlyDubai', 'Emirates'], basePrice: 560, durationMins: 270 },
  { origin: 'MLE', destination: 'DXB', airlines: ['FlyDubai'], basePrice: 590, durationMins: 255 },
  { origin: 'DXB', destination: 'SIN', airlines: ['Singapore Airlines', 'Emirates'], basePrice: 690, durationMins: 465 },
  { origin: 'SIN', destination: 'DXB', airlines: ['Singapore Airlines'], basePrice: 710, durationMins: 450 },
  { origin: 'DXB', destination: 'BOM', airlines: ['Emirates', 'Air India'], basePrice: 320, durationMins: 195 },
  { origin: 'BOM', destination: 'DXB', airlines: ['Emirates'], basePrice: 340, durationMins: 180 },
  { origin: 'DXB', destination: 'CDG', airlines: ['Air France', 'Emirates'], basePrice: 720, durationMins: 420 },
  { origin: 'CDG', destination: 'DXB', airlines: ['Air France'], basePrice: 750, durationMins: 390 },
  { origin: 'LHR', destination: 'JFK', airlines: ['British Airways', 'Delta Airlines'], basePrice: 640, durationMins: 495 },
  { origin: 'JFK', destination: 'LHR', airlines: ['British Airways', 'Delta Airlines'], basePrice: 660, durationMins: 420 },
  { origin: 'LHR', destination: 'LAX', airlines: ['British Airways'], basePrice: 890, durationMins: 660 },
  { origin: 'LAX', destination: 'LHR', airlines: ['British Airways'], basePrice: 910, durationMins: 615 },
  { origin: 'JFK', destination: 'LAX', airlines: ['Delta Airlines', 'American Airlines'], basePrice: 280, durationMins: 360 },
  { origin: 'LAX', destination: 'JFK', airlines: ['Delta Airlines', 'American Airlines'], basePrice: 300, durationMins: 315 },
];

// Departure dates each route is offered on, relative to a fixed near-future anchor.
const DAY_OFFSETS = [3, 10, 17, 24, 38, 52];
const ANCHOR = new Date('2026-09-01T00:00:00Z');

function isoDate(offsetDays: number): string {
  const d = new Date(ANCHOR);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function hhmm(totalMins: number): string {
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Deterministic pseudo-random in [0,1) seeded by a string, so re-running the seed produces the same data.
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

interface FlightRow {
  airline: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  total_seats: number;
  seats_available: number;
}

function buildFlights(): FlightRow[] {
  const flights: FlightRow[] = [];

  for (const route of ROUTES) {
    DAY_OFFSETS.forEach((offset, dateIdx) => {
      route.airlines.forEach((airline, airlineIdx) => {
        const seed = `${route.origin}${route.destination}${airline}${offset}`;
        const rand = seededRandom(seed);

        const departureMins = 240 + ((dateIdx * 3 + airlineIdx * 5) % 18) * 55; // spread across the day, 04:00-21:00
        const arrivalMins = departureMins + route.durationMins;

        const priceJitter = Math.round((rand - 0.5) * 120); // +/- ~60 around base price
        const price = Math.max(59, route.basePrice + priceJitter);

        const totalSeats = [150, 180, 220, 250, 300][Math.floor(rand * 5)] ?? 200;

        // Most flights are comfortably open; a few are nearly sold out or fully booked
        // so the search/results UI has realistic edge cases to render.
        let seatsAvailable: number;
        if (rand < 0.08) {
          seatsAvailable = 0;
        } else if (rand < 0.18) {
          seatsAvailable = Math.floor(rand * 5) + 1; // 1-5 seats left
        } else {
          seatsAvailable = Math.round(totalSeats * (0.35 + rand * 0.6));
        }

        flights.push({
          airline,
          origin: route.origin,
          destination: route.destination,
          departure_date: isoDate(offset),
          departure_time: hhmm(departureMins),
          arrival_time: hhmm(arrivalMins),
          price,
          total_seats: totalSeats,
          seats_available: Math.min(seatsAvailable, totalSeats),
        });
      });
    });
  }

  return flights;
}

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, async (err) => {
  if (err) {
    console.error('Database error:', err);
    process.exit(1);
  }

  console.log('Seeding SQLite database...');

  db.serialize(() => {
    // Drop existing tables
    db.run('DROP TABLE IF EXISTS refunds');
    db.run('DROP TABLE IF EXISTS passengers');
    db.run('DROP TABLE IF EXISTS bookings');
    db.run('DROP TABLE IF EXISTS flights');
    db.run('DROP TABLE IF EXISTS users');

    // Create Users Table
    db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Flights Table
    db.run(`
      CREATE TABLE flights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        airline TEXT NOT NULL,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        departure_date TEXT NOT NULL,
        departure_time TEXT NOT NULL,
        arrival_time TEXT NOT NULL,
        price REAL NOT NULL,
        total_seats INTEGER NOT NULL,
        seats_available INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Bookings Table
    db.run(`
      CREATE TABLE bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        flight_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        total_price REAL NOT NULL,
        stripe_payment_intent_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (flight_id) REFERENCES flights (id)
      )
    `);

    // Create Passengers Table
    db.run(`
      CREATE TABLE passengers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        date_of_birth TEXT NOT NULL,
        nationality TEXT NOT NULL,
        passport_number TEXT NOT NULL,
        email TEXT,
        contact_number TEXT,
        FOREIGN KEY (booking_id) REFERENCES bookings (id)
      )
    `);

    // Create Refunds Table
    db.run(`
      CREATE TABLE refunds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        stripe_refund_id TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings (id)
      )
    `, async () => {
      // Now insert data
      const hashedPass = await bcrypt.hash('password123', 10);
      db.run(
        `INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)`,
        ['test@example.com', hashedPass, 'user']
      );
      const hashedAdminPass = await bcrypt.hash('admin123', 10);
      db.run(
        `INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)`,
        ['admin@example.com', hashedAdminPass, 'admin']
      );

      const flights = buildFlights();

      flights.forEach((f) => {
        db.run(
          `INSERT INTO flights (airline, origin, destination, departure_date, departure_time, arrival_time, price, total_seats, seats_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [f.airline, f.origin, f.destination, f.departure_date, f.departure_time, f.arrival_time, f.price, f.total_seats, f.seats_available]
        );
      });

      setTimeout(() => {
        console.log(`Database seeded successfully with ${flights.length} flights across ${ROUTES.length} routes!`);
        console.log('You can login with: test@example.com / password123');
        console.log(`Try searching flights from DXB to JFK on ${isoDate(DAY_OFFSETS[0]!)}`);
        db.close();
      }, 1000);
    });
  });
});
