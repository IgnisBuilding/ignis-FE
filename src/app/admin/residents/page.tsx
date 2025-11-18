'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, UserPlus, Mail, Phone, Home } from 'lucide-react';
import PageTransition from '@/components/shared/pageTransition';
import { fadeIn } from '@/lib/animations';
import { useAuth } from '../../../../context/AuthContext';
import { mockResidents } from '@/lib/mockData';
import { Resident } from '../../../../types';

export default function ResidentsManagementPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [residents, setResidents] = useState<Resident[]>(mockResidents);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', apartmentNumber: '', floor: 1, building: '', emergencyContact: '', status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    if (!user || role !== 'building_authority') router.push('/login');
  }, [user, role, router]);

  const filteredResidents = residents.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.apartmentNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingResident(null);
    setFormData({ name: '', email: '', phone: '', apartmentNumber: '', floor: 1, building: '', emergencyContact: '', status: 'active' });
    setShowModal(true);
  };

  const handleEdit = (resident: Resident) => {
    setEditingResident(resident);
    setFormData({
      name: resident.name, email: resident.email, phone: resident.phone,
      apartmentNumber: resident.apartmentNumber, floor: resident.floor,
      building: resident.building, emergencyContact: resident.emergencyContact,
      status: resident.status
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this resident?')) {
      setResidents(residents.filter(r => r.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingResident) {
      setResidents(residents.map(r => r.id === editingResident.id ? { ...r, ...formData } : r));
    } else {
      const newResident: Resident = {
        id: `R${Date.now()}`,
        ...formData,
        moveInDate: new Date()
      };
      setResidents([...residents, newResident]);
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
                <input type="text" placeholder="Search residents by name, email, or apartment..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
              </div>
            </div>

            <div className="premium-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-dark-green-50 to-dark-green-100 border-b-2 border-dark-green-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Apartment</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Floor</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Building</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResidents.map((resident, index) => (
                      <motion.tr key={resident.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="border-b border-dark-green-100 hover:bg-gradient-to-r hover:from-dark-green-50/50 hover:to-transparent transition-all">
                        <td className="px-6 py-4 text-dark-green-800 font-medium">{resident.name}</td>
                        <td className="px-6 py-4 text-dark-green-600">{resident.email}</td>
                        <td className="px-6 py-4 text-dark-green-600">{resident.apartmentNumber}</td>
                        <td className="px-6 py-4 text-dark-green-600">Floor {resident.floor}</td>
                        <td className="px-6 py-4 text-dark-green-600">{resident.building}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${resident.status === 'active' ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200' : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200'}`}>
                            {resident.status}
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
            </div>

            {showModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl premium-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-8">
                    <h2 className="text-2xl font-bold text-dark-green-800 mb-6">{editingResident ? 'Edit Resident' : 'Add New Resident'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Full Name</label>
                          <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Email</label>
                          <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Phone</label>
                          <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Apartment Number</label>
                          <input type="text" required value={formData.apartmentNumber} onChange={(e) => setFormData({...formData, apartmentNumber: e.target.value})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Floor</label>
                          <input type="number" required min="1" value={formData.floor} onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value)})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Building</label>
                          <input type="text" required value={formData.building} onChange={(e) => setFormData({...formData, building: e.target.value})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Emergency Contact</label>
                          <input type="tel" required value={formData.emergencyContact} onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Status</label>
                          <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})} className="w-full px-4 py-2 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:ring-2 focus:ring-dark-green-100 focus:outline-none">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
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

