'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, 
  MapPin, 
  Users, 
  Layers, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  X,
  Save,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../../../../context/AuthContext'
import { useRouter } from 'next/navigation'
import { buildingApi } from '../../../lib/api'
import PageTransition from '@/components/shared/pageTransition'

interface Building {
  id: number
  name: string
  type: string
  address: string
  society_id: number
  created_at: string
  updated_at: string
}

interface BuildingFormData {
  name: string
  address: string
  type: string
}

export default function BuildingsManagementPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [filteredBuildings, setFilteredBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null)
  const [formData, setFormData] = useState<BuildingFormData>({
    name: '',
    address: '',
    type: 'residential'
  })
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'building_authority'))) {
      router.push('/login')
    }
  }, [isAuthenticated, user, router, authLoading])

  useEffect(() => {
    fetchBuildings()
  }, [])

  useEffect(() => {
    const filtered = buildings.filter(building =>
      building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.address.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredBuildings(filtered)
  }, [searchTerm, buildings])

  const fetchBuildings = async () => {
    try {
      setLoading(true)
      const data = await buildingApi.getBuildings()
      setBuildings(data)
      setFilteredBuildings(data)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching buildings:', err)
      setError(err.message || 'Failed to load buildings')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (building?: Building) => {
    if (building) {
      setEditingBuilding(building)
      setFormData({
        name: building.name,
        address: building.address,
        type: building.type
      })
    } else {
      setEditingBuilding(null)
      setFormData({
        name: '',
        address: '',
        type: 'residential'
      })
    }
    setIsModalOpen(true)
    setError(null)
    setSuccessMessage(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingBuilding(null)
    setFormData({
      name: '',
      address: '',
      type: 'residential'
    })
    setError(null)
    setSuccessMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingBuilding) {
        await buildingApi.updateBuilding(editingBuilding.id, formData)
        setSuccessMessage('Building updated successfully!')
      } else {
        await buildingApi.createBuilding(formData)
        setSuccessMessage('Building created successfully!')
      }
      
      await fetchBuildings()
      setTimeout(() => {
        handleCloseModal()
      }, 1500)
    } catch (err: any) {
      console.error('Error saving building:', err)
      setError(err.message || 'Failed to save building')
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await buildingApi.deleteBuilding(id)
      setSuccessMessage('Building deleted successfully!')
      await fetchBuildings()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error('Error deleting building:', err)
      setError(err.message || 'Failed to delete building')
      setTimeout(() => setError(null), 3000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (authLoading || loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center cream-gradient">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl text-dark-green-600">Loading buildings...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'building_authority')) {
    return null
  }

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold gradient-text mb-2">Buildings Management</h1>
                <p className="text-dark-green-600">Manage all buildings in the fire safety system</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-6 py-3 green-gradient text-white rounded-xl hover:shadow-xl transition-shadow"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Add Building</span>
              </motion.button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="premium-card rounded-2xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-green-600 mb-1">Total Buildings</p>
                    <p className="text-3xl font-bold text-dark-green-800">{buildings.length}</p>
                  </div>
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-green-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="premium-card rounded-2xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-green-600 mb-1">Total Floors</p>
                    <p className="text-3xl font-bold text-dark-green-800">
                      {buildings.reduce((sum, b) => sum + b.total_floors, 0)}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Layers className="w-7 h-7 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="premium-card rounded-2xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-green-600 mb-1">Avg Floors/Building</p>
                    <p className="text-3xl font-bold text-dark-green-800">
                      {buildings.length > 0 
                        ? (buildings.reduce((sum, b) => sum + b.total_floors, 0) / buildings.length).toFixed(1)
                        : '0'
                      }
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Users className="w-7 h-7 text-purple-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search buildings by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border-2 border-dark-green-100 focus:border-green-500 focus:outline-none transition-colors"
              />
            </div>
          </motion.div>

          {/* Success/Error Messages */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-green-700 font-medium">{successMessage}</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 font-medium">{error}</p>
            </motion.div>
          )}

          {/* Buildings Grid */}
          {filteredBuildings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="premium-card rounded-2xl p-12 text-center"
            >
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-dark-green-800 mb-2">No buildings found</h3>
              <p className="text-dark-green-600 mb-6">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first building'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => handleOpenModal()}
                  className="px-6 py-3 green-gradient text-white rounded-xl hover:shadow-xl transition-shadow"
                >
                  Add Building
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBuildings.map((building, index) => (
                <motion.div
                  key={building.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="premium-card rounded-2xl hover:shadow-xl transition-all overflow-hidden"
                >
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleOpenModal(building)}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                        >
                          <Edit className="w-4 h-4 text-white" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(building.id, building.name)}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-dark-green-800 mb-2">{building.name}</h3>
                    
                    <div className="flex items-start gap-2 mb-4">
                      <MapPin className="w-4 h-4 text-dark-green-400 mt-1 flex-shrink-0" />
                      <p className="text-dark-green-600 text-sm">{building.address}</p>
                    </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-dark-green-100">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-dark-green-700 capitalize">
                        {building.type}
                      </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-dark-green-100">
                      <p className="text-xs text-dark-green-500">
                        Added {formatDate(building.created_at)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Add/Edit Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-dark-green-800">
                    {editingBuilding ? 'Edit Building' : 'Add New Building'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-green-700">{successMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-green-700 mb-2">
                      Building Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-dark-green-100 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                      placeholder="e.g., Tower A"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-green-700 mb-2">
                      Address *
                    </label>
                    <textarea
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-dark-green-100 rounded-xl focus:border-green-500 focus:outline-none transition-colors resize-none"
                      placeholder="e.g., 123 Main Street, City, State 12345"
                    />
                  </div>

                <div>
                  <label className="block text-sm font-medium text-dark-green-700 mb-2">
                    Building Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-green-100 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="mixed">Mixed Use</option>
                  </select>
                </div>                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-3 border-2 border-dark-green-200 text-dark-green-700 rounded-xl hover:bg-dark-green-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 green-gradient text-white rounded-xl hover:shadow-xl transition-shadow font-medium flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingBuilding ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}

