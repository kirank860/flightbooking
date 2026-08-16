'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Pill from '../components/Pill';
import apiClient from '../lib/apiClient';
import getErrorMessage from '../lib/getErrorMessage';
import { useAuthStore } from '../store/authStore';

interface Stats {
  bookingsToday: number;
  revenueToday: number;
  cancellationRate: number;
  seatsSold: number;
}

interface Flight {
  id: number;
  airline: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  total_seats: number;
  seats_available: number;
}

interface AdminBooking {
  id: number;
  user_email: string;
  origin: string;
  destination: string;
  return_origin?: string | null;
  return_destination?: string | null;
  created_at: string;
  total_price: number;
  status: string;
}

function routeLabel(b: AdminBooking) {
  return b.return_origin ? `${b.origin}→${b.destination} / ${b.return_origin}→${b.return_destination}` : `${b.origin}→${b.destination}`;
}

const emptyFlightForm = {
  airline: '', origin: '', destination: '', departure_date: '', departure_time: '', arrival_time: '', price: '', total_seats: '',
};

function chipClass(status: string) {
  if (status === 'confirmed') return 'bg-accent-tint text-accent';
  if (status === 'pending') return 'bg-warn-bg text-warn-text';
  return 'bg-danger-bg text-danger-text';
}

const inputClass = 'border border-border-input rounded-lg px-3.5 py-2.5 text-sm bg-input outline-none focus:border-accent transition-colors w-full';

