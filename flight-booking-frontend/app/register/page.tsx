'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import apiClient from '../lib/apiClient';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/register', {
        email,
        password,
      });

      setEmail('');
      setPassword('');
      setConfirmPassword('');
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a101f] to-black p-6 font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)] mb-6">
            <svg className="w-8 h-8 text-white transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">AeroGlide</h1>
          <p className="text-slate-400 mt-2">Join the sky.</p>
        </div>

        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-semibold text-white mb-8">Create Account</h2>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400 text-sm flex items-center gap-3"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {error}
              </motion.div>
            )}

            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white px-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white px-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                  required
                />
                <p className="text-xs text-slate-500 ml-1">Minimum 8 characters</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white px-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 rounded-xl hover:from-blue-500 hover:to-indigo-500 focus:ring-4 focus:ring-blue-500/30 transition-all transform active:scale-[0.99] shadow-lg flex justify-center items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : 'Create Account'}
              </button>
            </div>

            <p className="mt-8 text-center text-sm text-slate-500">
              Already have an account? <a href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Sign in</a>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
