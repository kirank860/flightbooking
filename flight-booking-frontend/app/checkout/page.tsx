'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
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

interface Passenger {
  full_name: string;
  date_of_birth: string;
  nationality: string;
  passport_number: string;
  email: string;
  contact_number: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flightId = searchParams.get('flightId');
  const passengerCount = parseInt(searchParams.get('passengerCount') || '1');

  const [flight, setFlight] = useState<Flight | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passengers, setPassengers] = useState<Passenger[]>(
    Array(passengerCount).fill(null).map(() => ({
      full_name: '',
      date_of_birth: '',
      nationality: '',
      passport_number: '',
      email: '',
      contact_number: '',
    }))
  );

  useEffect(() => {
    if (!flightId) return;
    const fetchFlight = async () => {
      try {
        const { data } = await apiClient.get(`/flights/${flightId}`);
        setFlight(data);
      } catch (err) {
        setError('Failed to load flight details');
      }
    };
    fetchFlight();
  }, [flightId]);

  const updatePassenger = (index: number, field: keyof Passenger, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const handleNext = () => {
    if (step === 1) {
      const allFilled = passengers.every(p => p.full_name && p.date_of_birth && p.nationality && p.passport_number);
      if (!allFilled) {
        setError('Please fill in all passenger details');
        return;
      }
      setError('');
      setStep(2);
    }
  };

  const handleBooking = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.post('/bookings', {
        flightId: parseInt(flightId!),
        passengers,
      });
      router.push(`/confirmation?bookingId=${data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (!flight) return <div className="min-h-screen bg-black flex items-center justify-center"><p className="text-white">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a101f] to-black text-slate-100 font-sans pt-24 pb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 sm:px-6"
      >
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <div className="flex-1">
              <motion.div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${step >= 1 ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}
                animate={{ scale: step === 1 ? 1.1 : 1 }}
              >
                1
              </motion.div>
              <p className="text-sm text-slate-400 mt-2">Passengers</p>
            </div>
            <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${step >= 2 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-800'}`}></div>
            <div className="flex-1">
              <motion.div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${step >= 2 ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}
                animate={{ scale: step === 2 ? 1.1 : 1 }}
              >
                2
              </motion.div>
              <p className="text-sm text-slate-400 mt-2">Review & Pay</p>
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Step 1: Passenger Details */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-white mb-8">Passenger Details</h2>
            {passengers.map((passenger, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
                  <h3 className="text-lg font-semibold text-blue-400 mb-6">Passenger {index + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase mb-2 block">Full Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={passenger.full_name}
                        onChange={(e) => updatePassenger(index, 'full_name', e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase mb-2 block">Date of Birth</label>
                      <input
                        type="date"
                        value={passenger.date_of_birth}
                        onChange={(e) => updatePassenger(index, 'date_of_birth', e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase mb-2 block">Nationality</label>
                      <input
                        type="text"
                        placeholder="United States"
                        value={passenger.nationality}
                        onChange={(e) => updatePassenger(index, 'nationality', e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase mb-2 block">Passport Number</label>
                      <input
                        type="text"
                        placeholder="ABC123456"
                        value={passenger.passport_number}
                        onChange={(e) => updatePassenger(index, 'passport_number', e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase mb-2 block">Email</label>
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={passenger.email}
                        onChange={(e) => updatePassenger(index, 'email', e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase mb-2 block">Contact Number</label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={passenger.contact_number}
                        onChange={(e) => updatePassenger(index, 'contact_number', e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 rounded-lg border border-slate-700 text-white hover:bg-slate-800 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all"
              >
                Continue to Review
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Review & Payment */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-white mb-8">Review Booking</h2>

            {/* Flight Summary */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-white mb-4">Flight Details</h3>
                <div className="space-y-3 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Airline:</span>
                    <span className="text-white font-medium">{flight.airline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Route:</span>
                    <span className="text-white font-medium">{flight.origin} → {flight.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Departure:</span>
                    <span className="text-white font-medium">{flight.departure_date} at {flight.departure_time}</span>
                  </div>
                  <div className="h-px bg-slate-700 my-4"></div>
                  <div className="flex justify-between text-lg">
                    <span className="text-slate-400">Subtotal ({passengerCount} passengers):</span>
                    <span className="text-white font-bold">AED {(flight.price * passengerCount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Taxes & Fees:</span>
                    <span className="text-white">AED 0.00</span>
                  </div>
                  <div className="h-px bg-slate-700 my-4"></div>
                  <div className="flex justify-between text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    <span>Total:</span>
                    <span>AED {(flight.price * passengerCount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Summary */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-white mb-4">Passengers</h3>
                <div className="space-y-4">
                  {passengers.map((p, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-slate-700">
                      <div>
                        <p className="text-white font-medium">{p.full_name}</p>
                        <p className="text-sm text-slate-400">{p.passport_number}</p>
                      </div>
                      <button
                        onClick={() => setStep(1)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 rounded-lg border border-slate-700 text-white hover:bg-slate-800 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleBooking}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    Proceed to Payment
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
