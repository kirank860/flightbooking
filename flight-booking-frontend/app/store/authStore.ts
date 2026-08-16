import { create } from 'zustand';

export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  initializing: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  bootstrap: () => Promise<void>;
}

// Refresh tokens are single-use (rotated server-side on every /auth/refresh
// call), so two concurrent callers presenting the same token race each
// other: whichever request the server sees second finds the token already
// rotated away and gets rejected, wiping the session the first call just set
// up. This can genuinely happen - e.g. React Strict Mode double-invokes
// AuthBootstrap's effect in dev, firing two refreshAccessToken() calls back
// to back before the first one's fetch resolves. Sharing one in-flight
// promise across every caller (bootstrap, the axios interceptor, anything
// else) means only one real request ever goes out at a time.
let refreshPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  initializing: true,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, accessToken, refreshToken });
  },

  logout: () => {
    const { accessToken } = get();
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null });
    if (accessToken) {
      fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001') + '/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => {});
    }
  },

  refreshAccessToken: () => {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          get().logout();
          throw new Error('No refresh token');
        }

        try {
          const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001') + '/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (!res.ok) throw new Error('Refresh failed');
          const data = await res.json();
          localStorage.setItem('refreshToken', data.refreshToken);
          set({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
        } catch (error) {
          get().logout();
          throw error;
        }
      })().finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  },

  bootstrap: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await get().refreshAccessToken();
      } catch {
        // refreshAccessToken already logs out on failure
      }
    }
    set({ initializing: false });
  },
}));
