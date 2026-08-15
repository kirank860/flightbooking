'use client';

import { useEffect, useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import apiClient from '../lib/apiClient';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const labelClass = 'text-xs tracking-[0.1em] uppercase text-ink-muted';

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      fontFamily: '"Public Sans", sans-serif',
      color: '#16191C',
      '::placeholder': { color: '#9AA0A6' },
    },
    invalid: { color: '#A63A2B' },
  },
};

interface Flight {
  origin: string;
  destination: string;
  airline: string;
  departure_date: string;
}

interface Booking {
  id: number;
  total_price: number;
}

interface Props {
  flight: Flight;
  booking: Booking;
  passengerCount: number;
  billingName: string;
  setError: (message: string) => void;
  onSuccess: (bookingId: number) => void;
  onDecline: () => void;
}

function PaymentForm({ clientSecret, booking, billingName, setError, onSuccess, onDecline }: {
  clientSecret: string;
  booking: Booking;
  billingName: string;
  setError: (message: string) => void;
  onSuccess: (bookingId: number) => void;
  onDecline: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setPaying(true);
    setError('');

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card, billing_details: { name: billingName || undefined } },
    });

    if (stripeError) {
      try {
        await apiClient.post('/payments/decline', { bookingId: booking.id });
      } catch {
        // booking will still be cleaned up by the payment_intent.payment_failed webhook
      }
      onDecline();
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        await apiClient.post('/payments/confirm', { bookingId: booking.id, paymentIntentId: paymentIntent.id });
        onSuccess(booking.id);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Payment succeeded but we could not confirm the booking. It will finalize shortly.');
        setPaying(false);
      }
      return;
    }

    setError('Payment did not complete. Please try again.');
    setPaying(false);
  };

  return (
    <>
      <label className="flex flex-col gap-[7px]">
        <span className={labelClass}>Card details</span>
        <div className="border border-border-input rounded-xl px-[15px] py-3.5 bg-input">
          <CardElement options={cardElementOptions} />
        </div>
      </label>

      <div className="flex items-center gap-2.5 mt-5 text-xs text-ink-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
        <span>Real Stripe test mode. Use 4242 4242 4242 4242 (any future date/CVC) to succeed, or 4000 0000 0000 0002 to see a decline.</span>
      </div>

      <button
        onClick={handlePay}
        disabled={paying || !stripe}
        className="w-full bg-accent text-page border-none rounded-xl py-[15px] text-base font-medium cursor-pointer min-h-[52px] mt-6 hover:bg-accent-hover transition-colors disabled:opacity-60"
      >
        {paying ? 'Processing…' : `Pay AED ${booking.total_price}`}
      </button>
    </>
  );
}

export default function StripePaymentStep({ flight, booking, passengerCount, billingName, setError, onSuccess, onDecline }: Props) {
  const [clientSecret, setClientSecret] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    apiClient.post('/payments/create-intent', { bookingId: booking.id })
      .then(({ data }) => setClientSecret(data.clientSecret))
      .catch((err) => setLoadError(err.response?.data?.error || 'Could not start the payment.'));
  }, [booking.id]);

  return (
    <div className="flex gap-5 flex-wrap items-start">
      <section className="flex-[2] min-w-[380px] bg-surface border border-border rounded-[20px] p-5 sm:p-8">
        <h2 className="font-serif font-normal text-[clamp(26px,3.6vw,36px)] mb-1.5 tracking-[-0.01em]">Payment</h2>
        <p className="text-sm text-ink-muted mb-6.5 mb-[26px] font-light">Your booking is held in a pending state until the payment clears.</p>

        {loadError && (
          <div className="bg-danger-bg border border-danger-border text-danger-body rounded-xl px-4 py-3 text-sm">{loadError}</div>
        )}

        {!loadError && !clientSecret && (
          <div className="text-sm text-ink-muted">Setting up payment…</div>
        )}

        {clientSecret && (
          <Elements stripe={stripePromise}>
            <PaymentForm
              clientSecret={clientSecret}
              booking={booking}
              billingName={billingName}
              setError={setError}
              onSuccess={onSuccess}
              onDecline={onDecline}
            />
          </Elements>
        )}
      </section>

      <aside className="flex-1 min-w-[260px] sticky top-24 bg-surface border border-border rounded-[20px] p-6">
        <div className="text-xs tracking-[0.12em] uppercase text-ink-muted mb-3.5">Order</div>
        <div className="text-[17px] mb-1">{flight.origin} → {flight.destination}</div>
        <div className="text-[13px] text-ink-muted mb-4.5 mb-[18px]">{passengerCount} {passengerCount > 1 ? 'passengers' : 'passenger'} &middot; {flight.departure_date}</div>
        <div className="flex flex-col gap-2.5 text-[15px] border-t border-border pt-4">
          <div className="flex justify-between gap-3"><span className="text-ink-secondary">Fare &times; {passengerCount}</span><span>AED {booking.total_price}</span></div>
          <div className="flex justify-between gap-3"><span className="text-ink-secondary">Taxes &amp; fees</span><span>Included</span></div>
        </div>
        <div className="border-t border-border my-4 pt-4 flex justify-between items-baseline gap-3">
          <span className="text-[15px]">Total</span>
          <span className="font-serif text-[30px]">AED {booking.total_price}</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-warn-bg border border-warn-border text-warn-text rounded-full px-3.5 py-[7px] text-xs">
          Booking pending until payment clears
        </div>
      </aside>
    </div>
  );
}
