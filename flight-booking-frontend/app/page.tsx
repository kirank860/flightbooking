'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from './store/authStore';

export default function Home() {
  const router = useRouter();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    // Redirect based on auth status
    if (accessToken) {
      router.push('/search');
    } else {
      router.push('/login');
    }
  }, [accessToken, router]);

  // Landing page while redirecting
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a101f] to-black text-white font-sans flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-6 px-6"
      >
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.6)]">
          <svg className="w-10 h-10 text-white transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
        </div>
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">AeroGlide</h1>
        <p className="text-slate-400 text-lg">Redirecting to your destination...</p>
        <div className="flex justify-center gap-2">
          <motion.div className="w-3 h-3 bg-blue-500 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
          <motion.div className="w-3 h-3 bg-blue-500 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, delay: 0.1, repeat: Infinity }} />
          <motion.div className="w-3 h-3 bg-blue-500 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, delay: 0.2, repeat: Infinity }} />
        </div>
      </motion.div>
    </div>
  );
}
