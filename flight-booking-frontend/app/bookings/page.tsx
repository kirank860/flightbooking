'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import apiClient from '../lib/apiClient';
import { useAuthStore } from '../store/authStore';

interface Booking {
  id: number;
  airline: string;
  origin: string;
  destination: string;
  departure_date: string;
  status: string;
  total_price: number;
  created_at: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await apiClient.get('/bookings/my-bookings');
        setBookings(data.bookings);
      } catch (err: any) {
        if (err.response?.status === 401) {
          logout();
          router.push('/login');
        } else {
          setError('Failed to load bookings');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [logout, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await apiClient.post(`/bookings/${bookingId}/cancel`);
      setBookings(bookings.filter(b => b.id !== bookingId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel booking');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a101f] to-black text-slate-100 font-sans">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <svg className="w-5 h-5 text-white transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">AeroGlide</h1>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button onClick={() => router.push('/search')} className="hover:text-white cursor-pointer transition-colors duration-200">New Search</button>
            <button onClick={() => router.push('/bookings')} className="text-blue-400">My Bookings</button>
            <button onClick={handleLogout} className="px-5 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300">Log Out</button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 space-y-4"
        >
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            My Bookings
          </h2>
          <p className="text-lg text-slate-400">
            Manage and view all your flight reservations
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400"
          >
            {error}
          </motion.div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
            <p className="text-slate-400">Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12"
          >
            <div className="text-4xl mb-4">✈️</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Bookings Yet</h3>
            <p className="text-slate-400 mb-6">Start your journey by searching and booking a flight.</p>
            <button
              onClick={() => router.push('/search')}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all"
            >
              Search Flights
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {bookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.3)]"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-700/50 flex items-center justify-center text-xl">✈️</div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{booking.airline}</h3>
                        <p className="text-slate-400">
                          {booking.origin} <span className="mx-2">→</span> {booking.destination}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-3 gap-6 w-full md:w-auto">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Date</p>
                      <p className="text-white font-semibold">{booking.departure_date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Status</p>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Amount</p>
                      <p className="text-white font-bold">AED {booking.total_price.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 w-full md:w-auto">
                    <button
                      className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all text-sm font-medium"
                    >
                      Details
                    </button>
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="flex-1 md:flex-none px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
