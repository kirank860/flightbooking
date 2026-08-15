'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import StepProgress from '../components/StepProgress';
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

interface Booking {
  id: number;
  total_price: number;
  status: string;
}

const inputClass = 'border border-border-input rounded-xl px-[15px] py-3.5 text-base bg-input outline-none focus:border-accent transition-colors w-full';
const labelClass = 'text-xs tracking-[0.1em] uppercase text-ink-muted';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flightId = searchParams.get('flightId');
  const passengerCount = parseInt(searchParams.get('passengerCount') || '1');

  const [flight, setFlight] = useState<Flight | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
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
      const { data } = await apiClient.post('/bookings', { flightId: parseInt(flightId!), passengers });
      setBooking(data);
      setPayFailed(false);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not hold this booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!booking) return;
    setPaying(true);
    setError('');
    try {
      await apiClient.post('/payments/confirm', { bookingId: booking.id });
      router.push(`/confirmation?bookingId=${booking.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment could not be confirmed.');
    } finally {
      setPaying(false);
    }
  };

  const handleDeclinePreview = async () => {
    if (!booking) return;
    setPaying(true);
    setError('');
    try {
      await apiClient.post('/payments/decline', { bookingId: booking.id });
      setPayFailed(true);
      setBooking(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setPaying(false);
    }
  };

  if (!flight) {
    return (
      <div className="min-h-screen flex flex-col bg-page">
        <Header />
        <main className="flex-1 flex items-center justify-center text-ink-muted">{error || 'Loading…'}</main>
        <Footer />
      </div>
    );
  }

  const total = booking?.total_price ?? flight.price * passengerCount;

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
              <div className="text-xs tracking-[0.12em] uppercase text-ink-muted mb-3.5">Your flight</div>
              <div className="text-[17px] mb-1">{flight.origin} → {flight.destination}</div>
              <div className="text-[13px] text-ink-muted mb-5">{flight.airline} &middot; {flight.departure_date}</div>
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-5 flex-wrap items-start">
            <section className="flex-[2] min-w-[380px] bg-surface border border-border rounded-[20px] p-5 sm:p-8">
              <h2 className="font-serif font-normal text-[clamp(26px,3.6vw,36px)] mb-1.5 tracking-[-0.01em]">Payment</h2>
              <p className="text-sm text-ink-muted mb-6.5 mb-[26px] font-light">Your booking is held in a pending state until the payment clears.</p>

              <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <label className="flex flex-col gap-[7px]" style={{ gridColumn: '1 / -1' }}>
                  <span className={labelClass}>Card number</span>
                  <input placeholder="4242 4242 4242 4242" className={inputClass} />
                </label>
                <label className="flex flex-col gap-[7px]">
                  <span className={labelClass}>Expiry</span>
                  <input placeholder="09 / 29" className={inputClass} />
                </label>
                <label className="flex flex-col gap-[7px]">
                  <span className={labelClass}>CVC</span>
                  <input placeholder="123" className={inputClass} />
                </label>
                <label className="flex flex-col gap-[7px]" style={{ gridColumn: '1 / -1' }}>
                  <span className={labelClass}>Name on card</span>
                  <input placeholder={passengers[0]?.full_name || 'Anika Raman'} className={inputClass} />
                </label>
              </div>

              <div className="flex items-center gap-2.5 mt-5 text-xs text-ink-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                <span>This is a mock payment step — no real card data is collected or sent anywhere.</span>
              </div>
            </section>

            <aside className="flex-1 min-w-[260px] sticky top-24 bg-surface border border-border rounded-[20px] p-6">
              <div className="text-xs tracking-[0.12em] uppercase text-ink-muted mb-3.5">Order</div>
              <div className="text-[17px] mb-1">{flight.origin} → {flight.destination}</div>
              <div className="text-[13px] text-ink-muted mb-4.5 mb-[18px]">{passengerCount} {passengerCount > 1 ? 'passengers' : 'passenger'} &middot; {flight.departure_date}</div>
              <div className="flex flex-col gap-2.5 text-[15px] border-t border-border pt-4">
                <div className="flex justify-between gap-3"><span className="text-ink-secondary">Fare &times; {passengerCount}</span><span>AED {total}</span></div>
                <div className="flex justify-between gap-3"><span className="text-ink-secondary">Taxes &amp; fees</span><span>Included</span></div>
              </div>
              <div className="border-t border-border my-4 pt-4 flex justify-between items-baseline gap-3">
                <span className="text-[15px]">Total</span>
                <span className="font-serif text-[30px]">AED {total}</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-warn-bg border border-warn-border text-warn-text rounded-full px-3.5 py-[7px] text-xs mb-4">
                Booking pending until payment clears
              </div>
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full bg-accent text-page border-none rounded-xl py-[15px] text-base font-medium cursor-pointer min-h-[52px] hover:bg-accent-hover transition-colors disabled:opacity-60"
              >
                {paying ? 'Processing…' : `Pay AED ${total}`}
              </button>
              <button
                onClick={handleDeclinePreview}
                disabled={paying}
                className="w-full bg-transparent border border-border-input text-ink-muted rounded-xl py-3 text-[13px] cursor-pointer min-h-[44px] mt-2.5 hover:border-[#C9C1B4] transition-colors disabled:opacity-60"
              >
                Preview declined-card state
              </button>
            </aside>
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
