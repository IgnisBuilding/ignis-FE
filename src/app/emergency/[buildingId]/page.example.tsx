import { Suspense } from 'react';
import { getFireLocations } from '@/app/actions/maps';
import FireMap from '@/components/maps/FireMap';
import { PageLoadingSkeleton } from '@/components/shared/LoadingSkeleton';

interface Props {
  params: Promise<{ buildingId: string }>;
}

// Server Component - fetches initial data on server
export default async function EmergencyMapPage({ params }: Props) {
  const { buildingId } = await params;
  
  // Fetch initial fire locations on server
  const fireLocations = await getFireLocations(buildingId);

  return (
    <div className="min-h-screen cream-gradient py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-dark-green-800 mb-2">
            Emergency Response Map
          </h1>
          <p className="text-dark-green-600">
            Real-time fire location tracking for Building {buildingId}
          </p>
        </div>

        <Suspense fallback={<PageLoadingSkeleton />}>
          {/* Client component handles real-time updates */}
          <FireMap buildingId={buildingId} initialData={fireLocations} />
        </Suspense>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-4">
            <h3 className="font-semibold text-dark-green-800 mb-2">
              Emergency Contacts
            </h3>
            <p className="text-sm text-dark-green-600">
              Fire Department: 911
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-4">
            <h3 className="font-semibold text-dark-green-800 mb-2">
              Evacuation Status
            </h3>
            <p className="text-sm text-dark-green-600">
              All routes clear
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-4">
            <h3 className="font-semibold text-dark-green-800 mb-2">
              Building Status
            </h3>
            <p className="text-sm text-dark-green-600">
              Monitoring active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;
