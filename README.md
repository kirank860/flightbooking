# AeroGlide

A full-stack flight booking platform: search and compare fares, book with a real passenger + payment flow, manage trips, and administer flights/bookings — built end to end with a concurrency-safe booking engine and real Stripe test-mode payments.

## Tech stack

**Frontend** — Next.js 16 (App Router) + React 19, Tailwind CSS v4, Framer Motion, Zustand, Axios, Stripe Elements
**Backend** — Express + TypeScript, SQLite, JWT auth, Stripe

| Screen | Route |
|---|---|
| Search / home | `/` |
| Results | `/results` |
| Flight detail | `/flights/[id]` |
| Checkout (passengers + payment) | `/checkout` |
| Confirmation | `/confirmation` |
| Login / Register | `/login`, `/register` |
| My trips | `/bookings` |
| Admin (dashboard / fares / bookings, tabbed) | `/admin` |

## Setup

### Prerequisites
- Node.js 20+
- A free Stripe account in test mode — only needed to actually complete a payment; everything else runs without it

### 1. Backend

```bash
cd flight-booking
npm install
cp .env.example .env
npm run seed   # creates the SQLite DB and seeds flights + two accounts
npm run dev    # http://localhost:5001
```

Seeded accounts: `test@example.com` / `password123` (user), `admin@example.com` / `admin123` (admin).

### 2. Frontend

```bash
cd flight-booking-frontend
npm install
cp .env.local.example .env.local
npm run dev    # http://localhost:3000
```

### 3. Stripe (only needed to complete a payment)

The app runs fully without this — you just won't be able to get past the payment step. To enable it:

