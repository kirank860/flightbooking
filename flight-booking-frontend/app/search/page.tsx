'use client';

import { useState } from 'react';
import apiClient from '../lib/apiClient';

interface Flight {
  id: number;
  airline: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  price: number;
  seats_available: number;
}

export default function SearchPage() {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    date: '',
    passengerCount: 1,
  });

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await apiClient.get('/flights/search', {
        params: formData,
      });
      setFlights(data.flights);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Search Flights</h1>

      <form onSubmit={handleSearch} className="bg-white p-6 rounded shadow-md mb-8">
        <div className="grid grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Origin (e.g., DXB)"
            value={formData.origin}
            onChange={(e) =>
              setFormData({ ...formData, origin: e.target.value.toUpperCase() })
            }
            className="border px-4 py-2 rounded"
            required
          />

          <input
            type="text"
            placeholder="Destination"
            value={formData.destination}
            onChange={(e) =>
              setFormData({ ...formData, destination: e.target.value.toUpperCase() })
            }
            className="border px-4 py-2 rounded"
            required
          />

          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="border px-4 py-2 rounded"
            required
          />

          <select
            value={formData.passengerCount}
            onChange={(e) =>
              setFormData({ ...formData, passengerCount: parseInt(e.target.value) })
            }
            className="border px-4 py-2 rounded"
          >
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <option key={num} value={num}>
                {num} Passenger{num > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded mt-4 hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search Flights'}
        </button>
      </form>

      <div className="space-y-4">
        {flights.map((flight) => (
          <div key={flight.id} className="border p-4 rounded hover:shadow-lg">
            <div className="flex justify-between">
              <div>
                <h3 className="font-bold text-lg">{flight.airline}</h3>
                <p className="text-gray-600">
                  {flight.origin} → {flight.destination}
                </p>
                <p className="text-sm text-gray-500">{flight.departure_time}</p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">AED {flight.price}</p>
                <p className="text-sm text-gray-600">
                  {flight.seats_available} seats left
                </p>
                <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
