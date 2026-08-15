import { Router, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import pool from '../config/database';

const router = Router();
const paymentService = new PaymentService();

router.post('/create-intent', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body;
    const booking = await pool.query(
      'SELECT total_price, status FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, req.user?.userId]
    );

    if (booking.rows.length === 0 || booking.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Invalid booking' });
    }

    const paymentIntent = await paymentService.createPaymentIntent(
      bookingId,
      booking.rows[0].total_price,
      req.user!.email
    );

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/confirm', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body;
    const booking = await paymentService.confirmPayment(bookingId, req.user!.userId);
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/decline', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body;
    const booking = await paymentService.declinePayment(bookingId, req.user!.userId);
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
