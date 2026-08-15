'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import apiClient from '../../lib/apiClient';

interface Flight {
  id: number;
  airline: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  seats_available: number;
  total_seats: number;
}

function duration(dep: string, arr: string) {
  const [dh, dm] = dep.split(':').map(Number);
  const [ah, am] = arr.split(':').map(Number);
  let mins = (ah * 60 + am) - (dh * 60 + dm);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function flightCode(f: Flight) {
  return `${f.airline.slice(0, 2).toUpperCase()} ${String(f.id).padStart(3, '0')}`;
}

export default function FlightDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const passengerCount = parseInt(searchParams.get('passengers') || '1');

  const [flight, setFlight] = useState<Flight | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get(`/flights/${id}`)
      .then(({ data }) => setFlight(data))
      .catch(() => setError('Flight not found'));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-page">
        <Header />
        <main className="flex-1 flex items-center justify-center text-ink-muted">{error}</main>
        <Footer />
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen flex flex-col bg-page">
        <Header />
        <main className="flex-1 flex items-center justify-center text-ink-muted">Loading…</main>
        <Footer />
      </div>
    );
  }

  const total = flight.price * passengerCount;

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 lg:px-14 py-5 sm:py-9 pb-20">
        <button
          onClick={() => router.back()}
          className="border-none bg-transparent text-accent text-sm cursor-pointer py-2 min-h-[44px] hover:text-accent-hover transition-colors"
        >
          ← Back to results
        </button>

        <div className="flex gap-5 flex-wrap items-start mt-2">
          <section className="flex-[2] min-w-[380px] bg-surface border border-border rounded-[20px] p-5 sm:p-8">
            <h2 className="font-serif font-normal text-[clamp(26px,3.6vw,38px)] mb-1.5 tracking-[-0.01em]">
              {flight.origin} → {flight.destination}
            </h2>
            <div className="text-sm text-ink-muted mb-7">
              {flight.airline} {flightCode(flight)} &middot; {duration(flight.departure_time, flight.arrival_time)} &middot; Direct &middot; {flight.departure_date}
            </div>

            <div className="flex gap-5 items-stretch">
              <div className="w-px bg-border my-1.5" />
              <div className="flex-1 flex flex-col gap-6.5 gap-[26px]">
                <div>
                  <div className="text-[clamp(17px,2vw,20px)]">{flight.departure_time} &middot; {flight.origin}</div>
                  <div className="text-[13px] text-ink-muted mt-1.5">Bag drop closes 45 min before departure</div>
                </div>
                <div>
                  <div className="text-[clamp(17px,2vw,20px)]">{flight.arrival_time} &middot; {flight.destination}</div>
                  <div className="text-[13px] text-ink-muted mt-1.5">{flight.airline} {flightCode(flight)} &middot; {duration(flight.departure_time, flight.arrival_time)} in the air</div>
                </div>
              </div>
            </div>

            <div className="border-t border-border mt-7 pt-5.5 pt-[22px] grid gap-4.5 gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              <div>
                <div className="text-xs tracking-[0.1em] uppercase text-ink-muted mb-1.5">Cabin bag</div>
                <div className="text-[15px]">1 × 7 kg included</div>
              </div>
              <div>
                <div className="text-xs tracking-[0.1em] uppercase text-ink-muted mb-1.5">Seats remaining</div>
                <div className="text-[15px]">{flight.seats_available} of {flight.total_seats}</div>
              </div>
              <div>
                <div className="text-xs tracking-[0.1em] uppercase text-ink-muted mb-1.5">Cancellation</div>
                <div className="text-[15px]">Free up to 24h before travel</div>
              </div>
            </div>
          </section>

          <aside className="flex-1 min-w-[260px] sticky top-24 bg-surface border border-border rounded-[20px] p-6">
            <div className="text-xs tracking-[0.12em] uppercase text-ink-muted mb-4">Fare summary</div>
            <div className="flex flex-col gap-3 text-[15px]">
              <div className="flex justify-between gap-3"><span className="text-ink-secondary">Fare × {passengerCount}</span><span>AED {total}</span></div>
              <div className="flex justify-between gap-3"><span className="text-ink-secondary">Taxes &amp; fees</span><span>Included</span></div>
              <div className="flex justify-between gap-3"><span className="text-ink-secondary">Seat selection</span><span>Free</span></div>
            </div>
            <div className="border-t border-border my-4.5 my-[18px] pt-4.5 pt-[18px] flex justify-between items-baseline gap-3">
              <span className="text-[15px]">Total</span>
              <span className="font-serif text-[30px]">AED {total}</span>
            </div>
            <button
              onClick={() => router.push(`/checkout?flightId=${flight.id}&passengerCount=${passengerCount}`)}
              disabled={flight.seats_available < passengerCount}
              className="w-full bg-accent text-page border-none rounded-xl py-[15px] text-base font-medium cursor-pointer min-h-[52px] hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {flight.seats_available < passengerCount ? 'Not enough seats' : 'Continue to passengers'}
            </button>
            <div className="text-xs text-ink-muted mt-3 text-center">{flight.seats_available} seats left at this fare</div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
