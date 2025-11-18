'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Building2, Users, Activity, DoorOpen } from 'lucide-react';
import PageTransition from '@/components/shared/pageTransition';
import { fadeIn } from '@/lib/animations';
import { useAuth } from '../../../../context/AuthContext';
import { mockBuildings } from '@/lib/mockData';
import { Building } from '../../../../types';

export default function BuildingsManagementPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>(mockBuildings);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [formData, setFormData] = useState({
    name: '', address: '', floors: 1, apartments: 0, sensors: 0,
    residents: 0, emergencyExits: 0,
    status: 'operational' as 'operational' | 'maintenance' | 'emergency'
  });

  useEffect(() => {
    if (!user || role !== 'building_authority') router.push('/login');
  }, [user, role, router]);

  const filteredBuildings = buildings.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingBuilding(null);
    setFormData({ name: '', address: '', floors: 1, apartments: 0, sensors: 0, residents: 0, emergencyExits: 0, status: 'operational' });
    setShowModal(true);
  };

  const handleEdit = (building: Building) => {
    setEditingBuilding(building);
    setFormData({
      name: building.name, address: building.address, floors: building.floors,
      apartments: building.apartments, sensors: building.sensors,
      residents: building.residents, emergencyExits: building.emergencyExits,
      status: building.status
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this building?')) {
      setBuildings(buildings.filter(b => b.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBuilding) {
      setBuildings(buildings.map(b => b.id === editingBuilding.id ? { ...b, ...formData, lastInspection: new Date() } : b));
    } else {
      const newBuilding: Building = {
        id: `B${Date.now()}`,
        ...formData,
        lastInspection: new Date()
      };
      setBuildings([...buildings, newBuilding]);
    }
    setShowModal(false);
  };

  if (!user || role !== 'building_authority') return null;

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeIn} initial="initial" animate="animate">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold gradient-text mb-2">Building Management</h1>
                <p className="text-dark-green-600">Manage all buildings and their facilities</p>
              </div>
              <button onClick={handleAdd} className="flex items-center space-x-2 px-6 py-3.5 green-gradient font-bold text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all">
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Add Building</span>
              </button>
            </div>

            <div className="premium-card rounded-2xl hover-lift p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-green-400 w-5 h-5" />
                <input type="text" placeholder="Search buildings by name or address..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBuildings.map((building, index) => (
                <motion.div key={building.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="premium-card rounded-2xl hover-lift overflow-hidden transition-all">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 green-gradient rounded-xl">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-dark-green-800">{building.name}</h3>
                          <p className="text-sm text-dark-green-600">{building.address}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full font-bold text-xs font-semibold ${building.status === 'operational' ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200' : building.status === 'maintenance' ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200'}`}>
                        {building.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-dark-green-600" />
                        <span className="text-sm text-dark-green-600">{building.floors} Floors</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-dark-green-600" />
                        <span className="text-sm text-dark-green-600">{building.residents} Residents</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-dark-green-600" />
                        <span className="text-sm text-dark-green-600">{building.sensors} Sensors</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DoorOpen className="w-4 h-4 text-dark-green-600" />
                        <span className="text-sm text-dark-green-600">{building.emergencyExits} Exits</span>
                      </div>
                    </div>

                    <div className="text-xs text-dark-green-500 mb-4">
                      Last Inspection: {new Date(building.lastInspection).toLocaleDateString()}
                    </div>

                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(building)} className="flex-1 py-2 px-4 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-semibold text-sm flex items-center justify-center space-x-2">
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button onClick={() => handleDelete(building.id)} className="flex-1 py-2 px-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-semibold text-sm flex items-center justify-center space-x-2">
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {showModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl premium-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-dark-green-800 mb-6">{editingBuilding ? 'Edit Building' : 'Add New Building'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Building Name</label>
                          <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Address</label>
                          <input type="text" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Number of Floors</label>
                          <input type="number" required min="1" value={formData.floors} onChange={(e) => setFormData({...formData, floors: parseInt(e.target.value)})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Apartments</label>
                          <input type="number" required min="0" value={formData.apartments} onChange={(e) => setFormData({...formData, apartments: parseInt(e.target.value)})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Sensors</label>
                          <input type="number" required min="0" value={formData.sensors} onChange={(e) => setFormData({...formData, sensors: parseInt(e.target.value)})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Residents</label>
                          <input type="number" required min="0" value={formData.residents} onChange={(e) => setFormData({...formData, residents: parseInt(e.target.value)})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Emergency Exits</label>
                          <input type="number" required min="1" value={formData.emergencyExits} onChange={(e) => setFormData({...formData, emergencyExits: parseInt(e.target.value)})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Status</label>
                          <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none">
                            <option value="operational">Operational</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="emergency">Emergency</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex space-x-4 pt-4">
                        <button type="submit" className="flex-1 py-3.5 green-gradient font-bold text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all font-semibold">
                          {editingBuilding ? 'Update Building' : 'Add Building'}
                        </button>
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-dark-green-300 text-dark-green-700 rounded-xl hover:bg-dark-green-50 transition-colors font-semibold">
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

