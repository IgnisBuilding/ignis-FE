'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Flame, MapPin, Users, Clock, AlertTriangle, CheckCircle, Building2, Filter } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { fadeIn } from '@/lib/animations';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface Hazard {
  id: number;
  type: string;
  severity: string;
  status: string;
  apartment: {
    id: number;
    unit_number: string;
    floor: {
      id: number;
      name: string;
      level: number;
      building: {
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
}

function FiresPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'responding' | 'resolved'>('all');

  useEffect(() => {
    if (user && role === 'firefighter') {
      fetchHazards();
    }
  }, [user, role]);

  const fetchHazards = async () => {
    try {
      const data = await api.getHazards();
      console.log('Fetched hazards:', JSON.stringify(data, null, 2));
      setHazards(data);
    } catch (error) {
      console.error('Failed to fetch hazards:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHazards = filter === 'all' ? hazards : hazards.filter(h => h.status?.toLowerCase() === filter);
  const activeCount = hazards.filter(h => h.status?.toLowerCase() === 'active' || h.status?.toLowerCase() === 'reported').length;
  const respondingCount = hazards.filter(h => h.status?.toLowerCase() === 'responding' || h.status?.toLowerCase() === 'responded').length;
  const resolvedCount = hazards.filter(h => h.status?.toLowerCase() === 'resolved').length;

  const getSeverityColor = (severity: string) => {
    const severityLower = severity?.toLowerCase();
    switch (severityLower) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'active':
      case 'reported': return 'bg-red-100 text-red-700 border-red-200';
      case 'responding':
      case 'responded': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      if (newStatus === 'responding') {
        await api.respondToHazard(id);
      } else if (newStatus === 'resolved') {
        await api.resolveHazard(id);
      }
      await fetchHazards();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getTimeSince = (date: Date) => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date:', date);
        return 'Invalid Date';
      }
      const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return `${seconds}s ago`;
    } catch (error) {
      console.error('Error in getTimeSince:', error, date);
      return 'Unknown';
    }
  };

  if (!user || role !== 'firefighter') return null;

  if (loading) {
    return (
      <DashboardLayout role="firefighter" userName={user?.name || 'Commander'} userTitle="FIREFIGHTER">
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-dark-green-600">Loading hazards...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="firefighter" userName={user?.name || 'Commander'} userTitle="FIREFIGHTER">
      <div className="p-6 max-w-7xl mx-auto">
          <motion.div variants={fadeIn} initial="initial" animate="animate">
            <div className="mb-8">
              <h1 className="text-4xl font-bold gradient-text mb-2">Fire Incident Management</h1>
              <p className="text-dark-green-600">Monitor and manage all fire incidents in real-time</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <motion.div variants={fadeIn} className="premium-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-green-600 mb-1">Total Hazards</p>
                    <h3 className="text-3xl font-bold text-dark-green-800">{hazards.length}</h3>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Flame className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} className="premium-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-green-600 mb-1">Active</p>
                    <h3 className="text-3xl font-bold text-red-600">{activeCount}</h3>
                  </div>
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} className="premium-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-green-600 mb-1">Responding</p>
                    <h3 className="text-3xl font-bold text-yellow-600">{respondingCount}</h3>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Flame className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} className="premium-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-green-600 mb-1">Resolved</p>
                    <h3 className="text-3xl font-bold text-green-600">{resolvedCount}</h3>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="premium-card rounded-2xl p-6 mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Filter className="w-5 h-5 text-dark-green-600" />
                <h3 className="text-lg font-bold text-dark-green-800">Filter by Status</h3>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => setFilter('all')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${filter === 'all' ? 'green-gradient text-white' : 'border-2 border-dark-green-200 text-dark-green-700 hover:bg-dark-green-50'}`}>
                  All ({hazards.length})
                </button>
                <button onClick={() => setFilter('active')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${filter === 'active' ? 'bg-red-500 text-white' : 'border-2 border-red-200 text-red-700 hover:bg-red-50'}`}>
                  Active ({activeCount})
                </button>
                <button onClick={() => setFilter('responding')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${filter === 'responding' ? 'bg-yellow-500 text-white' : 'border-2 border-yellow-200 text-yellow-700 hover:bg-yellow-50'}`}>
                  Responding ({respondingCount})
                </button>
                <button onClick={() => setFilter('resolved')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${filter === 'resolved' ? 'bg-green-500 text-white' : 'border-2 border-green-200 text-green-700 hover:bg-green-50'}`}>
                  Resolved ({resolvedCount})
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {filteredHazards.length === 0 ? (
                <div className="premium-card rounded-2xl p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-dark-green-800 mb-2">No hazards found</h3>
                  <p className="text-dark-green-600">No {filter !== 'all' ? filter : ''} hazards at this time</p>
                </div>
              ) : (
                filteredHazards.map((hazard, index) => (
                  <motion.div key={hazard.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="premium-card rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start space-x-4">
                          <div className={`p-4 ${getSeverityColor(hazard.severity)} rounded-xl`}>
                            <Flame className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-dark-green-800 mb-1">{hazard.apartment?.floor?.building?.name || 'Unknown Building'}</h3>
                            <p className="text-dark-green-600 flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span>{hazard.apartment?.floor?.building?.address || 'N/A'}</span>
                            </p>
                            <p className="text-sm text-dark-green-500 mt-1">
                              Unit {hazard.apartment?.unit_number || 'N/A'} - {hazard.apartment?.floor?.name || `Floor ${hazard.apartment?.floor?.level}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(hazard.status)}`}>
                            {hazard.status.toUpperCase()}
                          </span>
                          <p className="text-sm text-dark-green-500 mt-2 flex items-center justify-end space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{hazard.created_at ? getTimeSince(hazard.created_at as any) : 'N/A'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-gradient-to-br from-dark-green-50 to-white rounded-xl">
                          <p className="text-sm text-dark-green-600 mb-1">Severity</p>
                          <p className={`font-bold text-lg capitalize ${hazard.severity === 'critical' ? 'text-red-600' : hazard.severity === 'high' ? 'text-orange-600' : hazard.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                            {hazard.severity}
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-dark-green-50 to-white rounded-xl">
                          <p className="text-sm text-dark-green-600 mb-1">Type</p>
                          <p className="font-bold text-lg text-dark-green-800 capitalize">
                            {hazard.type}
                          </p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl">
                          <p className="text-sm text-blue-600 mb-1">Reported</p>
                          <p className="font-bold text-sm text-blue-700">
                            {hazard.created_at ? new Date(hazard.created_at).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button onClick={() => router.push('/emergency')} className="flex-1 py-3 px-4 green-gradient text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all font-semibold flex items-center justify-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>View on Map</span>
                        </button>
                        {(hazard.status === 'active' || hazard.status === 'reported') && (
                          <button onClick={() => handleUpdateStatus(hazard.id, 'responding')} className="flex-1 py-3 px-4 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-semibold">
                            Respond to Hazard
                          </button>
                        )}
                        {hazard.status === 'responding' && (
                          <button onClick={() => handleUpdateStatus(hazard.id, 'resolved')} className="flex-1 py-3 px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold">
                            Mark as Resolved
                          </button>
                        )}
                        {hazard.status === 'resolved' && (
                          <div className="flex-1 py-3 px-4 bg-green-100 text-green-700 rounded-xl font-semibold text-center flex items-center justify-center space-x-2">
                            <CheckCircle className="w-5 h-5" />
                            <span>Hazard Resolved</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
      </div>
    </DashboardLayout>
  );
}

function FiresPageWrapper() {
  return (
    <ProtectedRoute allowedRoles={['firefighter']}>
      <FiresPage />
    </ProtectedRoute>
  );
}

export default FiresPageWrapper;

