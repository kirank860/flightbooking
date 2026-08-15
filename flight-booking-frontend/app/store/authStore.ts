import { create } from 'zustand';

interface AuthStore {
  user: any;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: any, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, accessToken, refreshToken });
  },

  logout: () => {
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null });
  },

  refreshAccessToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return;

    try {
      const res = await fetch('http://localhost:5001/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      set({ accessToken: data.accessToken });
    } catch (error) {
      get().logout();
    }
  },
}));
