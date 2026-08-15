'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import apiClient from '../lib/apiClient';

interface Booking {
  id: number;
  status: string;
  total_price: number;
  airline: string;
  origin: string;
  destination: string;
  departure_date: string;
  passenger_count: number;
}

function reference(id: number) {
  return `AG-${String(id).padStart(6, '0')}`;
}

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) {
      setError('No booking found');
      setLoading(false);
      return;
    }

    apiClient.get('/bookings/my-bookings')
      .then(({ data }) => {
        const found = data.bookings.find((b: Booking) => b.id === parseInt(bookingId));
        if (!found) {
          setError('Booking not found');
        } else {
          setBooking(found);
        }
      })
      .catch(() => setError('Failed to load booking'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-14 py-10 sm:py-24">
        {loading ? (
          <p className="text-ink-muted">Loading…</p>
        ) : (
          <div className="max-w-[620px] w-full text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="w-14 h-14 rounded-full border-[1.5px] border-accent mx-auto mb-6.5 mb-[26px] flex items-center justify-center text-accent text-2xl"
            >
              ✓
            </motion.div>

            {booking ? (
              <>
                <h2 className="font-serif font-normal text-[clamp(30px,5vw,48px)] mb-3.5 tracking-[-0.01em]">Booking confirmed.</h2>
                <p className="text-base leading-relaxed text-ink-secondary font-light mb-7">
                  Reference <strong className="font-medium">{reference(booking.id)}</strong>. Find it anytime under My trips.
                </p>

                <div className="bg-surface border border-border rounded-[20px] p-6 text-left grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                  <div>
                    <div className={labelClass}>Route</div>
                    <div className="text-base mt-1.5">{booking.origin} → {booking.destination}</div>
                  </div>
                  <div>
                    <div className={labelClass}>Departs</div>
                    <div className="text-base mt-1.5">{booking.departure_date}</div>
                  </div>
                  <div>
                    <div className={labelClass}>Passengers</div>
                    <div className="text-base mt-1.5">{booking.passenger_count}</div>
                  </div>
                  <div>
                    <div className={labelClass}>Paid</div>
                    <div className="text-base mt-1.5">AED {booking.total_price}</div>
                  </div>
                </div>

                <div className="flex gap-2.5 flex-wrap justify-center mt-7">
                  <button
                    onClick={() => router.push('/bookings')}
                    className="bg-accent text-page border-none rounded-full px-6 py-3 text-[15px] cursor-pointer min-h-[48px] hover:bg-accent-hover transition-colors"
                  >
                    View my trips
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="border border-ink bg-transparent rounded-full px-6 py-3 text-[15px] cursor-pointer min-h-[48px] hover:bg-ink hover:text-page transition-colors"
                  >
                    Search another flight
                  </button>
                </div>
              </>
            ) : (
              <div className="text-danger-body bg-danger-bg border border-danger-border rounded-2xl p-6">{error}</div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

const labelClass = 'text-xs tracking-[0.1em] uppercase text-ink-muted';
