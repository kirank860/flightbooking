import { create } from 'zustand';

interface AuthStore {
  user: any;
  accessToken: string | null;
  refreshToken: string | null;
  initializing: boolean;
  setAuth: (user: any, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  bootstrap: () => Promise<void>;
}

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

  refreshAccessToken: async () => {
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
