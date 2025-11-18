'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, MapPin, Users, Activity, Calendar, Shield, AlertTriangle } from 'lucide-react';
import PageTransition from '@/components/shared/pageTransition';
import { fadeIn, scaleIn } from '@/lib/animations';
import { useAuth } from '../../../../context/AuthContext';
import { mockApartmentInfo } from '@/lib/mockData';

export default function ApartmentDetailsPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const apartment = mockApartmentInfo;

  useEffect(() => {
    if (!user || role !== 'resident') router.push('/login');
  }, [user, role, router]);

  if (!user || role !== 'resident') return null;

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient py-8 px-4 relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-10 right-20 w-80 h-80 bg-gradient-to-br from-blue-200/10 to-purple-200/10 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              x: [0, -20, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-green-200/10 to-blue-200/10 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div variants={fadeIn} initial="initial" animate="animate">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-10"
            >
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 mb-4">
                <Home className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Your Residence</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-3">Apartment Details</h1>
              <p className="text-dark-green-600 text-xl">Complete information about your residence</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <motion.div variants={scaleIn} whileHover={{ y: -5, scale: 1.02 }} className="premium-card rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100/30 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="flex items-center space-x-4 mb-6 relative z-10">
                  <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }} className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg shadow-green-500/30">
                    <Home className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <p className="text-sm text-dark-green-600 font-semibold uppercase tracking-wide">Apartment</p>
                    <h3 className="text-4xl font-bold gradient-text">{apartment.number}</h3>
                  </div>
                </div>
                <div className="space-y-3 relative z-10">
                  <motion.div whileHover={{ x: 5 }} className="flex justify-between items-center py-3 px-4 rounded-xl bg-gradient-to-r from-cream-50 to-transparent hover:from-cream-100 transition-all">
                    <span className="text-dark-green-600 font-medium">Floor:</span>
                    <span className="font-bold text-dark-green-800 text-lg">Floor {apartment.floor}</span>
                  </motion.div>
                  <motion.div whileHover={{ x: 5 }} className="flex justify-between items-center py-3 px-4 rounded-xl bg-gradient-to-r from-cream-50 to-transparent hover:from-cream-100 transition-all">
                    <span className="text-dark-green-600 font-medium">Building:</span>
                    <span className="font-bold text-dark-green-800 text-lg">{apartment.building}</span>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div variants={scaleIn} whileHover={{ y: -5, scale: 1.02 }} className="premium-card rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="flex items-center space-x-4 mb-6 relative z-10">
                  <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }} className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
                    <Shield className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <p className="text-sm text-dark-green-600 font-semibold uppercase tracking-wide">Safety Score</p>
                    <h3 className="text-4xl font-bold gradient-text">{apartment.safetyScore}%</h3>
                  </div>
                </div>
                <div className="relative z-10">
                  <div className="w-full h-4 bg-cream-200 rounded-full overflow-hidden shadow-inner">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${apartment.safetyScore}%` }} transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-full shadow-lg"></motion.div>
                  </div>
                  <p className="text-sm text-dark-green-600 mt-3 font-medium">Excellent safety rating</p>
                </div>
              </motion.div>

              <motion.div variants={scaleIn} whileHover={{ y: -5, scale: 1.02 }} className="premium-card rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100/30 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="flex items-center space-x-4 mb-6 relative z-10">
                  <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }} className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/30">
                    <Activity className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <p className="text-sm text-dark-green-600 font-semibold uppercase tracking-wide">Active Sensors</p>
                    <h3 className="text-4xl font-bold gradient-text">{apartment.sensors}</h3>
                  </div>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-2">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 bg-green-500 rounded-full"></motion.div>
                    <p className="text-sm text-green-700 font-semibold">All systems operational</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={fadeIn} className="premium-card rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-dark-green-800 mb-6 flex items-center space-x-2">
                  <MapPin className="w-6 h-6 text-dark-green-600" />
                  <span>Location Information</span>
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-gradient-to-br from-dark-green-50 to-white rounded-xl">
                    <Home className="w-5 h-5 text-dark-green-600 mt-1" />
                    <div>
                      <p className="font-semibold text-dark-green-800">Building: {apartment.building}</p>
                      <p className="text-sm text-dark-green-600">Main residential tower</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-gradient-to-br from-dark-green-50 to-white rounded-xl">
                    <MapPin className="w-5 h-5 text-dark-green-600 mt-1" />
                    <div>
                      <p className="font-semibold text-dark-green-800">Floor {apartment.floor}</p>
                      <p className="text-sm text-dark-green-600">2 emergency exits available</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-gradient-to-br from-dark-green-50 to-white rounded-xl">
                    <Users className="w-5 h-5 text-dark-green-600 mt-1" />
                    <div>
                      <p className="font-semibold text-dark-green-800">Unit {apartment.number}</p>
                      <p className="text-sm text-dark-green-600">2 bedroom apartment, 950 sq ft</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} className="premium-card rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-dark-green-800 mb-6 flex items-center space-x-2">
                  <Activity className="w-6 h-6 text-dark-green-600" />
                  <span>Safety Systems</span>
                </h2>
                <div className="space-y-4">
                  <div className="p-4 border-2 border-green-200 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-dark-green-800">Smoke Detector</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Active</span>
                    </div>
                    <p className="text-sm text-dark-green-600">Last checked: 2 days ago</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-[95%]"></div>
                      </div>
                      <span className="text-xs text-dark-green-600">95%</span>
                    </div>
                  </div>
                  <div className="p-4 border-2 border-green-200 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-dark-green-800">Heat Sensor</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Active</span>
                    </div>
                    <p className="text-sm text-dark-green-600">Last checked: 1 day ago</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-[98%]"></div>
                      </div>
                      <span className="text-xs text-dark-green-600">98%</span>
                    </div>
                  </div>
                  <div className="p-4 border-2 border-yellow-200 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-dark-green-800">CO2 Monitor</span>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Maintenance Due</span>
                    </div>
                    <p className="text-sm text-dark-green-600">Last checked: 28 days ago</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 w-[78%]"></div>
                      </div>
                      <span className="text-xs text-dark-green-600">78%</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} className="premium-card rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-dark-green-800 mb-6 flex items-center space-x-2">
                  <Calendar className="w-6 h-6 text-dark-green-600" />
                  <span>Maintenance Schedule</span>
                </h2>
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-dark-green-50 to-white rounded-xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-dark-green-800">Last Inspection</p>
                        <p className="text-sm text-dark-green-600">{new Date(apartment.lastInspection).toLocaleDateString()}</p>
                      </div>
                      <Shield className="w-8 h-8 text-dark-green-600" />
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-blue-800">Next Inspection</p>
                        <p className="text-sm text-blue-600">In 15 days</p>
                      </div>
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-yellow-800">CO2 Monitor Service</p>
                        <p className="text-sm text-yellow-600">Scheduled in 3 days</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} className="premium-card rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-dark-green-800 mb-6 flex items-center space-x-2">
                  <AlertTriangle className="w-6 h-6 text-dark-green-600" />
                  <span>Emergency Information</span>
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                    <h3 className="font-semibold text-red-800 mb-2">Fire Evacuation Route</h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>â€¢ Exit apartment, turn left</li>
                      <li>â€¢ Use stairwell A (emergency exit)</li>
                      <li>â€¢ Assembly point: Front parking lot</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                    <h3 className="font-semibold text-green-800 mb-2">Emergency Contacts</h3>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>â€¢ Fire Department: 911</li>
                      <li>â€¢ Building Security: (555) 123-4567</li>
                      <li>â€¢ Maintenance: (555) 123-4568</li>
                    </ul>
                  </div>
                  <button onClick={() => router.push('/emergency')} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors">
                    View Emergency Map
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

