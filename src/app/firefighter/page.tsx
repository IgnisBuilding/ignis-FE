'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageTransition from '@/components/shared/pageTransition';
import { motion } from 'framer-motion';
import { Flame, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

interface Hazard {
  id: number;
  type: string;
  severity: string;
  status: string;
  description?: string;
  apartment: {
    id: number;
    unit_number: string;
    floor: {
      id: number;
      level: number;
      building: {
        id: number;
        name: string;
        address: string;
      };
    };
  };
  node?: {
    id: number;
  };
  created_at: string;
  updated_at: string;
  responded_at?: string;
  resolved_at?: string;
}

function FirefighterDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHazards();
  }, []);

  const fetchHazards = async () => {
    try {
      const data = await api.getActiveHazards();
      console.log('Fetched active hazards:', JSON.stringify(data, null, 2));
      setHazards(data);
    } catch (error) {
      console.error('Failed to fetch hazards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id: string) => {
    try {
      await api.respondToHazard(id);
      await fetchHazards(); // Refresh the list
    } catch (error) {
      console.error('Failed to respond to hazard:', error);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await api.resolveHazard(id);
      await fetchHazards(); // Refresh the list
    } catch (error) {
      console.error('Failed to resolve hazard:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const activeIncidents = hazards.filter(e => {
    const status = e.status?.toLowerCase();
    return status === 'active' || status === 'reported' || status === 'responding' || status === 'responded';
  });

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen cream-gradient flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-dark-green-600">Loading hazards...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

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
            <p className="text-dark-green-600 text-xl">Welcome, <span className="font-semibold text-dark-green-700">{user?.name}</span></p>
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
                  className="text-7xl md:text-8xl font-bold text-white"
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
            {activeIncidents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="premium-card rounded-3xl p-12 text-center"
              >
                <Flame className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-dark-green-600">No active hazards at the moment</p>
              </motion.div>
            ) : (
              activeIncidents.map((incident, index) => (
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
                    incident.severity?.toLowerCase() === 'critical' ? 'bg-red-500' :
                    incident.severity?.toLowerCase() === 'high' ? 'bg-orange-500' :
                    incident.severity?.toLowerCase() === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}></div>

                  <div className="flex flex-col md:flex-row items-start justify-between mb-6 gap-4 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <motion.div
                          animate={{ 
                            scale: incident.severity?.toLowerCase() === 'critical' ? [1, 1.2, 1] : 1,
                          }}
                          transition={{ 
                            duration: 1,
                            repeat: incident.severity?.toLowerCase() === 'critical' ? Infinity : 0,
                          }}
                        >
                          <Flame className={`w-8 h-8 ${
                            incident.severity?.toLowerCase() === 'critical' ? 'text-red-500' :
                            incident.severity?.toLowerCase() === 'high' ? 'text-orange-500' :
                            incident.severity?.toLowerCase() === 'medium' ? 'text-yellow-500' :
                            'text-green-500'
                          }`} />
                        </motion.div>
                        <h3 className="text-3xl font-bold text-dark-green-800">{incident.type || 'Fire'}</h3>
                      </div>
                      <div className="space-y-2 ml-11">
                        <div className="flex items-start space-x-2 text-dark-green-700">
                          <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-bold text-lg">{incident.apartment?.floor?.building?.name || 'Unknown Building'}</div>
                            <div className="text-sm text-dark-green-600">{incident.apartment?.floor?.building?.address || 'Address not available'}</div>
                            <div className="text-sm font-medium mt-1">
                              {incident.apartment?.floor?.name || `Floor ${incident.apartment?.floor?.level}`} • Apartment {incident.apartment?.unit_number}
                            </div>
                            {incident.description && (
                              <div className="text-sm text-dark-green-600 mt-2 italic">
                                {incident.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <motion.span 
                      whileHover={{ scale: 1.05 }}
                      className={`px-6 py-3 rounded-2xl font-bold text-base shadow-lg ${
                        incident.severity?.toLowerCase() === 'critical' ? 'bg-gradient-to-br from-red-500 to-red-600 text-white pulse-glow' :
                        incident.severity?.toLowerCase() === 'high' ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' :
                        incident.severity?.toLowerCase() === 'medium' ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900' :
                        'bg-gradient-to-br from-green-400 to-green-500 text-green-900'
                      }`}
                    >
                      {incident.severity.toUpperCase()}
                    </motion.span>
                  </div>



                  <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                    <motion.div 
                      whileHover={{ y: -3 }}
                      className="bg-gradient-to-br from-blue-100 to-blue-50 p-5 rounded-2xl shadow-md"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-700" />
                        <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Reported</p>
                      </div>
                      <p className="text-base font-bold text-blue-900">
                        {incident.created_at ? formatDate(incident.created_at) : 'N/A'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {incident.created_at ? getTimeSince(incident.created_at) : ''}
                      </p>
                    </motion.div>
                    <motion.div 
                      whileHover={{ y: -3 }}
                      className="bg-gradient-to-br from-purple-100 to-purple-50 p-5 rounded-2xl shadow-md"
                    >
                      <p className="text-xs text-purple-700 mb-2 font-semibold uppercase tracking-wide">Status</p>
                      <p className="text-lg font-bold text-purple-600 capitalize">{incident.status}</p>
                    </motion.div>
                  </div>

                  <div className="flex gap-4 relative z-10">
                    {(incident.status?.toLowerCase() === 'active' || incident.status?.toLowerCase() === 'reported') && (
                      <motion.button
                        onClick={() => handleRespond(incident.id)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30"
                      >
                        Respond to Hazard
                      </motion.button>
                    )}
                    {(incident.status?.toLowerCase() === 'responding' || incident.status?.toLowerCase() === 'responded') && (
                      <motion.button
                        onClick={() => handleResolve(incident.id)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/30"
                      >
                        Mark as Resolved
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => router.push('/emergency')}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="px-8 py-4 border-2 border-dark-green-500 text-dark-green-700 rounded-xl hover:bg-gradient-to-br from-dark-green-50 to-white font-bold transition-all"
                    >
                      View on Map
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
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

export default function FirefighterDashboard() {
  return (
    <ProtectedRoute allowedRoles={['firefighter']}>
      <FirefighterDashboardContent />
    </ProtectedRoute>
  );
}
