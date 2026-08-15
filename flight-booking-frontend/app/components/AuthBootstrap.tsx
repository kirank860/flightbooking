'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function AuthBootstrap() {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
