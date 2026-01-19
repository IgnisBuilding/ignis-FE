'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageTransition from '@/components/shared/pageTransition';
import { motion } from 'framer-motion';
import { Users, Activity, Building, AlertTriangle } from 'lucide-react';
import { mockResidents, mockSensors, mockBuildings } from '@/lib/mockData';

function AdminDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  const stats = [
    { label: 'Total Residents', value: mockResidents.length, icon: Users, color: 'from-blue-500 to-blue-600', glow: 'shadow-blue-500/20' },
    { label: 'Active Sensors', value: mockSensors.filter(s => s.status === 'active').length, icon: Activity, color: 'from-green-500 to-green-600', glow: 'shadow-green-500/20' },
    { label: 'Buildings', value: mockBuildings.length, icon: Building, color: 'from-purple-500 to-purple-600', glow: 'shadow-purple-500/20' },
    { label: 'Alerts', value: 3, icon: AlertTriangle, color: 'from-red-500 to-red-600', glow: 'shadow-red-500/20' }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient py-8 px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-dark-green-200/10 to-transparent rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-dark-green-300/10 to-transparent rounded-full blur-3xl"
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
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-dark-green-100 to-dark-green-50 mb-4"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-dark-green-700">System Online</span>
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-3">Admin Dashboard</h1>
            <p className="text-dark-green-600 text-xl">Welcome back, <span className="font-semibold text-dark-green-700">{user?.name}</span></p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="premium-card rounded-3xl p-7 group cursor-pointer relative overflow-hidden"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-dark-green-600 text-sm font-semibold mb-2 uppercase tracking-wide">{stat.label}</p>
                    <motion.p
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.3 + index * 0.1,
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                      className="text-5xl font-bold gradient-text"
                    >
                      {stat.value}
                    </motion.p>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                      className={`h-1 bg-gradient-to-r ${stat.color} rounded-full mt-3`}
                    />
                  </div>
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-xl ${stat.glow} relative`}
                  >
                    <stat.icon className="w-8 h-8 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 rounded-2xl"></div>
                  </motion.div>
                </div>

                {/* Sparkle effect */}
                <motion.div
                  className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full"
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.3,
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Quick Access */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="premium-card rounded-3xl p-8 md:p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-dark-green-100/30 to-transparent rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-1 h-8 bg-gradient-to-b from-dark-green-500 to-dark-green-600 rounded-full"></div>
                <h2 className="text-3xl md:text-4xl font-bold gradient-text">Quick Access</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.button
                  onClick={() => router.push('/admin/residents')}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="group p-7 premium-card rounded-2xl hover:shadow-2xl transition-all text-left relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                      className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30"
                    >
                      <Users className="w-7 h-7 text-white" />
                    </motion.div>
                    <h3 className="font-bold text-dark-green-800 text-xl mb-2 group-hover:text-blue-600 transition-colors">Manage Residents</h3>
                    <p className="text-sm text-dark-green-600 leading-relaxed">Add, edit, or remove residents from the system</p>
                    <motion.div
                      className="mt-4 flex items-center text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100"
                      initial={{ x: -10 }}
                      whileHover={{ x: 0 }}
                    >
                      <span>Manage</span>
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="ml-2"
                      >
                        →
                      </motion.span>
                    </motion.div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => router.push('/admin/sensors')}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="group p-7 premium-card rounded-2xl hover:shadow-2xl transition-all text-left relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                      className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-green-500/30"
                    >
                      <Activity className="w-7 h-7 text-white" />
                    </motion.div>
                    <h3 className="font-bold text-dark-green-800 text-xl mb-2 group-hover:text-green-600 transition-colors">Manage Sensors</h3>
                    <p className="text-sm text-dark-green-600 leading-relaxed">Monitor and configure fire safety sensors</p>
                    <motion.div
                      className="mt-4 flex items-center text-green-600 font-semibold text-sm opacity-0 group-hover:opacity-100"
                      initial={{ x: -10 }}
                      whileHover={{ x: 0 }}
                    >
                      <span>Configure</span>
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="ml-2"
                      >
                        →
                      </motion.span>
                    </motion.div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => router.push('/admin/buildings')}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="group p-7 premium-card rounded-2xl hover:shadow-2xl transition-all text-left relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                      className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-purple-500/30"
                    >
                      <Building className="w-7 h-7 text-white" />
                    </motion.div>
                    <h3 className="font-bold text-dark-green-800 text-xl mb-2 group-hover:text-purple-600 transition-colors">Manage Buildings</h3>
                    <p className="text-sm text-dark-green-600 leading-relaxed">View and update building information</p>
                    <motion.div
                      className="mt-4 flex items-center text-purple-600 font-semibold text-sm opacity-0 group-hover:opacity-100"
                      initial={{ x: -10 }}
                      whileHover={{ x: 0 }}
                    >
                      <span>View All</span>
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="ml-2"
                      >
                        →
                      </motion.span>
                    </motion.div>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['management', 'building_authority']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
