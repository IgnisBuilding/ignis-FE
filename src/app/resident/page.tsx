'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import PageTransition from '@/components/shared/pageTransition';
import { motion } from 'framer-motion';
import { Building, Bell, Shield, AlertTriangle } from 'lucide-react';
import { mockApartmentInfo, mockAlerts } from '@/lib/mockData';

export default function ResidentDashboard() {
  const { user, role, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || role !== 'resident') {
      router.push('/login');
    }
  }, [isAuthenticated, role, router]);

  if (!user) return null;

  const recentAlerts = mockAlerts.filter(a => !a.read).slice(0, 3);

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient py-8 px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 right-10 w-80 h-80 bg-gradient-to-br from-blue-200/10 to-transparent rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              x: [0, -30, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-20 left-10 w-80 h-80 bg-gradient-to-tr from-green-200/10 to-transparent rounded-full blur-3xl"
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
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-100 to-green-50 mb-4"
            >
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Protected</span>
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-3">Resident Dashboard</h1>
            <p className="text-dark-green-600 text-xl">Welcome back, <span className="font-semibold text-dark-green-700">{user.name}</span></p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Apartment Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="premium-card rounded-3xl p-8 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-3xl font-bold gradient-text">My Apartment</h2>
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30"
                >
                  <Building className="w-7 h-7 text-white" />
                </motion.div>
              </div>
              
              <div className="space-y-4 relative z-10">
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex justify-between items-center py-4 px-4 rounded-xl bg-gradient-to-r from-cream-50 to-transparent hover:from-cream-100 transition-all"
                >
                  <span className="text-dark-green-600 font-medium">Apartment</span>
                  <span className="font-bold text-dark-green-800 text-lg">{mockApartmentInfo.number}</span>
                </motion.div>
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex justify-between items-center py-4 px-4 rounded-xl bg-gradient-to-r from-cream-50 to-transparent hover:from-cream-100 transition-all"
                >
                  <span className="text-dark-green-600 font-medium">Floor</span>
                  <span className="font-bold text-dark-green-800 text-lg">{mockApartmentInfo.floor}</span>
                </motion.div>
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex justify-between items-center py-4 px-4 rounded-xl bg-gradient-to-r from-cream-50 to-transparent hover:from-cream-100 transition-all"
                >
                  <span className="text-dark-green-600 font-medium">Building</span>
                  <span className="font-bold text-dark-green-800 text-lg">{mockApartmentInfo.building}</span>
                </motion.div>
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex justify-between items-center py-4 px-4 rounded-xl bg-gradient-to-r from-cream-50 to-transparent hover:from-cream-100 transition-all"
                >
                  <span className="text-dark-green-600 font-medium">Active Sensors</span>
                  <span className="font-bold text-dark-green-800 text-lg">{mockApartmentInfo.sensors}</span>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex justify-between items-center py-6 px-4 rounded-xl bg-gradient-to-r from-green-50 via-green-100 to-green-50 shadow-lg"
                >
                  <span className="text-green-700 font-bold text-lg">Safety Score</span>
                  <div className="flex items-center space-x-3">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100px" }}
                      transition={{ delay: 0.5, duration: 1 }}
                      className="h-3 bg-cream-200 rounded-full overflow-hidden"
                    >
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${mockApartmentInfo.safetyScore}%` }}
                        transition={{ delay: 0.7, duration: 1.2 }}
                        className="h-full bg-gradient-to-r from-green-500 to-green-600"
                      />
                    </motion.div>
                    <span className="font-bold text-green-600 text-2xl pulse-glow">{mockApartmentInfo.safetyScore}%</span>
                  </div>
                </motion.div>
              </div>

              <motion.button
                onClick={() => router.push('/resident/apartment')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all relative z-10"
              >
                View Full Details
              </motion.button>
            </motion.div>

            {/* Recent Alerts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="premium-card rounded-3xl p-8 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-orange-100/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-3xl font-bold gradient-text">Recent Alerts</h2>
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 relative"
                >
                  <Bell className="w-7 h-7 text-white" />
                  {recentAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold pulse-glow">
                      {recentAlerts.length}
                    </span>
                  )}
                </motion.div>
              </div>
              
              <div className="space-y-4 relative z-10">
                {recentAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, type: "spring" }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className={`p-5 rounded-2xl border-l-4 shadow-lg relative overflow-hidden group ${
                      alert.priority === 'critical' ? 'border-red-500 bg-gradient-to-r from-red-50 to-red-100/50' :
                      alert.priority === 'high' ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100/50' :
                      'border-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-100/50'
                    }`}
                  >
                    <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 ${
                      alert.priority === 'critical' ? 'bg-red-500' :
                      alert.priority === 'high' ? 'bg-orange-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <p className="font-bold text-dark-green-800 mb-2 text-base relative z-10">{alert.message}</p>
                    <div className="flex items-center justify-between relative z-10">
                      <p className="text-xs text-dark-green-600 font-medium">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        alert.priority === 'critical' ? 'bg-red-200 text-red-700' :
                        alert.priority === 'high' ? 'bg-orange-200 text-orange-700' :
                        'bg-yellow-200 text-yellow-700'
                      }`}>
                        {alert.priority.toUpperCase()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <motion.button
                onClick={() => router.push('/resident/alerts')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 py-4 border-2 border-dark-green-500 text-dark-green-700 rounded-xl hover:bg-gradient-to-br from-dark-green-50 to-white transition-all font-semibold relative z-10"
              >
                View All Alerts
              </motion.button>
            </motion.div>
          </div>

          {/* Emergency Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <motion.button
              onClick={() => router.push('/emergency')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-8 bg-gradient-to-r from-red-500 via-red-600 to-orange-500 hover:from-red-600 hover:via-red-700 hover:to-orange-600 text-white rounded-3xl shadow-2xl shadow-red-500/40 transition-all flex items-center justify-center space-x-4 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
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

