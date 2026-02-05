'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
      // Redirect to appropriate dashboard based on role
      let dashboardRoute = '/resident';
      switch (role) {
        case 'admin':
          dashboardRoute = '/admin';
          break;
        case 'commander':
        case 'management':
        case 'building_authority':
          dashboardRoute = '/admin';
          break;
        case 'firefighter':
        case 'firefighter_hq':
        case 'firefighter_state':
        case 'firefighter_district':
          dashboardRoute = '/firefighter';
          break;
        case 'resident':
        default:
          dashboardRoute = '/resident';
          break;
      }
      router.push(dashboardRoute);
    }
  }, [isAuthenticated, role, allowedRoles, router, loading]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
