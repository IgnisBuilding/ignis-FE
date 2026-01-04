'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageTransition from '@/components/shared/pageTransition';
import { motion } from 'framer-motion';
import { Building, Bell, Shield, AlertTriangle, Home, MapPin, Users } from 'lucide-react';
import { mockAlerts } from '@/lib/mockData';
import { useEffect, useState } from 'react';

interface ApartmentInfo {
  id: number;
  number: string;
  floor: {
    id: number;
    name: string;
    level: number;
  };
  building: {
    id: number;
    name: string;
    address: string;
    type: string;
  };
  status: string;
  occupied: boolean;
}

function ResidentDashboardContent() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [apartmentInfo, setApartmentInfo] = useState<ApartmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Log every render
  console.log('=== ResidentDashboard Render ===');
  console.log('user:', user);
  console.log('isAuthenticated:', isAuthenticated);
  console.log('authLoading:', authLoading);
  console.log('apartmentInfo:', apartmentInfo);
  console.log('loading:', loading);

  useEffect(() => {
    console.log('=== useEffect TRIGGERED ===');
    console.log('Current user:', user);
    console.log('Is authenticated:', isAuthenticated);
    console.log('Auth loading:', authLoading);

    // If still loading auth, don't do anything
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }

    // If not authenticated after loading is done, redirect
    if (!isAuthenticated || !user) {
      console.log('Not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    // User is authenticated, fetch apartment data
    console.log('User authenticated, calling fetchApartmentData');
    fetchApartmentData();
  }, [user, isAuthenticated, authLoading]);

  const fetchApartmentData = async () => {
    console.log('=== fetchApartmentData STARTED ===');
    
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('ignis_token');
      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length);
      console.log('Token preview:', token?.substring(0, 30) + '...');

      if (!token) {
        console.error('No token found in localStorage');
        throw new Error('No authentication token found');
      }

      const url = 'http://localhost:7000/apartments/my-apartment';
      console.log('Making fetch request to:', url);
      console.log('With Authorization header');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('Response received:');
      console.log('- status:', response.status);
      console.log('- statusText:', response.statusText);
      console.log('- ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to fetch apartment data: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Raw API data:', JSON.stringify(data, null, 2));

      // Transform the data
      const transformedData: ApartmentInfo = {
        id: data.id,
        number: data.unit_number || data.number,
        floor: {
          id: data.floor.id,
          name: data.floor.name || `Floor ${data.floor.level}`,
          level: data.floor.level,
        },
        building: {
          id: data.building.id,
          name: data.building.name,
          address: data.building.address,
          type: data.building.type || 'residential',
        },
        status: data.occupied ? 'Occupied' : 'Vacant',
        occupied: data.occupied,
      };

      console.log('Transformed data:', transformedData);
      console.log('Setting apartmentInfo state');
      setApartmentInfo(transformedData);
      console.log('apartmentInfo state set successfully');
    } catch (err) {
      console.error('=== ERROR in fetchApartmentData ===');
      console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err);
      console.error('Error message:', err instanceof Error ? err.message : String(err));
      console.error('Full error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load apartment information');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const recentAlerts = mockAlerts.filter(a => !a.read).slice(0, 3);

  if (authLoading) {
    console.log('Rendering: Auth Loading Screen');
    return (
      <div className="min-h-screen flex items-center justify-center cream-gradient">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    console.log('Rendering: Not authenticated (returning null)');
    return null;
  }

  if (loading) {
    console.log('Rendering: Loading Skeleton');
    return (
      <PageTransition>
        <div className="min-h-screen cream-gradient p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <p className="text-center text-gray-600 mt-4">Fetching your apartment data...</p>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    console.log('Rendering: Error State');
    return (
      <PageTransition>
        <div className="min-h-screen cream-gradient p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-2xl shadow-lg p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Data</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchApartmentData}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!apartmentInfo) {
    console.log('Rendering: No Apartment Assigned');
    return (
      <PageTransition>
        <div className="min-h-screen cream-gradient p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl shadow-lg p-8 text-center">
              <Home className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-yellow-800 mb-2">No Apartment Assigned</h2>
              <p className="text-yellow-600">You don't have an apartment assigned yet. Please contact management.</p>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  console.log('Rendering: Main Dashboard with apartment data');
  
  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Resident Dashboard
                </h1>
                <p className="text-gray-600">Welcome back, {user.name}! View your apartment information and safety status</p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </motion.div>

          {/* Apartment Info Card */}
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
            <p className="text-dark-green-600 text-xl">Welcome, <span className="font-semibold text-dark-green-700">{user?.name}</span></p>
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
                  <span className="font-bold text-dark-green-800 text-lg">{apartmentInfo.number}</span>
                </motion.div>
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex justify-between items-center py-4 px-4 rounded-xl bg-gradient-to-r from-cream-50 to-transparent hover:from-cream-100 transition-all"
                >
                  <span className="text-dark-green-600 font-medium">Floor</span>
                  <span className="font-bold text-dark-green-800 text-lg">{apartmentInfo.floor.name}</span>
                </motion.div>
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex justify-between items-center py-4 px-4 rounded-xl bg-gradient-to-r from-cream-50 to-transparent hover:from-cream-100 transition-all"
                >
                  <span className="text-dark-green-600 font-medium">Building</span>
                  <span className="font-bold text-dark-green-800 text-lg">{apartmentInfo.building.name}</span>
                </motion.div>
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex justify-between items-center py-4 px-4 rounded-xl bg-gradient-to-r from-cream-50 to-transparent hover:from-cream-100 transition-all"
                >
                  <span className="text-dark-green-600 font-medium">Address</span>
                  <span className="font-bold text-dark-green-800 text-lg">{apartmentInfo.building.address}</span>
                </motion.div>
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex justify-between items-center py-4 px-4 rounded-xl bg-gradient-to-r from-cream-50 to-transparent hover:from-cream-100 transition-all"
                >
                  <span className="text-dark-green-600 font-medium">Status</span>
                  <span className={`font-bold text-lg ${apartmentInfo.occupied ? 'text-green-600' : 'text-gray-600'}`}>
                    {apartmentInfo.status}
                  </span>
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

export default function ResidentDashboard() {
  return (
    <ProtectedRoute allowedRoles={['resident']}>
      <ResidentDashboardContent />
    </ProtectedRoute>
  );
}
