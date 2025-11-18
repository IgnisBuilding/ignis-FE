'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import PageTransition from '@/components/shared/pageTransition';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, User as UserIcon, MessageCircle, X, ZoomIn, ZoomOut } from 'lucide-react';
import { mockFireLocations, mockOccupantLocations } from '@/lib/mockData';

export default function EmergencyPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedFloor, setSelectedFloor] = useState(3);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isTalking, setIsTalking] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const aiMessages = [
    "Fire detected on Floor 3, Room A-305",
    "15 occupants in affected area",
    "Emergency services notified",
    "Evacuation route: Use Stairwell B",
    "Avoid elevators at all times"
  ];

  const firesOnFloor = mockFireLocations.filter(f => f.floor === selectedFloor);
  const occupantsOnFloor = mockOccupantLocations.filter(o => o.floor === selectedFloor);

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-4xl font-bold text-red-600 mb-2">ðŸš¨ Emergency Response Center</h1>
            <p className="text-dark-green-600">Real-time fire and occupant tracking</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <div className="lg:col-span-3">
              {/* Building Map */}
              <motion.div
                initial={{ opacity: 0, scale: 0.955 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="premium-card rounded-2xl p-6"
              >
                {/* Floor Selector */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-dark-green-800">Building Map</h2>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(floor => (
                      <button
                        key={floor}
                        onClick={() => setSelectedFloor(floor)}
                        className={`px-4 py-2 rounded-lg transition-all font-semibold ${
                          selectedFloor === floor
                            ? 'bg-dark-green-500 text-white'
                            : 'bg-cream-100 text-dark-green-700 hover:bg-cream-200'
                        }`}
                      >
                        Floor {floor}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Map Area */}
                <div className="relative w-full h-[500px] bg-cream-100 rounded-lg border-4 border-dark-green-300">
                  {/* Building Grid */}
                  <div className="absolute inset-4 border-4 border-dark-green-400 rounded-lg bg-white">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-px bg-gray-200">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className="bg-white"></div>
                      ))}
                    </div>

                    {/* Fire Markers */}
                    {firesOnFloor.map((fire) => (
                      <motion.div
                        key={fire.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute"
                        style={{
                          left: `${(fire.coordinates.x / 400) * 100}%`,
                          top: `${(fire.coordinates.y / 300) * 100}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="relative"
                        >
                          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                            <Flame className="w-8 h-8 text-white" />
                          </div>
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {fire.room}
                          </span>
                        </motion.div>
                      </motion.div>
                    ))}

                    {/* Occupant Markers */}
                    {occupantsOnFloor.map((occupant) => (
                      <motion.div
                        key={occupant.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
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
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center justify-center gap-6">
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
              </motion.div>
            </div>

            {/* Stats Panel */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-red-500 text-white rounded-2xl shadow-lg p-6"
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
                <UserIcon className="w-8 h-8 mb-3" />
                <p className="text-green-100 text-sm mb-1">Safe</p>
                <p className="text-4xl font-bold">
                  {mockOccupantLocations.filter(o => o.status === 'safe').length}
                </p>
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
              <div className="bg-dark-green-500 text-white p-4">
                <h3 className="font-bold">Emergency AI Assistant</h3>
                <p className="text-sm opacity-90">Real-time guidance</p>
              </div>
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                {aiMessages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.2 }}
                    className="bg-cream-100 p-3 rounded-lg text-sm text-dark-green-800"
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

