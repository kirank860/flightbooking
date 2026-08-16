'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Header from './components/Header';
import Footer from './components/Footer';
import Pill from './components/Pill';
import HeroSlider from './components/HeroSlider';
import apiClient from './lib/apiClient';

const HERO_SLIDES = [
  { src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=80&auto=format&fit=crop', alt: 'Aeroplane wing above the clouds at sunset' },
  { src: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1600&q=80&auto=format&fit=crop', alt: 'Aeroplane parked at an airport terminal' },
  { src: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=1600&q=80&auto=format&fit=crop', alt: 'Traveller at the gate watching a plane take off' },
];

const DESTINATION_IMAGES: Record<string, string> = {
  LAX: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&q=80&auto=format&fit=crop',
  MLE: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80&auto=format&fit=crop',
  LHR: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800&q=80&auto=format&fit=crop',
  DXB: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80&auto=format&fit=crop',
  JFK: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80&auto=format&fit=crop',
};
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80&auto=format&fit=crop';

interface Flight {
  id: number;
  airline: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  price: number;
}

const VALUES = [
  {
    title: 'Every fare, one search',
    body: 'All our partner airlines compared in a single list — no tabs, no hidden surcharges at the last step.',
  },
  {
    title: "Pay only when it's confirmed",
    body: 'Your booking stays pending until the payment clears, so a declined card never costs you a seat or a fare.',
  },
  {
    title: 'Cancel without a phone call',
    body: 'Refunds go back to the card you paid with, and the seat returns to availability the moment it’s processed.',
  },
];

const HOW_STEPS = [
  { n: '01', title: 'Search the route', body: 'Filter by stops, price and departure time. Results are paginated so nothing takes a second to load.' },
  { n: '02', title: 'Add passenger details', body: 'Name, date of birth, nationality, passport and contact details for everyone travelling.' },
  { n: '03', title: 'Pay securely', body: 'Card details are handled the way Stripe expects. We confirm the booking only once the payment settles.' },
  { n: '04', title: 'Manage it later', body: 'Tickets, changes and cancellations all live under My trips — refunds included.' },
];

export default function Home() {
  const router = useRouter();
  const [tripType, setTripType] = useState<'Round trip' | 'One way'>('Round trip');
  const [from, setFrom] = useState('DXB');
  const [to, setTo] = useState('JFK');
  const [depart, setDepart] = useState('');
  const [ret, setRet] = useState('');
  const [pax, setPax] = useState(1);
  const [popular, setPopular] = useState<Flight[]>([]);

  useEffect(() => {
    apiClient
      .get('/flights/popular')
      .then(({ data }) => setPopular(data.destinations))
      .catch(() => setPopular([]));
  }, []);

  const search = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams({
      origin: from.toUpperCase(),
      destination: to.toUpperCase(),
      date: depart,
      passengers: String(pax),
    });
    if (tripType === 'Round trip' && ret) {
      params.set('returnDate', ret);
    }
    router.push(`/results?${params.toString()}`);
  };

  const searchRoute = (origin: string, destination: string, date: string) => {
    const params = new URLSearchParams({ origin, destination, date, passengers: '1' });
    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-page pb-16">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="px-3 sm:px-5 lg:px-7 pt-3 sm:pt-5">
          <div className="relative rounded-[clamp(18px,2.4vw,28px)] overflow-hidden min-h-[clamp(400px,58vh,620px)] flex items-end">
            <HeroSlider slides={HERO_SLIDES} />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative z-10 p-6 sm:p-10 lg:p-14 max-w-6xl mx-auto w-full text-page"
            >
              <p className="text-[13px] tracking-[0.16em] uppercase text-page/78 mb-4">Fly with room to breathe</p>
              <h1 className="font-serif font-normal text-[clamp(38px,7vw,80px)] leading-[1.02] tracking-[-0.02em] max-w-[15ch] text-balance">
                Somewhere new is one search away.
              </h1>
              <p className="mt-5 max-w-[52ch] text-[clamp(15px,1.6vw,18px)] leading-relaxed text-page/86 font-light text-pretty">
                Compare real fares across our partner airlines, book in minutes, and cancel on your terms — nothing charged until your booking is confirmed.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Search card */}
        <section className="px-4 sm:px-8 lg:px-14 max-w-6xl mx-auto w-full relative z-[2]" style={{ marginTop: 'clamp(-70px,-6vw,-30px)' }}>
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            onSubmit={search}
            className="bg-surface border border-border rounded-[20px] p-5 sm:p-7 shadow-[0_24px_60px_-40px_rgba(20,25,30,0.4)]"
          >
            <div className="flex gap-2 flex-wrap mb-5">
              {(['Round trip', 'One way'] as const).map((t) => (
                <Pill key={t} active={tripType === t} onClick={() => setTripType(t)}>{t}</Pill>
              ))}
            </div>

            <div className="grid gap-3 items-end" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
              <label className="flex flex-col gap-[7px]">
                <span className="text-xs tracking-[0.1em] uppercase text-ink-muted">From</span>
                <input
                  value={from}
                  onChange={(e) => setFrom(e.target.value.toUpperCase())}
                  placeholder="e.g. DXB"
                  className="border border-border-input rounded-xl px-[15px] py-3.5 text-base bg-input outline-none focus:border-accent transition-colors"
                  required
                />
              </label>
              <label className="flex flex-col gap-[7px]">
                <span className="text-xs tracking-[0.1em] uppercase text-ink-muted">To</span>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value.toUpperCase())}
                  placeholder="e.g. JFK"
                  className="border border-border-input rounded-xl px-[15px] py-3.5 text-base bg-input outline-none focus:border-accent transition-colors"
                  required
                />
              </label>
              <label className="flex flex-col gap-[7px]">
                <span className="text-xs tracking-[0.1em] uppercase text-ink-muted">Depart</span>
                <input
                  type="date"
                  value={depart}
                  onChange={(e) => setDepart(e.target.value)}
                  className="border border-border-input rounded-xl px-[15px] py-3.5 text-base bg-input outline-none focus:border-accent transition-colors"
                  required
                />
              </label>
              {tripType === 'Round trip' && (
                <label className="flex flex-col gap-[7px]">
                  <span className="text-xs tracking-[0.1em] uppercase text-ink-muted">Return</span>
                  <input
                    type="date"
                    value={ret}
                    onChange={(e) => setRet(e.target.value)}
                    min={depart || undefined}
                    className="border border-border-input rounded-xl px-[15px] py-3.5 text-base bg-input outline-none focus:border-accent transition-colors"
                    required={tripType === 'Round trip'}
                  />
                </label>
              )}
              <label className="flex flex-col gap-[7px]">
                <span className="text-xs tracking-[0.1em] uppercase text-ink-muted">Passengers</span>
                <select
                  value={pax}
                  onChange={(e) => setPax(parseInt(e.target.value))}
                  className="border border-border-input rounded-xl px-[15px] py-3.5 text-base bg-input outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n} {n > 1 ? 'passengers' : 'passenger'}</option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="bg-accent text-page border-none rounded-xl px-[26px] py-[15px] text-base font-medium cursor-pointer min-h-[52px] hover:bg-accent-hover transition-colors"
              >
                Search flights
              </button>
            </div>

            <div className="flex gap-4 flex-wrap mt-4 text-[13px] text-ink-muted">
              <span>Direct flights only</span><span>&middot;</span><span>Flexible dates &plusmn;3 days</span><span>&middot;</span><span>Add nearby airports</span>
            </div>
          </motion.form>
        </section>

        {/* Deals */}
        {popular.length > 0 && (
          <section className="px-4 sm:px-8 lg:px-14 max-w-6xl mx-auto w-full pt-8 sm:pt-10 pb-14 sm:pb-20">
            <div className="flex items-baseline justify-between gap-4 flex-wrap mb-6">
              <h2 className="font-serif font-normal text-[clamp(26px,3.4vw,40px)] tracking-[-0.01em]">Fares worth a detour</h2>
              <span className="text-[13px] text-ink-muted">Lowest fare per route, right now</span>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              {popular.slice(0, 4).map((d) => (
                <article
                  key={d.id}
                  onClick={() => searchRoute(d.origin, d.destination, d.departure_date)}
                  className="border border-border rounded-2xl overflow-hidden bg-surface cursor-pointer hover:border-[#C9C1B4] transition-colors"
                >
                  <div className="relative h-[150px]">
                    <Image
                      src={DESTINATION_IMAGES[d.destination] || FALLBACK_IMAGE}
                      alt={`${d.destination} skyline`}
                      fill
                      sizes="(max-width: 640px) 100vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="px-[18px] pt-4 pb-[18px]">
                    <div className="text-[17px] mb-1">{d.destination}</div>
                    <div className="text-[13px] text-ink-muted mb-3">{d.airline}</div>
                    <div className="font-serif text-2xl">AED {d.price}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Value props */}
        <section className="border-t border-b border-border bg-band px-4 sm:px-8 lg:px-14 py-10 sm:py-14">
          <div className="max-w-6xl mx-auto grid gap-8 sm:gap-12" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
            {VALUES.map((v) => (
              <div key={v.title}>
                <div className="w-2.5 h-2.5 rounded-full bg-accent mb-[18px]" />
                <h3 className="font-serif font-normal text-[clamp(22px,2.6vw,28px)] mb-2.5 tracking-[-0.01em]">{v.title}</h3>
                <p className="text-[15px] leading-[1.7] text-ink-secondary font-light max-w-[34ch] text-pretty">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 sm:px-8 lg:px-14 max-w-6xl mx-auto w-full py-12 sm:py-20">
          <div className="flex gap-8 sm:gap-14 flex-wrap items-start">
            <div className="flex-1 min-w-[260px]">
              <h2 className="font-serif font-normal text-[clamp(28px,3.6vw,42px)] mb-3.5 tracking-[-0.01em] text-balance">Booked in four steps, refunded in one.</h2>
              <p className="text-[15px] leading-[1.7] text-ink-secondary font-light mb-5 max-w-[38ch] text-pretty">
                Nothing is charged until the fare is locked, and cancelling inside the policy window returns the money to the card you paid with.
              </p>
              <button
                onClick={() => search()}
                className="border border-ink bg-transparent rounded-full px-[26px] py-[13px] text-[15px] cursor-pointer min-h-[48px] hover:bg-ink hover:text-page transition-colors"
              >
                Start a search
              </button>
            </div>
            <div className="flex-[1.4] min-w-[280px] flex flex-col">
              {HOW_STEPS.map((h) => (
                <div key={h.n} className="flex gap-[18px] items-start py-5 border-t border-border">
                  <span className="font-mono text-xs text-ink-faint pt-1 shrink-0">{h.n}</span>
                  <div>
                    <div className="text-[clamp(17px,2vw,19px)] mb-1">{h.title}</div>
                    <div className="text-sm text-ink-muted leading-[1.7] max-w-[44ch]">{h.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular routes */}
        {popular.length > 0 && (
          <section className="px-4 sm:px-8 lg:px-14 max-w-6xl mx-auto w-full pb-14 sm:pb-20">
            <div className="flex items-baseline justify-between gap-4 flex-wrap mb-2">
              <h2 className="font-serif font-normal text-[clamp(26px,3.4vw,40px)] tracking-[-0.01em]">Popular routes this week</h2>
              <span className="text-[13px] text-ink-muted">Lowest fare found across our network</span>
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', columnGap: 'clamp(24px,4vw,48px)' }}>
              {popular.map((r) => (
                <div
                  key={r.id}
                  onClick={() => searchRoute(r.origin, r.destination, r.departure_date)}
                  className="flex items-baseline justify-between gap-4 py-[17px] border-b border-border cursor-pointer hover:border-accent transition-colors"
                >
                  <div>
                    <div className="text-base">{r.origin} → {r.destination}</div>
                    <div className="text-[13px] text-ink-faint mt-1">{r.airline} &middot; {r.departure_date}</div>
                  </div>
                  <div className="font-serif text-[22px] whitespace-nowrap">AED {r.price}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Dark CTA band */}
        <section className="px-4 sm:px-8 lg:px-14 max-w-6xl mx-auto w-full pb-16 sm:pb-24">
          <div className="bg-ink text-page rounded-[clamp(18px,2.4vw,28px)] p-6 sm:p-10 lg:p-14 flex gap-8 sm:gap-14 flex-wrap items-center justify-between">
            <div className="flex-1 min-w-[260px]">
              <h2 className="font-serif font-normal text-[clamp(26px,3.6vw,40px)] mb-3 tracking-[-0.01em] text-balance">Your booking, always in reach.</h2>
              <p className="text-[15px] leading-[1.7] text-page/72 font-light max-w-[42ch] text-pretty">
                Every ticket, change and refund lives under My trips — no calling support to find out what happened to your money.
              </p>
            </div>
            <div className="flex gap-9 flex-wrap">
              {[
                { value: 'Pending', label: 'until payment clears' },
                { value: 'Self-service', label: 'cancellation & refunds' },
                { value: 'Real-time', label: 'seat availability' },
              ].map((p) => (
                <div key={p.label}>
                  <div className="font-serif text-[clamp(22px,3vw,32px)] leading-none">{p.value}</div>
                  <div className="text-[13px] text-page/60 mt-[7px] tracking-[0.04em]">{p.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
