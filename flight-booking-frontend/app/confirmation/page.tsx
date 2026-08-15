'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import apiClient from '../lib/apiClient';

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) {
      setError('No booking found');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const { data } = await apiClient.get(`/bookings/my-bookings`);
        const found = data.bookings.find((b: any) => b.id === parseInt(bookingId));
        setBooking(found);
      } catch (err) {
        setError('Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a101f] to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
          <p className="text-slate-400">Confirming your booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a101f] to-black text-white font-sans pt-24 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-4 sm:px-6"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-xl opacity-50"></div>
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl">
              <motion.svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </motion.svg>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-4">Booking Confirmed!</h1>
          <p className="text-xl text-slate-400">Your flight is reserved and ready to go.</p>
        </motion.div>

        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group mb-8"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl blur opacity-25"></div>
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-slate-400 mb-2">Booking Reference</p>
                  <p className="text-2xl font-bold text-blue-400">#{booking.id}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Route</p>
                    <p className="text-white font-semibold">{booking.origin} → {booking.destination}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Date</p>
                    <p className="text-white font-semibold">{booking.departure_date}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Airline</p>
                    <p className="text-white font-semibold">{booking.airline}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Status</p>
                    <div className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <p className="text-white font-semibold capitalize">{booking.status}</p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-700"></div>

                <div>
                  <p className="text-sm text-slate-400 mb-2">Total Amount</p>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                    AED {booking.total_price.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400 mb-8"
          >
            {error}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4"
        >
          <button
            onClick={() => router.push('/')}
            className="flex-1 px-6 py-4 rounded-lg border border-slate-700 text-white hover:bg-slate-800 transition-all font-semibold"
          >
            Book Another Flight
          </button>
          <button
            onClick={() => router.push('/bookings')}
            className="flex-1 px-6 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 transition-all font-semibold"
          >
            View My Bookings
          </button>
        </motion.div>

        {/* Info Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-slate-400 text-sm mt-8"
        >
          A confirmation email has been sent to your email address. Check your inbox for your e-ticket and booking details.
        </motion.p>
      </motion.div>
    </div>
  );
}
