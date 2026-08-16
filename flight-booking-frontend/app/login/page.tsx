'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AxiosError } from 'axios';
import Header from '../components/Header';
import { useAuthStore } from '../store/authStore';
import apiClient from '../lib/apiClient';
import getErrorMessage from '../lib/getErrorMessage';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-ink-muted">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [credentialsError, setCredentialsError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const emailFormatError = emailTouched && email.length > 0 && !EMAIL_RE.test(email)
    ? 'Enter a valid email address.'
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialsError('');
    setEmailTouched(true);

    if (!EMAIL_RE.test(email)) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      setAuth(data.user, data.accessToken, data.refreshToken);
      window.location.href = redirect;
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        setCredentialsError('That email and password don’t match. Double-check your password and try again.');
      } else {
        setCredentialsError(getErrorMessage(err, 'Something went wrong. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const credentialsInvalid = Boolean(credentialsError);

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-14 py-10 sm:py-20">
        <div className="w-full max-w-[440px]">
          <h2 className="font-serif font-normal text-[clamp(30px,4.6vw,44px)] mb-2 tracking-[-0.01em]">Welcome back</h2>
          <p className="text-[15px] text-ink-muted mb-7 font-light">Sign in to see your trips and finish any pending bookings.</p>

          <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-[20px] p-5 sm:p-7 flex flex-col gap-3.5" noValidate>
            <label className="flex flex-col gap-[7px]">
              <span className="text-xs tracking-[0.1em] uppercase text-ink-muted">Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setCredentialsError('');
                }}
                onBlur={() => setEmailTouched(true)}
                aria-invalid={Boolean(emailFormatError) || credentialsInvalid}
                className={`border rounded-xl px-[15px] py-3.5 text-base bg-input outline-none transition-colors ${
                  emailFormatError || credentialsInvalid ? 'border-danger-text focus:border-danger-text' : 'border-border-input focus:border-accent'
                }`}
              />
              {emailFormatError && <span className="text-xs text-danger-text">{emailFormatError}</span>}
            </label>

            <label className="flex flex-col gap-[7px]">
              <span className="text-xs tracking-[0.1em] uppercase text-ink-muted">Password</span>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setCredentialsError('');
                }}
                aria-invalid={credentialsInvalid}
                className={`border rounded-xl px-[15px] py-3.5 text-base bg-input outline-none transition-colors ${
                  credentialsInvalid ? 'border-danger-text focus:border-danger-text' : 'border-border-input focus:border-accent'
                }`}
              />
              {credentialsError && <span className="text-xs text-danger-text">{credentialsError}</span>}
            </label>

            <button
              type="submit"
              disabled={loading}
              className="bg-accent text-page border-none rounded-xl py-[15px] text-base font-medium cursor-pointer min-h-[52px] mt-1 hover:bg-accent-hover transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="text-sm text-ink-secondary text-center mt-0.5">
              New here? <Link href="/register" className="text-accent hover:text-accent-hover">Create one</Link>
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
