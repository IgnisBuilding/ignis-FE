"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Map } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useSearchParams } from "next/navigation";

// Full screen loader component
function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 green-gradient rounded-2xl flex items-center justify-center shadow-lg">
          <Map className="w-10 h-10 text-white animate-pulse" />
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-800 font-semibold text-lg">Loading Floor Plan Editor...</p>
        <p className="text-gray-500 text-sm mt-2">Preparing drawing tools and canvas</p>
      </div>
    </div>
  );
}

// Dynamic import to avoid SSR issues (canvas/SVG needs browser)
const MapEditor = dynamic(() => import("@/components/editor/MapEditor"), {
  ssr: false,
  loading: () => <FullScreenLoader />,
});

function EditorPageContent() {
  const searchParams = useSearchParams();
  const buildingId = searchParams.get('building');
  const initialBuildingId = buildingId ? parseInt(buildingId, 10) : undefined;

  return (
    <div className="w-screen h-screen overflow-hidden">
      <MapEditor initialBuildingId={initialBuildingId} />
    </div>
  );
}

export default function EditorPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'management', 'building_authority']}>
      <Suspense fallback={<FullScreenLoader />}>
        <EditorPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
