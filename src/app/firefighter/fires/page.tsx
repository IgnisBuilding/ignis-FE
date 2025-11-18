'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Flame, MapPin, Users, Clock, AlertTriangle, CheckCircle, Building2, Filter } from 'lucide-react';
import PageTransition from '@/components/shared/pageTransition';
import { fadeIn } from '@/lib/animations';
import { useAuth } from '../../../../context/AuthContext';
import { mockFireIncidents } from '@/lib/mockData';
import { FireIncident } from '../../../../types';

export default function FiresPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [incidents, setIncidents] = useState<FireIncident[]>(mockFireIncidents);
  const [filter, setFilter] = useState<'all' | 'active' | 'contained' | 'extinguished'>('all');

  useEffect(() => {
    if (!user || role !== 'firefighter') router.push('/login');
  }, [user, role, router]);

  const filteredIncidents = filter === 'all' ? incidents : incidents.filter(i => i.status === filter);
  const activeCount = incidents.filter(i => i.status === 'active').length;
  const containedCount = incidents.filter(i => i.status === 'contained').length;
  const extinguishedCount = incidents.filter(i => i.status === 'extinguished').length;

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'critical': return 'bg-red-500';
      case 'severe': return 'bg-orange-500';
      case 'moderate': return 'bg-yellow-500';
      case 'minor': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-700 border-red-200';
      case 'contained': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'extinguished': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleUpdateStatus = (id: string, newStatus: 'active' | 'contained' | 'extinguished') => {
    setIncidents(incidents.map(i => i.id === id ? { ...i, status: newStatus } : i));
  };

  const getTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  if (!user || role !== 'firefighter') return null;

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeIn} initial="initial" animate="animate">
            <div className="mb-8">
              <h1 className="text-4xl font-bold gradient-text mb-2">Fire Incident Management</h1>
              <p className="text-dark-green-600">Monitor and manage all fire incidents in real-time</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <motion.div variants={fadeIn} className="premium-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-green-600 mb-1">Total Incidents</p>
                    <h3 className="text-3xl font-bold text-dark-green-800">{incidents.length}</h3>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Flame className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} className="premium-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-green-600 mb-1">Active Fires</p>
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
                    <p className="text-sm text-dark-green-600 mb-1">Contained</p>
                    <h3 className="text-3xl font-bold text-yellow-600">{containedCount}</h3>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Flame className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} className="premium-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-green-600 mb-1">Extinguished</p>
                    <h3 className="text-3xl font-bold text-green-600">{extinguishedCount}</h3>
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
                  All ({incidents.length})
                </button>
                <button onClick={() => setFilter('active')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${filter === 'active' ? 'bg-red-500 text-white' : 'border-2 border-red-200 text-red-700 hover:bg-red-50'}`}>
                  Active ({activeCount})
                </button>
                <button onClick={() => setFilter('contained')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${filter === 'contained' ? 'bg-yellow-500 text-white' : 'border-2 border-yellow-200 text-yellow-700 hover:bg-yellow-50'}`}>
                  Contained ({containedCount})
                </button>
                <button onClick={() => setFilter('extinguished')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${filter === 'extinguished' ? 'bg-green-500 text-white' : 'border-2 border-green-200 text-green-700 hover:bg-green-50'}`}>
                  Extinguished ({extinguishedCount})
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {filteredIncidents.length === 0 ? (
                <div className="premium-card rounded-2xl p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-dark-green-800 mb-2">No incidents found</h3>
                  <p className="text-dark-green-600">No {filter !== 'all' ? filter : ''} fire incidents at this time</p>
                </div>
              ) : (
                filteredIncidents.map((incident, index) => (
                  <motion.div key={incident.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="premium-card rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start space-x-4">
                          <div className={`p-4 ${getIntensityColor(incident.intensity)} rounded-xl`}>
                            <Flame className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-dark-green-800 mb-1">{incident.building}</h3>
                            <p className="text-dark-green-600 flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span>{incident.address}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(incident.status)}`}>
                            {incident.status.toUpperCase()}
                          </span>
                          <p className="text-sm text-dark-green-500 mt-2 flex items-center justify-end space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{getTimeSince(incident.startTime)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 bg-gradient-to-br from-dark-green-50 to-white rounded-xl">
                          <p className="text-sm text-dark-green-600 mb-1">Intensity</p>
                          <p className={`font-bold text-lg capitalize ${incident.intensity === 'critical' ? 'text-red-600' : incident.intensity === 'severe' ? 'text-orange-600' : incident.intensity === 'moderate' ? 'text-yellow-600' : 'text-green-600'}`}>
                            {incident.intensity}
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-dark-green-50 to-white rounded-xl">
                          <p className="text-sm text-dark-green-600 mb-1">Affected Floors</p>
                          <p className="font-bold text-lg text-dark-green-800">
                            {incident.floors.join(', ')}
                          </p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-xl">
                          <p className="text-sm text-orange-600 mb-1">Occupants Affected</p>
                          <p className="font-bold text-lg text-orange-700">
                            {incident.occupantsAffected}
                          </p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl">
                          <p className="text-sm text-green-600 mb-1">Evacuated</p>
                          <p className="font-bold text-lg text-green-700">
                            {incident.occupantsEvacuated} / {incident.occupantsAffected}
                          </p>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button onClick={() => router.push('/emergency')} className="flex-1 py-3 px-4 green-gradient text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all font-semibold flex items-center justify-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>View on Map</span>
                        </button>
                        {incident.status === 'active' && (
                          <button onClick={() => handleUpdateStatus(incident.id, 'contained')} className="flex-1 py-3 px-4 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-semibold">
                            Mark as Contained
                          </button>
                        )}
                        {incident.status === 'contained' && (
                          <button onClick={() => handleUpdateStatus(incident.id, 'extinguished')} className="flex-1 py-3 px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold">
                            Mark as Extinguished
                          </button>
                        )}
                        {incident.status === 'extinguished' && (
                          <div className="flex-1 py-3 px-4 bg-green-100 text-green-700 rounded-xl font-semibold text-center flex items-center justify-center space-x-2">
                            <CheckCircle className="w-5 h-5" />
                            <span>Incident Resolved</span>
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
      </div>
    </PageTransition>
  );
}

