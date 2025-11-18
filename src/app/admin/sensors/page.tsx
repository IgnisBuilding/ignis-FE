'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Activity, Thermometer, Wind, Droplets } from 'lucide-react';
import PageTransition from '@/components/shared/pageTransition';
import { fadeIn } from '@/lib/animations';
import { useAuth } from '../../../../context/AuthContext';
import { mockSensors } from '@/lib/mockData';
import { Sensor } from '../../../../types';

export default function SensorsManagementPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [sensors, setSensors] = useState<Sensor[]>(mockSensors);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [formData, setFormData] = useState({
    type: 'smoke' as 'smoke' | 'heat' | 'co2' | 'sprinkler',
    location: '', floor: 1, building: '',
    status: 'active' as 'active' | 'inactive' | 'maintenance',
    batteryLevel: 100, sensitivity: 'medium' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    if (!user || role !== 'building_authority') router.push('/login');
  }, [user, role, router]);

  const filteredSensors = sensors.filter(s =>
    s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.building.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSensorIcon = (type: string) => {
    switch(type) {
      case 'smoke': return <Wind className="w-5 h-5" />;
      case 'heat': return <Thermometer className="w-5 h-5" />;
      case 'co2': return <Activity className="w-5 h-5" />;
      case 'sprinkler': return <Droplets className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const handleAdd = () => {
    setEditingSensor(null);
    setFormData({ type: 'smoke', location: '', floor: 1, building: '', status: 'active', batteryLevel: 100, sensitivity: 'medium' });
    setShowModal(true);
  };

  const handleEdit = (sensor: Sensor) => {
    setEditingSensor(sensor);
    setFormData({
      type: sensor.type, location: sensor.location, floor: sensor.floor,
      building: sensor.building, status: sensor.status,
      batteryLevel: sensor.batteryLevel || 100, sensitivity: sensor.sensitivity
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this sensor?')) {
      setSensors(sensors.filter(s => s.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSensor) {
      setSensors(sensors.map(s => s.id === editingSensor.id ? { ...s, ...formData, lastChecked: new Date() } : s));
    } else {
      const newSensor: Sensor = {
        id: `S${Date.now()}`,
        ...formData,
        lastChecked: new Date()
      };
      setSensors([...sensors, newSensor]);
    }
    setShowModal(false);
  };

  if (!user || role !== 'building_authority') return null;

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient py-8 px-4">
        <div className="max-w-7xl mx-auto">
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-dark-green-50 to-dark-green-100 border-b-2 border-dark-green-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Location</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Floor</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Building</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Battery</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Status</th>
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
                            <span className="text-dark-green-800 font-semibold capitalize">{sensor.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-dark-green-600">{sensor.location}</td>
                        <td className="px-6 py-4 text-dark-green-600">Floor {sensor.floor}</td>
                        <td className="px-6 py-4 text-dark-green-600">{sensor.building}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-24 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                              <div className={`h-full rounded-full transition-all ${(sensor.batteryLevel || 0) > 50 ? 'bg-gradient-to-r from-green-400 to-green-500' : (sensor.batteryLevel || 0) > 20 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${sensor.batteryLevel || 0}%` }}></div>
                            </div>
                            <span className="text-xs font-semibold text-dark-green-600">{sensor.batteryLevel}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${sensor.status === 'active' ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200' : sensor.status === 'maintenance' ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200'}`}>
                            {sensor.status}
                          </span>
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
            </div>

            {showModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.3 }} className="premium-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-8">
                    <h2 className="text-2xl font-bold gradient-text mb-6">{editingSensor ? 'Edit Sensor' : 'Add New Sensor'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Sensor Type</label>
                          <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as any})} className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none">
                            <option value="smoke">Smoke Detector</option>
                            <option value="heat">Heat Sensor</option>
                            <option value="co2">CO2 Monitor</option>
                            <option value="sprinkler">Sprinkler System</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Location</label>
                          <input type="text" required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Floor</label>
                          <input type="number" required min="1" value={formData.floor} onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value)})} className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Building</label>
                          <input type="text" required value={formData.building} onChange={(e) => setFormData({...formData, building: e.target.value})} className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Battery Level (%)</label>
                          <input type="number" required min="0" max="100" value={formData.batteryLevel} onChange={(e) => setFormData({...formData, batteryLevel: parseInt(e.target.value)})} className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Sensitivity</label>
                          <select value={formData.sensitivity} onChange={(e) => setFormData({...formData, sensitivity: e.target.value as any})} className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Status</label>
                          <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="maintenance">Maintenance</option>
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
      </div>
    </PageTransition>
  );
}
