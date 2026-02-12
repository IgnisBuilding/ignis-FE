'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Share2,
  Check,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type { EmergencyState } from '@/lib/map';
import { api, type Floor } from '@/lib/api';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useEvacueeTracking } from '@/hooks/use-evacuee-tracking';

// Dynamically import EvacuationMap to avoid SSR issues with MapLibre
const EvacuationMap = dynamic(
  () => import('@/components/maps/EvacuationMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tactical map...</p>
        </div>
      </div>
    )
  }
);


function EmergencyPageContent() {
  const { user, dashboardRole, roleTitle } = useAuth();
  const searchParams = useSearchParams();

  // Get building ID and name from URL params
  const buildingIdParam = searchParams.get('id');
  const buildingName = searchParams.get('building') || 'Building';
  const buildingId = buildingIdParam ? parseInt(buildingIdParam, 10) : 1;
  const isMobileMode = searchParams.get('mobile') === 'true';

  // Building & Floor State
  const [floors, setFloors] = useState<Floor[]>([]);
  const [activeFloor, setActiveFloor] = useState<Floor | null>(null);
  const [isLoadingFloors, setIsLoadingFloors] = useState(true);
  const [floorPlanData, setFloorPlanData] = useState<any>(null);

  // UI State
  const [stackMode, setStackMode] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isTalking, setIsTalking] = useState(false);

  // Emergency State
  const [emergencyState, setEmergencyState] = useState<EmergencyState | null>(null);

  // Real-time evacuee tracking
  const {
    isConnected: isTrackingConnected,
    evacuees,
    routes,
    stats: evacuationStats,
    subscribeToBuilding,
    unsubscribeFromBuilding,
  } = useEvacueeTracking({
    buildingId,
    autoConnect: true,
    onEvacueePositionUpdate: (position) => {
      console.log('[Emergency] Evacuee position update:', position);
    },
    onEvacueeSafe: (event) => {
      console.log('[Emergency] Evacuee safe:', event);
    },
    onEvacueeTrapped: (event) => {
      console.log('[Emergency] Evacuee trapped:', event);
    },
  });

  // Mobile bridge for Android WebView offline injection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    (window as any).__mobileBridge = {
      // Called by Android when going offline
      setOfflineMode: (isOffline: boolean) => {
        console.log('[MobileBridge] Offline mode:', isOffline);
        // Show/hide offline indicator in the legend
        const offlineEl = document.getElementById('mobile-offline-indicator');
        if (offlineEl) offlineEl.style.display = isOffline ? 'flex' : 'none';
      },

      // Called by Android to inject user position directly onto map
      injectPosition: (positionJson: string) => {
        try {
          const pos = JSON.parse(positionJson);
          const map = (window as any)._mapInstance;
          if (!map) return;

          const coords = [pos.lng, pos.lat];
          const source = map.getSource('mobile-position');
          const geojson = {
            type: 'FeatureCollection' as const,
            features: [{
              type: 'Feature' as const,
              geometry: { type: 'Point' as const, coordinates: coords },
              properties: { heading: pos.heading || 0, accuracy: pos.accuracy || 5 }
            }]
          };

          if (source) {
            source.setData(geojson);
          } else {
            map.addSource('mobile-position', { type: 'geojson', data: geojson });
            map.addLayer({
              id: 'mobile-position-circle',
              type: 'circle',
              source: 'mobile-position',
              paint: {
                'circle-radius': 8,
                'circle-color': '#2196F3',
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 3,
                'circle-opacity': 0.9
              }
            });
          }
        } catch (e) {
          console.error('[MobileBridge] injectPosition error:', e);
        }
      },

      // Called by Android to inject cached hazards when offline
      injectHazards: (hazardsGeoJson: string) => {
        try {
          const geojson = JSON.parse(hazardsGeoJson);
          const map = (window as any)._mapInstance;
          if (!map) return;

          const source = map.getSource('offline-hazards');
          if (source) {
            source.setData(geojson);
          } else {
            map.addSource('offline-hazards', { type: 'geojson', data: geojson });
            map.addLayer({
              id: 'offline-hazards-layer',
              type: 'circle',
              source: 'offline-hazards',
              paint: {
                'circle-radius': 12,
                'circle-color': '#FF4444',
                'circle-stroke-color': '#CC0000',
                'circle-stroke-width': 2,
                'circle-opacity': 0.8
              }
            });
          }
        } catch (e) {
          console.error('[MobileBridge] injectHazards error:', e);
        }
      },

      // Called by Android to display locally-computed evacuation route
      injectRoute: (routeGeoJson: string) => {
        try {
          const geojson = JSON.parse(routeGeoJson);
          const map = (window as any)._mapInstance;
          if (!map) return;

          const source = map.getSource('offline-route');
          if (source) {
            source.setData(geojson);
          } else {
            map.addSource('offline-route', { type: 'geojson', data: geojson });
            map.addLayer({
              id: 'offline-route-layer',
              type: 'line',
              source: 'offline-route',
              paint: {
                'line-color': '#4CAF50',
                'line-width': 4,
                'line-dasharray': [2, 1],
                'line-opacity': 0.9
              }
            });
          }
        } catch (e) {
          console.error('[MobileBridge] injectRoute error:', e);
        }
      },

      // Get current building/floor IDs
      getBuildingId: () => buildingId,
      getFloorId: () => activeFloor?.id ?? null,
      getFloorLevel: () => activeFloor?.level ?? null,
    };

    return () => {
      delete (window as any).__mobileBridge;
    };
  }, [buildingId, activeFloor]);

  // Fetch floors and floor plan from API
  useEffect(() => {
    const fetchBuildingData = async () => {
      try {
        setIsLoadingFloors(true);

        // Fetch floors
        const buildingFloors = await api.getBuildingFloors(buildingId);
        // Sort by level descending (highest floor first)
        const sortedFloors = buildingFloors.sort((a, b) => b.level - a.level);
        setFloors(sortedFloors);
        // Set the first floor as active by default
        if (sortedFloors.length > 0) {
          setActiveFloor(sortedFloors[0]);
        }

        // Fetch floor plan GeoJSON data
        try {
          const floorPlan = await api.getBuildingFloorPlan(buildingId);
          setFloorPlanData(floorPlan);
        } catch (fpError) {
          console.error('Failed to fetch floor plan:', fpError);
        }
      } catch (error) {
        console.error('Failed to fetch floors:', error);
        // Fallback to default floors if API fails
        setFloors([
          { id: 2, name: 'Floor 2', level: 2, building_id: 1, created_at: '', updated_at: '' },
          { id: 1, name: 'Floor 1', level: 1, building_id: 1, created_at: '', updated_at: '' },
        ]);
        setActiveFloor({ id: 1, name: 'Floor 1', level: 1, building_id: 1, created_at: '', updated_at: '' });
      } finally {
        setIsLoadingFloors(false);
      }
    };

    fetchBuildingData();
  }, [buildingId]);
  const [criticalAlert, setCriticalAlert] = useState<{
    title: string;
    description: string;
    acknowledged: boolean;
  } | null>(null);

  // AI Messages
  const [aiMessages, setAiMessages] = useState<string[]>([
    "System ready. Monitoring for fire hazards.",
    "All evacuation routes are clear.",
    "Emergency services on standby."
  ]);

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

      setCriticalAlert({
        title: 'Unit 701: Breach',
        description: 'Thermal escalation in NW quadrant. Recommend pathing via East Stairs (Safety Trail updated).',
        acknowledged: false,
      });
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
      setCriticalAlert(null);
    } else if (state.mode === 'idle') {
      setAiMessages([
        "System ready. Monitoring for fire hazards.",
        "All evacuation routes are clear.",
        "Emergency services on standby."
      ]);
      setIsTalking(false);
      setCriticalAlert(null);
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

  // Handle acknowledge alert
  const handleAcknowledgeAlert = () => {
    if (criticalAlert) {
      setCriticalAlert({ ...criticalAlert, acknowledged: true });
    }
  };

  const content = (
      <div className="flex-1 flex flex-col h-full">
        <div className="flex flex-1 min-h-0">
          {/* Floor Selector — minimal on mobile, full on desktop */}
          <div className={`flex-shrink-0 flex flex-col items-center gap-1 border-r border-border bg-card px-3 py-4 ${isMobileMode ? 'py-2 px-1.5' : ''}`}>
            {isLoadingFloors ? (
              <div className="animate-pulse h-10 w-10 bg-muted rounded-lg" />
            ) : (
              floors.map((floor) => (
                <button
                  key={floor.id}
                  type="button"
                  onClick={() => setActiveFloor(floor)}
                  className={`flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    isMobileMode ? 'h-8 w-8 text-[10px]' : 'h-10 w-10'
                  } ${
                    activeFloor?.id === floor.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  F{String(floor.level).padStart(2, '0')}
                </button>
              ))
            )}
            {/* Stack toggle — desktop only */}
            {!isMobileMode && (
              <div className="mt-2 flex flex-col items-center gap-1">
                <Switch checked={stackMode} onCheckedChange={setStackMode} />
                <span className="text-[9px] font-medium text-muted-foreground">STACK</span>
              </div>
            )}
          </div>

          {/* Map View Area */}
          <div className="relative flex-1 min-w-0">
            {/* Critical Alert Card — desktop only */}
            {!isMobileMode && (
              <AnimatePresence>
                {criticalAlert && !criticalAlert.acknowledged && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute left-4 top-4 z-20 w-64"
                  >
                    <Card className="border-0 bg-gradient-to-br from-red-400 to-red-500 text-white shadow-xl">
                      <CardContent className="p-3">
                        <div className="mb-1 flex items-center justify-between">
                          <Badge className="bg-red-700/50 text-[9px] font-bold text-white hover:bg-red-700/50">CRITICAL ALERT</Badge>
                          <div className="h-2 w-2 rounded-full bg-white/50 animate-pulse" />
                        </div>
                        <h3 className="text-base font-bold">{criticalAlert.title}</h3>
                        <p className="mt-1 text-xs text-white/90">
                          {criticalAlert.description}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAcknowledgeAlert}
                            className="flex-1 border-white/30 bg-transparent text-white hover:bg-white/20 text-xs h-8"
                          >
                            ACKNOWLEDGE
                          </Button>
                          <Button size="icon" className="bg-red-700 text-white hover:bg-red-800 h-8 w-8">
                            <Share2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Evacuation Map — no emergency controls on mobile */}
            <EvacuationMap
              className="absolute inset-0"
              showControls={true}
              showLegend={false}
              showEmergencyControls={!isMobileMode}
              showFloorSelector={false}
              floor={activeFloor ? `floor${activeFloor.level}` as 'floor1' | 'floor2' : 'floor1'}
              onRoomClick={handleRoomClick}
              onEmergencyStateChange={handleEmergencyStateChange}
              buildingId={buildingId}
              floorPlanData={floorPlanData}
              activeFloorLevel={activeFloor?.level}
              activeFloorId={activeFloor?.id}
              // Real-time evacuee tracking
              evacuees={evacuees}
              showEvacuees={true}
              currentUserId={user?.id}
            />

            {/* Tactical Overlay Legend — compact on mobile */}
            <Card className={`absolute ${isMobileMode ? 'bottom-2 left-2 right-2' : 'bottom-4 left-1/2 -translate-x-1/2'} shadow-lg`}>
              <CardContent className={`flex items-center gap-4 ${isMobileMode ? 'gap-2 px-2 py-1.5 flex-wrap justify-center' : 'px-4 py-2'}`}>
                {!isMobileMode && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tactical Overlay</span>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="text-xs text-foreground">Fire</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="3,3" className="text-muted-foreground" /></svg>
                  <span className="text-xs text-foreground">Path</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex h-3 w-3 items-center justify-center rounded bg-green-500">
                    <Check className="h-2 w-2 text-white" />
                  </div>
                  <span className="text-xs text-foreground">Exit</span>
                </div>
                {/* Live Tracking Status */}
                <div className="flex items-center gap-1.5 border-l pl-2 ml-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${isTrackingConnected ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-xs text-foreground">
                    {isTrackingConnected ? `${evacuees.size} Live` : 'Offline'}
                  </span>
                </div>
                {/* Offline indicator for mobile bridge */}
                <div id="mobile-offline-indicator" className="items-center gap-1.5" style={{ display: 'none' }}>
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                  <span className="text-xs text-orange-600 font-medium">Offline</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Agent Button & Chat — desktop only */}
      {!isMobileMode && (
        <>
          <motion.button
            type="button"
            onClick={() => setIsAIOpen(!isAIOpen)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-primary rounded-full shadow-2xl flex items-center justify-center z-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isAIOpen ? <X className="w-6 h-6 text-primary-foreground" /> : <MessageCircle className="w-6 h-6 text-primary-foreground" />}
            {isTalking && (
              <motion.div
                className="absolute inset-0 border-4 border-primary-foreground rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </motion.button>

          <AnimatePresence>
            {isAIOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="fixed bottom-24 right-6 w-80 bg-card rounded-2xl shadow-2xl z-50 overflow-hidden border border-border"
              >
                <div className={`${emergencyState?.mode === 'fire_detected' ? 'bg-destructive' : 'bg-primary'} text-primary-foreground p-4`}>
                  <h3 className="font-bold text-sm">Emergency AI Assistant</h3>
                  <p className="text-xs opacity-90">
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
                          ? 'bg-destructive/10 text-destructive font-semibold'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {msg}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
  );

  // Mobile mode (Android WebView): skip DashboardLayout wrapper
  if (isMobileMode) {
    return <div className="h-screen w-screen flex flex-col">{content}</div>;
  }

  return (
    <DashboardLayout role={dashboardRole} userName={user?.name || 'User'} userTitle={`${roleTitle} • ${buildingName}`}>
      {content}
    </DashboardLayout>
  );
}

export default function EmergencyPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'commander', 'management', 'building_authority', 'firefighter', 'firefighter_hq', 'firefighter_state', 'firefighter_district', 'evacuee']}>
      <Suspense fallback={
        <div className="w-full h-screen flex items-center justify-center bg-muted/20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1f3d2f]"></div>
            <p className="text-sm text-muted-foreground">Loading emergency view...</p>
          </div>
        </div>
      }>
        <EmergencyPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
