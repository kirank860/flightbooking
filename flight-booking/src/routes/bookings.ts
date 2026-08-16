import { Router, Response } from 'express';
import { BookingService } from '../services/bookingService';
import { PaymentService } from '../services/paymentService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const bookingService = new BookingService();
const paymentService = new PaymentService();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { flightId, passengers, returnFlightId } = req.body;
    const booking = await bookingService.createBooking(
      req.user!.userId,
      flightId,
      passengers.length,
      passengers,
      returnFlightId
    );
    res.status(201).json(booking);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/my-bookings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = req.query;
    const result = await bookingService.getUserBookings(
      req.user!.userId,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 10
    );
    res.json({ bookings: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const bookingId = parseInt(req.params.id as string);
    const isAdmin = req.user!.role === 'admin';
    const booking = await bookingService.cancelBooking(bookingId, req.user!.userId, isAdmin);
    const refund = await paymentService.refundPayment(bookingId);
    res.json({ message: 'Booking cancelled', booking, refund });
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
  }
});

export default router;
