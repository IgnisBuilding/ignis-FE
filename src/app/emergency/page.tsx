'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import PageTransition from '@/components/shared/pageTransition';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, User as UserIcon, MessageCircle, X, AlertTriangle, Shield, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { EmergencyState } from '@/lib/map';

// Dynamically import EvacuationMap to avoid SSR issues with MapLibre
const EvacuationMap = dynamic(
  () => import('@/components/maps/EvacuationMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-cream-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading evacuation map...</p>
        </div>
      </div>
    )
  }
);

export default function EmergencyPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [emergencyState, setEmergencyState] = useState<EmergencyState | null>(null);
  const [aiMessages, setAiMessages] = useState<string[]>([
    "System ready. Monitoring for fire hazards.",
    "All evacuation routes are clear.",
    "Emergency services on standby."
  ]);

  // Temporarily disabled login check
  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.push('/login');
  //   }
  // }, [isAuthenticated, router]);

  // Handle emergency state changes from map
  const handleEmergencyStateChange = useCallback((state: EmergencyState) => {
    setEmergencyState(state);

    // Update AI messages based on emergency state
    if (state.mode === 'fire_detected') {
      setAiMessages([
        "ALERT: Fire detected in building!",
        `${state.fireMarkers.length} active fire location(s)`,
        "Recommended: Start evacuation immediately",
        "Emergency services have been notified",
        "Avoid elevators - use stairs only"
      ]);
      setIsTalking(true);
    } else if (state.mode === 'evacuation_in_progress') {
      setAiMessages([
        "EVACUATION IN PROGRESS",
        `${state.occupancy} people remaining in building`,
        `Evacuation ${Math.round(state.evacuationProgress * 100)}% complete`,
        "Follow illuminated exit signs",
        "Assist those who need help"
      ]);
    } else if (state.mode === 'evacuation_complete') {
      setAiMessages([
        "EVACUATION COMPLETE",
        "All occupants have been evacuated",
        "Building is now clear",
        "Wait for fire department clearance",
        "Do not re-enter the building"
      ]);
      setIsTalking(false);
    } else if (state.mode === 'idle') {
      setAiMessages([
        "System ready. Monitoring for fire hazards.",
        "All evacuation routes are clear.",
        "Emergency services on standby."
      ]);
      setIsTalking(false);
    }
  }, []);

  // Handle room click from map
  const handleRoomClick = useCallback((room: GeoJSON.Feature) => {
    const roomName = room.properties?.name || 'Unknown Room';
    const roomType = room.properties?.room_type || 'Unknown';

    // Add contextual AI message
    setAiMessages(prev => [
      `Selected: ${roomName}`,
      `Room type: ${roomType}`,
      ...prev.slice(0, 3)
    ]);
  }, []);

  // Get status color and icon based on emergency state
  const getStatusInfo = () => {
    if (!emergencyState) {
      return { color: 'bg-blue-500', text: 'Initializing...', icon: Shield };
    }

    switch (emergencyState.mode) {
      case 'fire_detected':
        return { color: 'bg-red-500', text: 'FIRE DETECTED', icon: AlertTriangle };
      case 'evacuation_in_progress':
        return { color: 'bg-orange-500', text: 'EVACUATION IN PROGRESS', icon: Users };
      case 'evacuation_complete':
        return { color: 'bg-green-500', text: 'EVACUATION COMPLETE', icon: Shield };
      default:
        return { color: 'bg-emerald-500', text: 'System Ready', icon: Shield };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-red-600 mb-2 flex items-center gap-3">
                  <AlertTriangle className="w-10 h-10" />
                  Emergency Response Center
                </h1>
                <p className="text-dark-green-600">Real-time fire monitoring and evacuation management</p>
              </div>

              {/* Status Badge */}
              <motion.div
                animate={emergencyState?.mode === 'fire_detected' ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
                className={`${statusInfo.color} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3`}
              >
                <StatusIcon className="w-6 h-6" />
                <span className="font-bold">{statusInfo.text}</span>
              </motion.div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {/* Main Map Area */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="premium-card rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-dark-green-800">Building Evacuation Map</h2>
                </div>

                {/* Evacuation Map Component */}
                <div className="w-full h-[600px] rounded-lg overflow-hidden border-2 border-dark-green-200">
                  <EvacuationMap
                    className="w-full h-full"
                    showControls={true}
                    showLegend={true}
                    showEmergencyControls={true}
                    onRoomClick={handleRoomClick}
                    onEmergencyStateChange={handleEmergencyStateChange}
                  />
                </div>
              </motion.div>
            </div>

            {/* Stats Panel */}
            <div className="space-y-4">
              {/* Active Fires */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`${emergencyState?.fireMarkers?.length ? 'bg-red-500' : 'bg-gray-400'} text-white rounded-2xl shadow-lg p-6`}
              >
                <Flame className="w-8 h-8 mb-3" />
                <p className="text-red-100 text-sm mb-1">Active Fires</p>
                <p className="text-4xl font-bold">{emergencyState?.fireMarkers?.length || 0}</p>
              </motion.div>

              {/* Building Occupancy */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-yellow-500 text-white rounded-2xl shadow-lg p-6"
              >
                <UserIcon className="w-8 h-8 mb-3" />
                <p className="text-yellow-100 text-sm mb-1">Building Occupancy</p>
                <p className="text-4xl font-bold">{emergencyState?.occupancy || '--'}</p>
                <p className="text-yellow-100 text-xs mt-1">people in building</p>
              </motion.div>

              {/* Evacuation Progress */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-emerald-500 text-white rounded-2xl shadow-lg p-6"
              >
                <Shield className="w-8 h-8 mb-3" />
                <p className="text-emerald-100 text-sm mb-1">Evacuation Progress</p>
                <p className="text-4xl font-bold">
                  {emergencyState?.evacuationProgress
                    ? `${Math.round(emergencyState.evacuationProgress * 100)}%`
                    : '0%'}
                </p>
                <div className="mt-2 h-2 bg-emerald-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: '0%' }}
                    animate={{ width: `${(emergencyState?.evacuationProgress || 0) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>

              {/* System Status */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
              >
                <h3 className="font-bold text-dark-green-800 mb-3">System Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sensors</span>
                    <span className="text-sm font-semibold text-green-600">Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Backend</span>
                    <span className="text-sm font-semibold text-green-600">Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Alarms</span>
                    <span className={`text-sm font-semibold ${emergencyState?.mode === 'fire_detected' ? 'text-red-600' : 'text-green-600'}`}>
                      {emergencyState?.mode === 'fire_detected' ? 'ACTIVE' : 'Standby'}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* AI Agent Button */}
        <motion.button
          onClick={() => setIsAIOpen(!isAIOpen)}
          className="fixed bottom-6 right-6 w-16 h-16 green-gradient rounded-full shadow-2xl flex items-center justify-center z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isAIOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
          {isTalking && (
            <motion.div
              className="absolute inset-0 border-4 border-white rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </motion.button>

        {/* AI Chat Window */}
        <AnimatePresence>
          {isAIOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className={`${emergencyState?.mode === 'fire_detected' ? 'bg-red-500' : 'bg-dark-green-500'} text-white p-4`}>
                <h3 className="font-bold">Emergency AI Assistant</h3>
                <p className="text-sm opacity-90">
                  {emergencyState?.mode === 'fire_detected' ? 'Emergency Mode Active' : 'Real-time guidance'}
                </p>
              </div>
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                {aiMessages.map((msg, idx) => (
                  <motion.div
                    key={`${idx}-${msg}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-3 rounded-lg text-sm ${
                      emergencyState?.mode === 'fire_detected' && idx === 0
                        ? 'bg-red-100 text-red-800 font-semibold'
                        : 'bg-cream-100 text-dark-green-800'
                    }`}
                  >
                    {msg}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
