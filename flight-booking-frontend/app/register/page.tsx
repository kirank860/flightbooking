'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../components/Header';
import apiClient from '../lib/apiClient';
import getErrorMessage from '../lib/getErrorMessage';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/register', { email, password });
      setEmail('');
      setPassword('');
      router.push('/login?registered=true');
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-14 py-10 sm:py-20">
        <div className="w-full max-w-[440px]">
          <h2 className="font-serif font-normal text-[clamp(30px,4.6vw,44px)] mb-2 tracking-[-0.01em]">Create your account</h2>
          <p className="text-[15px] text-ink-muted mb-7 font-light">One account for booking, changes and refunds.</p>

          <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-[20px] p-5 sm:p-7 flex flex-col gap-3.5">
            {error && (
              <div className="text-sm bg-danger-bg border border-danger-border text-danger-body rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <label className="flex flex-col gap-[7px]">
              <span className="text-xs tracking-[0.1em] uppercase text-ink-muted">Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-border-input rounded-xl px-[15px] py-3.5 text-base bg-input outline-none focus:border-accent transition-colors"
                required
              />
            </label>

            <label className="flex flex-col gap-[7px]">
              <span className="text-xs tracking-[0.1em] uppercase text-ink-muted">Password</span>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-border-input rounded-xl px-[15px] py-3.5 text-base bg-input outline-none focus:border-accent transition-colors"
                required
              />
              <span className="text-xs text-ink-muted">Use 8+ characters with a number or symbol.</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="bg-accent text-page border-none rounded-xl py-[15px] text-base font-medium cursor-pointer min-h-[52px] mt-1 hover:bg-accent-hover transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>

            <div className="text-sm text-ink-secondary text-center mt-0.5">
              Already have an account? <Link href="/login" className="text-accent hover:text-accent-hover">Sign in</Link>
            </div>
          </form>

          <div className="flex items-center gap-2.5 mt-4 text-xs text-ink-muted leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            <span>Sessions stay signed in — your access token renews quietly in the background.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
