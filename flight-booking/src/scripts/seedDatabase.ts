import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

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

      // Insert dummy flights
      const flights = [
        ['Emirates', 'DXB', 'JFK', '2026-10-15', '08:00', '14:00', 1200.00, 300, 300],
        ['Qatar Airways', 'DXB', 'JFK', '2026-10-15', '10:30', '16:45', 1150.00, 250, 200],
        ['Etihad Airways', 'DXB', 'LHR', '2026-10-16', '02:00', '06:30', 800.00, 200, 150],
        ['British Airways', 'LHR', 'DXB', '2026-10-20', '14:00', '23:55', 850.00, 200, 50],
        ['Delta Airlines', 'JFK', 'LAX', '2026-11-01', '09:00', '12:00', 300.00, 150, 150],
        ['FlyDubai', 'DXB', 'MLE', '2026-12-01', '10:00', '15:00', 600.00, 180, 10],
      ];

      flights.forEach(f => {
        db.run(
          `INSERT INTO flights (airline, origin, destination, departure_date, departure_time, arrival_time, price, total_seats, seats_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          f
        );
      });

      setTimeout(() => {
        console.log('Database seeded successfully!');
        console.log('You can login with: test@example.com / password123');
        console.log('Try searching flights from DXB to JFK on 2026-10-15');
        db.close();
      }, 1000);
    });
  });
});
