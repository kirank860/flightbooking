import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import flightRoutes from './routes/flights';
import bookingRoutes from './routes/bookings';
import paymentRoutes from './routes/payment';
import adminRoutes from './routes/admin';
import { stripeWebhookHandler } from './webhooks/stripeWebhook';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Falls back to wide-open when FRONTEND_URL isn't set (local dev without a
// .env entry for it) rather than failing closed.
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

// Stripe signature verification needs the raw request body, so this must be
// registered before the global express.json() parser below.
app.post('/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

// Middleware
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/flights', flightRoutes);
app.use('/bookings', bookingRoutes);
app.use('/payments', paymentRoutes);
app.use('/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
