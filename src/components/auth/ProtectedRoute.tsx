'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      // Redirect to appropriate dashboard
      const dashboardRoute = 
        role === 'admin' ? '/admin' :
        role === 'firefighter' ? '/firefighter' :
        '/resident';
      router.push(dashboardRoute);
    }
  }, [isAuthenticated, role, allowedRoles, router, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center cream-gradient">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dark-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-green-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center cream-gradient">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dark-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-green-700">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center cream-gradient">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dark-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-green-700">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
