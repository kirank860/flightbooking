import { Router, Response } from 'express';
import { FlightService } from '../services/flightService';
import { BookingService } from '../services/bookingService';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const flightService = new FlightService();
const bookingService = new BookingService();

router.use(authMiddleware, adminMiddleware);

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await bookingService.getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/flights', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = req.query;
    const result = await flightService.listAllFlights(
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/flights', async (req: AuthRequest, res: Response) => {
  try {
    const flight = await flightService.createFlight(req.body);
    res.status(201).json(flight);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/flights/:id', async (req: AuthRequest, res: Response) => {
  try {
    const flight = await flightService.updateFlight(parseInt(req.params.id as string), req.body);
    res.json(flight);
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
  }
});

router.delete('/flights/:id', async (req: AuthRequest, res: Response) => {
  try {
    await flightService.deleteFlight(parseInt(req.params.id as string));
    res.json({ message: 'Flight deleted' });
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
  }
});

router.get('/bookings', async (req: AuthRequest, res: Response) => {
  try {
    const { status, date, route, page, limit } = req.query;
    const result = await bookingService.getAllBookings({
      status: status as string | undefined,
      date: date as string | undefined,
      route: route as string | undefined,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 10,
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
