"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Map, PenTool } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fadeIn } from "@/lib/animations";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

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
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <FullScreenLoader />;
  }

  return (
    <DashboardLayout role="admin" userName={user?.name || 'Admin'} userTitle="ADMINISTRATOR">
      <div className="flex-1 p-3 sm:p-4 md:p-6 w-full max-w-none h-full flex flex-col">
        <motion.div variants={fadeIn} initial="initial" animate="animate" className="flex flex-col h-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Floor Plan Editor</h1>
              <p className="text-gray-600">Design and digitize building floor plans for fire evacuation</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
              <PenTool className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700 font-medium">Drawing Mode</span>
            </div>
          </div>

          {/* Editor Container */}
          <div className="flex-1 premium-card rounded-xl overflow-hidden" style={{ minHeight: 'calc(100vh - 220px)' }}>
            <MapEditor />
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default function EditorPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'building_authority']}>
      <EditorPageContent />
    </ProtectedRoute>
  );
}
