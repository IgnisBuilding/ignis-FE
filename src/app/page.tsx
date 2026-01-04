'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuth();

  useEffect(() => {
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
      }
    }
  }, [isAuthenticated, role, router]);

  return (
    <div className="min-h-screen cream-gradient flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 green-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl animate-pulse">
          <span className="text-white font-bold text-2xl">I</span>
        </div>
        <p className="text-dark-green-600 font-semibold text-lg">Loading Ignis...</p>
      </div>
    </div>
  );
}