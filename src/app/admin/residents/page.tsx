'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Mail, Phone, Home, AlertCircle } from 'lucide-react';
import PageTransition from '@/components/shared/pageTransition';
import { fadeIn } from '@/lib/animations';
import { useAuth } from '../../../../context/AuthContext';
import { api, Resident as ApiResident } from '@/lib/api';

export default function ResidentsManagementPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [residents, setResidents] = useState<ApiResident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingResident, setEditingResident] = useState<ApiResident | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    apartmentId: undefined as number | undefined,
    type: 'resident',
    isActive: true,
    emergencyContact: '',
  });

  useEffect(() => {
    if (user && (role === 'building_authority' || role === 'management')) {
      loadResidents();
    }
  }, [user, role]);

  const loadResidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getResidents();
      setResidents(data);
    } catch (err: any) {
      console.error('Failed to load residents:', err);
      setError(err.message || 'Failed to load residents');
    } finally {
      setLoading(false);
    }
  };

  const filteredResidents = residents.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingResident(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      apartmentId: undefined,
      type: 'resident',
      isActive: true,
      emergencyContact: '',
    });
    setShowModal(true);
  };

  const handleEdit = (resident: ApiResident) => {
    setEditingResident(resident);
    setFormData({
      name: resident.name,
      email: resident.email,
      phone: resident.phone || '',
      apartmentId: resident.apartmentId,
      type: resident.type,
      isActive: resident.isActive,
      emergencyContact: resident.emergencyContact || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this resident?')) {
      try {
        await api.deleteResident(id);
        await loadResidents();
      } catch (err: any) {
        alert('Failed to delete resident: ' + err.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingResident) {
        await api.updateResident(editingResident.id, formData);
      } else {
        await api.createResident(formData);
      }
      setShowModal(false);
      await loadResidents();
    } catch (err: any) {
      alert('Failed to save resident: ' + err.message);
    }
  };

  if (!user || (role !== 'building_authority' && role !== 'management')) return null;

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeIn} initial="initial" animate="animate">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold gradient-text mb-2">Resident Management</h1>
                <p className="text-dark-green-600">Manage all residents in the building</p>
              </div>
              <button onClick={handleAdd} className="flex items-center space-x-2 px-6 py-3.5 green-gradient text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all">
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Add Resident</span>
              </button>
            </div>

            <div className="premium-card rounded-2xl p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-green-400 w-5 h-5" />
                <input type="text" placeholder="Search residents by name, email, or type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
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
                        <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Phone</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Apartment ID</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Type</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResidents.map((resident, index) => (
                        <motion.tr key={resident.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="border-b border-dark-green-100 hover:bg-gradient-to-r hover:from-dark-green-50/50 hover:to-transparent transition-all">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-2.5 bg-gradient-to-br from-dark-green-100 to-dark-green-50 rounded-xl text-dark-green-600 shadow-sm">
                                <Home className="w-5 h-5" />
                              </div>
                              <span className="text-dark-green-800 font-semibold">{resident.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2 text-dark-green-600">
                              <Mail className="w-4 h-4" />
                              <span>{resident.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2 text-dark-green-600">
                              <Phone className="w-4 h-4" />
                              <span>{resident.phone || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-dark-green-600">{resident.apartment?.unit_number || resident.apartmentId || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                              resident.type === 'owner' ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200' :
                              resident.type === 'tenant' ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200' :
                              'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200'
                            }`}>
                              {resident.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${resident.isActive ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200' : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200'}`}>
                              {resident.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button onClick={() => handleEdit(resident)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl hover:scale-110 shadow-sm transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(resident.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl hover:scale-110 shadow-sm transition-colors">
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
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl premium-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-8">
                    <h2 className="text-2xl font-bold gradient-text mb-6">{editingResident ? 'Edit Resident' : 'Add New Resident'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Full Name</label>
                          <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g., Ahmed Khan" className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Email</label>
                          <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="ahmed@example.com" className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Phone</label>
                          <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+92-300-1234567" className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Apartment ID</label>
                          <input type="number" value={formData.apartmentId || ''} onChange={(e) => setFormData({...formData, apartmentId: e.target.value ? parseInt(e.target.value) : undefined})} placeholder="Optional" className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Type</label>
                          <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none">
                            <option value="resident">Resident</option>
                            <option value="owner">Owner</option>
                            <option value="tenant">Tenant</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Emergency Contact</label>
                          <input type="text" value={formData.emergencyContact} onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})} placeholder="e.g., Ali Khan: +92-301-7654321" className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div className="col-span-2">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 text-dark-green-500 border-dark-green-300 rounded focus:ring-dark-green-500" />
                            <span className="text-sm font-semibold text-dark-green-700">Active</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex space-x-4 pt-4">
                        <button type="submit" className="flex-1 py-3.5 green-gradient text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all font-bold">
                          {editingResident ? 'Update Resident' : 'Add Resident'}
                        </button>
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-dark-green-300 text-dark-green-700 rounded-xl hover:bg-gradient-to-r hover:from-dark-green-50/50 hover:to-transparent transition-all font-bold">
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

