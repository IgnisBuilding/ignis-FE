'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Activity, Thermometer, Wind, Droplets, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { fadeIn } from '@/lib/animations';
import { useAuth } from '@/context/AuthContext';
import { api, Sensor as ApiSensor } from '@/lib/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useSensorStream, SensorReadingEvent } from '@/hooks/use-sensor-stream';

export function SensorsManagementContent() {
  const { user, role, dashboardRole, roleTitle } = useAuth();
  const [sensors, setSensors] = useState<ApiSensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSensor, setEditingSensor] = useState<ApiSensor | null>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<number | undefined>();
  const [selectedFloor, setSelectedFloor] = useState<number | undefined>();
  const [hardwareConnected, setHardwareConnected] = useState(false);

  interface DetectedHardware { key: string; label: string; lastValue: number | null; lastSeenAt: string | null; }
  const [detectedHardwareSensors, setDetectedHardwareSensors] = useState<DetectedHardware[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'smoke',
    hardwareUid: '',
    value: 0,
    unit: 'ppm',
    status: 'active',
    roomId: undefined as number | undefined,
    buildingId: undefined as number | undefined,
    floorId: undefined as number | undefined,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    warningThreshold: undefined as number | undefined,
    alertThreshold: undefined as number | undefined,
  });

  const activeDetectedSensors = useMemo(() => {
    if (!detectedHardwareSensors.length) return [];
    const cutoff = Date.now() - 5 * 60 * 1000; // 5 minutes
    const active = detectedHardwareSensors.filter(
      (hw) => hw.lastSeenAt && new Date(hw.lastSeenAt).getTime() >= cutoff
    );
    return active.length > 0 ? active : detectedHardwareSensors;
  }, [detectedHardwareSensors]);

  const applyLiveReading = (event: SensorReadingEvent) => {
    setSensors((prev) => {
      const exists = prev.some(s => s.id === event.sensor_id);
      if (!exists) {
        // Append newly discovered sensor
        return [...prev, {
          id: event.sensor_id,
          name: event.name || 'Arduino Sensor',
          type: event.type || 'gas',
          value: event.value,
          unit: event.unit || 'ppm',
          status: event.status,
          lastReading: new Date(event.timestamp).toISOString(),
          createdAt: new Date(event.timestamp).toISOString(),
          updatedAt: new Date(event.timestamp).toISOString(),
          building: undefined,
          floor: undefined,
          room: undefined,
        } as ApiSensor];
      }

      return prev.map((sensor) => {
        if (sensor.id !== event.sensor_id) {
          return sensor;
        }

        return {
          ...sensor,
          value: event.value,
          unit: event.unit,
          status: event.status,
          lastReading: new Date(event.timestamp).toISOString(),
          updatedAt: new Date(event.timestamp).toISOString(),
        };
      });
    });
  };

  const { isConnected: isSensorSocketConnected, latestConnection } = useSensorStream({
    autoConnect: true,
    onSensorReading: applyLiveReading,
    onSensorAlert: applyLiveReading,
  });

  const loadConnectedHardwareSensors = useCallback(async () => {
    try {
      const health = await api.getArduinoSensorHealth();
      setHardwareConnected(Boolean(health?.connected));
      setDetectedHardwareSensors(health?.detectedSensors || []);
    } catch (err) {
      console.error('Failed to load connected hardware sensors:', err);
      setHardwareConnected(false);
      setDetectedHardwareSensors([]);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadSensors();
      loadBuildings();
      loadConnectedHardwareSensors();
    }
  }, [user, loadConnectedHardwareSensors]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadConnectedHardwareSensors();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadConnectedHardwareSensors]);

  const loadBuildings = async () => {
    try {
      const data = await api.getBuildings();
      setBuildings(data);
    } catch (err: any) {
      console.error('Failed to load buildings:', err);
    }
  };

  const loadFloors = async (buildingId: number) => {
    try {
      const data = await api.getBuildingFloors(buildingId);
      setFloors(data);
      setRooms([]);
      setSelectedFloor(undefined);
    } catch (err: any) {
      console.error('Failed to load floors:', err);
      setFloors([]);
    }
  };

  const loadRooms = async (floorId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/floors/${floorId}/rooms`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ignis_token')}`,
        },
      });
      const data = await response.json();
      setRooms(data);
    } catch (err: any) {
      console.error('Failed to load rooms:', err);
      setRooms([]);
    }
  };

  const handleBuildingChange = (buildingId: string) => {
    const id = buildingId ? parseInt(buildingId) : undefined;
    setSelectedBuilding(id);
    setFormData({ ...formData, buildingId: id, floorId: undefined, roomId: undefined });
    if (id) {
      loadFloors(id);
    } else {
      setFloors([]);
      setRooms([]);
    }
  };

  const handleFloorChange = (floorId: string) => {
    const id = floorId ? parseInt(floorId) : undefined;
    setSelectedFloor(id);
    setFormData({ ...formData, floorId: id, roomId: undefined });
    if (id) {
      loadRooms(id);
    } else {
      setRooms([]);
    }
  };

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

  const getStatusBadgeClass = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'safe':
      case 'active':
        return 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200';
      case 'warning':
        return 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border border-amber-200';
      case 'alert':
        return 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const handleAdd = () => {
    setEditingSensor(null);
    setSelectedBuilding(undefined);
    setSelectedFloor(undefined);
    setFloors([]);
    setRooms([]);
    setFormData({
      name: '',
      type: 'smoke',
      hardwareUid: '',
      value: 0,
      unit: 'ppm',
      status: 'active',
      roomId: undefined,
      buildingId: undefined,
      floorId: undefined,
      latitude: undefined,
      longitude: undefined,
      warningThreshold: undefined,
      alertThreshold: undefined,
    });
    setShowModal(true);
  };

  const handleEdit = async (sensor: ApiSensor) => {
    setEditingSensor(sensor);
    
    // Pre-populate building, floor, room
    const buildingId = sensor.building?.id || sensor.floor?.building?.id || sensor.room?.floor?.building?.id;
    const floorId = sensor.floor?.id || sensor.room?.floor?.id;
    const roomId = sensor.room?.id;
    
    setSelectedBuilding(buildingId);
    setSelectedFloor(floorId);
    
    // Load floors and rooms if needed
    if (buildingId) {
      await loadFloors(buildingId);
    }
    if (floorId) {
      await loadRooms(floorId);
    }
    
    setFormData({
      name: sensor.name,
      type: sensor.type,
      hardwareUid: sensor.hardwareUid || '',
      value: sensor.value || 0,
      unit: sensor.unit || 'ppm',
      status: sensor.status,
      roomId: roomId,
      buildingId: buildingId,
      floorId: floorId,
      latitude: sensor.latitude,
      longitude: sensor.longitude,
      warningThreshold: sensor.warningThreshold,
      alertThreshold: sensor.alertThreshold,
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
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      isSensorSocketConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-dark-green-700">
                    Live stream: {isSensorSocketConnected ? 'Connected' : 'Disconnected'}
                    {latestConnection?.mode ? ` (${latestConnection.mode})` : ''}
                    {latestConnection?.port ? ` • ${latestConnection.port}` : ''}
                  </span>
                </div>
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
                        <th className="px-6 py-4 text-left text-sm font-bold text-dark-green-800">Location</th>
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
                          <td className="px-6 py-4">
                            {sensor.room ? (
                              <div className="text-dark-green-600 text-sm">
                                <div className="font-semibold">{sensor.room.name}</div>
                                {sensor.room.floor && (
                                  <div className="text-xs text-dark-green-400">
                                    {sensor.room.floor.name || `Floor ${sensor.room.floor.level}`}
                                    {sensor.room.floor.building && ` • ${sensor.room.floor.building.name}`}
                                  </div>
                                )}
                              </div>
                            ) : sensor.floor ? (
                              <div className="text-dark-green-600 text-sm">
                                <div className="font-semibold">{sensor.floor.name || `Floor ${sensor.floor.level}`}</div>
                                {sensor.floor.building && (
                                  <div className="text-xs text-dark-green-400">{sensor.floor.building.name}</div>
                                )}
                              </div>
                            ) : sensor.building ? (
                              <div className="text-dark-green-600 text-sm font-semibold">{sensor.building.name}</div>
                            ) : (
                              <span className="text-dark-green-400 text-sm italic">Not assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusBadgeClass(sensor.status)}`}>
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
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Link to Connected Hardware Sensor</label>
                          <select
                            value={formData.hardwareUid || ''}
                            onChange={(e) => {
                              setFormData((prev) => ({ ...prev, hardwareUid: e.target.value }));
                            }}
                            className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none"
                          >
                            <option value="">-- No Hardware Link --</option>
                            {!hardwareConnected && (
                              <option value="" disabled>No hardware port connected</option>
                            )}
                            {hardwareConnected && activeDetectedSensors.length === 0 && (
                              <option value="" disabled>No sensors detected yet — send a packet first</option>
                            )}
                            {activeDetectedSensors.map((hw) => (
                              <option key={hw.key} value={hw.key}>
                                {hw.label} ({hw.key}) — {hw.lastValue ?? 'N/A'} adc
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Sensor Name</label>
                          <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g., Smoke Detector - Lobby" className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Unique Hardware ID</label>
                          <input
                            type="text"
                            value={formData.hardwareUid}
                            onChange={(e) => setFormData({...formData, hardwareUid: e.target.value.toUpperCase().replace(/\s/g, '-')})}
                            placeholder="e.g., SENSOR-MQ5-001"
                            className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none"
                          />
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
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Warning Threshold</label>
                          <input type="number" step="1" value={formData.warningThreshold ?? ''} onChange={(e) => setFormData({...formData, warningThreshold: e.target.value ? parseInt(e.target.value) : undefined})} placeholder="e.g., 400" className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Alert Threshold</label>
                          <input type="number" step="1" value={formData.alertThreshold ?? ''} onChange={(e) => setFormData({...formData, alertThreshold: e.target.value ? parseInt(e.target.value) : undefined})} placeholder="e.g., 700" className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Initial Value</label>
                          <input type="number" step="0.01" value={formData.value} onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value)})} className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Building</label>
                          <select value={selectedBuilding || ''} onChange={(e) => handleBuildingChange(e.target.value)} className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none">
                            <option value="">Select Building</option>
                            {buildings.map(building => (
                              <option key={building.id} value={building.id}>{building.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Floor</label>
                          <select value={selectedFloor || ''} onChange={(e) => handleFloorChange(e.target.value)} disabled={!selectedBuilding} className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed">
                            <option value="">Select Floor</option>
                            {floors.map(floor => (
                              <option key={floor.id} value={floor.id}>{floor.name || `Floor ${floor.level}`}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-dark-green-700 mb-2">Room</label>
                          <select value={formData.roomId || ''} onChange={(e) => setFormData({...formData, roomId: e.target.value ? parseInt(e.target.value) : undefined})} disabled={!selectedFloor} className="w-full px-4 py-2 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed">
                            <option value="">Select Room</option>
                            {rooms.map(room => (
                              <option key={room.id} value={room.id}>{room.name}</option>
                            ))}
                          </select>
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
    <ProtectedRoute allowedRoles={['admin']}>
      <SensorsManagementContent />
    </ProtectedRoute>
  );
}
