'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Pill from '../components/Pill';
import apiClient from '../lib/apiClient';

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

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const origin = (searchParams.get('origin') || '').toUpperCase();
  const destination = (searchParams.get('destination') || '').toUpperCase();
  const date = searchParams.get('date') || '';
  const passengers = parseInt(searchParams.get('passengers') || '1');

  const [flights, setFlights] = useState<Flight[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<'Cheapest' | 'Earliest'>('Cheapest');
  const [maxPrice, setMaxPrice] = useState(2000);
  const limit = 10;

  useEffect(() => {
    if (!origin || !destination || !date) return;
    setLoading(true);
    apiClient
      .get('/flights/search', { params: { origin, destination, date, passengerCount: passengers, page, limit } })
      .then(({ data }) => {
        setFlights(data.flights);
        setTotal(data.total);
        setError('');
      })
      .catch((err) => setError(err.response?.data?.error || 'Search failed'))
      .finally(() => setLoading(false));
  }, [origin, destination, date, passengers, page]);

  const list = useMemo(() => {
    return flights
      .filter((f) => f.price <= maxPrice)
      .slice()
      .sort((a, b) => (sort === 'Cheapest' ? a.price - b.price : a.departure_time.localeCompare(b.departure_time)));
  }, [flights, maxPrice, sort]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const openFlight = (id: number) => {
    router.push(`/flights/${id}?passengers=${passengers}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 lg:px-14 py-5 sm:py-9 pb-16">
        <div className="flex items-center justify-between gap-4 flex-wrap bg-surface border border-border rounded-2xl px-5 py-4">
          <div>
            <div className="font-serif text-[clamp(22px,3vw,30px)] tracking-[-0.01em]">{origin} → {destination}</div>
            <div className="text-[13px] text-ink-muted mt-1">{date || 'Any date'} &middot; {passengers} {passengers > 1 ? 'passengers' : 'passenger'}</div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="border border-ink bg-transparent rounded-full px-5 py-2.5 text-sm cursor-pointer min-h-[44px] hover:bg-ink hover:text-page transition-colors"
          >
            Edit search
          </button>
        </div>

        <div className="flex gap-5 flex-wrap mt-5 items-start">
          <aside className="flex-1 min-w-[240px] max-w-[320px] bg-surface border border-border rounded-2xl p-5">
            <div className="text-xs tracking-[0.12em] uppercase text-ink-muted mb-3.5">Sort by</div>
            <div className="flex flex-col gap-2 mb-6">
              {(['Cheapest', 'Earliest'] as const).map((s) => (
                <Pill key={s} active={sort === s} onClick={() => setSort(s)}>{s}</Pill>
              ))}
            </div>
            <div className="text-xs tracking-[0.12em] uppercase text-ink-muted mb-2.5">Max price</div>
            <input
              type="range"
              min={100}
              max={2000}
              step={10}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="text-sm text-ink-secondary mt-2">Up to AED {maxPrice}</div>
          </aside>

          <section className="flex-[3] min-w-[min(100%,320px)] flex flex-col gap-3">
            {error && (
              <div className="border border-danger-border bg-danger-bg text-danger-body rounded-2xl p-6 text-sm">{error}</div>
            )}
            {!error && !loading && (
              <div className="text-sm text-ink-muted">{list.length} of {total} flights &middot; sorted by {sort.toLowerCase()}</div>
            )}
            {loading && <div className="text-sm text-ink-muted">Searching…</div>}

            {!loading && list.map((f) => (
              <article
                key={f.id}
                onClick={() => openFlight(f.id)}
                className="bg-surface border border-border rounded-2xl px-5 py-[18px] flex gap-5 flex-wrap items-center justify-between cursor-pointer hover:border-accent transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                  <div className="w-10 h-10 rounded-[10px] bg-[#F2EEE7] flex items-center justify-center text-[13px] tracking-[0.04em] text-ink-secondary shrink-0">
                    {f.airline.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <span className="text-[clamp(18px,2.2vw,22px)]">{f.departure_time} – {f.arrival_time}</span>
                      <span className="text-[13px] text-ink-muted">{f.airline}</span>
                    </div>
                    <div className="text-[13px] text-ink-muted mt-1">{duration(f.departure_time, f.arrival_time)} &middot; Direct &middot; {f.seats_available} seats left</div>
                  </div>
                </div>
                <div className="flex items-center gap-4.5 gap-[18px] ml-auto whitespace-nowrap">
                  <div className="text-right">
                    <div className="font-serif text-[26px] leading-tight">AED {f.price}</div>
                    <div className="text-xs text-ink-muted">per passenger</div>
                  </div>
                  <span className="border border-accent text-accent rounded-full px-[18px] py-2.5 text-sm min-h-[44px] flex items-center">Select</span>
                </div>
              </article>
            ))}

            {!loading && !error && list.length === 0 && (
              <div className="border border-dashed border-[#D6CFC3] rounded-2xl p-10 text-center text-ink-muted text-[15px]">
                No flights under that price. Try widening the max price filter or a different date.
              </div>
            )}

            {!loading && total > limit && (
              <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
                <span className="text-[13px] text-ink-muted">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="border border-border-input text-ink-secondary rounded-full px-4 py-2.5 text-sm min-h-[44px] flex items-center disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:border-accent transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="border border-ink rounded-full px-4 py-2.5 text-sm cursor-pointer min-h-[44px] flex items-center disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-ink hover:enabled:text-page transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
