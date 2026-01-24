'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, role, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // Timeout fallback - redirect to login if loading takes too long
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('[HomePage] Auth loading timeout - redirecting to login');
        setTimedOut(true);
        router.replace('/login');
      }
    }, 3000); // 3 second timeout

    return () => clearTimeout(timeout);
  }, [loading, router]);

  useEffect(() => {
    // Wait for auth to finish loading (unless timed out)
    if (loading && !timedOut) return;

    if (!isAuthenticated) {
      router.replace('/login');
    } else {
      // Redirect to role-specific dashboard
      if (role === 'building_authority' || role === 'management') {
        router.replace('/admin');
      } else if (role === 'resident') {
        router.replace('/resident');
      } else if (role === 'firefighter') {
        router.replace('/firefighter');
      } else {
        // Default fallback for unknown roles
        router.replace('/admin');
      }
    }
  }, [isAuthenticated, role, router, loading, timedOut]);

  return (
    <div className="fixed inset-0 cream-gradient flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 green-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl animate-pulse">
          <span className="text-white font-bold text-2xl">I</span>
        </div>
        <p className="text-dark-green-600 font-semibold text-lg">Loading Ignis...</p>
      </div>
    </div>
  );
}