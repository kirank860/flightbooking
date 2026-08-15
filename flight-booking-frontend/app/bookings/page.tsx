'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
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
  passenger_count: number;
}

function chipClass(status: string) {
  if (status === 'confirmed') return 'bg-accent-tint text-accent';
  if (status === 'pending') return 'bg-warn-bg text-warn-text';
  return 'bg-danger-bg text-danger-text';
}

function reference(id: number) {
  return `AG-${String(id).padStart(6, '0')}`;
}

export default function BookingsPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelErrors, setCancelErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    apiClient.get('/bookings/my-bookings')
      .then(({ data }) => setBookings(data.bookings))
      .catch((err: any) => {
        if (err.response?.status === 401) {
          logout();
          router.push('/login');
        } else {
          setError('Failed to load bookings');
        }
      })
      .finally(() => setLoading(false));
  }, [logout, router]);

  const handleCancel = async (bookingId: number) => {
    setCancelErrors((prev) => ({ ...prev, [bookingId]: '' }));
    try {
      const { data } = await apiClient.post(`/bookings/${bookingId}/cancel`);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: data.booking.status } : b)));
    } catch (err: any) {
      setCancelErrors((prev) => ({ ...prev, [bookingId]: err.response?.data?.error || 'Could not cancel this booking.' }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 lg:px-14 py-6 sm:py-12 pb-20">
        <h2 className="font-serif font-normal text-[clamp(30px,4.6vw,44px)] mb-1.5 tracking-[-0.01em]">My trips</h2>
        <p className="text-[15px] text-ink-muted mb-7 font-light">
          {loading ? 'Loading…' : `${bookings.length} booking${bookings.length === 1 ? '' : 's'} on this account.`}
        </p>

        {error && (
          <div className="bg-danger-bg border border-danger-border text-danger-body rounded-xl px-4 py-3 text-sm mb-6">{error}</div>
        )}

        {!loading && bookings.length === 0 && !error && (
          <div className="border border-dashed border-[#D6CFC3] rounded-2xl p-12 text-center">
            <h3 className="font-serif text-2xl mb-2">No bookings yet</h3>
            <p className="text-ink-muted mb-6">Start your journey by searching and booking a flight.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-accent text-page border-none rounded-full px-6 py-3 text-sm cursor-pointer min-h-[44px] hover:bg-accent-hover transition-colors"
            >
              Search flights
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3.5">
          {bookings.map((booking, index) => (
            <motion.article
              key={booking.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="bg-surface border border-border rounded-[20px] p-5 sm:p-6"
            >
              <div className="flex gap-4 flex-wrap items-start justify-between">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-3 flex-wrap mb-1.5">
                    <span className="font-serif text-[clamp(22px,2.8vw,28px)]">{booking.origin} → {booking.destination}</span>
                    <span className={`inline-flex items-center rounded-full px-3 py-[5px] text-xs tracking-[0.04em] whitespace-nowrap capitalize ${chipClass(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-ink-secondary leading-relaxed">
                    {booking.departure_date} &middot; {booking.airline} &middot; {booking.passenger_count} {booking.passenger_count > 1 ? 'passengers' : 'passenger'}
                  </div>
                  <div className="text-[13px] text-ink-faint mt-1.5">Ref {reference(booking.id)} &middot; AED {booking.total_price}</div>
                </div>
                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="border border-danger-text text-danger-text rounded-full px-[18px] py-2.5 text-sm cursor-pointer min-h-[44px]"
                  >
                    Cancel booking
                  </button>
                )}
              </div>

              {cancelErrors[booking.id] && (
                <div className="border border-danger-border bg-danger-bg rounded-2xl p-4 mt-4 flex gap-3">
                  <span className="w-2 h-2 rounded-full bg-danger-text shrink-0 mt-1.5" />
                  <div className="text-[13px] text-danger-body leading-relaxed">{cancelErrors[booking.id]}</div>
                </div>
              )}
            </motion.article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
