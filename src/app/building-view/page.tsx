'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/shared/pageTransition';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  User as UserIcon,
  MessageCircle,
  X,
  ArrowLeft,
  AlertTriangle,
  Shield,
  Phone,
  Bell,
  Building2
} from 'lucide-react';
import { mockFireLocations, mockOccupantLocations } from '@/lib/mockData';

// Fire intensity colors
const intensityColors = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-600'
};

function BuildingViewContent() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedFloor, setSelectedFloor] = useState(3);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Get building info from URL params
  const buildingName = searchParams.get('building') || 'Tower A';
  const buildingId = searchParams.get('id') || '1';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const aiMessages = [
    "Fire detected on Floor 3, Room A-305",
    "15 occupants in affected area",
    "Emergency services notified",
    "Evacuation route: Use Stairwell B",
    "Avoid elevators at all times"
  ];

  const firesOnFloor = mockFireLocations.filter(f => f.floor === selectedFloor);
  const occupantsOnFloor = mockOccupantLocations.filter(o => o.floor === selectedFloor);
  const activeFires = mockFireLocations.filter(f => f.intensity === 'high' || f.intensity === 'critical');

  // Check if there's an active emergency
  const hasActiveEmergency = activeFires.length > 0;

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
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-dark-green-600 hover:text-dark-green-800 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Map</span>
            </button>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-dark-green-500 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-dark-green-800 mb-1">
                    {buildingName}
                  </h1>
                  <p className="text-dark-green-600">
                    Building #{buildingId} - Real-time monitoring
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <motion.div
                animate={hasActiveEmergency ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
                className={`${hasActiveEmergency ? 'bg-red-500' : 'bg-emerald-500'} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3`}
              >
                {hasActiveEmergency ? (
                  <>
                    <AlertTriangle className="w-6 h-6" />
                    <span className="font-bold">FIRE DETECTED</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-6 h-6" />
                    <span className="font-bold">All Clear</span>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <div className="lg:col-span-3">
              {/* Building Map */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-cream-200"
              >
                {/* Floor Selector */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-dark-green-800">Building Floor Plan</h2>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(floor => (
                      <button
                        key={floor}
                        onClick={() => setSelectedFloor(floor)}
                        className={`px-4 py-2 rounded-lg transition-all font-semibold ${
                          selectedFloor === floor
                            ? 'bg-dark-green-500 text-white shadow-md'
                            : 'bg-cream-100 text-dark-green-700 hover:bg-cream-200'
                        }`}
                      >
                        Floor {floor}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Map Area */}
                <div className="relative w-full h-[500px] bg-cream-50 rounded-xl overflow-hidden border-2 border-dark-green-200">
                  {/* Grid Background */}
                  <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 gap-1 p-4">
                    {Array.from({ length: 100 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-white/70 rounded border border-cream-200"
                      />
                    ))}
                  </div>

                  {/* Fire Markers */}
                  <AnimatePresence>
                    {firesOnFloor.map((fire) => (
                      <motion.div
                        key={fire.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute"
                        style={{
                          left: `${(fire.coordinates.x / 400) * 100}%`,
                          top: `${(fire.coordinates.y / 300) * 100}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="relative"
                        >
                          <div className={`w-12 h-12 ${intensityColors[fire.intensity as keyof typeof intensityColors] || 'bg-red-500'} rounded-full flex items-center justify-center shadow-lg`}>
                            <Flame className="w-7 h-7 text-white" />
                          </div>
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap font-semibold">
                            {fire.room}
                          </span>
                        </motion.div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Occupant Markers */}
                  <AnimatePresence>
                    {occupantsOnFloor.map((occupant) => (
                      <motion.div
                        key={occupant.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute"
                        style={{
                          left: `${(occupant.coordinates.x / 400) * 100}%`,
                          top: `${(occupant.coordinates.y / 300) * 100}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                          occupant.status === 'safe' ? 'bg-green-500' :
                          occupant.status === 'evacuating' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}>
                          <UserIcon className="w-5 h-5 text-white" />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Status Bar */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
                      <p className="text-sm font-semibold text-dark-green-800">
                        Floor {selectedFloor} - Active Fires: {firesOnFloor.length}
                      </p>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
                      <p className="text-xs text-dark-green-600">
                        Last update: {lastUpdate.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Empty State */}
                  {firesOnFloor.length === 0 && occupantsOnFloor.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl p-6">
                        <Shield className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                        <p className="text-xl font-semibold text-dark-green-800 mb-1">
                          All Clear
                        </p>
                        <p className="text-dark-green-600">
                          No incidents on Floor {selectedFloor}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-dark-green-700">Fire</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-dark-green-700">Safe</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-dark-green-700">Evacuating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 border-2 border-red-700 rounded-full"></div>
                      <span className="text-sm text-dark-green-700">Needs Help</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-blue-500">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div> Low
                    </span>
                    <span className="flex items-center gap-1 text-yellow-500">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div> Medium
                    </span>
                    <span className="flex items-center gap-1 text-orange-500">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div> High
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div> Critical
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Stats Panel */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`${mockFireLocations.length > 0 ? 'bg-red-500' : 'bg-gray-400'} text-white rounded-2xl shadow-lg p-6`}
              >
                <Flame className="w-8 h-8 mb-3" />
                <p className="text-red-100 text-sm mb-1">Active Fires</p>
                <p className="text-4xl font-bold">{mockFireLocations.length}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-yellow-500 text-white rounded-2xl shadow-lg p-6"
              >
                <UserIcon className="w-8 h-8 mb-3" />
                <p className="text-yellow-100 text-sm mb-1">Evacuating</p>
                <p className="text-4xl font-bold">
                  {mockOccupantLocations.filter(o => o.status === 'evacuating').length}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-green-500 text-white rounded-2xl shadow-lg p-6"
              >
                <Shield className="w-8 h-8 mb-3" />
                <p className="text-green-100 text-sm mb-1">Safe</p>
                <p className="text-4xl font-bold">
                  {mockOccupantLocations.filter(o => o.status === 'safe').length}
                </p>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
              >
                <h3 className="font-bold text-dark-green-800 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
                    <Phone className="w-5 h-5" />
                    <span className="font-medium">Call Emergency: 911</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="font-medium">Sound Alarm</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* AI Agent */}
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
              <div className={`${hasActiveEmergency ? 'bg-red-500' : 'bg-dark-green-500'} text-white p-4`}>
                <h3 className="font-bold">Emergency AI Assistant</h3>
                <p className="text-sm opacity-90">
                  {hasActiveEmergency ? 'Emergency Mode Active' : 'Real-time guidance'}
                </p>
              </div>
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                {aiMessages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-3 rounded-lg text-sm ${
                      hasActiveEmergency && idx === 0
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

export default function BuildingViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen cream-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading building view...</p>
        </div>
      </div>
    }>
      <BuildingViewContent />
    </Suspense>
  );
}
