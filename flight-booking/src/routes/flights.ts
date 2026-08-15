import { Router, Request, Response } from 'express';
import { FlightService } from '../services/flightService';

const router = Router();
const flightService = new FlightService();

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { origin, destination, date, passengerCount, page, limit } = req.query;
    const result = await flightService.searchFlights(
      origin as string,
      destination as string,
      date as string,
      parseInt(passengerCount as string) || 1,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 10
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/popular', async (req: Request, res: Response) => {
  try {
    const destinations = await flightService.getPopularDestinations(6);
    res.json({ destinations });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await flightService.getFlightById(parseInt(req.params.id as string));
    if (!result) return res.status(404).json({ error: 'Flight not found' });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
