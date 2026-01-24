'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  User as UserIcon,
  MessageCircle,
  X,
  AlertTriangle,
  Shield,
  Users,
  Search,
  Bell,
  Settings,
  Plus,
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation,
  Compass,
  History,
  BarChart3,
  Truck,
  Wrench,
  Radio,
  RefreshCw
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type { EmergencyState } from '@/lib/map';
import { uploadSampleFloorPlan } from '@/lib/map/sampleFloorPlan';
import { api } from '@/lib/api';

// Dynamically import EvacuationMap to avoid SSR issues with MapLibre
const EvacuationMap = dynamic(
  () => import('@/components/maps/EvacuationMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading evacuation map...</p>
        </div>
      </div>
    )
  }
);

// Hazard interface from backend
interface Hazard {
  id: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'reported' | 'responding' | 'resolved';
  apartment?: {
    id: number;
    unit_number: string;
    floor?: {
      level: number;
      building?: {
        name: string;
        address: string;
      };
    };
  };
  node?: { id: number };
  created_at: string;
  updated_at: string;
}

// Convert hazard to incident format for display
interface Incident {
  id: string;
  priority: number;
  title: string;
  location: string;
  unitsAssigned: number;
  elapsed: string;
  severity: string;
  hazardId: number;
}

export default function EmergencyPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [emergencyState, setEmergencyState] = useState<EmergencyState | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [layers, setLayers] = useState({
    thermalHeatmap: true,
    hydrantNetwork: false,
    floorPlans: true
  });
  const [aiMessages, setAiMessages] = useState<string[]>([
    "System ready. Monitoring for fire hazards.",
    "All evacuation routes are clear.",
    "Emergency services on standby."
  ]);

  // Backend data
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);
  const [sensorCount, setSensorCount] = useState<number>(0);

  // Get building info from URL params
  const buildingName = searchParams.get('building') || 'Command Center';

  // Fetch hazards from backend API
  const fetchHazards = useCallback(async () => {
    setIsLoadingIncidents(true);
    try {
      const hazards = await api.getHazards();

      // Convert hazards to incidents format
      const convertedIncidents: Incident[] = hazards
        .filter((h: Hazard) => h.status !== 'resolved')
        .map((hazard: Hazard, index: number) => {
          const priority = hazard.severity === 'critical' ? 1 :
                          hazard.severity === 'high' ? 2 : 3;

          const buildingName = hazard.apartment?.floor?.building?.name || 'Unknown Building';
          const unitNumber = hazard.apartment?.unit_number || 'N/A';
          const floorLevel = hazard.apartment?.floor?.level || 'N/A';

          // Calculate elapsed time
          const createdAt = new Date(hazard.created_at);
          const now = new Date();
          const diffMs = now.getTime() - createdAt.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const elapsed = diffMins < 60 ? `${diffMins}m` : `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;

          return {
            id: `${hazard.id}-${index}`,
            priority,
            title: `${hazard.type || 'Fire'} - ${buildingName}`,
            location: `Unit ${unitNumber}, Floor ${floorLevel}`,
            unitsAssigned: priority === 1 ? 4 : priority === 2 ? 2 : 1,
            elapsed,
            severity: hazard.severity,
            hazardId: hazard.id
          };
        });

      setIncidents(convertedIncidents);
    } catch (error) {
      console.error('Failed to fetch hazards:', error);
      // Fallback to empty array on error
      setIncidents([]);
    } finally {
      setIsLoadingIncidents(false);
    }
  }, []);

  // Fetch sensor stats
  const fetchSensorStats = useCallback(async () => {
    try {
      const sensors = await api.getSensors();
      setSensorCount(Array.isArray(sensors) ? sensors.filter((s: { status?: string }) => s.status === 'online' || s.status === 'active').length : 0);
    } catch (error) {
      console.error('Failed to fetch sensors:', error);
      setSensorCount(0);
    }
  }, []);

  // Upload sample floor plan data when page loads
  useEffect(() => {
    const loadFloorPlanData = async () => {
      setIsLoadingData(true);
      try {
        console.log('[EmergencyPage] Uploading sample floor plan data...');
        const uploaded = await uploadSampleFloorPlan(buildingName);
        if (uploaded) {
          console.log('[EmergencyPage] Sample data uploaded successfully');
          setMapKey(prev => prev + 1);
        }
      } catch (error) {
        console.error('[EmergencyPage] Error uploading floor plan data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadFloorPlanData();
  }, [buildingName]);

  // Fetch data on mount and set up polling
  useEffect(() => {
    fetchHazards();
    fetchSensorStats();

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchHazards();
      fetchSensorStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchHazards, fetchSensorStats]);

  // Handle emergency state changes from map
  const handleEmergencyStateChange = useCallback((state: EmergencyState) => {
    setEmergencyState(state);

    if (state.mode === 'fire_detected') {
      setAiMessages([
        "ALERT: Fire detected in building!",
        `${state.fireMarkers.length} active fire location(s)`,
        "Recommended: Start evacuation immediately",
        "Emergency services have been notified",
        "Avoid elevators - use stairs only"
      ]);
      setIsTalking(true);
    } else if (state.mode === 'evacuation_in_progress') {
      setAiMessages([
        "EVACUATION IN PROGRESS",
        `${state.occupancy} people remaining in building`,
        `Evacuation ${Math.round(state.evacuationProgress * 100)}% complete`,
        "Follow illuminated exit signs",
        "Assist those who need help"
      ]);
    } else if (state.mode === 'evacuation_complete') {
      setAiMessages([
        "EVACUATION COMPLETE",
        "All occupants have been evacuated",
        "Building is now clear",
        "Wait for fire department clearance",
        "Do not re-enter the building"
      ]);
      setIsTalking(false);
    } else if (state.mode === 'idle') {
      setAiMessages([
        "System ready. Monitoring for fire hazards.",
        "All evacuation routes are clear.",
        "Emergency services on standby."
      ]);
      setIsTalking(false);
    }
  }, []);

  // Handle room click from map
  const handleRoomClick = useCallback((room: GeoJSON.Feature) => {
    const roomName = room.properties?.name || 'Unknown Room';
    const roomType = room.properties?.room_type || 'Unknown';

    setAiMessages(prev => [
      `Selected: ${roomName}`,
      `Room type: ${roomType}`,
      ...prev.slice(0, 3)
    ]);
  }, []);

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-600';
      case 2: return 'text-amber-600';
      default: return 'text-slate-500';
    }
  };

  const getPriorityBg = (priority: number) => {
    switch (priority) {
      case 1: return 'border-red-200 bg-red-50 hover:bg-red-100';
      case 2: return 'border-slate-200 bg-white hover:bg-slate-50';
      default: return 'border-slate-200 bg-white hover:bg-slate-50';
    }
  };

  const activeAlerts = incidents.filter(i => i.priority === 1).length || emergencyState?.fireMarkers?.length || 0;

  return (
    <div className="fixed inset-0 bg-slate-100 flex flex-col overflow-hidden z-[100]">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-primary/10 bg-card px-6 py-3 z-30 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-primary">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <Flame className="w-5 h-5" />
            </div>
            <h2 className="text-primary text-xl font-bold leading-tight tracking-tight">Ignis Command</h2>
          </div>
          <div className="flex min-w-64 h-10">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
              <div className="text-primary/60 flex border-none bg-primary/5 items-center justify-center pl-4 rounded-l-lg">
                <Search className="w-5 h-5" />
              </div>
              <input
                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-primary focus:outline-none focus:ring-0 border-none bg-primary/5 h-full placeholder:text-primary/50 px-4 rounded-l-none pl-2 text-sm"
                placeholder="Search coordinates, units, or incidents..."
              />
            </div>
          </div>
        </div>
        <div className="flex flex-1 justify-end gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => { fetchHazards(); fetchSensorStats(); }}
              className="flex size-10 items-center justify-center rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${isLoadingIncidents ? 'animate-spin' : ''}`} />
            </button>
            <button className="flex size-10 items-center justify-center rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="flex size-10 items-center justify-center rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <div className="h-8 w-px bg-primary/10 mx-2"></div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-primary">{user?.name || 'Commander'}</p>
              <p className="text-[10px] text-primary/60">Station Chief</p>
            </div>
            <div className="bg-primary/10 rounded-full size-10 flex items-center justify-center border-2 border-primary/20">
              <UserIcon className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      </header>

      <main className="relative flex-1 flex overflow-hidden">
        {/* Floating Left Sidebar (Incident List) */}
        <aside className="absolute left-4 top-4 bottom-4 w-72 z-20 flex flex-col gap-3 pointer-events-none">
          <div className="bg-card/95 backdrop-blur-md rounded-xl border border-primary/10 shadow-xl pointer-events-auto overflow-hidden flex flex-col flex-1">
            <div className="p-4 border-b border-primary/10 flex justify-between items-center bg-primary text-white">
              <h3 className="font-bold text-sm tracking-wide uppercase">Active Incidents</h3>
              <span className="bg-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {activeAlerts} ALERT{activeAlerts !== 1 ? 'S' : ''}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {isLoadingIncidents ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : incidents.length === 0 ? (
                <div className="text-center py-8 text-primary/50">
                  <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active incidents</p>
                </div>
              ) : (
                incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${getPriorityBg(incident.priority)}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${getPriorityColor(incident.priority)}`}>
                        Priority {incident.priority}
                      </span>
                      <span className="text-[10px] text-primary/40 font-mono">#{incident.hazardId}</span>
                    </div>
                    <h4 className="font-bold text-sm text-primary leading-tight">{incident.title}</h4>
                    <p className="text-xs text-primary/60 mt-1">
                      {incident.unitsAssigned} Units Assigned &bull; {incident.elapsed} elapsed
                    </p>
                    <p className="text-[10px] text-primary/40 mt-1">{incident.location}</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 bg-primary/5 border-t border-primary/10">
              <button className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4" />
                New Dispatch
              </button>
            </div>
          </div>

          {/* Sensor Summary Stats */}
          <div className="bg-card/95 backdrop-blur-md rounded-xl border border-primary/10 shadow-lg pointer-events-auto p-3">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-primary/40">Sensor Network</p>
                <p className="text-xs font-bold text-primary">
                  {sensorCount} Nodes Online
                  <span className="ml-1 inline-block w-2 h-2 rounded-full bg-green-500"></span>
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Map Area */}
        <div className="relative flex-1 w-full h-full overflow-hidden">
          {/* Map Background with Grid Pattern */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundColor: '#f1f3f0',
              backgroundImage: `
                radial-gradient(#d1d5db 1px, transparent 1px),
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px, 160px 160px, 160px 160px'
            }}
          />

          {/* EvacuationMap Component */}
          <div className="absolute inset-0 z-10">
            {isLoadingData ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading floor plan data...</p>
                </div>
              </div>
            ) : (
              <EvacuationMap
                key={mapKey}
                className="w-full h-full"
                showControls={true}
                showLegend={true}
                showEmergencyControls={true}
                onRoomClick={handleRoomClick}
                onEmergencyStateChange={handleEmergencyStateChange}
              />
            )}
          </div>

          {/* Bottom Right Controls */}
          <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-20 pointer-events-none">
            {/* Layers Toggle */}
            <div className="bg-card/95 backdrop-blur-md rounded-xl border border-primary/10 shadow-xl overflow-hidden flex flex-col p-1 pointer-events-auto">
              <button
                onClick={() => setShowLayers(!showLayers)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary hover:text-white rounded-lg transition-colors group"
              >
                <Layers className="w-5 h-5 text-primary group-hover:text-white" />
                <span className="text-sm font-semibold pr-2">Map Layers</span>
              </button>

              <AnimatePresence>
                {showLayers && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="h-px bg-primary/10 mx-2"></div>
                    <div className="p-2 space-y-1">
                      <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-primary/5 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={layers.thermalHeatmap}
                          onChange={(e) => setLayers(prev => ({ ...prev, thermalHeatmap: e.target.checked }))}
                          className="size-4 rounded text-primary border-primary/20 bg-transparent focus:ring-0"
                        />
                        <span className="text-xs font-medium">Thermal Heatmap</span>
                      </label>
                      <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-primary/5 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={layers.hydrantNetwork}
                          onChange={(e) => setLayers(prev => ({ ...prev, hydrantNetwork: e.target.checked }))}
                          className="size-4 rounded text-primary border-primary/20 bg-transparent focus:ring-0"
                        />
                        <span className="text-xs font-medium">Hydrant Network</span>
                      </label>
                      <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-primary/5 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={layers.floorPlans}
                          onChange={(e) => setLayers(prev => ({ ...prev, floorPlans: e.target.checked }))}
                          className="size-4 rounded text-primary border-primary/20 bg-transparent focus:ring-0"
                        />
                        <span className="text-xs font-medium">Floor Plans</span>
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="flex flex-col gap-1 bg-card rounded-lg border border-primary/10 shadow-lg overflow-hidden pointer-events-auto">
              <button className="p-2.5 hover:bg-primary/5 text-primary border-b border-primary/10">
                <ZoomIn className="w-5 h-5" />
              </button>
              <button className="p-2.5 hover:bg-primary/5 text-primary border-b border-primary/10">
                <ZoomOut className="w-5 h-5" />
              </button>
              <button className="p-2.5 hover:bg-primary/5 text-primary">
                <Navigation className="w-5 h-5" />
              </button>
            </div>

            <button className="flex size-11 items-center justify-center rounded-xl bg-primary text-white shadow-xl hover:scale-105 transition-transform pointer-events-auto">
              <Compass className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Center Toolbar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-card/95 backdrop-blur-md rounded-2xl border border-primary/10 shadow-2xl px-2 py-1.5 gap-1 z-20">
            <button className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors" title="Equipment">
              <Wrench className="w-5 h-5" />
            </button>
            <button className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors" title="Vehicles">
              <Truck className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-primary/10 mx-1"></div>
            <button className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors" title="History">
              <History className="w-5 h-5" />
            </button>
            <button className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors" title="Analytics">
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>

          {/* Status Badge - Top Right of Map */}
          <motion.div
            animate={emergencyState?.mode === 'fire_detected' ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
            className={`absolute top-4 right-4 z-20 ${
              emergencyState?.mode === 'fire_detected'
                ? 'bg-red-500'
                : emergencyState?.mode === 'evacuation_in_progress'
                ? 'bg-orange-500'
                : emergencyState?.mode === 'evacuation_complete'
                ? 'bg-green-500'
                : 'bg-primary'
            } text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2`}
          >
            {emergencyState?.mode === 'fire_detected' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : emergencyState?.mode === 'evacuation_in_progress' ? (
              <Users className="w-5 h-5" />
            ) : (
              <Shield className="w-5 h-5" />
            )}
            <span className="font-bold text-sm">
              {emergencyState?.mode === 'fire_detected'
                ? 'FIRE DETECTED'
                : emergencyState?.mode === 'evacuation_in_progress'
                ? 'EVACUATION IN PROGRESS'
                : emergencyState?.mode === 'evacuation_complete'
                ? 'EVACUATION COMPLETE'
                : 'System Ready'}
            </span>
          </motion.div>

          {/* Quick Stats - Top Center */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            <div className="bg-card/95 backdrop-blur-md rounded-xl border border-primary/10 shadow-lg px-4 py-2 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Flame className={`w-5 h-5 ${emergencyState?.fireMarkers?.length || incidents.filter(i => i.priority === 1).length ? 'text-red-500' : 'text-slate-400'}`} />
                <div>
                  <p className="text-[10px] text-primary/50 font-bold uppercase">Active Fires</p>
                  <p className="text-lg font-bold text-primary">{emergencyState?.fireMarkers?.length || incidents.filter(i => i.priority === 1).length}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-primary/10"></div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-[10px] text-primary/50 font-bold uppercase">Occupancy</p>
                  <p className="text-lg font-bold text-primary">{emergencyState?.occupancy || '--'}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-primary/10"></div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-[10px] text-primary/50 font-bold uppercase">Evacuation</p>
                  <p className="text-lg font-bold text-primary">
                    {emergencyState?.evacuationProgress
                      ? `${Math.round(emergencyState.evacuationProgress * 100)}%`
                      : '0%'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Agent Button */}
        <motion.button
          onClick={() => setIsAIOpen(!isAIOpen)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full shadow-2xl flex items-center justify-center z-[110] hover:scale-105 transition-transform"
          whileTap={{ scale: 0.95 }}
        >
          {isAIOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
          {isTalking && (
            <motion.div
              className="absolute inset-0 border-4 border-white rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </motion.button>

        {/* AI Chat Window */}
        <AnimatePresence>
          {isAIOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl z-[110] overflow-hidden border border-primary/10"
            >
              <div className={`${emergencyState?.mode === 'fire_detected' ? 'bg-red-500' : 'bg-primary'} text-white p-4`}>
                <h3 className="font-bold">Emergency AI Assistant</h3>
                <p className="text-sm opacity-90">
                  {emergencyState?.mode === 'fire_detected' ? 'Emergency Mode Active' : 'Real-time guidance'}
                </p>
              </div>
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                {aiMessages.map((msg, idx) => (
                  <motion.div
                    key={`${idx}-${msg}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-3 rounded-lg text-sm ${
                      emergencyState?.mode === 'fire_detected' && idx === 0
                        ? 'bg-red-100 text-red-800 font-semibold'
                        : 'bg-slate-100 text-primary'
                    }`}
                  >
                    {msg}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
