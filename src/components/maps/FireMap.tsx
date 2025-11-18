'use client';

import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFireLocations, type FireLocation } from '@/app/actions/maps';

interface Props {
  buildingId: string;
  initialData: FireLocation[];
}

const FireMarker = memo(({ fire }: { fire: FireLocation }) => {
  const intensityColors = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-600'
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute"
      style={{
        left: `${fire.coordinates.x}%`,
        top: `${fire.coordinates.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className={`w-8 h-8 rounded-full flex items-center justify-center ${intensityColors[fire.intensity]} shadow-lg`}
      >
        <span className="text-white text-xs font-bold">🔥</span>
      </motion.div>
      
      {/* Tooltip */}
      <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <p className="text-xs font-semibold text-dark-green-800">Floor {fire.floor}</p>
        <p className="text-xs text-dark-green-600 capitalize">{fire.intensity} intensity</p>
        <p className="text-xs text-dark-green-600">{fire.status}</p>
      </div>
    </motion.div>
  );
});

FireMarker.displayName = 'FireMarker';

const FireMap = memo(({ buildingId, initialData }: Props) => {
  const [fireLocations, setFireLocations] = useState<FireLocation[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Poll for real-time updates every 5 seconds
    const interval = setInterval(async () => {
      setIsLoading(true);
      try {
        const data = await getFireLocations(buildingId);
        setFireLocations(data);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Failed to fetch fire locations:', error);
      } finally {
        setIsLoading(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [buildingId]);

  return (
    <div className="relative w-full h-[600px] bg-cream-100 rounded-xl overflow-hidden shadow-lg">
      {/* Map Grid Background */}
      <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 gap-1 p-4">
        {Array.from({ length: 100 }).map((_, i) => (
          <div 
            key={i} 
            className="bg-white/50 rounded border border-cream-200" 
          />
        ))}
      </div>

      {/* Fire Location Markers */}
      <AnimatePresence>
        {fireLocations.map((fire) => (
          <FireMarker key={fire.id} fire={fire} />
        ))}
      </AnimatePresence>

      {/* Status Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-dark-green-800">
            Active Fires: {fireLocations.filter(f => f.status === 'active').length}
          </p>
        </div>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg"
          >
            <span className="text-sm text-dark-green-700">Updating...</span>
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4">
        <p className="text-sm font-semibold text-dark-green-800 mb-2">Intensity</p>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-xs text-dark-green-700">Low</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-dark-green-700">Medium</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-xs text-dark-green-700">High</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-600"></div>
            <span className="text-xs text-dark-green-700">Critical</span>
          </div>
        </div>
      </div>

      {/* Last Update Time */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
        <p className="text-xs text-dark-green-600">
          Last update: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      {/* Empty State */}
      {fireLocations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-semibold text-dark-green-800 mb-2">
              All Clear
            </p>
            <p className="text-dark-green-600">
              No active fires detected
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

FireMap.displayName = 'FireMap';
export default FireMap;
