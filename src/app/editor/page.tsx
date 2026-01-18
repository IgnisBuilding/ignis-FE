"use client";

import dynamic from "next/dynamic";
import PageTransition from "@/components/shared/pageTransition";
import { motion } from "framer-motion";
import { Map } from "lucide-react";

// Dynamic import to avoid SSR issues (canvas/SVG needs browser)
const MapEditor = dynamic(() => import("@/components/editor/MapEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] bg-cream-100 rounded-2xl">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-dark-green-500 to-dark-green-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Map className="w-8 h-8 text-white animate-pulse" />
        </div>
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-dark-green-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-dark-green-600 font-medium">Loading Floor Plan Editor...</p>
        <p className="text-dark-green-400 text-sm mt-2">Preparing drawing tools and canvas</p>
      </div>
    </div>
  ),
});

export default function EditorPage() {
  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient">
        {/* Editor Container */}
        <div className="p-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="premium-card rounded-2xl overflow-hidden shadow-xl"
            style={{ height: "calc(100vh - 100px)" }}
          >
            <MapEditor />
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
