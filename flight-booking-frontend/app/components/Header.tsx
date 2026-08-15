'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="flex items-center justify-between gap-5 flex-wrap px-4 sm:px-8 lg:px-14 py-4 border-b border-border bg-page/92 backdrop-blur-md sticky top-0 z-20">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="w-[26px] h-[26px] rounded-full border-[1.5px] border-accent flex items-center justify-center shrink-0">
          <span className="w-2 h-2 rounded-full bg-accent" />
        </span>
        <span className="font-serif text-2xl tracking-tight">AeroGlide</span>
      </Link>

      <nav className="flex items-center gap-4 sm:gap-6 flex-wrap text-sm text-ink-secondary">
        <Link href="/" className="hover:text-ink transition-colors">Flights</Link>
        {user && (
          <Link href="/bookings" className="hover:text-ink transition-colors">My trips</Link>
        )}
        {user?.role === 'admin' && (
          <Link href="/admin" className="hover:text-ink transition-colors">Admin</Link>
        )}
        {user ? (
          <button
            onClick={handleLogout}
            className="border border-ink bg-transparent rounded-full px-[18px] py-[9px] text-sm cursor-pointer min-h-[44px] hover:bg-ink hover:text-page transition-colors"
          >
            Log out
          </button>
        ) : (
          <Link
            href="/login"
            className="border border-ink bg-transparent rounded-full px-[18px] py-[9px] text-sm cursor-pointer min-h-[44px] flex items-center hover:bg-ink hover:text-page transition-colors"
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
