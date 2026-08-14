import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import flightRoutes from './routes/flights';
import bookingRoutes from './routes/bookings';
import paymentRoutes from './routes/payment';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
// We need raw body for Stripe webhook, so let's handle that conditionally
app.use((req, res, next) => {
  if (req.originalUrl === '/payments/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(cors());

// Routes
app.use('/auth', authRoutes);
app.use('/flights', flightRoutes);
app.use('/bookings', bookingRoutes);
app.use('/payments', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
