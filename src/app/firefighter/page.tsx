'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import PageTransition from '@/components/shared/pageTransition';
import { motion } from 'framer-motion';
import { Flame, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { mockFireIncidents } from '@/lib/mockData';

export default function FirefighterDashboard() {
  const { user, role, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || role !== 'firefighter') {
      router.push('/login');
    }
  }, [isAuthenticated, role, router]);

  if (!user) return null;

  const activeIncidents = mockFireIncidents.filter(i => i.status === 'active');

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient py-8 px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-10 right-20 w-96 h-96 bg-gradient-to-br from-red-200/10 to-orange-200/10 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [360, 180, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-10 left-20 w-96 h-96 bg-gradient-to-tr from-orange-200/10 to-red-200/10 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-100 to-orange-100 mb-4"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                <Flame className="w-4 h-4 text-red-600" />
              </motion.div>
              <span className="text-sm font-semibold text-red-700">On Duty</span>
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-3">Firefighter Dashboard</h1>
            <p className="text-dark-green-600 text-xl">Welcome, <span className="font-semibold text-dark-green-700">{user.name}</span></p>
          </motion.div>

          {/* Active Fires Count */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="relative rounded-3xl shadow-2xl p-10 mb-8 overflow-hidden group"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-[length:200%_100%] animate-gradient-shift"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-red-600/20 to-transparent animate-shimmer"></div>
            
            {/* Floating flame particles */}
            <motion.div 
              animate={{ 
                y: [0, -20, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-10 right-10 w-16 h-16 bg-orange-400/30 rounded-full blur-2xl"
            />
            <motion.div 
              animate={{ 
                y: [0, -15, 0],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              className="absolute bottom-10 left-10 w-20 h-20 bg-red-400/30 rounded-full blur-2xl"
            />

            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-red-100 mb-3 text-lg font-semibold uppercase tracking-wide">Active Fire Incidents</p>
                <motion.p 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  className="text-7xl md:text-8xl font-bold text-white pulse-glow"
                >
                  {activeIncidents.length}
                </motion.p>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="h-2 bg-white/30 rounded-full mt-4 overflow-hidden"
                >
                  <motion.div 
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="h-full w-1/3 bg-white rounded-full"
                  />
                </motion.div>
              </div>
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                }}
                className="relative"
              >
                <Flame className="w-32 h-32 md:w-40 md:h-40 text-white/30" />
                <div className="absolute inset-0 blur-2xl bg-orange-400/50 rounded-full"></div>
              </motion.div>
            </div>
          </motion.div>

          {/* Active Incidents */}
          <div className="space-y-6">
            {activeIncidents.map((incident, index) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: 0.3 + index * 0.1,
                  type: "spring",
                  stiffness: 150,
                }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="premium-card rounded-3xl p-8 relative overflow-hidden group"
              >
                {/* Intensity-based gradient overlay */}
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${
                  incident.intensity === 'critical' ? 'bg-red-500' :
                  incident.intensity === 'severe' ? 'bg-orange-500' :
                  incident.intensity === 'moderate' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}></div>

                <div className="flex flex-col md:flex-row items-start justify-between mb-6 gap-4 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <motion.div
                        animate={{ 
                          scale: incident.intensity === 'critical' ? [1, 1.2, 1] : 1,
                        }}
                        transition={{ 
                          duration: 1,
                          repeat: incident.intensity === 'critical' ? Infinity : 0,
                        }}
                      >
                        <Flame className={`w-8 h-8 ${
                          incident.intensity === 'critical' ? 'text-red-500' :
                          incident.intensity === 'severe' ? 'text-orange-500' :
                          incident.intensity === 'moderate' ? 'text-yellow-500' :
                          'text-green-500'
                        }`} />
                      </motion.div>
                      <h3 className="text-3xl font-bold text-dark-green-800">{incident.building}</h3>
                    </div>
                    <div className="flex items-center space-x-2 text-dark-green-600 ml-11">
                      <MapPin className="w-5 h-5" />
                      <span className="text-base font-medium">{incident.address}</span>
                    </div>
                  </div>
                  <motion.span 
                    whileHover={{ scale: 1.05 }}
                    className={`px-6 py-3 rounded-2xl font-bold text-base shadow-lg ${
                      incident.intensity === 'critical' ? 'bg-gradient-to-br from-red-500 to-red-600 text-white pulse-glow' :
                      incident.intensity === 'severe' ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' :
                      incident.intensity === 'moderate' ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900' :
                      'bg-gradient-to-br from-green-400 to-green-500 text-green-900'
                    }`}
                  >
                    {incident.intensity.toUpperCase()}
                  </motion.span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative z-10">
                  <motion.div 
                    whileHover={{ y: -3 }}
                    className="bg-gradient-to-br from-cream-100 to-cream-50 p-5 rounded-2xl shadow-md"
                  >
                    <p className="text-xs text-dark-green-600 mb-2 font-semibold uppercase tracking-wide">Floors Affected</p>
                    <p className="text-2xl font-bold gradient-text">{incident.floors.join(', ')}</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ y: -3 }}
                    className="bg-gradient-to-br from-orange-100 to-orange-50 p-5 rounded-2xl shadow-md"
                  >
                    <p className="text-xs text-orange-700 mb-2 font-semibold uppercase tracking-wide">Occupants</p>
                    <p className="text-2xl font-bold text-orange-600">{incident.occupantsAffected}</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ y: -3 }}
                    className="bg-gradient-to-br from-green-100 to-green-50 p-5 rounded-2xl shadow-md"
                  >
                    <p className="text-xs text-green-700 mb-2 font-semibold uppercase tracking-wide">Evacuated</p>
                    <p className="text-2xl font-bold text-green-600">{incident.occupantsEvacuated}</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ y: -3 }}
                    className="bg-gradient-to-br from-blue-100 to-blue-50 p-5 rounded-2xl shadow-md"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-3 h-3 text-blue-700" />
                      <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Duration</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.floor((Date.now() - incident.startTime.getTime()) / 60000)}m
                    </p>
                  </motion.div>
                </div>

                <div className="flex gap-4 relative z-10">
                  <motion.button
                    onClick={() => router.push('/emergency')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-4 bg-gradient-to-r from-dark-green-500 to-dark-green-600 hover:from-dark-green-600 hover:to-dark-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-dark-green-500/30"
                  >
                    View on Map
                  </motion.button>
                  <motion.button
                    onClick={() => router.push('/firefighter/fires')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-8 py-4 border-2 border-dark-green-500 text-dark-green-700 rounded-xl hover:bg-gradient-to-br from-dark-green-50 to-white font-bold transition-all"
                  >
                    Details
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Emergency Access Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <motion.button
              onClick={() => router.push('/emergency')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-8 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white rounded-3xl shadow-2xl shadow-red-500/40 transition-all flex items-center justify-center space-x-4 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 10, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                }}
                className="relative z-10"
              >
                <AlertTriangle className="w-8 h-8" />
              </motion.div>
              <span className="text-2xl font-bold relative z-10">Emergency Response Center</span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

