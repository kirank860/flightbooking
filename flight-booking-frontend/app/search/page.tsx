'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ShieldCheck, BadgePercent, Headset, MapPin } from 'lucide-react';
import apiClient from '../lib/apiClient';
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

const TRUST_POINTS = [
  { icon: ShieldCheck, title: 'Secure Payments', desc: 'Encrypted checkout, every time' },
  { icon: BadgePercent, title: 'Best Price Guarantee', desc: "We'll match a lower fare" },
  { icon: Headset, title: '24/7 Support', desc: 'Real humans, always on' },
];

export default function SearchPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    date: '',
    passengerCount: 1,
  });

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [popularDestinations, setPopularDestinations] = useState<Flight[]>([]);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const { data } = await apiClient.get('/flights/popular');
        setPopularDestinations(data.destinations);
      } catch (error) {
        console.error('Failed to load popular destinations', error);
      }
    };
    fetchPopular();
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const searchRoute = (origin: string, destination: string, date: string) => {
    setFormData({ ...formData, origin, destination, date });
    setLoading(true);
    apiClient
      .get('/flights/search', { params: { origin, destination, date, passengerCount: formData.passengerCount } })
      .then(({ data }) => {
        setFlights(data.flights);
        setHasSearched(true);
      })
      .catch(() => setHasSearched(true))
      .finally(() => setLoading(false));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await apiClient.get('/flights/search', {
        params: formData,
      });
      setFlights(data.flights);
      setHasSearched(true);
    } catch (error) {
      console.error('Search failed', error);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a101f] to-black text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* Premium Navbar/Header */}
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
            <button onClick={() => router.push('/bookings')} className="hover:text-white cursor-pointer transition-colors duration-200">My Bookings</button>
            <button onClick={() => router.push('/bookings')} className="hover:text-white cursor-pointer transition-colors duration-200">Profile</button>
            <button onClick={handleLogout} className="px-5 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">Log Out</button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button className="text-slate-300 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-12 md:mb-16 space-y-4"
        >
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 pb-2">
            Where to next?
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Discover premium flights across the globe. Seamless booking, transparent pricing, and unparalleled comfort.
          </p>
        </motion.div>

        {/* Search Form (Glassmorphism) */}
        <motion.form 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          onSubmit={handleSearch} 
          className="relative group z-10"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Origin</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. DXB"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white px-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Destination</label>
                <input
                  type="text"
                  placeholder="e.g. JFK"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white px-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Departure</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white px-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Passengers</label>
                <select
                  value={formData.passengerCount}
                  onChange={(e) => setFormData({ ...formData, passengerCount: parseInt(e.target.value) })}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white px-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num} className="bg-slate-800 text-white">
                      {num} {num > 1 ? 'Passengers' : 'Passenger'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 rounded-xl hover:from-blue-500 hover:to-indigo-500 focus:ring-4 focus:ring-blue-500/30 transition-all transform active:scale-[0.99] shadow-lg flex justify-center items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Scanning skies...
                </>
              ) : 'Search Available Flights'}
            </button>
          </div>
        </motion.form>

        {/* Popular Destinations + Trust Strip (pre-search state) */}
        {!hasSearched && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-20"
            >
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <span className="bg-blue-500/20 text-blue-400 p-2 rounded-lg">
                  <MapPin className="w-5 h-5" aria-hidden="true" />
                </span>
                Popular Destinations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularDestinations.map((dest, index) => (
                  <motion.button
                    key={dest.id}
                    type="button"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    onClick={() => searchRoute(dest.origin, dest.destination, dest.departure_date)}
                    className="group relative bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 text-left hover:bg-slate-800/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.3)]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-lg font-bold text-white">
                        <span>{dest.origin}</span>
                        <span className="text-slate-600">⟶</span>
                        <span>{dest.destination}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{dest.airline}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Starting from</div>
                        <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                          AED {dest.price}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                        Search →
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6"
            >
              {TRUST_POINTS.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-start gap-4 bg-slate-800/30 border border-slate-700/40 rounded-2xl p-6"
                >
                  <span className="shrink-0 bg-blue-500/20 text-blue-400 p-2.5 rounded-xl">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div>
                    <div className="font-semibold text-white">{title}</div>
                    <div className="text-sm text-slate-400 mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </>
        )}

        {/* Results Section */}
        {hasSearched && flights.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-20 text-center bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12"
          >
            <div className="text-4xl mb-4">🛬</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Flights Found</h3>
            <p className="text-slate-400">We couldn't find any flights for this route on the selected date.</p>
            <p className="text-slate-400 mt-2 text-sm">Hint: Try searching from <strong className="text-white">DXB</strong> to <strong className="text-white">JFK</strong> on <strong className="text-white">15/10/2026</strong></p>
          </motion.div>
        )}

        {flights.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mt-20"
          >
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <span className="bg-blue-500/20 text-blue-400 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </span>
              {flights.length} Flights Found
            </h3>
            <div className="space-y-6">
              {flights.map((flight, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  key={flight.id} 
                  className="group relative bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.3)]"
                >
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    
                    {/* Airline & Route */}
                    <div className="flex items-center gap-8 w-full md:w-auto">
                      <div className="w-16 h-16 rounded-xl bg-slate-700/50 border border-slate-600 flex items-center justify-center text-2xl shadow-inner">
                        ✈️
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-1 tracking-wide">{flight.airline}</h4>
                        <div className="flex items-center gap-3 text-slate-400 font-medium">
                          <span className="text-blue-400">{flight.origin}</span>
                          <span className="text-slate-600">⟶</span>
                          <span className="text-blue-400">{flight.destination}</span>
                        </div>
                      </div>
                    </div>

                    {/* Time & Seats */}
                    <div className="flex flex-col items-center md:items-end w-full md:w-auto">
                      <div className="text-2xl font-bold text-white tracking-tight">{flight.departure_time}</div>
                      <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        {flight.seats_available} seats remaining
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-700/50 pt-6 md:pt-0 md:pl-8">
                      <div className="text-center md:text-right">
                        <div className="text-sm text-slate-400 mb-1">Price per passenger</div>
                        <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                          AED {flight.price}
                        </div>
                      </div>
                      <button
                        onClick={() => window.location.href = `/checkout?flightId=${flight.id}&passengerCount=${formData.passengerCount}`}
                        className="w-full md:w-auto bg-white/10 hover:bg-white text-white hover:text-slate-900 font-semibold px-8 py-3 rounded-xl transition-all duration-300 border border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

      </main>
    </div>
  );
}
