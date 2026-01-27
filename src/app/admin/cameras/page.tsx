'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Video, VideoOff, AlertCircle, Building2, Layers, DoorOpen, Activity, Settings, Flame, Save, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { fadeIn } from '@/lib/animations';
import { useAuth } from '@/context/AuthContext';
import { api, Camera, CameraStats, Building, Floor, Room, FireAlertConfig } from '@/lib/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function CamerasManagementContent() {
  const { user } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<CameraStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBuilding, setFilterBuilding] = useState<number | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    rtsp_url: '',
    camera_id: '',
    building_id: 0,
    floor_id: undefined as number | undefined,
    room_id: undefined as number | undefined,
    status: 'active',
    location_description: '',
    is_fire_detection_enabled: true,
  });

  // Fire Alert Config State
  const [fireAlertConfig, setFireAlertConfig] = useState<FireAlertConfig | null>(null);
  const [showFireAlertConfig, setShowFireAlertConfig] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configFormData, setConfigFormData] = useState({
    min_confidence: 0.7,
    consecutive_detections: 3,
    cooldown_seconds: 60,
    auto_create_hazard: true,
    auto_notify_firefighters: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.building_id) {
      loadFloors(formData.building_id);
    } else {
      setFloors([]);
      setRooms([]);
    }
  }, [formData.building_id]);

  useEffect(() => {
    if (formData.floor_id) {
      loadRooms(formData.floor_id);
    } else {
      setRooms([]);
    }
  }, [formData.floor_id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [camerasData, buildingsData, statsData] = await Promise.all([
        api.getCameras(),
        api.getBuildings(),
        api.getCameraStats(),
      ]);
      setCameras(camerasData);
      setBuildings(buildingsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadFloors = async (buildingId: number) => {
    try {
      const floorsData = await api.getBuildingFloors(buildingId);
      setFloors(floorsData);
    } catch (err) {
      console.error('Failed to load floors:', err);
      setFloors([]);
    }
  };

  const loadRooms = async (floorId: number) => {
    try {
      const roomsData = await api.getFloorRooms(floorId);
      setRooms(roomsData);
    } catch (err) {
      console.error('Failed to load rooms:', err);
      setRooms([]);
    }
  };

  const loadFireAlertConfig = async (buildingId: number) => {
    try {
      setConfigLoading(true);
      const config = await api.getFireAlertConfig(buildingId);
      setFireAlertConfig(config);
      setConfigFormData({
        min_confidence: config.min_confidence,
        consecutive_detections: config.consecutive_detections,
        cooldown_seconds: config.cooldown_seconds,
        auto_create_hazard: config.auto_create_hazard,
        auto_notify_firefighters: config.auto_notify_firefighters,
      });
    } catch (err) {
      console.error('Failed to load fire alert config:', err);
      // If config doesn't exist, use defaults
      setConfigFormData({
        min_confidence: 0.7,
        consecutive_detections: 3,
        cooldown_seconds: 60,
        auto_create_hazard: true,
        auto_notify_firefighters: true,
      });
    } finally {
      setConfigLoading(false);
    }
  };

  const saveFireAlertConfig = async () => {
    if (!filterBuilding) return;
    try {
      setConfigSaving(true);
      await api.updateFireAlertConfig(filterBuilding, configFormData);
      await loadFireAlertConfig(filterBuilding);
      alert('Fire alert configuration saved successfully!');
    } catch (err: any) {
      alert('Failed to save config: ' + err.message);
    } finally {
      setConfigSaving(false);
    }
  };

  // Load fire alert config when building filter changes
  useEffect(() => {
    if (filterBuilding) {
      loadFireAlertConfig(filterBuilding);
      setShowFireAlertConfig(true);
    } else {
      setFireAlertConfig(null);
      setShowFireAlertConfig(false);
    }
  }, [filterBuilding]);

  const filteredCameras = cameras.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.camera_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location_description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBuilding = !filterBuilding || c.building_id === filterBuilding;
    return matchesSearch && matchesBuilding;
  });

  const handleAdd = () => {
    setEditingCamera(null);
    setFormData({
      name: '',
      rtsp_url: '',
      camera_id: '',
      building_id: buildings[0]?.id || 0,
      floor_id: undefined,
      room_id: undefined,
      status: 'active',
      location_description: '',
      is_fire_detection_enabled: true,
    });
    setShowModal(true);
  };

  const handleEdit = async (camera: Camera) => {
    setEditingCamera(camera);
    setFormData({
      name: camera.name,
      rtsp_url: camera.rtsp_url,
      camera_id: camera.camera_id,
      building_id: camera.building_id,
      floor_id: camera.floor_id,
      room_id: camera.room_id,
      status: camera.status,
      location_description: camera.location_description || '',
      is_fire_detection_enabled: camera.is_fire_detection_enabled,
    });
    // Pre-load floors and rooms for the camera's building/floor
    if (camera.building_id) {
      await loadFloors(camera.building_id);
    }
    if (camera.floor_id) {
      await loadRooms(camera.floor_id);
    }
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this camera?')) {
      try {
        await api.deleteCamera(id);
        await loadData();
      } catch (err: any) {
        alert('Failed to delete camera: ' + err.message);
      }
    }
  };

  const handleToggleStatus = async (camera: Camera) => {
    const newStatus = camera.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateCameraStatus(camera.id, newStatus);
      await loadData();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCamera) {
        await api.updateCamera(editingCamera.id, formData);
      } else {
        await api.createCamera(formData);
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert('Failed to save camera: ' + err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200';
      case 'inactive': return 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200';
      case 'maintenance': return 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border border-yellow-200';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200';
    }
  };

  return (
    <DashboardLayout role="admin" userName={user?.name || 'Admin'} userTitle="ADMINISTRATOR">
      <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-none">
        <motion.div variants={fadeIn} initial="initial" animate="animate">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Camera Management</h1>
              <p className="text-dark-green-600">Manage CCTV cameras for fire detection</p>
            </div>
            <button onClick={handleAdd} className="flex items-center space-x-2 px-6 py-3 green-gradient text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all">
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Add Camera</span>
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="premium-card rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-green-600 text-sm">Total</p>
                    <p className="text-2xl font-bold text-dark-green-800">{stats.total}</p>
                  </div>
                  <Video className="w-8 h-8 text-dark-green-400" />
                </div>
              </div>
              <div className="premium-card rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm">Active</p>
                    <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div className="premium-card rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Inactive</p>
                    <p className="text-2xl font-bold text-gray-700">{stats.inactive}</p>
                  </div>
                  <VideoOff className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <div className="premium-card rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 text-sm">Maintenance</p>
                    <p className="text-2xl font-bold text-yellow-700">{stats.maintenance}</p>
                  </div>
                  <Settings className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              <div className="premium-card rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm">Fire Detection</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.fireDetectionEnabled}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="premium-card rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-green-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search cameras by name, code, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:outline-none focus:ring-2 focus:ring-dark-green-100 transition-all"
                />
              </div>
              <select
                value={filterBuilding || ''}
                onChange={(e) => setFilterBuilding(e.target.value ? parseInt(e.target.value) : undefined)}
                className="px-4 py-3 border-2 border-dark-green-100 rounded-xl focus:border-dark-green-400 focus:outline-none"
              >
                <option value="">All Buildings</option>
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fire Alert Configuration Panel - shows when a building is selected */}
          {showFireAlertConfig && filterBuilding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="premium-card rounded-2xl p-6 mb-6 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white shadow-lg">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-dark-green-800">Fire Alert Configuration</h3>
                    <p className="text-sm text-dark-green-600">
                      Configure fire detection thresholds for {buildings.find(b => b.id === filterBuilding)?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => loadFireAlertConfig(filterBuilding)}
                  disabled={configLoading}
                  className="p-2 text-dark-green-600 hover:bg-dark-green-100 rounded-lg transition-all"
                  title="Refresh config"
                >
                  <RefreshCw className={`w-5 h-5 ${configLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {configLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Minimum Confidence */}
                  <div>
                    <label className="block text-sm font-semibold text-dark-green-700 mb-2">
                      Minimum Confidence Threshold
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="0.5"
                        max="0.99"
                        step="0.01"
                        value={configFormData.min_confidence}
                        onChange={(e) => setConfigFormData({...configFormData, min_confidence: parseFloat(e.target.value)})}
                        className="flex-1"
                      />
                      <span className="text-lg font-bold text-orange-600 min-w-[60px]">
                        {(configFormData.min_confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-dark-green-500 mt-1">
                      Fire detections below this confidence will be ignored
                    </p>
                  </div>

                  {/* Consecutive Detections */}
                  <div>
                    <label className="block text-sm font-semibold text-dark-green-700 mb-2">
                      Consecutive Detections Required
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={configFormData.consecutive_detections}
                      onChange={(e) => setConfigFormData({...configFormData, consecutive_detections: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                    <p className="text-xs text-dark-green-500 mt-1">
                      Number of consecutive detections before triggering alert
                    </p>
                  </div>

                  {/* Cooldown Period */}
                  <div>
                    <label className="block text-sm font-semibold text-dark-green-700 mb-2">
                      Cooldown Period (seconds)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="600"
                      value={configFormData.cooldown_seconds}
                      onChange={(e) => setConfigFormData({...configFormData, cooldown_seconds: parseInt(e.target.value) || 60})}
                      className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                    <p className="text-xs text-dark-green-500 mt-1">
                      Time to wait after an alert before triggering another
                    </p>
                  </div>

                  {/* Auto Create Hazard */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-dark-green-100">
                    <div>
                      <p className="font-semibold text-dark-green-700">Auto-create Hazard</p>
                      <p className="text-xs text-dark-green-500">Automatically create hazard record when fire detected</p>
                    </div>
                    <button
                      onClick={() => setConfigFormData({...configFormData, auto_create_hazard: !configFormData.auto_create_hazard})}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        configFormData.auto_create_hazard ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        configFormData.auto_create_hazard ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* Auto Notify Firefighters */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-dark-green-100">
                    <div>
                      <p className="font-semibold text-dark-green-700">Auto-notify Firefighters</p>
                      <p className="text-xs text-dark-green-500">Send notification to fire department automatically</p>
                    </div>
                    <button
                      onClick={() => setConfigFormData({...configFormData, auto_notify_firefighters: !configFormData.auto_notify_firefighters})}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        configFormData.auto_notify_firefighters ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        configFormData.auto_notify_firefighters ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* Save Button */}
                  <div className="flex items-end">
                    <button
                      onClick={saveFireAlertConfig}
                      disabled={configSaving}
                      className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      {configSaving ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Save Configuration</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Table */}
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
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Camera</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Camera Code</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Building</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Floor</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Fire Detection</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCameras.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-dark-green-400">
                          No cameras found. Add your first camera to get started.
                        </td>
                      </tr>
                    ) : (
                      filteredCameras.map((camera, index) => (
                        <motion.tr
                          key={camera.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b border-dark-green-50 hover:bg-gradient-to-r hover:from-dark-green-50/50 hover:to-transparent transition-all"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2.5 rounded-xl shadow-sm ${camera.status === 'active' ? 'bg-gradient-to-br from-green-100 to-green-50 text-green-600' : 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600'}`}>
                                <Video className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-semibold text-dark-green-800">{camera.name}</p>
                                {camera.location_description && (
                                  <p className="text-xs text-dark-green-500">{camera.location_description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <code className="px-2 py-1 bg-dark-green-50 rounded text-sm text-dark-green-700">{camera.camera_id}</code>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 text-dark-green-400" />
                              <span className="text-dark-green-600">{camera.building?.name || `Building ${camera.building_id}`}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {camera.floor_id ? (
                              <div className="flex items-center space-x-2">
                                <Layers className="w-4 h-4 text-dark-green-400" />
                                <span className="text-dark-green-600">{camera.floor?.name || `Floor ${camera.floor_id}`}</span>
                              </div>
                            ) : (
                              <span className="text-dark-green-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${camera.is_fire_detection_enabled ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200' : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-500 border border-gray-200'}`}>
                              {camera.is_fire_detection_enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleStatus(camera)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer hover:scale-105 transition-transform ${getStatusColor(camera.status)}`}
                            >
                              {camera.status}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button onClick={() => handleEdit(camera)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all hover:scale-110 shadow-sm">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(camera.id)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110 shadow-sm">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="premium-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold gradient-text mb-6">{editingCamera ? 'Edit Camera' : 'Add New Camera'}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-dark-green-700 mb-2">Camera Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="e.g., Main Lobby Camera"
                          className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-dark-green-700 mb-2">RTSP URL</label>
                        <input
                          type="text"
                          required
                          value={formData.rtsp_url}
                          onChange={(e) => setFormData({...formData, rtsp_url: e.target.value})}
                          placeholder="rtsp://192.168.1.100:554/stream"
                          className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-dark-green-700 mb-2">Camera Code (Unique ID)</label>
                        <input
                          type="text"
                          required
                          value={formData.camera_id}
                          onChange={(e) => setFormData({...formData, camera_id: e.target.value})}
                          placeholder="e.g., cam_lobby_01"
                          disabled={!!editingCamera}
                          className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        {!editingCamera && (
                          <p className="text-xs text-dark-green-500 mt-1">This must match the camera_id in fire-detect pipeline</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-dark-green-700 mb-2">Building</label>
                        <select
                          required
                          value={formData.building_id}
                          onChange={(e) => setFormData({...formData, building_id: parseInt(e.target.value), floor_id: undefined, room_id: undefined})}
                          className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none"
                        >
                          <option value="">Select Building</option>
                          {buildings.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-dark-green-700 mb-2">Floor (Optional)</label>
                        <select
                          value={formData.floor_id || ''}
                          onChange={(e) => setFormData({...formData, floor_id: e.target.value ? parseInt(e.target.value) : undefined, room_id: undefined})}
                          className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none"
                          disabled={!formData.building_id}
                        >
                          <option value="">Select Floor</option>
                          {floors.map(f => (
                            <option key={f.id} value={f.id}>{f.name} (Level {f.level})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-dark-green-700 mb-2">Room (Optional)</label>
                        <select
                          value={formData.room_id || ''}
                          onChange={(e) => setFormData({...formData, room_id: e.target.value ? parseInt(e.target.value) : undefined})}
                          className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none"
                          disabled={!formData.floor_id}
                        >
                          <option value="">Select Room</option>
                          {rooms.map(r => (
                            <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                          ))}
                        </select>
                        {!formData.floor_id && (
                          <p className="text-xs text-dark-green-500 mt-1">Select a floor first to see available rooms</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-dark-green-700 mb-2">Location Description (Optional)</label>
                        <input
                          type="text"
                          value={formData.location_description}
                          onChange={(e) => setFormData({...formData, location_description: e.target.value})}
                          placeholder="e.g., Near main entrance, facing elevator"
                          className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-dark-green-700 mb-2">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.is_fire_detection_enabled}
                            onChange={(e) => setFormData({...formData, is_fire_detection_enabled: e.target.checked})}
                            className="w-5 h-5 text-dark-green-600 rounded focus:ring-dark-green-500"
                          />
                          <span className="text-sm font-semibold text-dark-green-700">Enable Fire Detection</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex space-x-4 pt-4">
                      <button
                        type="submit"
                        className="flex-1 py-3.5 green-gradient text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all font-bold"
                      >
                        {editingCamera ? 'Update Camera' : 'Add Camera'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="flex-1 py-3.5 border-2 border-dark-green-200 text-dark-green-700 rounded-xl hover:bg-dark-green-50 hover:border-dark-green-300 transition-all font-semibold"
                      >
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

export default function CamerasManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'building_authority']}>
      <CamerasManagementContent />
    </ProtectedRoute>
  );
}
