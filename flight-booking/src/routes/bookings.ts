import { Router, Response } from 'express';
import { BookingService } from '../services/bookingService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const bookingService = new BookingService();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { flightId, passengers } = req.body;
    const booking = await bookingService.createBooking(
      req.user!.userId,
      flightId,
      passengers.length,
      passengers
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
    // In a real app we'd ensure users only cancel their own bookings
    const result = await bookingService.cancelBooking(parseInt(req.params.id));
    res.json({ message: 'Booking cancelled', booking: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
