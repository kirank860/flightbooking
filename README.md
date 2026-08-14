# Flight Booking Module - Full Stack Application

A complete flight booking system built with Node.js + Express + PostgreSQL + React, featuring secure payment processing via Stripe, JWT authentication with token refresh, and role-based access control.

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v13+)

### Step 1: Clone and Install Backend

```bash
cd flight-booking
npm install
```

### Step 2: Environment Setup
Copy the `.env.example` to `.env` and configure your variables.

### Step 3: Database Setup
```bash
createdb flight_booking
psql flight_booking < src/config/database.sql
```

### Step 4: Start Backend
```bash
npm run dev
# Server runs on http://localhost:5000
```

### Step 5: Setup Frontend
```bash
cd flight-booking-frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```