1. Get your test-mode keys from the Stripe dashboard (Developers → API keys) and put them in `flight-booking/.env` (`STRIPE_SECRET_KEY`) and `flight-booking-frontend/.env.local` (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
2. Install the Stripe CLI and log in: `brew install stripe/stripe-cli/stripe && stripe login` (or grab a binary from the [releases page](https://github.com/stripe/stripe-cli/releases) if you're not on Homebrew).
3. Forward webhooks to your local backend, and keep this running while you test payments:
   ```bash
   stripe listen --forward-to localhost:5001/payments/webhook
   ```
4. Copy the `whsec_...` it prints into `flight-booking/.env` as `STRIPE_WEBHOOK_SECRET`, then restart the backend.
5. Test with Stripe's official test cards: `4242 4242 4242 4242` (any future expiry/CVC) succeeds, `4000 0000 0000 0002` declines. These never touch real money, in test mode or otherwise.

## Environment variables

**`flight-booking/.env`**

| Variable | Purpose |
|---|---|
| `PORT` | Backend port (default 5001) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Signing secrets for access/refresh tokens — keep these different from each other |
| `ACCESS_TOKEN_EXPIRY` / `REFRESH_TOKEN_EXPIRY` | Token lifetimes (`15m`, `7d` by default) |
| `STRIPE_SECRET_KEY` | Server-side Stripe key, test mode |
| `STRIPE_WEBHOOK_SECRET` | Printed by `stripe listen`; verifies webhook payloads actually came from Stripe |
| `FRONTEND_URL` | Currently unused by any request path, kept for future CORS/redirect config |

**`flight-booking-frontend/.env.local`**

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe key, test mode |

## Architecture decisions

### SQLite instead of PostgreSQL

The backend runs on SQLite through a small hand-rolled shim (`src/config/database.ts`) that exposes the same `pool.query(text, params)` shape as the `pg` driver, using Postgres-style `$1, $2, ...` placeholders. This means the service layer reads like standard parameterized Postgres SQL (`SELECT ... WHERE id = $1`) without actually needing a Postgres server running for local development.

The one real gotcha this introduces: the shim does a **blind positional replacement** of `$N` → `?` — it does not support reusing the same placeholder number twice in one query the way Postgres does. Every `$N` occurrence needs its own entry in the params array, in order (`$1` used twice needs two matching values, not one reused). This surfaced as two real bugs during development — a query silently matching zero rows because a repeated `$1` bound against `undefined` — so it's called out here specifically for whoever touches this layer next.

### The flight abstraction layer

`FlightService` (`src/services/flightService.ts`) is the sole gateway to the `flights` table: search with pagination, popular destinations, lookup by ID, seat increment/decrement, and admin CRUD all live there. `BookingService` and the route handlers never touch the `flights` table directly — they call through `FlightService`, so how flight data is queried or stored can change without touching booking logic, and the concurrency-critical seat decrement (below) has exactly one implementation used everywhere.

### Concurrency strategy

Booking a seat is a single atomic conditional `UPDATE`:

```sql
UPDATE flights
SET seats_available = seats_available - $1
WHERE id = $2 AND seats_available >= $3
RETURNING seats_available, price
```

The availability check and the decrement happen in the same statement, so two concurrent requests racing for the last seat can't both read "1 seat available" and both proceed — only one `UPDATE` can actually match the `WHERE` clause and affect a row; the other affects zero rows and gets a clean "not enough seats" error. This was verified under real concurrent load: 10 simultaneous booking requests against a flight with exactly 1 seat left produced exactly 1 success; against 3 seats, exactly 3.

An earlier version wrapped a `SELECT`-then-`UPDATE` in a hand-rolled `BEGIN`/`COMMIT` block using `pool.connect()`. That doesn't work on this shim — `pool.connect()` returns the same shared SQLite connection every time rather than an isolated one, so concurrent "transactions" collided and threw raw SQLite errors instead of just rejecting the losing request. The single atomic statement above replaced it and is simpler besides.

### Payment flow

Real Stripe test-mode `PaymentIntent`s, confirmed client-side via Stripe Elements (`CardElement`). A booking's status moves through `pending` → `confirmed`/`payment_failed` from two places that are both allowed to write it:

1. The frontend calls `/payments/confirm` (or `/payments/decline`) right after `stripe.confirmCardPayment()` resolves, so the UI doesn't have to wait on webhook latency.
2. `POST /payments/webhook` handles `payment_intent.succeeded` / `payment_intent.payment_failed` as the authoritative, server-to-server source of truth.

Both paths call the same guarded status transition (`... WHERE status = 'pending'`), so whichever one arrives first wins and the second is a no-op rather than an error. This matters in practice — testing against a real Stripe sandbox showed the webhook consistently arrives *before* the frontend's own follow-up call, so the client-side path had to treat "already confirmed" as success rather than surface it as a failure.

Cancelling a confirmed booking issues a real Stripe refund via the Refunds API.

### Auth strategy

JWT access tokens (short-lived, 15m default) plus refresh tokens that are **rotated and single-use**: each `/auth/refresh` call issues a new refresh token and invalidates the one just used, tracked as `current_refresh_token` on the user row. Presenting an already-rotated token is rejected and wipes the stored token, forcing re-authentication — this catches both replay attempts and simple double-submission bugs.

Rotation being single-use means concurrent refresh calls with the same token race each other, and the loser's failure shouldn't be allowed to log the user out from under the winner. `refreshAccessToken()` in the frontend store dedupes concurrent callers onto a single in-flight request for exactly this reason — this isn't theoretical, it's what was actually happening (React Strict Mode's double effect-invocation in dev fired two refresh calls back to back and the second one's failure was wiping out the first one's successful login) until it was fixed.

Role-based access control is two small pieces of middleware (`authMiddleware`, `adminMiddleware`) — 401 for missing/invalid tokens, 403 for a valid non-admin token on an admin route.

### Cancellation policy

Users can cancel a confirmed booking up to 24 hours before departure; inside that window the API rejects it with an explicit message. Admins bypass the window entirely (force-cancel) and it triggers the same real Stripe refund.

## Implementation trade-offs

- **SQLite over Postgres/Docker Compose** — avoids requiring a running Postgres instance to develop or review this project. The trade-off is the `$N`-reuse limitation above, and this isn't a drop-in swap back to real Postgres without re-testing the query layer.
- **No ORM** — direct parameterized SQL through a thin per-entity service layer rather than Prisma. More manual query-writing, but full visibility into exactly what SQL runs, which mattered for getting the concurrency-safety guarantee right.
- **Webhook *and* client-confirm, not webhook-only** — more surface area (two paths that have to agree) in exchange for a payment UI that doesn't sit waiting on webhook delivery.
- **Generated mock data over a large realistic dataset** — 180 flights across 18 routes and 6 dates, enough to meaningfully exercise search, pagination, and filtering without a full data-generation pipeline.

## Testing performed

- **Concurrency** — 10 simultaneous booking requests against 1-seat and 3-seat flights; results matched exactly (1 and 3 successes respectively), no oversell, no spurious failures for legitimate winners.
- **Role guards** — verified live: no token → 401, invalid token → 401, non-admin token on an admin route → 403, admin token → 200.
- **Token expiry** — shortened the access token lifetime to 2 seconds, confirmed an expired token is rejected with 401, and that the still-valid refresh token successfully issues a new access token that then works.
- **Payment failure** — Stripe's official test decline card correctly leaves a booking as `payment_failed` and releases the held seat back to inventory.
- **Cancellation window** — a booking on a flight departing in ~12 hours was correctly blocked from user cancellation and correctly force-cancellable (with a real refund) by an admin.
