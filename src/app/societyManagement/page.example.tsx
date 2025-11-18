import { Suspense } from 'react';
import { getSocieties } from '@/app/actions/societies';
import PageTransition from '@/components/shared/pageTransition';
import { PageLoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import SocietyList from './SocietyList';

// This is a Server Component - renders on server for better performance
export default async function SocietyManagementPage() {
  // Fetch data on server - faster than client-side fetch
  const societies = await getSocieties();

  return (
    <div className="min-h-screen cream-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-green-800">
            Society Management
          </h1>
          <p className="text-dark-green-600 mt-2">
            Manage all your residential societies
          </p>
        </div>

        {/* Suspense boundary for streaming */}
        <Suspense fallback={<PageLoadingSkeleton />}>
          <SocietyList initialSocieties={societies} />
        </Suspense>
      </div>
    </div>
  );
}

// Enable ISR (Incremental Static Regeneration)
// Page will be regenerated every 60 seconds
export const revalidate = 60;
