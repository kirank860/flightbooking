'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import StepProgress from '../components/StepProgress';
import StripePaymentStep from '../components/StripePaymentStep';
import apiClient from '../lib/apiClient';
import getErrorMessage from '../lib/getErrorMessage';
import { useAuthStore } from '../store/authStore';

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

interface Booking {
  id: number;
  total_price: number;
  status: string;
}

const inputClass = 'border border-border-input rounded-xl px-[15px] py-3.5 text-base bg-input outline-none focus:border-accent transition-colors w-full';
const labelClass = 'text-xs tracking-[0.1em] uppercase text-ink-muted';

import { Suspense } from 'react';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-ink-muted">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flightId = searchParams.get('flightId');
  const returnFlightId = searchParams.get('returnFlightId');
  const passengerCount = parseInt(searchParams.get('passengerCount') || '1');
  const { user, initializing } = useAuthStore();

  useEffect(() => {
    if (!initializing && !user) {
      const redirect = `/checkout?flightId=${flightId}${returnFlightId ? `&returnFlightId=${returnFlightId}` : ''}&passengerCount=${passengerCount}`;
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [initializing, user, router, flightId, returnFlightId, passengerCount]);

  const [flight, setFlight] = useState<Flight | null>(null);
  const [returnFlight, setReturnFlight] = useState<Flight | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payFailed, setPayFailed] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>(
    Array(passengerCount).fill(null).map(() => ({
      full_name: '', date_of_birth: '', nationality: '', passport_number: '', email: '', contact_number: '',
    }))
  );

  useEffect(() => {
    if (!flightId) return;
    apiClient.get(`/flights/${flightId}`)
      .then(({ data }) => setFlight(data))
      .catch(() => setError('Failed to load flight details'));
  }, [flightId]);

  useEffect(() => {
    if (!returnFlightId) return;
    apiClient.get(`/flights/${returnFlightId}`)
      .then(({ data }) => setReturnFlight(data))
      .catch(() => setError('Failed to load return flight details'));
  }, [returnFlightId]);

  const updatePassenger = (index: number, field: keyof Passenger, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const createBooking = async () => {
    const allFilled = passengers.every(p => p.full_name && p.date_of_birth && p.nationality && p.passport_number && p.email && p.contact_number);
    if (!allFilled) {
      setError('Please fill in every field for each passenger before continuing.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await apiClient.post('/bookings', {
        flightId: parseInt(flightId!),
        passengers,
        ...(returnFlightId ? { returnFlightId: parseInt(returnFlightId) } : {}),
      });
      setBooking(data);
      setPayFailed(false);
      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not hold this booking. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (bookingId: number) => {
    router.push(`/confirmation?bookingId=${bookingId}`);
  };

  const handlePaymentDecline = () => {
    setPayFailed(true);
    setBooking(null);
  };

  if (initializing || !user || !flight || (returnFlightId && !returnFlight)) {
    return (
      <div className="min-h-screen flex flex-col bg-page">
        <Header />
        <main className="flex-1 flex items-center justify-center text-ink-muted">
          {!initializing && !user ? 'Redirecting to sign in…' : error || 'Loading…'}
        </main>
        <Footer />
      </div>
    );
  }

  const total = booking?.total_price ?? (flight.price + (returnFlight?.price ?? 0)) * passengerCount;

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 lg:px-14 py-5 sm:py-9 pb-20">
        <StepProgress activeIndex={step} />

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 bg-danger-bg border border-danger-border text-danger-body rounded-xl px-4 py-3 text-sm">
            {error}
          </motion.div>
        )}

        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-5 flex-wrap items-start">
            <section className="flex-[2] min-w-[380px] flex flex-col gap-4">
              {passengers.map((p, index) => (
                <div key={index} className="bg-surface border border-border rounded-[20px] p-5 sm:p-7">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap mb-5">
                    <h3 className="font-serif font-normal text-2xl">Passenger {index + 1}</h3>
                  </div>
                  <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <label className="flex flex-col gap-[7px]">
                      <span className={labelClass}>Full name (as on passport)</span>
                      <input value={p.full_name} onChange={(e) => updatePassenger(index, 'full_name', e.target.value)} placeholder="Anika Raman" className={inputClass} />
                    </label>
                    <label className="flex flex-col gap-[7px]">
                      <span className={labelClass}>Date of birth</span>
                      <input type="date" value={p.date_of_birth} onChange={(e) => updatePassenger(index, 'date_of_birth', e.target.value)} className={inputClass} />
                    </label>
                    <label className="flex flex-col gap-[7px]">
                      <span className={labelClass}>Nationality</span>
                      <input value={p.nationality} onChange={(e) => updatePassenger(index, 'nationality', e.target.value)} placeholder="India" className={inputClass} />
                    </label>
                    <label className="flex flex-col gap-[7px]">
                      <span className={labelClass}>Passport number</span>
                      <input value={p.passport_number} onChange={(e) => updatePassenger(index, 'passport_number', e.target.value)} placeholder="P1234567" className={inputClass} />
                    </label>
                    <label className="flex flex-col gap-[7px]">
                      <span className={labelClass}>Email</span>
                      <input type="email" value={p.email} onChange={(e) => updatePassenger(index, 'email', e.target.value)} placeholder="you@example.com" className={inputClass} />
                    </label>
                    <label className="flex flex-col gap-[7px]">
                      <span className={labelClass}>Contact number</span>
                      <input value={p.contact_number} onChange={(e) => updatePassenger(index, 'contact_number', e.target.value)} placeholder="+971 50 000 0000" className={inputClass} />
                    </label>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2.5 text-[13px] text-ink-muted leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A66A00] shrink-0" />
                <span>Every field is required before payment can begin. Names must match the travel document exactly.</span>
              </div>
            </section>

            <aside className="flex-1 min-w-[260px] sticky top-24 bg-surface border border-border rounded-[20px] p-6">
              <div className="text-xs tracking-[0.12em] uppercase text-ink-muted mb-3.5">{returnFlight ? 'Your trip' : 'Your flight'}</div>
              <div className="text-[17px] mb-1">{flight.origin} → {flight.destination}</div>
              <div className="text-[13px] text-ink-muted mb-5">{flight.airline} &middot; {flight.departure_date}</div>
              {returnFlight && (
                <>
                  <div className="text-[17px] mb-1">{returnFlight.origin} → {returnFlight.destination}</div>
                  <div className="text-[13px] text-ink-muted mb-5">{returnFlight.airline} &middot; {returnFlight.departure_date}</div>
                </>
              )}
              <div className="border-t border-border pt-4.5 pt-[18px] flex justify-between items-baseline gap-3 mb-4.5 mb-[18px]">
                <span className="text-[15px]">Total</span>
                <span className="font-serif text-[30px]">AED {total}</span>
              </div>
              <button
                onClick={createBooking}
                disabled={loading}
                className="w-full bg-accent text-page border-none rounded-xl py-[15px] text-base font-medium cursor-pointer min-h-[52px] hover:bg-accent-hover transition-colors disabled:opacity-60"
              >
                {loading ? 'Holding your seats…' : 'Continue to payment'}
              </button>
            </aside>
          </motion.div>
        )}

        {step === 2 && booking && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <StripePaymentStep
              flight={flight}
              returnFlight={returnFlight}
              booking={booking}
              passengerCount={passengerCount}
              billingName={passengers[0]?.full_name || ''}
              setError={setError}
              onSuccess={handlePaymentSuccess}
              onDecline={handlePaymentDecline}
            />
          </motion.div>
        )}

        {step === 2 && !booking && payFailed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg">
            <div className="border border-danger-border bg-danger-bg rounded-2xl p-5 flex gap-3 mb-5">
              <span className="w-2 h-2 rounded-full bg-danger-text shrink-0 mt-1.5" />
              <div>
                <div className="text-[15px] mb-1">Your card was declined</div>
                <div className="text-[13px] text-danger-body leading-relaxed">No seats were taken and nothing was charged. Try again with the same details, or edit your passengers first.</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="border border-ink bg-transparent rounded-full px-6 py-3 text-sm cursor-pointer min-h-[44px] hover:bg-ink hover:text-page transition-colors"
              >
                Edit passengers
              </button>
              <button
                onClick={createBooking}
                disabled={loading}
                className="bg-accent text-page border-none rounded-full px-6 py-3 text-sm cursor-pointer min-h-[44px] hover:bg-accent-hover transition-colors disabled:opacity-60"
              >
                {loading ? 'Retrying…' : 'Try again'}
              </button>
            </div>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}