export default function AdminPage() {
  const router = useRouter();
  const { user, initializing } = useAuthStore();
  const [tab, setTab] = useState<'Dashboard' | 'Fares' | 'Bookings'>('Dashboard');

  useEffect(() => {
    if (!initializing && user?.role !== 'admin') {
      router.push('/');
    }
  }, [initializing, user, router]);

  // Dashboard state
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<AdminBooking[]>([]);

  // Fares state
  const [flights, setFlights] = useState<Flight[]>([]);
  const [flightForm, setFlightForm] = useState(emptyFlightForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fareError, setFareError] = useState('');

  // Bookings state
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [routeFilter, setRouteFilter] = useState('');
  const bookingsLimit = 10;

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === 'Dashboard') {
      apiClient.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {});
      apiClient.get('/admin/bookings', { params: { limit: 5 } }).then(({ data }) => setRecent(data.bookings)).catch(() => {});
    }
    if (tab === 'Fares') {
      apiClient.get('/admin/flights', { params: { limit: 50 } }).then(({ data }) => setFlights(data.flights)).catch(() => {});
    }
  }, [tab, isAdmin]);

  useEffect(() => {
    if (!isAdmin || tab !== 'Bookings') return;
    apiClient
      .get('/admin/bookings', {
        params: {
          status: statusFilter || undefined,
          date: dateFilter || undefined,
          route: routeFilter || undefined,
          page: bookingsPage,
          limit: bookingsLimit,
        },
      })
      .then(({ data }) => {
        setBookings(data.bookings);
        setBookingsTotal(data.total);
      })
      .catch(() => {});
  }, [tab, isAdmin, statusFilter, dateFilter, routeFilter, bookingsPage]);

  const refreshFlights = () => {
    apiClient.get('/admin/flights', { params: { limit: 50 } }).then(({ data }) => setFlights(data.flights)).catch(() => {});
  };

  const openAddForm = () => {
    setFlightForm(emptyFlightForm);
    setEditingId(null);
    setFareError('');
    setShowForm(true);
  };

  const openEditForm = (f: Flight) => {
    setFlightForm({
      airline: f.airline, origin: f.origin, destination: f.destination,
      departure_date: f.departure_date, departure_time: f.departure_time, arrival_time: f.arrival_time,
      price: String(f.price), total_seats: String(f.total_seats),
    });
    setEditingId(f.id);
    setFareError('');
    setShowForm(true);
  };

  const submitFlightForm = async () => {
    setFareError('');
    const payload = {
      ...flightForm,
      price: parseFloat(flightForm.price),
      total_seats: parseInt(flightForm.total_seats),
    };
    try {
      if (editingId) {
        await apiClient.put(`/admin/flights/${editingId}`, payload);
      } else {
        await apiClient.post('/admin/flights', payload);
      }
      setShowForm(false);
      refreshFlights();
    } catch (err) {
      setFareError(getErrorMessage(err, 'Could not save flight'));
    }
  };

  const deleteFlight = async (id: number) => {
    if (!confirm('Delete this flight?')) return;
    try {
      await apiClient.delete(`/admin/flights/${id}`);
      refreshFlights();
    } catch (err) {
      alert(getErrorMessage(err, 'Could not delete flight'));
    }
  };

  const refundBooking = async (id: number) => {
    if (!confirm('Force-cancel and refund this booking?')) return;
    try {
      await apiClient.post(`/bookings/${id}/cancel`);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)));
    } catch (err) {
      alert(getErrorMessage(err, 'Could not refund booking'));
    }
  };

  if (initializing || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-page">
        <Header />
        <main className="flex-1 flex items-center justify-center text-ink-muted">
          {initializing ? 'Loading…' : 'Redirecting…'}
        </main>
        <Footer />
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(bookingsTotal / bookingsLimit));

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 lg:px-14 py-6 sm:py-11 pb-20">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-5.5 mb-[22px]">
          <div>
            <h2 className="font-serif font-normal text-[clamp(28px,4.2vw,42px)] mb-1 tracking-[-0.01em]">Operations</h2>
            <p className="text-sm text-ink-muted font-light">Signed in as {user.email}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['Dashboard', 'Fares', 'Bookings'] as const).map((t) => (
              <Pill key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Pill>
            ))}
          </div>
        </div>

        {tab === 'Dashboard' && (
          <div>
            <div className="grid gap-3.5 mb-5.5 mb-[22px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
              {stats && [
                { label: 'Bookings today', value: String(stats.bookingsToday) },
                { label: 'Revenue today', value: `AED ${stats.revenueToday}` },
                { label: 'Cancellation rate', value: `${stats.cancellationRate}%` },
                { label: 'Seats sold', value: String(stats.seatsSold) },
              ].map((s) => (
                <div key={s.label} className="bg-surface border border-border rounded-[18px] p-5.5 p-[22px]">
                  <div className="text-xs tracking-[0.12em] uppercase text-ink-muted mb-3">{s.label}</div>
                  <div className="font-serif text-[clamp(30px,3.6vw,40px)] leading-none">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-surface border border-border rounded-[18px] p-5 sm:p-6">
              <div className="text-xs tracking-[0.12em] uppercase text-ink-muted mb-4.5 mb-[18px]">Recent bookings</div>
              <div className="overflow-x-auto">
                <div className="min-w-[560px]">
                  <div className="grid grid-cols-[1fr_1.4fr_1fr_0.9fr_0.8fr] gap-3.5 text-xs tracking-[0.06em] uppercase text-ink-faint pb-2.5">
                    <span>Ref</span><span>Passenger</span><span>Route</span><span>Amount</span><span>Status</span>
                  </div>
                  {recent.map((r) => (
                    <div key={r.id} className="grid grid-cols-[1fr_1.4fr_1fr_0.9fr_0.8fr] gap-3.5 items-center text-sm py-3 border-t border-border-row">
                      <span className="font-mono text-[13px] text-ink-secondary">AG-{String(r.id).padStart(6, '0')}</span>
                      <span>{r.user_email}</span>
                      <span className="text-ink-secondary">{routeLabel(r)}</span>
                      <span>AED {r.total_price}</span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs w-fit capitalize ${chipClass(r.status)}`}>{r.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'Fares' && (
          <div className="bg-surface border border-border rounded-[18px] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3.5 flex-wrap mb-4.5 mb-[18px]">
              <div className="text-xs tracking-[0.12em] uppercase text-ink-muted">Fares &amp; inventory</div>
              <button
                onClick={openAddForm}
                className="bg-accent text-page border-none rounded-full px-5 py-2.5 text-sm cursor-pointer min-h-[44px] hover:bg-accent-hover transition-colors"
              >
                Add flight
              </button>
            </div>

            {showForm && (
              <div className="border border-border rounded-2xl p-5 mb-5 bg-band">
                {fareError && <div className="text-sm text-danger-body bg-danger-bg border border-danger-border rounded-lg px-3 py-2 mb-3">{fareError}</div>}
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                  <input placeholder="Airline" value={flightForm.airline} onChange={(e) => setFlightForm({ ...flightForm, airline: e.target.value })} className={inputClass} />
                  <input placeholder="Origin (DXB)" value={flightForm.origin} onChange={(e) => setFlightForm({ ...flightForm, origin: e.target.value.toUpperCase() })} className={inputClass} />
                  <input placeholder="Destination (JFK)" value={flightForm.destination} onChange={(e) => setFlightForm({ ...flightForm, destination: e.target.value.toUpperCase() })} className={inputClass} />
                  <input type="date" value={flightForm.departure_date} onChange={(e) => setFlightForm({ ...flightForm, departure_date: e.target.value })} className={inputClass} />
                  <input type="time" value={flightForm.departure_time} onChange={(e) => setFlightForm({ ...flightForm, departure_time: e.target.value })} className={inputClass} />
                  <input type="time" value={flightForm.arrival_time} onChange={(e) => setFlightForm({ ...flightForm, arrival_time: e.target.value })} className={inputClass} />
                  <input type="number" placeholder="Price" value={flightForm.price} onChange={(e) => setFlightForm({ ...flightForm, price: e.target.value })} className={inputClass} />
                  <input type="number" placeholder="Total seats" value={flightForm.total_seats} onChange={(e) => setFlightForm({ ...flightForm, total_seats: e.target.value })} className={inputClass} />
                </div>
                <div className="flex gap-2.5 mt-4">
                  <button onClick={submitFlightForm} className="bg-accent text-page border-none rounded-full px-5 py-2.5 text-sm cursor-pointer min-h-[44px] hover:bg-accent-hover transition-colors">
                    {editingId ? 'Save changes' : 'Create flight'}
                  </button>
                  <button onClick={() => setShowForm(false)} className="border border-border-input text-ink-secondary rounded-full px-5 py-2.5 text-sm cursor-pointer min-h-[44px]">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[0.7fr_1.2fr_1.1fr_0.8fr_0.9fr_0.8fr] gap-3.5 text-xs tracking-[0.06em] uppercase text-ink-faint pb-2.5">
                  <span>Flight</span><span>Route</span><span>Departs</span><span>Fare</span><span>Seats</span><span></span>
                </div>
                {flights.map((f) => (
                  <div key={f.id} className="grid grid-cols-[0.7fr_1.2fr_1.1fr_0.8fr_0.9fr_0.8fr] gap-3.5 items-center text-sm py-3 border-t border-border-row">
                    <span className="font-mono text-[13px] text-ink-secondary">{f.airline.slice(0, 2).toUpperCase()}{String(f.id).padStart(3, '0')}</span>
                    <span>{f.origin} → {f.destination}</span>
                    <span className="text-ink-secondary">{f.departure_date} &middot; {f.departure_time}</span>
                    <span>AED {f.price}</span>
                    <span className={f.seats_available <= 4 ? 'text-danger-text' : ''}>{f.seats_available} / {f.total_seats}</span>
                    <span className="flex gap-3.5 text-sm">
                      <button onClick={() => openEditForm(f)} className="text-accent cursor-pointer">Edit</button>
                      <button onClick={() => deleteFlight(f.id)} className="text-danger-text cursor-pointer">Delete</button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'Bookings' && (
          <div className="bg-surface border border-border rounded-[18px] p-5 sm:p-6">
            <div className="flex gap-2.5 flex-wrap mb-5">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setBookingsPage(1); }}
                className="border border-border-input rounded-full px-4 py-2.5 text-sm bg-input outline-none min-h-[44px] appearance-none cursor-pointer"
              >
                <option value="">All statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="payment_failed">Payment failed</option>
              </select>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setBookingsPage(1); }}
                className="border border-border-input rounded-full px-4 py-2.5 text-sm bg-input outline-none min-h-[44px]"
              />
              <input
                placeholder="Route, e.g. DXBJFK"
                value={routeFilter}
                onChange={(e) => { setRouteFilter(e.target.value); setBookingsPage(1); }}
                className="border border-border-input rounded-full px-4 py-2.5 text-sm bg-input outline-none min-h-[44px] min-w-[180px]"
              />
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[1fr_1.3fr_1fr_1fr_0.9fr_1.1fr] gap-3.5 text-xs tracking-[0.06em] uppercase text-ink-faint pb-2.5">
                  <span>Ref</span><span>Passenger</span><span>Route</span><span>Booked</span><span>Amount</span><span>Status</span>
                </div>
                {bookings.map((b) => (
                  <div key={b.id} className="grid grid-cols-[1fr_1.3fr_1fr_1fr_0.9fr_1.1fr] gap-3.5 items-center text-sm py-3 border-t border-border-row">
                    <span className="font-mono text-[13px] text-ink-secondary">AG-{String(b.id).padStart(6, '0')}</span>
                    <span>{b.user_email}</span>
                    <span className="text-ink-secondary">{routeLabel(b)}</span>
                    <span className="text-ink-secondary">{b.created_at.slice(0, 10)}</span>
                    <span>AED {b.total_price}</span>
                    <span className="flex items-center gap-3 flex-wrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs capitalize ${chipClass(b.status)}`}>{b.status.replace('_', ' ')}</span>
                      {b.status === 'confirmed' && (
                        <button onClick={() => refundBooking(b.id)} className="text-[13px] text-danger-text cursor-pointer whitespace-nowrap">Refund</button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap pt-4.5 pt-[18px] text-[13px] text-ink-muted">
              <span>Showing {bookings.length} of {bookingsTotal} bookings</span>
              <div className="flex gap-2">
                <button
                  disabled={bookingsPage <= 1}
                  onClick={() => setBookingsPage((p) => Math.max(1, p - 1))}
                  className="border border-border-input rounded-full px-4 py-2 min-h-[40px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  disabled={bookingsPage >= totalPages}
                  onClick={() => setBookingsPage((p) => Math.min(totalPages, p + 1))}
                  className="border border-ink rounded-full px-4 py-2 min-h-[40px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
