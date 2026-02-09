'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Activity, Thermometer, Wind, Droplets, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { fadeIn } from '@/lib/animations';
import { useAuth } from '@/context/AuthContext';
import { api, Sensor as ApiSensor } from '@/lib/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function SensorsManagementContent() {
  const { user, role, dashboardRole, roleTitle } = useAuth();
  const [sensors, setSensors] = useState<ApiSensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSensor, setEditingSensor] = useState<ApiSensor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'smoke',
    value: 0,
    unit: 'ppm',
    status: 'active',
    roomId: undefined as number | undefined,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  useEffect(() => {
    if (user && (role === 'building_authority' || role === 'management')) {
      loadSensors();
    }
  }, [user, role]);

  const loadSensors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSensors();
      setSensors(data);
    } catch (err: any) {
      console.error('Failed to load sensors:', err);
      setError(err.message || 'Failed to load sensors');
    } finally {
      setLoading(false);
    }
  };

  const filteredSensors = sensors.filter(s =>
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.status || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSensorIcon = (type?: string) => {
    if (!type) return <Activity className="w-5 h-5" />;
    switch(type.toLowerCase()) {
      case 'smoke': return <Wind className="w-5 h-5" />;
      case 'temperature': return <Thermometer className="w-5 h-5" />;
      case 'heat': return <Thermometer className="w-5 h-5" />;
      case 'gas': return <Activity className="w-5 h-5" />;
      case 'co2': return <Activity className="w-5 h-5" />;
      case 'humidity': return <Droplets className="w-5 h-5" />;
      case 'sprinkler': return <Droplets className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const handleAdd = () => {
    setEditingSensor(null);
    setFormData({
      name: '',
      type: 'smoke',
      value: 0,
      unit: 'ppm',
      status: 'active',
      roomId: undefined,
      latitude: undefined,
      longitude: undefined,
    });
    setShowModal(true);
  };

  const handleEdit = (sensor: ApiSensor) => {
    setEditingSensor(sensor);
    setFormData({
      name: sensor.name,
      type: sensor.type,
      value: sensor.value || 0,
      unit: sensor.unit || 'ppm',
      status: sensor.status,
      roomId: sensor.roomId,
      latitude: sensor.latitude,
      longitude: sensor.longitude,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this sensor?')) {
      try {
        await api.deleteSensor(id);
        await loadSensors();
      } catch (err: any) {
        alert('Failed to delete sensor: ' + err.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSensor) {
        await api.updateSensor(editingSensor.id, formData);
      } else {
        await api.createSensor(formData);
      }
      setShowModal(false);
      await loadSensors();
    } catch (err: any) {
      alert('Failed to save sensor: ' + err.message);
    }
  };

  return (
    <DashboardLayout role={dashboardRole} userName={user?.name || 'Admin'} userTitle={roleTitle}>
      <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-none">
          <motion.div variants={fadeIn} initial="initial" animate="animate">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-4xl font-bold gradient-text mb-2">Sensor Management</h1>
                <p className="text-dark-green-600">Monitor and manage all fire safety sensors</p>
              </div>
              <button onClick={handleAdd} className="flex items-center space-x-2 px-6 py-3 green-gradient text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all">
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Add Sensor</span>
              </button>
            </div>

            <div className="premium-card rounded-2xl p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-green-400 w-5 h-5" />
                <input type="text" placeholder="Search sensors by location, type, or building..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:outline-none focus:ring-2 focus:ring-dark-green-100 transition-all" />
              </div>
            </div>

            <div className="premium-card rounded-2xl overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-green-500"></div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12 text-red-600">
                  <AlertCircle className="w-6 h-6 mr-2" />
                  <span>{error}</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-dark-green-50 to-dark-green-100 border-b-2 border-dark-green-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Type</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Value</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Room ID</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Last Reading</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSensors.map((sensor, index) => (
                        <motion.tr key={sensor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="border-b border-dark-green-50 hover:bg-gradient-to-r hover:from-dark-green-50/50 hover:to-transparent transition-all">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-2.5 bg-gradient-to-br from-dark-green-100 to-dark-green-50 rounded-xl text-dark-green-600 shadow-sm">
                                {getSensorIcon(sensor.type)}
                              </div>
                              <span className="text-dark-green-800 font-semibold capitalize">{sensor.type || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-dark-green-600">{sensor.name || 'Unnamed Sensor'}</td>
                          <td className="px-6 py-4 text-dark-green-600">{sensor.value ?? 'N/A'} {sensor.unit || ''}</td>
                          <td className="px-6 py-4 text-dark-green-600">{sensor.room?.name || sensor.roomId || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${sensor.status === 'active' ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200' : sensor.status === 'alert' ? 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200' : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200'}`}>
                              {sensor.status || 'unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-dark-green-600 text-sm">
                            {sensor.lastReading ? new Date(sensor.lastReading).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button onClick={() => handleEdit(sensor)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all hover:scale-110 shadow-sm">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(sensor.id)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110 shadow-sm">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {showModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.3 }} className="premium-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-8">
                    <h2 className="text-2xl font-bold gradient-text mb-6">{editingSensor ? 'Edit Sensor' : 'Add New Sensor'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Sensor Name</label>
                          <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g., Smoke Detector - Lobby" className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Sensor Type</label>
                          <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none">
                            <option value="smoke">Smoke</option>
                            <option value="temperature">Temperature</option>
                            <option value="gas">Gas</option>
                            <option value="humidity">Humidity</option>
                            <option value="co2">CO2</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Unit</label>
                          <input type="text" required value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} placeholder="e.g., ppm, °C, %" className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Initial Value</label>
                          <input type="number" step="0.01" value={formData.value} onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value)})} className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Room ID (Optional)</label>
                          <input type="number" value={formData.roomId || ''} onChange={(e) => setFormData({...formData, roomId: e.target.value ? parseInt(e.target.value) : undefined})} placeholder="Leave empty if not assigned" className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Latitude (Optional)</label>
                          <input type="number" step="0.000001" value={formData.latitude || ''} onChange={(e) => setFormData({...formData, latitude: e.target.value ? parseFloat(e.target.value) : undefined})} placeholder="e.g., 24.8607" className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Longitude (Optional)</label>
                          <input type="number" step="0.000001" value={formData.longitude || ''} onChange={(e) => setFormData({...formData, longitude: e.target.value ? parseFloat(e.target.value) : undefined})} placeholder="e.g., 67.0011" className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Status</label>
                          <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="alert">Alert</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex space-x-4 pt-4">
                        <button type="submit" className="flex-1 py-3.5 green-gradient text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all font-bold">
                          {editingSensor ? 'Update Sensor' : 'Add Sensor'}
                        </button>
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 border-2 border-dark-green-200 text-dark-green-700 rounded-xl hover:bg-dark-green-50 hover:border-dark-green-300 transition-all font-semibold">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default function SensorsManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'building_authority']}>
      <SensorsManagementContent />
    </ProtectedRoute>
  );
}
