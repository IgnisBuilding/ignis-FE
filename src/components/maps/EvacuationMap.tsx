'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { io, Socket } from 'socket.io-client';

import {
  DEFAULT_MAP_CONFIG,
  FLOOR_LAYERS,
  LAYER_STYLES,
  NOTIFICATION_COLORS,
  loadMapData,
  normalizeGeoJSON,
  calculateBounds,
  formatRoomPopupContent,
  formatFireAlertPopup,
  createStairsPattern,
  computeRoute,
  placeFires,
  clearFires,
  extractFeatureFromResponse,
  convertGeometryIfMercator,
  isValidLonLat,
  loadImportedBuilding,
  convertImportedToMapData,
  // Local routing for imported buildings
  isUsingImportedRouting,
  computeLocalRoute,
  placeLocalFires,
  clearLocalFires,
  // Fetch active hazards from backend
  fetchActiveHazards,
} from '@/lib/map';

import type { EmergencyState, MapCallbacks, Sensor, HazardData, IsolationResponse } from '@/lib/map';

// Evacuee position interface for real-time tracking
export interface EvacueePosition {
  user_id: number;
  building_id: number;
  floor_id: number;
  coordinates: [number, number];
  heading?: number;
  status: 'active' | 'navigating' | 'safe' | 'trapped' | 'offline';
  current_instruction?: string;
  progress?: number;
  last_update: number;
  userName?: string;
}

// Props interface
interface EvacuationMapProps {
  className?: string;
  initialFloor?: 'floor1' | 'floor2';
  floor?: 'floor1' | 'floor2'; // External floor control from parent
  showControls?: boolean;
  showLegend?: boolean;
  showEmergencyControls?: boolean;
  showFloorSelector?: boolean; // Whether to show internal floor tabs
  onRoomClick?: (room: GeoJSON.Feature) => void;
  onEmergencyStateChange?: (state: EmergencyState) => void;
  buildingId?: number; // Building ID from database
  floorPlanData?: any; // Floor plan GeoJSON data from database
  activeFloorLevel?: number; // Active floor level from parent
  activeFloorId?: number; // Active floor ID from parent (for precise filtering)
  // Real-time evacuee tracking
  evacuees?: Map<number, EvacueePosition>; // Map of user_id to position
  showEvacuees?: boolean; // Whether to show evacuee markers
  currentUserId?: number; // Current user's ID (to highlight their marker)
}

// Notification component
const Notification = memo(({ message, type }: { message: string; type: keyof typeof NOTIFICATION_COLORS }) => {
  const colors = NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.info;

  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg animate-slide-up"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {message}
    </div>
  );
});

Notification.displayName = 'Notification';

// Main component
const EvacuationMap = memo(({
  className = '',
  initialFloor = 'floor1',
  floor: externalFloor,
  showControls = true,
  showLegend = true,
  showEmergencyControls = true,
  showFloorSelector = true,
  onRoomClick,
  onEmergencyStateChange,
  buildingId,
  floorPlanData,
  activeFloorLevel,
  activeFloorId,
  evacuees,
  showEvacuees = true,
  currentUserId,
}: EvacuationMapProps) => {
  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const fireMarkersRef = useRef<maplibregl.Marker[]>([]);
  const startMarkerRef = useRef<maplibregl.Marker | null>(null);
  const endMarkerRef = useRef<maplibregl.Marker | null>(null);
  const roomsDataRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const evacueeMarkersRef = useRef<Map<number, maplibregl.Marker>>(new Map());

  // State
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentFloor, setCurrentFloor] = useState<'floor1' | 'floor2'>(initialFloor);
  const [notification, setNotification] = useState<{ message: string; type: keyof typeof NOTIFICATION_COLORS } | null>(null);
  const [emergencyState, setEmergencyState] = useState<EmergencyState>({
    isActive: false,
    mode: 'idle',
    occupancy: Math.floor(Math.random() * 50) + 10,
    fireMarkers: [],
    evacuationProgress: 0,
  });
  const [routeNodes, setRouteNodes] = useState<{ id: string; name: string; nodeId?: string; roomId?: string; coordinates?: [number, number]; floorId?: number; floorLevel?: string | number; apartmentId?: number }[]>([]);
  const [selectedStart, setSelectedStart] = useState<string>('');
  const [selectedEnd, setSelectedEnd] = useState<string>('');
  const [isComputingRoute, setIsComputingRoute] = useState(false);
  const [hasComputedRoute, setHasComputedRoute] = useState(false);

  // Fire zone management state
  const [selectedFireZones, setSelectedFireZones] = useState<string[]>([]);
  const [fireSeverity, setFireSeverity] = useState<'HIGH' | 'CRITICAL'>('HIGH');
  const [activeFireZones, setActiveFireZones] = useState<Array<{ roomId: string; roomName: string; severity: string }>>([]);

  // Automatic fire detection state
  const [autoFireEnabled, setAutoFireEnabled] = useState(false);
  const [autoFireRoom, setAutoFireRoom] = useState<string>('');
  const [isConnectedToDetection, setIsConnectedToDetection] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const lastFirePlacementRef = useRef<number>(0); // Debounce fire placements

  // Ignis-BE fire detection integration (real-time from cameras)
  const [ignisFireDetectionEnabled, setIgnisFireDetectionEnabled] = useState(true); // Enabled by default
  const [isConnectedToIgnis, setIsConnectedToIgnis] = useState(false);
  const ignisSocketRef = useRef<Socket | null>(null);
  const allFloorRouteNodesRef = useRef<{ id: string; name: string; nodeId?: string; roomId?: string; coordinates?: [number, number]; floorLevel?: string }[]>([]);
  const allRoomsDataRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const activeFireZonesRef = useRef<Array<{ roomId: string; roomName: string; severity: string }>>([]);
  const pendingFireEventsRef = useRef<Array<{ roomId: string; detectionData: any }>>([]);

  // Panel collapse states - start collapsed for cleaner initial view
  const [isEmergencyPanelCollapsed, setIsEmergencyPanelCollapsed] = useState(true);
  const [isFireZonePanelCollapsed, setIsFireZonePanelCollapsed] = useState(true);
  const [isRoutePanelCollapsed, setIsRoutePanelCollapsed] = useState(true);

  // Isolation alert state (when person is trapped by fire)
  const [isolationAlert, setIsolationAlert] = useState<IsolationResponse | null>(null);

  // Keep activeFireZonesRef in sync to avoid stale closures in socket handlers
  useEffect(() => {
    activeFireZonesRef.current = activeFireZones;
  }, [activeFireZones]);

  // ═══════════════════════════════════════════════════════════════
  // REAL-TIME EVACUEE MARKERS
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !showEvacuees || !evacuees) return;

    const map = mapRef.current;
    const currentMarkers = evacueeMarkersRef.current;
    const evacueeIds = new Set(evacuees.keys());

    // Remove markers for evacuees no longer in the list
    currentMarkers.forEach((marker, userId) => {
      if (!evacueeIds.has(userId)) {
        marker.remove();
        currentMarkers.delete(userId);
      }
    });

    // Add or update markers for each evacuee
    evacuees.forEach((evacuee, userId) => {
      // Skip if coordinates are invalid
      if (!evacuee.coordinates || evacuee.coordinates.length !== 2) return;
      if (!isValidLonLat(evacuee.coordinates[0], evacuee.coordinates[1])) return;

      // Filter by floor if activeFloorId is set
      if (activeFloorId && evacuee.floor_id !== activeFloorId) {
        // Hide marker if on different floor
        const existingMarker = currentMarkers.get(userId);
        if (existingMarker) {
          existingMarker.getElement().style.display = 'none';
        }
        return;
      }

      const isCurrentUser = currentUserId === userId;
      const existingMarker = currentMarkers.get(userId);

      if (existingMarker) {
        // Update existing marker position with smooth animation
        existingMarker.setLngLat(evacuee.coordinates);
        existingMarker.getElement().style.display = 'block';

        // Update marker style based on status
        const el = existingMarker.getElement();
        el.className = `evacuee-marker evacuee-${evacuee.status}${isCurrentUser ? ' current-user' : ''}`;

        // Update rotation if heading is available
        if (evacuee.heading !== undefined) {
          el.style.transform = `rotate(${evacuee.heading}deg)`;
        }
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.className = `evacuee-marker evacuee-${evacuee.status}${isCurrentUser ? ' current-user' : ''}`;

        // Style based on status
        const statusColors: Record<string, string> = {
          active: '#3B82F6',      // Blue
          navigating: '#10B981',  // Green
          safe: '#22C55E',        // Bright green
          trapped: '#EF4444',     // Red
          offline: '#6B7280',     // Gray
        };

        const color = statusColors[evacuee.status] || statusColors.active;
        const size = isCurrentUser ? 24 : 18;

        el.innerHTML = `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.3s ease;
            ${isCurrentUser ? 'animation: pulse 2s infinite;' : ''}
          ">
            ${isCurrentUser ? `
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
              "></div>
            ` : ''}
          </div>
          ${evacuee.heading !== undefined ? `
            <div style="
              position: absolute;
              top: -8px;
              left: 50%;
              transform: translateX(-50%) rotate(${evacuee.heading}deg);
              width: 0;
              height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-bottom: 8px solid ${color};
            "></div>
          ` : ''}
        `;

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(evacuee.coordinates)
          .setPopup(
            new maplibregl.Popup({ offset: 25, closeButton: false })
              .setHTML(`
                <div style="padding: 8px; min-width: 150px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">
                    ${isCurrentUser ? '📍 You' : `👤 User ${evacuee.user_id}`}
                  </div>
                  <div style="font-size: 12px; color: #666;">
                    <div>Status: <span style="color: ${color}; font-weight: 500;">${evacuee.status}</span></div>
                    ${evacuee.current_instruction ? `<div style="margin-top: 4px;">📢 ${evacuee.current_instruction}</div>` : ''}
                    ${evacuee.progress !== undefined ? `<div>Progress: ${evacuee.progress}%</div>` : ''}
                  </div>
                </div>
              `)
          )
          .addTo(map);

        currentMarkers.set(userId, marker);
      }
    });
  }, [evacuees, isMapLoaded, showEvacuees, activeFloorId, currentUserId]);

  // Cleanup evacuee markers on unmount
  useEffect(() => {
    return () => {
      evacueeMarkersRef.current.forEach(marker => marker.remove());
      evacueeMarkersRef.current.clear();
    };
  }, []);

  // Imported building state
  const [isUsingImportedData, setIsUsingImportedData] = useState(false);
  const [importedBuildingName, setImportedBuildingName] = useState<string>('');

  // Show notification
  const showNotification = useCallback((message: string, type: keyof typeof NOTIFICATION_COLORS = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  // Update emergency state
  const updateEmergencyState = useCallback((updates: Partial<EmergencyState>) => {
    setEmergencyState(prev => ({ ...prev, ...updates }));
  }, []);

  // Notify parent of emergency state changes (after render, not during)
  useEffect(() => {
    onEmergencyStateChange?.(emergencyState);
  }, [emergencyState, onEmergencyStateChange]);

  // Sync external floor prop with internal state and switch map layers
  useEffect(() => {
    if (externalFloor && externalFloor !== currentFloor && isMapLoaded && mapRef.current) {
      const map = mapRef.current;
      const allLayers = [...FLOOR_LAYERS.floor1.layers, ...FLOOR_LAYERS.floor2.layers];

      // Hide all floor layers
      allLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', 'none');
        }
      });

      // Show selected floor layers
      const showLayers = FLOOR_LAYERS[externalFloor]?.layers || FLOOR_LAYERS.floor1.layers;
      showLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', 'visible');
        }
      });

      setCurrentFloor(externalFloor);
    }
  }, [externalFloor, currentFloor, isMapLoaded]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    console.log('🗺️  Initializing MapLibre instance...');

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: DEFAULT_MAP_CONFIG.style,
      center: DEFAULT_MAP_CONFIG.center,
      zoom: DEFAULT_MAP_CONFIG.zoom,
      minZoom: DEFAULT_MAP_CONFIG.minZoom,
      maxZoom: DEFAULT_MAP_CONFIG.maxZoom,
      pitch: DEFAULT_MAP_CONFIG.pitch || 0,      // Isometric tilt angle
      bearing: DEFAULT_MAP_CONFIG.bearing || 0,  // Rotation angle
      attributionControl: false,
      preserveDrawingBuffer: true,
    });

    mapRef.current = map;
    console.log('✅ MapLibre instance created');

    map.on('load', async () => {
      try {
        let roomsData: GeoJSON.FeatureCollection;
        let featuresData: GeoJSON.FeatureCollection;
        let detailsData: GeoJSON.FeatureCollection;
        let nodesData: GeoJSON.FeatureCollection;
        let camerasData: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
        let roomNodesMappingData: any[] = [];
        let sensors: GeoJSON.FeatureCollection | null = null;
        let occupancy: any = null;
        let buildingCenter: [number, number] | null = null;

        // Priority 1: Use floorPlanData from props (passed from parent component)
        if (floorPlanData && floorPlanData.features && floorPlanData.features.length > 0) {
          console.log('[EvacuationMap] Using floor plan data from props, buildingId:', buildingId);

          // Filter features by active floor ID (preferred) or level (fallback)
          const filterByFloor = (features: any[]) => {
            // Prefer floor_id filtering for precise matching
            if (activeFloorId) {
              return features.filter((f: any) =>
                f.properties?.floor_id === activeFloorId ||
                f.properties?.floorId === activeFloorId ||
                (!f.properties?.floor_id && !f.properties?.floorId)
              );
            }
            // Fallback to level filtering
            if (!activeFloorLevel) return features;
            return features.filter((f: any) =>
              !f.properties?.level || String(f.properties.level) === String(activeFloorLevel)
            );
          };

          const roomFeatures = filterByFloor(floorPlanData.features.filter((f: any) =>
            f.properties?.room_type || (f.geometry?.type === 'Polygon' && !f.properties?.type)
          ));

          const openingFeatures = filterByFloor(floorPlanData.features.filter((f: any) =>
            f.properties?.type === 'opening' || f.properties?.opening_type
          ));

          const nodeFeatures = filterByFloor(floorPlanData.features.filter((f: any) =>
            f.properties?.type === 'node'
          ));

          const cameraFeatures = filterByFloor(floorPlanData.features.filter((f: any) =>
            f.properties?.type === 'camera' || f.properties?.is_camera
          ));

          roomsData = {
            type: 'FeatureCollection',
            features: roomFeatures.map((f: any) => ({
              ...f,
              properties: {
                ...f.properties,
                room_type: f.properties?.room_type || f.properties?.type || 'other',
              }
            }))
          };

          // Convert LineString openings to Points at their midpoints for circle rendering
          featuresData = {
            type: 'FeatureCollection',
            features: openingFeatures.map((f: any) => {
              // If it's a LineString (opening), convert to Point at midpoint
              if (f.geometry?.type === 'LineString' && f.geometry.coordinates?.length >= 2) {
                const coords = f.geometry.coordinates;
                const midLng = (coords[0][0] + coords[1][0]) / 2;
                const midLat = (coords[0][1] + coords[1][1]) / 2;
                return {
                  ...f,
                  geometry: {
                    type: 'Point',
                    coordinates: [midLng, midLat]
                  }
                };
              }
              return f;
            })
          };

          detailsData = { type: 'FeatureCollection', features: [] };

          nodesData = {
            type: 'FeatureCollection',
            features: nodeFeatures
          };

          // Create cameras data
          camerasData = {
            type: 'FeatureCollection',
            features: cameraFeatures
          };

          // Log cameras found
          if (cameraFeatures.length > 0) {
            console.log('[EvacuationMap] Found', cameraFeatures.length, 'cameras in floor plan data');
          }

          // Get building center from properties
          if (floorPlanData.properties?.center_lat && floorPlanData.properties?.center_lng) {
            buildingCenter = [floorPlanData.properties.center_lng, floorPlanData.properties.center_lat];
          }

          setIsUsingImportedData(true);
          setImportedBuildingName(floorPlanData.properties?.building_name || `Building #${buildingId}`);

          showNotification(`Loaded building floor plan from database`, 'success');
        } else {
          // Priority 2: Check for imported building data from Map Editor (localStorage)
          const importedBuilding = await loadImportedBuilding();

          if (importedBuilding) {
            // Use imported building data from Map Editor
            console.log('[EvacuationMap] Using imported building data:', importedBuilding.buildingId);
            const convertedData = convertImportedToMapData(importedBuilding);

            roomsData = convertedData.rooms;
            featuresData = convertedData.features;
            detailsData = convertedData.details;
            nodesData = convertedData.nodes;
            sensors = convertedData.sensors;
            occupancy = convertedData.occupancy;
            buildingCenter = convertedData.buildingCenter;

            setIsUsingImportedData(true);
            setImportedBuildingName(importedBuilding.building?.name || 'Imported Building');

            showNotification(`Loaded imported building: ${importedBuilding.building?.name || 'Custom Floor Plan'}`, 'success');
          } else {
            // Priority 3: Fall back to loading from backend API
            console.log('[EvacuationMap] No imported building, loading from backend API...');
            const backendData = await loadMapData();

            // Check if rooms data was loaded successfully
            if (!backendData.rooms || !backendData.rooms.features || backendData.rooms.features.length === 0) {
              console.error('Rooms data not loaded - backend may be unavailable');
              showNotification('Backend server not available. Please ensure the backend is running.', 'error');
              setIsMapLoaded(true); // Still mark as loaded to show error state
              return;
            }

            // Normalize and add sources
            roomsData = normalizeGeoJSON(backendData.rooms);
            featuresData = normalizeGeoJSON(backendData.features);
            detailsData = normalizeGeoJSON(backendData.details);
            nodesData = normalizeGeoJSON(backendData.nodes);
            roomNodesMappingData = backendData.roomNodes || [];
            sensors = backendData.sensors;
            occupancy = backendData.occupancy;
          }
        }

        // Check if rooms data was loaded successfully
        // If buildingId prop is provided, we expect floorPlanData to arrive later via useEffect
        if (!roomsData || !roomsData.features || roomsData.features.length === 0) {
          if (buildingId) {
            // We're waiting for floorPlanData from props - create empty sources
            console.log('[EvacuationMap] Waiting for floor plan data from database for building', buildingId);
            roomsData = { type: 'FeatureCollection', features: [] };
            featuresData = { type: 'FeatureCollection', features: [] };
            detailsData = { type: 'FeatureCollection', features: [] };
            nodesData = { type: 'FeatureCollection', features: [] };
          } else {
            console.error('No room data available');
            showNotification('No building data available. Please import a floor plan from Map Editor.', 'error');
            setIsMapLoaded(true);
            return;
          }
        }

        // Store rooms data in ref for later use (fire zone visualization)
        roomsDataRef.current = roomsData;

        // Add stairs pattern image
        const stairsCanvas = createStairsPattern();
        map.addImage('stairs-pattern', { width: 32, height: 32, data: new Uint8Array(stairsCanvas.getContext('2d')!.getImageData(0, 0, 32, 32).data) });

        // Add sources
        map.addSource('building', { type: 'geojson', data: roomsData, generateId: true });
        map.addSource('building-features', { type: 'geojson', data: featuresData });
        map.addSource('building-details', { type: 'geojson', data: detailsData });
        map.addSource('navigation-nodes', { type: 'geojson', data: nodesData });
        map.addSource('cameras', { type: 'geojson', data: camerasData });

        // Add all layers
        addMapLayers(map);

        // Fit to building bounds or center - preserve isometric view
        if (buildingCenter) {
          // Use building center from imported data
          map.flyTo({
            center: buildingCenter,
            zoom: 19,
            pitch: DEFAULT_MAP_CONFIG.pitch || 45,
            bearing: DEFAULT_MAP_CONFIG.bearing || -20,
            duration: 1000,
          });
        } else {
          const bounds = calculateBounds(roomsData);
          if (bounds) {
            map.fitBounds(bounds, {
              padding: 50,
              duration: 1000,
              pitch: DEFAULT_MAP_CONFIG.pitch || 45,
              bearing: DEFAULT_MAP_CONFIG.bearing || -20,
            });
          }
        }

        // Use room-nodes mapping from backend for accurate fire placement
        // This maps room IDs to their corresponding navigation node IDs
        const roomNodesMapping = roomNodesMappingData || [];

        // Create a map for quick lookup
        const roomToNodeMap = new Map<number, { nodeId: number; coordinates: [number, number]; nodeType: string }>();
        roomNodesMapping.forEach((mapping: any) => {
          roomToNodeMap.set(mapping.room_id, {
            nodeId: mapping.node_id,
            coordinates: [mapping.longitude, mapping.latitude],
            nodeType: mapping.node_type,
          });
        });

        // Populate route node options from rooms data with actual node IDs
        // The rooms endpoint now includes node_id directly in properties
        const roomNodes = roomsData.features
          .filter(f => f.properties?.name)
          .map(f => {
            const roomId = f.properties?.id || f.id;
            // Use node_id directly from room properties (added by backend)
            // Fall back to room-nodes mapping, then to room ID
            const nodeIdFromProps = f.properties?.node_id;
            const mapping = roomToNodeMap.get(Number(roomId));
            const nodeId = nodeIdFromProps || (mapping ? mapping.nodeId : roomId);

            // Get centroid of the room for visualization
            let coordinates: [number, number] | undefined;
            if (mapping) {
              coordinates = mapping.coordinates;
            } else if (f.geometry && f.geometry.type === 'Polygon') {
              const ring = (f.geometry as GeoJSON.Polygon).coordinates[0];
              let cx = 0, cy = 0;
              ring.forEach(([lng, lat]) => { cx += lng; cy += lat; });
              coordinates = [cx / ring.length, cy / ring.length];
            }

            return {
              id: String(roomId),
              name: f.properties?.name || 'Unknown',
              // CRITICAL: Use node_id from room properties for route computation
              nodeId: String(nodeId),
              roomId: String(roomId),
              coordinates,
              nodeType: mapping?.nodeType,
            };
          });

        // Also add navigation nodes (doorways, exits, etc.) for route computation
        const navNodes = nodesData.features
          .filter(f => f.properties?.type === 'doorway' || f.properties?.type === 'exit' || f.properties?.type === 'stairs' || f.properties?.type === 'entry')
          .map(f => {
            let coordinates: [number, number] | undefined;
            if (f.geometry && f.geometry.type === 'Point') {
              coordinates = (f.geometry as GeoJSON.Point).coordinates as [number, number];
            }
            const nodeType = f.properties?.type || 'node';
            return {
              id: `nav-${f.properties?.id || f.id}`,
              name: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${f.properties?.id || f.id}`,
              nodeId: String(f.properties?.id || f.id),
              roomId: `nav-${f.properties?.id || f.id}`,
              coordinates,
            };
          });

        // Deduplicate by node_id to avoid multiple entries for same node
        const seenNodeIds = new Set<string>();
        const deduplicatedRoomNodes = roomNodes.filter((node: any) => {
          if (seenNodeIds.has(node.nodeId)) return false;
          seenNodeIds.add(node.nodeId);
          return true;
        });
        const deduplicatedNavNodes = navNodes.filter((node: any) => {
          if (seenNodeIds.has(node.nodeId)) return false;
          seenNodeIds.add(node.nodeId);
          return true;
        });

        setRouteNodes([...deduplicatedRoomNodes, ...deduplicatedNavNodes]);

        // Store data globally for debugging
        if (typeof window !== 'undefined') {
          (window as any)._mapInstance = map;
          (window as any)._roomsData = roomsData;
          (window as any)._nodesData = nodesData;
          (window as any)._roomNodesMapping = roomNodesMapping;
          (window as any)._sensors = sensors;
          (window as any)._occupancy = occupancy;
        }

        // Add controls
        if (showControls) {
          map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true }), 'top-right');
          map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-right');
          map.addControl(new maplibregl.FullscreenControl(), 'top-right');
        }

        // Add room interactions
        setupRoomInteractions(map);

        setIsMapLoaded(true);
      } catch (error) {
        console.error('Failed to initialize map:', error);
        showNotification('Failed to load map data. Please check if the backend server is running.', 'error');
        setIsMapLoaded(true);
      }
    });

    map.on('error', (e) => {
      console.error('❌ Map error:', e);
    });

    return () => {
      console.log('🧹 Cleaning up map instance');
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [showControls, showNotification]);

  // Load active hazards from backend when map is loaded
  // This ensures existing fires are displayed when the emergency page opens
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;

    const loadExistingHazards = async () => {
      try {
        console.log('[Hazards] Loading active hazards from backend for building:', buildingId);
        const hazardsGeoJSON = await fetchActiveHazards(buildingId);

        if (!hazardsGeoJSON || !hazardsGeoJSON.features || hazardsGeoJSON.features.length === 0) {
          console.log('[Hazards] No active hazards found');
          return;
        }

        console.log(`[Hazards] Found ${hazardsGeoJSON.features.length} active hazard(s)`);
        const map = mapRef.current;
        if (!map) return;

        // Process each hazard and add fire markers
        for (const hazard of hazardsGeoJSON.features) {
          const props = hazard.properties || {};
          const geometry = hazard.geometry as GeoJSON.Point;

          // Skip if geometry is invalid
          if (!geometry || geometry.type !== 'Point' || !geometry.coordinates) {
            console.log('[Hazards] Skipping hazard with invalid geometry:', props.id);
            continue;
          }

          // Only process fire-type hazards that are active
          if (props.type !== 'fire' || props.status !== 'active') {
            console.log('[Hazards] Skipping non-fire or inactive hazard:', props.id, props.type, props.status);
            continue;
          }

          const [lng, lat] = geometry.coordinates;
          if (!isValidLonLat(lng, lat)) {
            console.log('[Hazards] Skipping hazard with invalid coordinates:', props.id);
            continue;
          }

          // Check if fire already exists at this location (avoid duplicates)
          const nodeId = String(props.node_id);
          if (activeFireZonesRef.current.some(fz => fz.roomId === nodeId)) {
            console.log('[Hazards] Fire already displayed at node:', nodeId);
            continue;
          }

          // Add fire marker
          const marker = new maplibregl.Marker({ color: 'red', scale: 1.2 })
            .setLngLat([lng, lat])
            .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(
              formatFireAlertPopup(`Hazard #${props.id}`, new Date().toLocaleTimeString())
            ))
            .addTo(map);
          fireMarkersRef.current.push(marker);

          // Track this fire zone
          setActiveFireZones(prev => [...prev, {
            roomId: nodeId,
            roomName: `Hazard #${props.id}`,
            severity: props.severity || 'high',
          }]);

          console.log('[Hazards] Added fire marker for hazard:', props.id, 'at', [lng, lat]);
        }

        // Update emergency state if we have active hazards
        if (hazardsGeoJSON.features.some(f => f.properties?.type === 'fire' && f.properties?.status === 'active')) {
          updateEmergencyState({
            isActive: true,
            mode: 'fire_detected',
          });
          showNotification(`${hazardsGeoJSON.features.length} active fire(s) detected in building`, 'error');
        }
      } catch (error) {
        console.error('[Hazards] Failed to load active hazards:', error);
      }
    };

    loadExistingHazards();
  }, [isMapLoaded, buildingId, showNotification, updateEmergencyState]);

  // Update map data when floorPlanData or activeFloorLevel changes
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !floorPlanData?.features?.length) return;

    const map = mapRef.current;

    try {
      // Filter features by active floor ID (preferred) or level (fallback)
      const filterByFloor = (features: any[]) => {
        // Prefer floor_id filtering for precise matching
        if (activeFloorId) {
          return features.filter((f: any) =>
            f.properties?.floor_id === activeFloorId ||
            f.properties?.floorId === activeFloorId ||
            (!f.properties?.floor_id && !f.properties?.floorId) // Include features without floor_id
          );
        }
        // Fallback to level filtering
        if (!activeFloorLevel) return features;
        return features.filter((f: any) =>
          !f.properties?.level || String(f.properties.level) === String(activeFloorLevel)
        );
      };

      const roomFeatures = filterByFloor(floorPlanData.features.filter((f: any) =>
        f.properties?.room_type || (f.geometry?.type === 'Polygon' && !f.properties?.type)
      ));

      const openingFeatures = filterByFloor(floorPlanData.features.filter((f: any) =>
        f.properties?.type === 'opening' || f.properties?.opening_type
      ));

      const nodeFeatures = filterByFloor(floorPlanData.features.filter((f: any) =>
        f.properties?.type === 'node'
      ));

      const edgeFeatures = filterByFloor(floorPlanData.features.filter((f: any) =>
        f.properties?.type === 'edge'
      ));

      console.log('[EvacuationMap] Floor', activeFloorLevel, '- Rooms:', roomFeatures.length, 'Openings:', openingFeatures.length, 'Nodes:', nodeFeatures.length, 'Edges:', edgeFeatures.length);

      const roomsData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: roomFeatures.map((f: any) => ({
          ...f,
          properties: {
            ...f.properties,
            room_type: f.properties?.room_type || f.properties?.type || 'other',
          }
        }))
      };

      // Convert LineString openings to Points at their midpoints for circle rendering
      const featuresData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: openingFeatures.map((f: any) => {
          // If it's a LineString (opening), convert to Point at midpoint
          if (f.geometry?.type === 'LineString' && f.geometry.coordinates?.length >= 2) {
            const coords = f.geometry.coordinates;
            const midLng = (coords[0][0] + coords[1][0]) / 2;
            const midLat = (coords[0][1] + coords[1][1]) / 2;
            return {
              ...f,
              geometry: {
                type: 'Point',
                coordinates: [midLng, midLat]
              }
            };
          }
          return f;
        })
      };

      const nodesData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: nodeFeatures
      };

      // Update or create sources
      let buildingSource = map.getSource('building') as maplibregl.GeoJSONSource;
      let featuresSource = map.getSource('building-features') as maplibregl.GeoJSONSource;
      let nodesSource = map.getSource('navigation-nodes') as maplibregl.GeoJSONSource;

      if (buildingSource) {
        buildingSource.setData(roomsData);
      } else {
        map.addSource('building', { type: 'geojson', data: roomsData, generateId: true });
      }
      roomsDataRef.current = roomsData;

      if (featuresSource) {
        featuresSource.setData(featuresData);
      } else {
        map.addSource('building-features', { type: 'geojson', data: featuresData });
      }

      if (nodesSource) {
        nodesSource.setData(nodesData);
      } else {
        map.addSource('navigation-nodes', { type: 'geojson', data: nodesData });
      }

      // Update cameras source
      const cameraFeatures = filterByFloor(floorPlanData.features.filter((f: any) =>
        f.properties?.type === 'camera' || f.properties?.is_camera
      ));
      const camerasData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: cameraFeatures
      };
      let camerasSource = map.getSource('cameras') as maplibregl.GeoJSONSource;
      if (camerasSource) {
        camerasSource.setData(camerasData);
      } else {
        map.addSource('cameras', { type: 'geojson', data: camerasData });
      }
      if (cameraFeatures.length > 0) {
        console.log('[EvacuationMap] Updated cameras source with', cameraFeatures.length, 'cameras');
      }

      // Update building center and fly to it
      if (floorPlanData.properties?.center_lat && floorPlanData.properties?.center_lng) {
        map.flyTo({
          center: [floorPlanData.properties.center_lng, floorPlanData.properties.center_lat],
          zoom: 19,
          duration: 500,
        });
      } else if (roomFeatures.length > 0) {
        // Calculate bounds from room features and fit to them
        const bounds = calculateBounds(roomsData);
        if (bounds) {
          map.fitBounds(bounds, { padding: 50, duration: 500 });
        }
      }

      // Update the building name display
      setImportedBuildingName(floorPlanData.properties?.building_name || `Building #${buildingId}`);
      setIsUsingImportedData(true);

      // Populate route nodes from the floor plan data for route calculation
      // Only include rooms that have a valid node_id (from backend or matched node feature)
      const roomNodesForRoute = roomFeatures
        .filter((f: any) => f.properties?.name)
        .map((f: any) => {
          const roomId = f.properties?.db_id || f.properties?.id || f.id;
          // Find the corresponding node for this room
          const roomNode = nodeFeatures.find((n: any) =>
            n.properties?.room_id === roomId ||
            String(n.properties?.room_id) === String(roomId)
          );

          // Resolve node_id: prefer backend-provided node_id, then matched node feature
          const resolvedNodeId = f.properties?.node_id
            ? String(f.properties.node_id)
            : (roomNode ? String(roomNode.properties?.db_id || roomNode.properties?.id) : null);

          // Get centroid from room properties or calculate from geometry
          let coordinates: [number, number] | undefined;
          if (f.properties?.centroid_lng && f.properties?.centroid_lat) {
            coordinates = [f.properties.centroid_lng, f.properties.centroid_lat];
          } else if (f.geometry && f.geometry.type === 'Polygon') {
            const ring = f.geometry.coordinates[0];
            let cx = 0, cy = 0;
            ring.forEach(([lng, lat]: [number, number]) => { cx += lng; cy += lat; });
            coordinates = [cx / ring.length, cy / ring.length];
          }

          // Extract floor and apartment info for filtering
          const floorId = f.properties?.floor_id || roomNode?.properties?.floor_id;
          const floorLevel = f.properties?.level || f.properties?.floor_level;
          const apartmentId = f.properties?.apartment_id || roomNode?.properties?.apartment_id;

          return {
            id: String(roomId),
            name: f.properties?.name || 'Unknown',
            nodeId: resolvedNodeId,
            roomId: String(roomId),
            coordinates,
            floorId,
            floorLevel,
            apartmentId,
          };
        })
        .filter((n: any) => n.nodeId !== null);

      // Add navigation nodes (doorways, exits, etc.)
      const navNodesForRoute = nodeFeatures
        .filter((f: any) => {
          const nodeType = f.properties?.node_type;
          return nodeType === 'door' || nodeType === 'exit' || nodeType === 'staircase' || nodeType === 'entrance';
        })
        .map((f: any) => {
          let coordinates: [number, number] | undefined;
          if (f.geometry && f.geometry.type === 'Point') {
            coordinates = f.geometry.coordinates as [number, number];
          }
          const nodeType = f.properties?.node_type || 'node';
          const nodeId = f.properties?.db_id || f.properties?.id || f.id;

          // Extract floor and apartment info for filtering
          const floorId = f.properties?.floor_id;
          const floorLevel = f.properties?.level || f.properties?.floor_level;
          const apartmentId = f.properties?.apartment_id;

          return {
            id: `nav-${nodeId}`,
            name: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${nodeId}`,
            nodeId: String(nodeId),
            roomId: `nav-${nodeId}`,
            coordinates,
            floorId,
            floorLevel,
            apartmentId,
          };
        });

      // Deduplicate by node_id to avoid multiple entries for same node
      const seenNodeIds = new Set<string>();
      const deduplicatedRoomNodes = roomNodesForRoute.filter((node: any) => {
        if (seenNodeIds.has(node.nodeId)) return false;
        seenNodeIds.add(node.nodeId);
        return true;
      });
      const deduplicatedNavNodes = navNodesForRoute.filter((node: any) => {
        if (seenNodeIds.has(node.nodeId)) return false;
        seenNodeIds.add(node.nodeId);
        return true;
      });

      setRouteNodes([...deduplicatedRoomNodes, ...deduplicatedNavNodes]);
      console.log('[EvacuationMap] Route nodes populated:', deduplicatedRoomNodes.length, 'rooms,', deduplicatedNavNodes.length, 'nav nodes (deduplicated)');

      // Build ALL-floor route nodes for fire detection (not filtered by active floor)
      const allRoomFeatures = floorPlanData.features.filter((f: any) =>
        f.properties?.room_type || (f.geometry?.type === 'Polygon' && !f.properties?.type)
      );
      const allNodeFeatures = floorPlanData.features.filter((f: any) =>
        f.properties?.type === 'node'
      );
      const allRoomNodesForRoute = allRoomFeatures
        .filter((f: any) => f.properties?.name)
        .map((f: any) => {
          const roomId = f.properties?.db_id || f.properties?.id || f.id;
          const roomNode = allNodeFeatures.find((n: any) =>
            n.properties?.room_id === roomId ||
            String(n.properties?.room_id) === String(roomId)
          );

          // Resolve node_id: prefer backend-provided node_id, then matched node feature
          const resolvedNodeId = f.properties?.node_id
            ? String(f.properties.node_id)
            : (roomNode ? String(roomNode.properties?.db_id || roomNode.properties?.id) : null);

          let coordinates: [number, number] | undefined;
          if (f.properties?.centroid_lng && f.properties?.centroid_lat) {
            coordinates = [f.properties.centroid_lng, f.properties.centroid_lat];
          } else if (f.geometry && f.geometry.type === 'Polygon') {
            const ring = f.geometry.coordinates[0];
            let cx = 0, cy = 0;
            ring.forEach(([lng, lat]: [number, number]) => { cx += lng; cy += lat; });
            coordinates = [cx / ring.length, cy / ring.length];
          }
          return {
            id: String(roomId),
            name: f.properties?.name || 'Unknown',
            nodeId: resolvedNodeId,
            roomId: String(roomId),
            coordinates,
            floorLevel: String(f.properties?.level || ''),
          };
        })
        .filter((n: any) => n.nodeId !== null);
      allFloorRouteNodesRef.current = allRoomNodesForRoute;

      // Store all rooms data (all floors) for fire zone polygon visualization
      allRoomsDataRef.current = {
        type: 'FeatureCollection',
        features: allRoomFeatures.map((f: any) => ({
          ...f,
          properties: {
            ...f.properties,
            room_type: f.properties?.room_type || f.properties?.type || 'other',
          }
        }))
      };
      console.log('[EvacuationMap] All-floor route nodes:', allRoomNodesForRoute.length, 'rooms across all floors');

      console.log('[EvacuationMap] Updated map with floor', activeFloorLevel, '- rooms:', roomFeatures.length);
    } catch (err) {
      console.error('[EvacuationMap] Error updating map data:', err);
    }
  }, [floorPlanData, activeFloorLevel, isMapLoaded, buildingId]);

  // Add map layers
  const addMapLayers = (map: maplibregl.Map) => {
    // Background layers
    map.addLayer({
      id: 'driveway',
      type: 'fill',
      source: 'building-features',
      filter: ['==', ['get', 'feature_type'], 'driveway'],
      paint: { 'fill-color': '#eceff1', 'fill-opacity': 0.8 },
    });

    map.addLayer({
      id: 'property-line',
      type: 'line',
      source: 'building-features',
      filter: ['==', ['get', 'feature_type'], 'property_line'],
      paint: { 'line-color': '#90a4ae', 'line-width': 2, 'line-dasharray': [4, 2] },
    });

    // Building shadow - show for all rooms (data is pre-filtered by floor)
    map.addLayer({
      id: 'building-shadow',
      type: 'fill',
      source: 'building',
      filter: ['!=', ['geometry-type'], 'LineString'],
      paint: LAYER_STYLES.buildingShadow as any,
    });

    // Room fill layer - show all rooms (data is pre-filtered by floor level)
    map.addLayer({
      id: 'floor1-fill',
      type: 'fill',
      source: 'building',
      filter: ['!=', ['geometry-type'], 'LineString'],
      paint: {
        'fill-color': '#f5f5f5',  // White/light gray for all rooms
        'fill-opacity': 0.9,
      },
    });

    // Room outline layer
    map.addLayer({
      id: 'floor1-outline',
      type: 'line',
      source: 'building',
      filter: ['!=', ['geometry-type'], 'LineString'],
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: LAYER_STYLES.floorOutline as any,
    });

    // Stairs
    map.addLayer({
      id: 'stairs-pattern',
      type: 'fill',
      source: 'building',
      filter: ['==', ['get', 'room_type'], 'stairs'],
      paint: { 'fill-pattern': 'stairs-pattern', 'fill-opacity': 0.3 },
    });

    map.addLayer({
      id: 'stairs-icons',
      type: 'symbol',
      source: 'building',
      filter: ['==', ['get', 'room_type'], 'stairs'],
      layout: { 'text-field': '🚶', 'text-size': 20, 'text-anchor': 'center' },
    });

    // Room labels - show for all rooms (data is pre-filtered by floor level)
    map.addLayer({
      id: 'floor1-labels',
      type: 'symbol',
      source: 'building',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-anchor': 'center',
        'text-max-width': 8,
        'text-line-height': 1.1,
        'text-transform': 'uppercase',
      },
      paint: {
        'text-color': ['case', ['in', ['get', 'room_type'], ['literal', ['bedroom', 'recreation']]], '#ffffff', '#2c3e50'],
        'text-halo-color': ['case', ['in', ['get', 'room_type'], ['literal', ['bedroom', 'recreation']]], 'rgba(0,0,0,0.5)', '#ffffff'],
        'text-halo-width': 1.5,
      },
    });

    // Walls
    map.addLayer({
      id: 'floor1-walls',
      type: 'line',
      source: 'building-features',
      filter: ['==', ['get', 'feature_type'], 'wall'],
      paint: { 'line-color': ['get', 'color'], 'line-width': 4 },
    });

    // Corridors
    map.addLayer({
      id: 'corridors',
      type: 'fill',
      source: 'building-features',
      filter: ['==', ['get', 'feature_type'], 'corridor'],
      paint: LAYER_STYLES.corridors as any,
    });

    // Exterior walls
    map.addLayer({
      id: 'exterior-walls',
      type: 'line',
      source: 'building-features',
      filter: ['==', ['get', 'feature_type'], 'exterior_wall'],
      paint: LAYER_STYLES.exteriorWalls as any,
    });

    // Windows (rendered as circles from opening data)
    map.addLayer({
      id: 'windows',
      type: 'circle',
      source: 'building-features',
      filter: [
        'all',
        ['==', ['get', 'type'], 'opening'],
        ['==', ['get', 'opening_type'], 'window'],
      ],
      paint: {
        'circle-radius': 5,
        'circle-color': '#2196F3', // Blue for windows
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
      },
    });

    // Archways (rendered as circles)
    map.addLayer({
      id: 'archways',
      type: 'circle',
      source: 'building-features',
      filter: [
        'all',
        ['==', ['get', 'type'], 'opening'],
        ['==', ['get', 'opening_type'], 'arch'],
      ],
      paint: {
        'circle-radius': 6,
        'circle-color': '#9C27B0', // Purple for archways
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });

    // Evacuation routes
    map.addLayer({
      id: 'evacuation-routes',
      type: 'line',
      source: 'building-features',
      filter: ['==', ['get', 'feature_type'], 'evacuation_route'],
      paint: LAYER_STYLES.evacuationRoutes as any,
    });

    // Interior doors (blue circles) - uses opening_type from database
    map.addLayer({
      id: 'doors',
      type: 'circle',
      source: 'building-features',
      filter: [
        'all',
        ['==', ['get', 'type'], 'opening'],
        ['==', ['get', 'opening_type'], 'door'],
      ],
      paint: {
        'circle-radius': 6,
        'circle-color': '#3b82f6', // Blue for interior doors
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });

    // Main entry doors (orange circles) - main entrance and garage doors
    map.addLayer({
      id: 'main-entry-doors',
      type: 'circle',
      source: 'building-features',
      filter: [
        'all',
        ['==', ['get', 'type'], 'opening'],
        ['any',
          ['==', ['get', 'opening_type'], 'main'],
          ['==', ['get', 'opening_type'], 'main_entrance'],
          ['==', ['get', 'opening_type'], 'garage'],
        ],
      ],
      paint: {
        'circle-radius': 10,
        'circle-color': '#FF9800', // Orange for main entrance
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });

    // Main entrance labels
    map.addLayer({
      id: 'main-entrance-labels',
      type: 'symbol',
      source: 'building-features',
      filter: [
        'all',
        ['==', ['get', 'type'], 'opening'],
        ['==', ['get', 'opening_type'], 'main_entrance'],
      ],
      layout: {
        'text-field': 'ENTRANCE',
        'text-size': 9,
        'text-offset': [0, -1.5],
        'text-anchor': 'center',
        'text-font': ['Open Sans Bold'],
      },
      paint: {
        'text-color': '#FF9800',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
      },
    });

    // Emergency exits (red circles)
    map.addLayer({
      id: 'emergency-exits',
      type: 'circle',
      source: 'building-features',
      filter: [
        'all',
        ['==', ['get', 'type'], 'opening'],
        ['==', ['get', 'opening_type'], 'emergency_exit'],
      ],
      paint: {
        'circle-radius': 8,
        'circle-color': '#ef4444', // Red for emergency exits
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });

    // Emergency exit labels
    map.addLayer({
      id: 'emergency-exit-labels',
      type: 'symbol',
      source: 'building-features',
      filter: [
        'all',
        ['==', ['get', 'type'], 'opening'],
        ['==', ['get', 'opening_type'], 'emergency_exit'],
      ],
      layout: {
        'text-field': 'EXIT',
        'text-size': 10,
        'text-offset': [0, -1.5],
        'text-anchor': 'center',
        'text-font': ['Open Sans Bold'],
      },
      paint: {
        'text-color': '#ef4444',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
      },
    });

    // Fire equipment (orange circles)
    map.addLayer({
      id: 'fire-equipment',
      type: 'circle',
      source: 'building-features',
      filter: ['==', ['get', 'feature_type'], 'fire_extinguisher'],
      paint: {
        'circle-radius': 6,
        'circle-color': '#f97316', // Orange for fire equipment
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });

    // Fire equipment labels
    map.addLayer({
      id: 'fire-equipment-labels',
      type: 'symbol',
      source: 'building-features',
      filter: ['==', ['get', 'feature_type'], 'fire_extinguisher'],
      layout: {
        'text-field': '🧯',
        'text-size': 12,
        'text-offset': [0, -1.2],
        'text-anchor': 'center',
      },
    });

    // Cameras (from floor plan data)
    map.addLayer({
      id: 'cameras',
      type: 'circle',
      source: 'cameras',
      paint: {
        'circle-radius': 8,
        'circle-color': [
          'case',
          ['==', ['get', 'is_fire_detection_enabled'], true],
          '#dc2626', // Red for fire detection enabled
          '#6b7280', // Gray for disabled
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });

    // Camera field of view (cone visualization)
    map.addLayer({
      id: 'camera-fov',
      type: 'circle',
      source: 'cameras',
      paint: {
        'circle-radius': 20,
        'circle-color': [
          'case',
          ['==', ['get', 'is_fire_detection_enabled'], true],
          'rgba(220, 38, 38, 0.15)', // Red transparent for fire detection
          'rgba(107, 114, 128, 0.1)', // Gray transparent
        ],
        'circle-stroke-color': [
          'case',
          ['==', ['get', 'is_fire_detection_enabled'], true],
          'rgba(220, 38, 38, 0.3)',
          'rgba(107, 114, 128, 0.2)',
        ],
        'circle-stroke-width': 1,
      },
    }, 'cameras'); // Place below camera markers

    // Camera labels
    map.addLayer({
      id: 'camera-labels',
      type: 'symbol',
      source: 'cameras',
      layout: {
        'text-field': ['get', 'camera_id'],
        'text-size': 10,
        'text-offset': [0, 1.5],
        'text-anchor': 'top',
        'text-font': ['Open Sans Bold'],
      },
      paint: {
        'text-color': '#dc2626',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
      },
    });

    // Stairway markers (orange circles) - from building data
    map.addLayer({
      id: 'stairway-markers',
      type: 'circle',
      source: 'building',
      filter: ['==', ['get', 'type'], 'stairs'],
      paint: {
        'circle-radius': 7,
        'circle-color': '#f97316', // Orange for stairways
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });

    // Navigation nodes from backend - Doorways (blue circles)
    map.addLayer({
      id: 'nav-doorways',
      type: 'circle',
      source: 'navigation-nodes',
      filter: ['==', ['get', 'type'], 'doorway'],
      paint: {
        'circle-radius': 6,
        'circle-color': '#3b82f6', // Blue for doorways
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });

    // Navigation nodes - Exits (red circles)
    map.addLayer({
      id: 'nav-exits',
      type: 'circle',
      source: 'navigation-nodes',
      filter: ['==', ['get', 'type'], 'exit'],
      paint: {
        'circle-radius': 8,
        'circle-color': '#ef4444', // Red for exits
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });

    // Navigation nodes - Exit labels
    map.addLayer({
      id: 'nav-exit-labels',
      type: 'symbol',
      source: 'navigation-nodes',
      filter: ['==', ['get', 'type'], 'exit'],
      layout: {
        'text-field': 'EXIT',
        'text-size': 9,
        'text-offset': [0, -1.3],
        'text-anchor': 'center',
      },
      paint: {
        'text-color': '#ef4444',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
      },
    });

    // Navigation nodes - Entry (green circles)
    map.addLayer({
      id: 'nav-entries',
      type: 'circle',
      source: 'navigation-nodes',
      filter: ['==', ['get', 'type'], 'entry'],
      paint: {
        'circle-radius': 8,
        'circle-color': '#22c55e', // Green for entries
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });

    // Navigation nodes - Stairs (orange circles)
    map.addLayer({
      id: 'nav-stairs',
      type: 'circle',
      source: 'navigation-nodes',
      filter: ['==', ['get', 'type'], 'stairs'],
      paint: {
        'circle-radius': 7,
        'circle-color': '#f97316', // Orange for stairs
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });

    // Navigation nodes - Junctions (smaller gray circles)
    map.addLayer({
      id: 'nav-junctions',
      type: 'circle',
      source: 'navigation-nodes',
      filter: ['==', ['get', 'type'], 'junction'],
      paint: {
        'circle-radius': 4,
        'circle-color': '#9ca3af', // Gray for junctions
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
    });

    // Navigation nodes - Corridors (smallest gray circles)
    map.addLayer({
      id: 'nav-corridors',
      type: 'circle',
      source: 'navigation-nodes',
      filter: ['==', ['get', 'type'], 'corridor'],
      paint: {
        'circle-radius': 3,
        'circle-color': '#d1d5db', // Light gray for corridors
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
    });

    // North arrow
    map.addLayer({
      id: 'north-arrow',
      type: 'symbol',
      source: 'building-features',
      filter: ['==', ['get', 'feature_type'], 'north_arrow'],
      layout: { 'text-field': 'N\n\u2191', 'text-size': 24, 'text-anchor': 'center' },
      paint: { 'text-color': '#000', 'text-halo-color': '#fff', 'text-halo-width': 3 },
    });

    // Furniture layers from building-details
    map.addLayer({
      id: 'beds',
      type: 'fill',
      source: 'building-details',
      filter: ['==', ['get', 'feature_type'], 'bed'],
      paint: { 'fill-color': '#8D6E63', 'fill-opacity': 0.3 },
    });

    map.addLayer({
      id: 'toilets',
      type: 'symbol',
      source: 'building-details',
      filter: ['==', ['get', 'feature_type'], 'toilet'],
      layout: { 'text-field': '🚽', 'text-size': 14, 'text-anchor': 'center' },
    });

    map.addLayer({
      id: 'bathtubs',
      type: 'fill',
      source: 'building-details',
      filter: ['==', ['get', 'feature_type'], 'bathtub'],
      paint: { 'fill-color': '#E3F2FD', 'fill-opacity': 0.5, 'fill-outline-color': '#1976D2' },
    });

    map.addLayer({
      id: 'showers',
      type: 'fill',
      source: 'building-details',
      filter: ['==', ['get', 'feature_type'], 'shower'],
      paint: { 'fill-color': '#E0F7FA', 'fill-opacity': 0.5, 'fill-outline-color': '#0097A7' },
    });

    map.addLayer({
      id: 'sinks',
      type: 'symbol',
      source: 'building-details',
      filter: ['in', ['get', 'feature_type'], ['literal', ['sink', 'sink_double']]],
      layout: { 'text-field': '\u2B2D', 'text-size': 12, 'text-anchor': 'center' },
      paint: { 'text-color': '#1976D2' },
    });

    map.addLayer({
      id: 'kitchen-fixtures',
      type: 'fill',
      source: 'building-details',
      filter: ['in', ['get', 'feature_type'], ['literal', ['stove', 'kitchen_island']]],
      paint: { 'fill-color': '#424242', 'fill-opacity': 0.6 },
    });

    map.addLayer({
      id: 'furniture-outlines',
      type: 'line',
      source: 'building-details',
      filter: ['in', ['get', 'feature_type'], ['literal', ['desk', 'sofa', 'dining_table', 'washer_dryer']]],
      paint: { 'line-color': '#616161', 'line-width': 2 },
    });

    map.addLayer({
      id: 'chairs',
      type: 'symbol',
      source: 'building-details',
      filter: ['==', ['get', 'feature_type'], 'chair'],
      layout: { 'text-field': '\u25CB', 'text-size': 10, 'text-anchor': 'center' },
      paint: { 'text-color': '#616161' },
    });

    map.addLayer({
      id: 'door-swings',
      type: 'line',
      source: 'building-details',
      filter: ['==', ['get', 'feature_type'], 'door_swing'],
      paint: { 'line-color': '#000000', 'line-width': 2, 'line-dasharray': [0, 2] },
    });

    map.addLayer({
      id: 'dimension-lines',
      type: 'line',
      source: 'building-details',
      filter: ['==', ['get', 'feature_type'], 'dimension_line'],
      paint: { 'line-color': '#333333', 'line-width': 1, 'line-dasharray': [0.5, 1] },
    });

    map.addLayer({
      id: 'dimension-text',
      type: 'symbol',
      source: 'building-details',
      filter: ['==', ['get', 'feature_type'], 'dimension_line'],
      layout: {
        'text-field': ['get', 'dimension'],
        'text-size': 14,
        'text-anchor': 'center',
        'symbol-placement': 'line-center',
      },
      paint: { 'text-color': '#000000', 'text-halo-color': '#ffffff', 'text-halo-width': 2 },
    });

    map.addLayer({
      id: 'exit-signs',
      type: 'symbol',
      source: 'building-details',
      filter: ['==', ['get', 'feature_type'], 'exit_sign'],
      layout: {
        'text-field': ['case', ['==', ['get', 'exit_type'], 'emergency'], 'EMERGENCY\nEXIT', ['==', ['get', 'exit_type'], 'main'], 'MAIN\nENTRY', 'EXIT'],
        'text-size': 10,
        'text-anchor': 'center',
        'text-transform': 'uppercase',
      },
      paint: { 'text-color': '#FF0000', 'text-halo-color': '#FFFF00', 'text-halo-width': 2 },
    });

    map.addLayer({
      id: 'stairs-labels',
      type: 'symbol',
      source: 'building-details',
      filter: ['==', ['get', 'feature_type'], 'stairs_arrow'],
      layout: { 'text-field': ['get', 'label'], 'text-size': 12, 'text-anchor': 'center' },
      paint: { 'text-color': '#000000', 'text-halo-color': '#ffffff', 'text-halo-width': 2 },
    });

    // Floor 2 layers (hidden initially) - level '1' = second floor
    map.addLayer({
      id: 'floor2-fill',
      type: 'fill',
      source: 'building',
      filter: ['==', ['get', 'level'], '1'],
      layout: { visibility: 'none' },
      paint: { 'fill-color': '#f5f5f5', 'fill-opacity': 0.9 },  // White/simple theme
    });

    map.addLayer({
      id: 'floor2-outline',
      type: 'line',
      source: 'building',
      filter: ['==', ['get', 'level'], '1'],
      layout: { visibility: 'none' },
      paint: { 'line-color': '#2c3e50', 'line-width': 2 },
    });

    map.addLayer({
      id: 'floor2-labels',
      type: 'symbol',
      source: 'building',
      filter: ['==', ['get', 'level'], '1'],
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-anchor': 'center',
        'text-max-width': 8,
        visibility: 'none',
      },
      paint: {
        'text-color': ['case', ['in', ['get', 'room_type'], ['literal', ['bedroom', 'recreation']]], '#ffffff', '#2c3e50'],
        'text-halo-color': ['case', ['in', ['get', 'room_type'], ['literal', ['bedroom', 'recreation']]], 'rgba(0,0,0,0.5)', '#ffffff'],
        'text-halo-width': 1.5,
      },
    });
  };

  // Setup room interactions
  const setupRoomInteractions = (map: maplibregl.Map) => {
    let hoveredRoomId: number | string | null = null;

    map.on('mouseenter', 'floor1-fill', (e) => {
      map.getCanvas().style.cursor = 'pointer';

      if (hoveredRoomId !== null) {
        map.setFeatureState({ source: 'building', id: hoveredRoomId }, { hover: false });
      }

      if (e.features?.[0]?.id !== undefined) {
        hoveredRoomId = e.features[0].id;
        map.setFeatureState({ source: 'building', id: hoveredRoomId }, { hover: true });
      }
    });

    map.on('mouseleave', 'floor1-fill', () => {
      map.getCanvas().style.cursor = '';

      if (hoveredRoomId !== null) {
        map.setFeatureState({ source: 'building', id: hoveredRoomId }, { hover: false });
      }
      hoveredRoomId = null;
    });

    map.on('click', 'floor1-fill', (e) => {
      if (!e.features?.[0]) return;

      const feature = e.features[0];
      const properties = feature.properties || {};
      const coordinates = e.lngLat;

      // Call external handler if provided
      onRoomClick?.(feature as GeoJSON.Feature);

      // Show popup
      const content = formatRoomPopupContent(properties);
      new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '300px' })
        .setLngLat(coordinates)
        .setHTML(content)
        .addTo(map);
    });
  };

  // Switch floor
  const switchFloor = useCallback((floor: 'floor1' | 'floor2') => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const allLayers = [...FLOOR_LAYERS.floor1.layers, ...FLOOR_LAYERS.floor2.layers];

    // Hide all floor layers
    allLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });

    // Show selected floor layers
    const showLayers = FLOOR_LAYERS[floor]?.layers || FLOOR_LAYERS.floor1.layers;
    showLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'visible');
      }
    });

    setCurrentFloor(floor);
  }, [isMapLoaded]);

  // Place fire in selected zones
  const placeFireInZones = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedFireZones.length === 0) {
      showNotification('Please select at least one room to place fire', 'warning');
      return;
    }

    // Get room details for selected zones - including the actual nodeId for backend
    // Guard against routeNodes being undefined
    if (!routeNodes || routeNodes.length === 0) {
      console.error('[FireZone] routeNodes is empty or undefined');
      showNotification('Map data not loaded. Please wait and try again.', 'warning');
      return;
    }

    console.log('[FireZone] routeNodes available:', routeNodes.length, 'selectedFireZones:', selectedFireZones);

    const fireZones = selectedFireZones.map(roomId => {
      const room = routeNodes.find(n => n.roomId === roomId);
      console.log('[FireZone] Looking for roomId:', roomId, 'found:', room);
      return {
        roomId: parseInt(roomId) || 0,
        roomName: room?.name || 'Unknown Room',
        nodeId: room?.nodeId ? parseInt(room.nodeId) : (parseInt(roomId) || 0),
        severity: fireSeverity,
        coordinates: room?.coordinates,
      };
    });

    // CRITICAL: Call backend API to register hazards in database
    // This is required for route computation to avoid fire zones
    // Backend expects: nodeId, roomId, roomName, longitude, latitude, floorLevel
    // Ensure all values are proper numbers (not NaN or undefined)
    const floorLevel: number = currentFloor === 'floor1' ? 1 : (currentFloor === 'floor2' ? 2 : 1);

    console.log('[FireZone] Building API payload from fireZones:', fireZones);
    console.log('[FireZone] Current floor:', currentFloor, '-> floorLevel:', floorLevel);

    const apiFireZones = fireZones.map(zone => {
      // Extract coordinates safely, ensuring they're valid numbers
      // Use Number() for explicit conversion and fallback to building center
      let lng: number = 67.1125; // Default to building center
      let lat: number = 24.862;  // Default to building center

      if (zone.coordinates && Array.isArray(zone.coordinates) && zone.coordinates.length >= 2) {
        const rawLng = zone.coordinates[0];
        const rawLat = zone.coordinates[1];
        if (typeof rawLng === 'number' && !isNaN(rawLng)) lng = rawLng;
        if (typeof rawLat === 'number' && !isNaN(rawLat)) lat = rawLat;
      }

      const payload = {
        nodeId: Number(zone.nodeId) || 1,
        roomId: Number(zone.roomId) || 1,
        roomName: String(zone.roomName || 'Unknown Room'),
        longitude: Number(lng),
        latitude: Number(lat),
        floorLevel: Number(floorLevel),
      };

      console.log('[FireZone] Zone payload:', payload);
      return payload;
    });

    console.log('[FireZone] Final API payload:', JSON.stringify(apiFireZones, null, 2));
    console.log('[FireZone] Severity value:', fireSeverity, 'type:', typeof fireSeverity);

    // Use local fire placement for imported buildings, backend API otherwise
    const result = isUsingImportedRouting()
      ? placeLocalFires(apiFireZones, fireSeverity)
      : await placeFires(apiFireZones, fireSeverity);

    if (!result.success) {
      showNotification(`Failed to register fire zones: ${result.error}`, 'error');
      return;
    }

    console.log('[FireZone] Registered hazard IDs:', result.hazardIds, isUsingImportedRouting() ? '(local)' : '(backend)');

    // Add fire markers for each selected zone (APPEND, don't clear existing!)
    // Only clear markers that are being replaced (same room)
    const existingRoomIds = new Set(activeFireZonesRef.current.map(fz => fz.roomId));

    fireZones.forEach(zone => {
      // Skip if this room already has a fire marker
      if (existingRoomIds.has(String(zone.roomId))) {
        console.log('[FireZone] Fire already exists in room:', zone.roomId);
        return;
      }

      let coords = zone.coordinates;

      // If no coordinates, try to get from room geometry
      if (!coords && roomsDataRef.current?.features) {
        const roomFeature = roomsDataRef.current.features.find(f =>
          f.properties?.id === zone.roomId || parseInt(String(f.id)) === zone.roomId
        );
        if (roomFeature?.geometry?.type === 'Polygon' && roomFeature.geometry.coordinates?.[0]) {
          // Calculate centroid of polygon
          const ring = roomFeature.geometry.coordinates[0] as [number, number][];
          const sumLng = ring.reduce((sum, coord) => sum + coord[0], 0);
          const sumLat = ring.reduce((sum, coord) => sum + coord[1], 0);
          coords = [sumLng / ring.length, sumLat / ring.length] as [number, number];
        }
      }

      if (coords) {
        const marker = new maplibregl.Marker({ color: 'red', scale: 1.2 })
          .setLngLat(coords)
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(formatFireAlertPopup(zone.roomName)))
          .addTo(map);
        fireMarkersRef.current.push(marker);
      } else {
        console.warn('[FireZone] No coordinates for fire marker:', zone.roomName, zone.roomId);
      }
    });

    // Add fire zone visualization layer
    // Use BOTH existing activeFireZones AND newly selected zones
    const roomsData = roomsDataRef.current;
    console.log('[FireZone] roomsDataRef.current:', roomsData ? 'exists' : 'null');
    console.log('[FireZone] roomsData.features:', roomsData?.features ? `${roomsData.features.length} features` : 'undefined');

    if (roomsData && roomsData.features && Array.isArray(roomsData.features)) {
      // Combine existing fire room IDs with newly selected ones
      const existingFireRoomIds = activeFireZonesRef.current.map(fz => parseInt(fz.roomId));
      const newFireRoomIds = selectedFireZones.map(id => parseInt(id));
      const allFireRoomIds = [...new Set([...existingFireRoomIds, ...newFireRoomIds])];
      console.log('[FireZone] All fire room IDs (existing + new):', allFireRoomIds);

      // Create fire zone overlay - with extra safety check
      const fireZoneFeatures = (roomsData.features || []).filter(f =>
        allFireRoomIds.includes(f.properties?.id) || allFireRoomIds.includes(parseInt(String(f.id)))
      );
      console.log('[FireZone] Found matching features:', fireZoneFeatures.length);

      if (fireZoneFeatures.length > 0) {
        const fireZoneGeoJSON: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: fireZoneFeatures.map(f => ({
            ...f,
            properties: { ...f.properties, fireZone: true },
          })),
        };

        // Add or update fire zone source
        if (map.getSource('fire-zones')) {
          (map.getSource('fire-zones') as maplibregl.GeoJSONSource).setData(fireZoneGeoJSON);
        } else {
          map.addSource('fire-zones', { type: 'geojson', data: fireZoneGeoJSON });
          map.addLayer({
            id: 'fire-zone-fill',
            type: 'fill',
            source: 'fire-zones',
            paint: {
              'fill-color': '#ff3d00',
              'fill-opacity': 0.4,
            },
          });
          map.addLayer({
            id: 'fire-zone-outline',
            type: 'line',
            source: 'fire-zones',
            paint: {
              'line-color': '#d32f2f',
              'line-width': 3,
            },
          });
        }
      }
    }

    // Flash effect
    map.setPaintProperty('floor1-fill', 'fill-opacity', 0.9);
    setTimeout(() => {
      map.setPaintProperty('floor1-fill', 'fill-opacity', 0.8);
    }, 500);

    // Update state - APPEND to existing activeFireZones (don't replace!)
    const newFireZones = fireZones.map(z => ({
      roomId: String(z.roomId),
      roomName: z.roomName,
      severity: z.severity,
    }));
    setActiveFireZones(prev => {
      // Filter out duplicates (same roomId)
      const existingRoomIds = new Set(prev.map(fz => fz.roomId));
      const uniqueNewFires = newFireZones.filter(nf => !existingRoomIds.has(nf.roomId));
      return [...prev, ...uniqueNewFires];
    });
    setSelectedFireZones([]);

    updateEmergencyState({
      isActive: true,
      mode: 'fire_detected',
      fireMarkers: fireMarkersRef.current,
    });

    showNotification(`🔥 Fire placed in ${fireZones.length} zone(s)! Click "Start Evacuation" to begin.`, 'error');
  }, [selectedFireZones, fireSeverity, routeNodes, currentFloor, showNotification, updateEmergencyState]);

  // Clear all fire zones
  // Auto-place fire in room when YOLO detection triggers
  const autoPlaceFireInRoom = useCallback(async (roomId: string, detectionData: any) => {
    const map = mapRef.current;
    if (!map) return;

    // Debounce: prevent multiple fire placements within 5 seconds
    const now = Date.now();
    if (now - lastFirePlacementRef.current < 5000) {
      console.log('[AutoFire] Debounced - fire placement too recent');
      return;
    }

    // Check if fire already placed in this room (use ref to avoid stale closure)
    if (activeFireZonesRef.current.some(fz => fz.roomId === roomId)) {
      console.log('[AutoFire] Fire already active in room:', roomId);
      return;
    }

    // Look up room across ALL floors (not just the active floor)
    const room = allFloorRouteNodesRef.current.find(n => n.roomId === roomId) || routeNodes.find(n => n.roomId === roomId);
    if (!room) {
      // If nodes haven't loaded yet, queue the event for later processing
      if (allFloorRouteNodesRef.current.length === 0 && routeNodes.length === 0) {
        console.warn('[AutoFire] Map data not loaded yet, queuing fire event for room:', roomId);
        pendingFireEventsRef.current.push({ roomId, detectionData });
      } else {
        console.error('[AutoFire] Room not found in any floor:', roomId, 'allFloorNodes:', allFloorRouteNodesRef.current.length, 'routeNodes:', routeNodes.length);
      }
      return;
    }

    console.log('[AutoFire] YOLO detection triggered fire placement in:', room.name, detectionData);
    lastFirePlacementRef.current = now;

    const [lng, lat] = room.coordinates || [67.1125, 24.862];
    const floorLevel = currentFloor === 'floor1' ? 1 : 2;

    const fireZone = {
      nodeId: Number(room.nodeId) || 1,
      roomId: Number(roomId) || 1,
      roomName: room.name || 'Unknown Room',
      longitude: Number(lng),
      latitude: Number(lat),
      floorLevel: Number(floorLevel),
    };

    try {
      // Use local fire placement for imported buildings, backend API otherwise
      const result = isUsingImportedRouting()
        ? placeLocalFires([fireZone], 'CRITICAL')
        : await placeFires([fireZone], 'CRITICAL');

      if (result.success) {
        // Add fire marker
        if (room.coordinates) {
          const marker = new maplibregl.Marker({ color: 'red', scale: 1.2 })
            .setLngLat(room.coordinates)
            .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(formatFireAlertPopup(room.name)))
            .addTo(map);
          fireMarkersRef.current.push(marker);
        }

        // Add fire zone visualization (use all-floor rooms data so fire on other floors still shows)
        const roomsData = allRoomsDataRef.current || roomsDataRef.current;
        if (roomsData && roomsData.features) {
          const fireZoneFeatures = roomsData.features.filter(f =>
            String(f.properties?.id) === roomId || String(f.properties?.db_id) === roomId
          );

          if (fireZoneFeatures.length > 0) {
            const fireZoneGeoJSON: GeoJSON.FeatureCollection = {
              type: 'FeatureCollection',
              features: fireZoneFeatures.map(f => ({
                ...f,
                properties: { ...f.properties, fireZone: true },
              })),
            };

            if (map.getSource('fire-zones')) {
              (map.getSource('fire-zones') as maplibregl.GeoJSONSource).setData(fireZoneGeoJSON);
            } else {
              map.addSource('fire-zones', { type: 'geojson', data: fireZoneGeoJSON });
              map.addLayer({
                id: 'fire-zone-fill',
                type: 'fill',
                source: 'fire-zones',
                paint: { 'fill-color': '#ff3d00', 'fill-opacity': 0.4 },
              });
              map.addLayer({
                id: 'fire-zone-outline',
                type: 'line',
                source: 'fire-zones',
                paint: { 'line-color': '#d32f2f', 'line-width': 3 },
              });
            }
          }
        }

        // Update state
        setActiveFireZones(prev => [...prev, {
          roomId: String(roomId),
          roomName: room.name,
          severity: 'critical',
        }]);

        updateEmergencyState({
          isActive: true,
          mode: 'fire_detected',
          fireMarkers: fireMarkersRef.current,
        });

        showNotification(
          `🔥 AUTO-DETECTED: Fire detected by camera and placed in ${room.name}!`,
          'error'
        );
      }
    } catch (error) {
      console.error('[AutoFire] Failed to place fire:', error);
      showNotification('Auto fire placement failed', 'error');
    }
  }, [routeNodes, currentFloor, showNotification, updateEmergencyState]);

  // Socket.IO connection for automatic fire detection from YOLO pipeline
  useEffect(() => {
    // Only connect when auto mode is enabled and a room is selected
    if (!autoFireEnabled || !autoFireRoom) {
      // Disconnect if conditions not met
      if (socketRef.current) {
        console.log('[AutoFire] Disconnecting socket - auto mode disabled or no room selected');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnectedToDetection(false);
      }
      return;
    }

    // Connect to Pipeline-Formation NestJS backend
    console.log('[AutoFire] Connecting to fire detection pipeline...');
    const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[AutoFire] ✅ Connected to fire detection pipeline');
      setIsConnectedToDetection(true);
    });

    socket.on('disconnect', () => {
      console.log('[AutoFire] ❌ Disconnected from fire detection pipeline');
      setIsConnectedToDetection(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[AutoFire] Connection error:', error.message);
      setIsConnectedToDetection(false);
    });

    // Listen for fire detections from YOLO pipeline
    socket.on('detections', (data: {
      camera_id: string;
      timestamp: number;
      detections: Array<{ bbox: number[]; score: number; label: string }>;
      latency: number;
    }) => {
      console.log('[AutoFire] Received detection event:', data);

      // Only trigger if fire detected (detections array not empty)
      if (data.detections && data.detections.length > 0) {
        console.log('[AutoFire] 🔥 Fire detected by YOLO! Detections:', data.detections.length);
        autoPlaceFireInRoom(autoFireRoom, data);
      }
    });

    return () => {
      console.log('[AutoFire] Cleanup - disconnecting socket');
      socket.disconnect();
      socketRef.current = null;
      setIsConnectedToDetection(false);
    };
  }, [autoFireEnabled, autoFireRoom, autoPlaceFireInRoom]);

  // Ignis-BE WebSocket for real-time fire detection alerts from camera pipeline
  useEffect(() => {
    if (!ignisFireDetectionEnabled) {
      if (ignisSocketRef.current) {
        console.log('[IgnisFire] Disconnecting from ignis-BE fire detection');
        ignisSocketRef.current.disconnect();
        ignisSocketRef.current = null;
        setIsConnectedToIgnis(false);
      }
      return;
    }

    console.log('[IgnisFire] Connecting to ignis-BE fire detection WebSocket...');
    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/fire-detection`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    ignisSocketRef.current = socket;

    socket.on('connect', () => {
      console.log('[IgnisFire] Connected to ignis-BE fire detection');
      setIsConnectedToIgnis(true);
    });

    socket.on('disconnect', () => {
      console.log('[IgnisFire] Disconnected from ignis-BE fire detection');
      setIsConnectedToIgnis(false);
    });

    socket.on('connected', (data) => {
      console.log('[IgnisFire] Server acknowledged connection:', data);
    });

    socket.on('fire.detected', (event: {
      camera_id: string;
      camera_name: string;
      building_id: number;
      floor_id?: number;
      room_id?: number;
      confidence: number;
      timestamp: number;
      hazard_id?: number;
      severity: string;
      location_description?: string;
    }) => {
      console.log('[IgnisFire] Fire detected event received:', event);

      // Filter by building ID - ignore events from other buildings
      if (buildingId && event.building_id !== buildingId) {
        console.log('[IgnisFire] Ignoring fire event for building', event.building_id, '(current building:', buildingId, ')');
        return;
      }

      // Try to find the room by room_id if available
      if (event.room_id) {
        const roomIdStr = String(event.room_id);
        // Use ref to avoid stale closure (socket handler doesn't re-bind on state changes)
        if (!activeFireZonesRef.current.some(fz => fz.roomId === roomIdStr)) {
          autoPlaceFireInRoom(roomIdStr, {
            camera_id: event.camera_id,
            confidence: event.confidence,
            severity: event.severity,
          });
        }
      } else {
        // If no room_id, show notification but can't place fire on map
        showNotification(
          `Fire detected by ${event.camera_name} - ${(event.confidence * 100).toFixed(1)}% confidence`,
          'error'
        );
        updateEmergencyState({
          isActive: true,
          mode: 'fire_detected',
        });
      }
    });

    socket.on('fire.resolved', (event: { hazard_id: number; building_id: number }) => {
      console.log('[IgnisFire] Fire resolved event:', event);
      showNotification(`Fire alert resolved - Hazard #${event.hazard_id}`, 'success');
    });

    return () => {
      console.log('[IgnisFire] Cleanup - disconnecting socket');
      socket.disconnect();
      ignisSocketRef.current = null;
      setIsConnectedToIgnis(false);
    };
  }, [ignisFireDetectionEnabled, buildingId, autoPlaceFireInRoom, showNotification, updateEmergencyState]);

  // Process pending fire events once route nodes become available
  useEffect(() => {
    if (routeNodes.length > 0 && pendingFireEventsRef.current.length > 0) {
      console.log('[AutoFire] Route nodes loaded, processing', pendingFireEventsRef.current.length, 'pending fire event(s)');
      const pending = [...pendingFireEventsRef.current];
      pendingFireEventsRef.current = [];
      for (const event of pending) {
        autoPlaceFireInRoom(event.roomId, event.detectionData);
      }
    }
  }, [routeNodes, autoPlaceFireInRoom]);

  // WebSocket listener for hazard events (created/updated/deleted) from other sources like Android app
  // This enables real-time sync between webapp and Android
  useEffect(() => {
    if (!isMapLoaded) return;

    console.log('[HazardSync] Connecting to hazard events WebSocket...');
    const hazardSocket = io(process.env.NEXT_PUBLIC_API_URL!, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    hazardSocket.on('connect', () => {
      console.log('[HazardSync] Connected to hazard events');
    });

    hazardSocket.on('disconnect', () => {
      console.log('[HazardSync] Disconnected from hazard events');
    });

    // Listen for hazard created events (e.g., from Android app)
    hazardSocket.on('hazard.created', async (hazard: {
      id: number;
      type: string;
      severity: string;
      status: string;
      node_id?: number;
      nodeId?: number;
      floor_id?: number;
      floorId?: number;
    }) => {
      console.log('[HazardSync] Hazard created event:', hazard);

      // Only process fire hazards that are active
      if (hazard.type !== 'fire' || hazard.status !== 'active') {
        console.log('[HazardSync] Ignoring non-fire or inactive hazard');
        return;
      }

      // Reload hazards to get full data with geometry
      const hazardsGeoJSON = await fetchActiveHazards(buildingId);
      if (!hazardsGeoJSON || !hazardsGeoJSON.features) return;

      const newHazard = hazardsGeoJSON.features.find(
        f => f.properties?.id === hazard.id
      );

      if (!newHazard || !newHazard.geometry || newHazard.geometry.type !== 'Point') {
        console.log('[HazardSync] Could not find hazard geometry');
        return;
      }

      const map = mapRef.current;
      if (!map) return;

      const [lng, lat] = (newHazard.geometry as GeoJSON.Point).coordinates;
      if (!isValidLonLat(lng, lat)) return;

      // Check if fire already displayed
      const nodeId = String(hazard.node_id || hazard.nodeId);
      if (activeFireZonesRef.current.some(fz => fz.roomId === nodeId)) {
        console.log('[HazardSync] Fire already displayed');
        return;
      }

      // Add fire marker
      const marker = new maplibregl.Marker({ color: 'red', scale: 1.2 })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(
          formatFireAlertPopup(`Hazard #${hazard.id}`, new Date().toLocaleTimeString())
        ))
        .addTo(map);
      fireMarkersRef.current.push(marker);

      // Track fire zone
      setActiveFireZones(prev => [...prev, {
        roomId: nodeId,
        roomName: `Hazard #${hazard.id}`,
        severity: hazard.severity || 'high',
      }]);

      // Update emergency state
      updateEmergencyState({
        isActive: true,
        mode: 'fire_detected',
        fireMarkers: fireMarkersRef.current,
      });

      showNotification(`🔥 New fire alert detected - Hazard #${hazard.id}`, 'error');
    });

    // Listen for hazard resolved events
    hazardSocket.on('hazard.resolved', (hazard: { id: number }) => {
      console.log('[HazardSync] Hazard resolved event:', hazard);
      showNotification(`Fire resolved - Hazard #${hazard.id}`, 'success');

      // Remove from active fire zones
      setActiveFireZones(prev =>
        prev.filter(fz => !fz.roomName?.includes(`#${hazard.id}`))
      );
    });

    // Listen for hazard deleted events
    hazardSocket.on('hazard.deleted', (data: { id: number }) => {
      console.log('[HazardSync] Hazard deleted event:', data);

      // Remove from active fire zones
      setActiveFireZones(prev =>
        prev.filter(fz => !fz.roomName?.includes(`#${data.id}`))
      );
    });

    return () => {
      console.log('[HazardSync] Cleanup - disconnecting socket');
      hazardSocket.disconnect();
    };
  }, [isMapLoaded, buildingId, showNotification, updateEmergencyState]);

  const clearFireZones = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    // Clear fires - use local for imported buildings, backend API otherwise
    console.log('[FireZone] Clearing fires...', isUsingImportedRouting() ? '(local)' : '(backend API)');
    const result = isUsingImportedRouting()
      ? clearLocalFires()
      : await clearFires();

    if (!result.success) {
      console.error('[FireZone] Failed to clear fires:', result.error);
      showNotification(`Warning: Failed to clear fire zones: ${result.error}`, 'warning');
    } else {
      console.log('[FireZone] Cleared hazards, count:', result.deletedCount);
    }

    // Remove fire zone layers
    if (map.getLayer('fire-zone-fill')) {
      map.removeLayer('fire-zone-fill');
    }
    if (map.getLayer('fire-zone-outline')) {
      map.removeLayer('fire-zone-outline');
    }
    if (map.getSource('fire-zones')) {
      map.removeSource('fire-zones');
    }

    // Clear markers
    fireMarkersRef.current.forEach(marker => marker.remove());
    fireMarkersRef.current = [];

    setActiveFireZones([]);
    setSelectedFireZones([]);

    showNotification('Fire zones cleared', 'success');
  }, [showNotification]);

  const startEvacuation = useCallback(() => {
    const map = mapRef.current;
    if (!map || emergencyState.mode === 'evacuation_in_progress') return;

    updateEmergencyState({ mode: 'evacuation_in_progress' });

    // Highlight evacuation routes
    map.setPaintProperty('evacuation-routes', 'line-width', 6);
    map.setPaintProperty('evacuation-routes', 'line-opacity', 1);

    // Add evacuation arrows layer
    if (!map.getLayer('evacuation-arrows')) {
      map.addLayer({
        id: 'evacuation-arrows',
        type: 'symbol',
        source: 'building-features',
        filter: ['==', ['get', 'feature_type'], 'evacuation_route'],
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 50,
          'text-field': '\u2192',
          'text-size': 24,
          'text-rotation-alignment': 'map',
          'text-pitch-alignment': 'viewport',
        },
        paint: { 'text-color': '#4caf50', 'text-halo-color': '#ffffff', 'text-halo-width': 2 },
      });
    }

    // Flash emergency exits
    let visible = true;
    const flashInterval = setInterval(() => {
      map.setLayoutProperty('emergency-exits', 'visibility', visible ? 'visible' : 'none');
      visible = !visible;
    }, 500);

    setTimeout(() => {
      clearInterval(flashInterval);
      map.setLayoutProperty('emergency-exits', 'visibility', 'visible');
    }, 10000);

    // Simulate occupancy decrease
    let currentOccupancy = emergencyState.occupancy;
    const evacuationInterval = setInterval(() => {
      currentOccupancy -= Math.floor(Math.random() * 5) + 1;
      if (currentOccupancy <= 0) {
        currentOccupancy = 0;
        clearInterval(evacuationInterval);
        updateEmergencyState({ mode: 'evacuation_complete', occupancy: 0, evacuationProgress: 1 });
        showNotification('\u2705 Evacuation completed successfully!', 'success');
      } else {
        const progress = (emergencyState.occupancy - currentOccupancy) / emergencyState.occupancy;
        updateEmergencyState({ occupancy: currentOccupancy, evacuationProgress: progress });

        // Update route color based on progress
        const color = progress < 0.5 ? '#ff5252' : progress < 0.8 ? '#ffc107' : '#4caf50';
        map.setPaintProperty('evacuation-routes', 'line-color', color);
      }
    }, 1000);
  }, [emergencyState, showNotification, updateEmergencyState]);

  const clearEmergency = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear fire zones
    clearFireZones();

    // Reset evacuation routes
    if (map.getLayer('evacuation-routes')) {
      map.setPaintProperty('evacuation-routes', 'line-width', 3);
      map.setPaintProperty('evacuation-routes', 'line-opacity', 0.8);
      map.setPaintProperty('evacuation-routes', 'line-color', ['case', ['==', ['get', 'route_type'], 'primary'], '#4caf50', '#ffc107']);
    }

    // Remove evacuation arrows
    if (map.getLayer('evacuation-arrows')) {
      map.removeLayer('evacuation-arrows');
    }

    // Clear highlighted route and related layers
    if (map.getLayer('selected-evac-route-arrows')) {
      map.removeLayer('selected-evac-route-arrows');
    }
    if (map.getLayer('selected-evac-route-line')) {
      map.removeLayer('selected-evac-route-line');
    }
    if (map.getLayer('selected-evac-route-glow')) {
      map.removeLayer('selected-evac-route-glow');
    }
    if (map.getSource('selected-evac-route')) {
      map.removeSource('selected-evac-route');
    }

    // Clear route markers
    startMarkerRef.current?.remove();
    endMarkerRef.current?.remove();
    startMarkerRef.current = null;
    endMarkerRef.current = null;

    // Reset route selection state
    setSelectedStart('');
    setSelectedEnd('');
    setHasComputedRoute(false);

    // Reset state
    updateEmergencyState({
      isActive: false,
      mode: 'idle',
      occupancy: Math.floor(Math.random() * 50) + 10,
      fireMarkers: [],
      evacuationProgress: 0,
    });

    showNotification('Emergency cleared. System reset.', 'success');
  }, [clearFireZones, showNotification, updateEmergencyState]);

  // Compute route
  const handleComputeRoute = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !selectedStart || !selectedEnd) {
      showNotification('Please select both start and end locations', 'warning');
      return;
    }

    // Clear any previous isolation alert
    setIsolationAlert(null);
    setIsComputingRoute(true);
    showNotification('Computing shortest route...', 'info');

    try {
      // Use local routing for imported buildings, backend API otherwise
      const result = isUsingImportedRouting()
        ? computeLocalRoute(selectedStart, selectedEnd)
        : await computeRoute(selectedStart, selectedEnd);

      // Handle isolation case - person is trapped by fire
      if (result.isolated && result.isolationData) {
        console.log('[Route] Person is isolated - showing shelter instructions');
        setIsolationAlert(result.isolationData);
        showNotification('⚠️ Location isolated - no safe evacuation path available!', 'error');
        setIsComputingRoute(false);
        return;
      }

      // Handle general errors
      if (!result.success) {
        showNotification(result.error || 'Failed to compute route', 'error');
        setIsComputingRoute(false);
        return;
      }

      const routeFeature = result.route;

      if (routeFeature && routeFeature.geometry) {
        // Convert geometry if needed
        const geometry = convertGeometryIfMercator(routeFeature.geometry);

        const fc: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry, properties: routeFeature.properties || {} }],
        };

        // Remove existing route layers first
        if (map.getLayer('selected-evac-route-line')) {
          map.removeLayer('selected-evac-route-line');
        }
        if (map.getLayer('selected-evac-route-glow')) {
          map.removeLayer('selected-evac-route-glow');
        }
        if (map.getLayer('selected-evac-route-arrows')) {
          map.removeLayer('selected-evac-route-arrows');
        }

        // Add or update source
        if (map.getSource('selected-evac-route')) {
          (map.getSource('selected-evac-route') as maplibregl.GeoJSONSource).setData(fc);
        } else {
          map.addSource('selected-evac-route', { type: 'geojson', data: fc });
        }

        // Add glow effect layer (behind main route)
        map.addLayer({
          id: 'selected-evac-route-glow',
          type: 'line',
          source: 'selected-evac-route',
          paint: {
            'line-color': '#ff3d00',
            'line-width': 12,
            'line-opacity': 0.3,
            'line-blur': 4,
          },
        });

        // Add main route line
        map.addLayer({
          id: 'selected-evac-route-line',
          type: 'line',
          source: 'selected-evac-route',
          paint: {
            'line-color': '#ff3d00',
            'line-width': 6,
            'line-opacity': 1,
          },
        });

        // Add direction arrows
        map.addLayer({
          id: 'selected-evac-route-arrows',
          type: 'symbol',
          source: 'selected-evac-route',
          layout: {
            'symbol-placement': 'line',
            'symbol-spacing': 80,
            'text-field': '\u2192',
            'text-size': 20,
            'text-rotation-alignment': 'map',
            'text-pitch-alignment': 'viewport',
            'text-keep-upright': false,
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#ff3d00',
            'text-halo-width': 2,
          },
        });

        // Add start and end markers
        const startNode = routeNodes.find(n => n.nodeId === selectedStart);
        const endNode = routeNodes.find(n => n.nodeId === selectedEnd);

        // Clear existing markers
        startMarkerRef.current?.remove();
        endMarkerRef.current?.remove();

        // Add start marker
        if (startNode?.coordinates) {
          const startEl = document.createElement('div');
          startEl.className = 'route-marker start-marker';
          startEl.innerHTML = '<div style="width: 24px; height: 24px; background: #22c55e; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">S</div>';
          startMarkerRef.current = new maplibregl.Marker({ element: startEl })
            .setLngLat(startNode.coordinates)
            .setPopup(new maplibregl.Popup({ offset: 25 }).setText(`Start: ${startNode.name}`))
            .addTo(map);
        }

        // Add end marker
        if (endNode?.coordinates) {
          const endEl = document.createElement('div');
          endEl.className = 'route-marker end-marker';
          endEl.innerHTML = '<div style="width: 24px; height: 24px; background: #ef4444; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">E</div>';
          endMarkerRef.current = new maplibregl.Marker({ element: endEl })
            .setLngLat(endNode.coordinates)
            .setPopup(new maplibregl.Popup({ offset: 25 }).setText(`End: ${endNode.name}`))
            .addTo(map);
        }

        setHasComputedRoute(true);
        showNotification('Route computed successfully!', 'success');
      } else {
        showNotification('No route found between selected locations', 'warning');
      }
    } catch (error) {
      console.error('Route computation failed:', error);
      showNotification('Failed to compute route. Make sure the backend server is running.', 'error');
    } finally {
      setIsComputingRoute(false);
    }
  }, [selectedStart, selectedEnd, routeNodes, showNotification]);

  // Clear computed route
  const clearComputedRoute = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear route layers
    if (map.getLayer('selected-evac-route-arrows')) {
      map.removeLayer('selected-evac-route-arrows');
    }
    if (map.getLayer('selected-evac-route-line')) {
      map.removeLayer('selected-evac-route-line');
    }
    if (map.getLayer('selected-evac-route-glow')) {
      map.removeLayer('selected-evac-route-glow');
    }
    if (map.getSource('selected-evac-route')) {
      map.removeSource('selected-evac-route');
    }

    // Clear route markers
    startMarkerRef.current?.remove();
    endMarkerRef.current?.remove();
    startMarkerRef.current = null;
    endMarkerRef.current = null;

    // Reset state
    setSelectedStart('');
    setSelectedEnd('');
    setHasComputedRoute(false);

    showNotification('Route cleared', 'info');
  }, [showNotification]);

  return (
    <div className={`flex flex-col w-full h-full ${className}`}>
      {/* CSS for evacuee marker animations */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .evacuee-marker {
          cursor: pointer;
          transition: transform 0.3s ease;
        }
        .evacuee-marker:hover {
          transform: scale(1.2);
        }
        .evacuee-marker.current-user > div {
          animation: pulse 2s infinite;
        }
      `}</style>

      {/* Map Section */}
      <div className="relative flex-1 min-h-0">
        {/* Map Container */}
        <div ref={mapContainerRef} className="w-full h-full rounded-lg overflow-hidden" />

      {/* Floor Selector - only show if showFloorSelector is true */}
      {showFloorSelector && isMapLoaded && (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            onClick={() => switchFloor('floor1')}
            className={`px-4 py-2 rounded-lg transition-all font-semibold ${
              currentFloor === 'floor1'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white/90 text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Floor 1
          </button>
          <button
            onClick={() => switchFloor('floor2')}
            className={`px-4 py-2 rounded-lg transition-all font-semibold ${
              currentFloor === 'floor2'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white/90 text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Floor 2
          </button>
        </div>
      )}

      {/* Emergency Controls */}
      {showEmergencyControls && isMapLoaded && (
        <div className="absolute top-4 right-[140px] z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg max-w-[220px] overflow-hidden">
          <button
            type="button"
            onClick={() => setIsEmergencyPanelCollapsed(!isEmergencyPanelCollapsed)}
            className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span>🚨</span> Emergency Controls
            </h3>
            <span className={`text-gray-500 transition-transform duration-200 ${isEmergencyPanelCollapsed ? '' : 'rotate-180'}`}>
              ▼
            </span>
          </button>

          {!isEmergencyPanelCollapsed && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2 mt-3">
                <span className="text-xs text-gray-600">Status:</span>
                <span className={`text-xs font-semibold ${
                  emergencyState.mode === 'idle' ? 'text-green-600' :
                  emergencyState.mode === 'fire_detected' ? 'text-red-600' :
                  emergencyState.mode === 'evacuation_in_progress' ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  {emergencyState.mode === 'idle' ? 'System Ready' :
                   emergencyState.mode === 'fire_detected' ? 'FIRE DETECTED!' :
                   emergencyState.mode === 'evacuation_in_progress' ? 'EVACUATION IN PROGRESS' :
                   'Evacuation Complete'}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-600">Occupancy:</span>
                <span className="text-xs font-semibold text-gray-800">{emergencyState.occupancy} people</span>
              </div>

              {activeFireZones.length > 0 && (
                <div className="text-xs text-red-600 mb-2">
                  Active Fires: {activeFireZones.map(z => z.roomName).join(', ')}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={startEvacuation}
                  disabled={emergencyState.mode !== 'fire_detected'}
                  className="px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Evacuation
                </button>
                <button
                  type="button"
                  onClick={clearEmergency}
                  className="px-3 py-1.5 text-xs font-semibold bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Left Side Panel - Fire Zone Management & Route Computation */}
      {isMapLoaded && (
        <div className="absolute top-20 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg max-w-[280px] max-h-[calc(100%-120px)] overflow-y-auto">
          {/* Fire Zone Management */}
          <div className="border-b border-gray-200">
            <button
              type="button"
              onClick={() => setIsFireZonePanelCollapsed(!isFireZonePanelCollapsed)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-sm font-bold text-orange-600 flex items-center gap-2">
                <span>🔥</span> Fire Zone Management
              </h3>
              <span className={`text-gray-500 transition-transform duration-200 ${isFireZonePanelCollapsed ? '' : 'rotate-180'}`}>
                ▼
              </span>
            </button>

            {!isFireZonePanelCollapsed && (
              <div className="px-4 pb-4 space-y-3">
                {/* Ignis-BE Real-time Fire Detection Status */}
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-blue-800">
                      📡 Camera Fire Detection
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      isConnectedToIgnis
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {isConnectedToIgnis ? '● Live' : '○ Connecting...'}
                    </span>
                  </div>
                  {isConnectedToIgnis && (
                    <p className="text-[9px] text-blue-600 mt-1">
                      Receiving real-time fire alerts from registered cameras
                    </p>
                  )}
                </div>

                {/* Automatic Fire Detection Section */}
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoFireEnabled}
                        onChange={(e) => {
                          setAutoFireEnabled(e.target.checked);
                          if (!e.target.checked) {
                            setAutoFireRoom('');
                          }
                        }}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                      />
                      <span className="text-xs font-medium text-orange-800">
                        🤖 Manual Room Detection
                      </span>
                    </label>
                    {autoFireEnabled && (
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        isConnectedToDetection
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {isConnectedToDetection ? '● Connected' : '○ Disconnected'}
                      </span>
                    )}
                  </div>

                  {autoFireEnabled && (
                    <>
                      <p className="text-[10px] text-orange-600 mb-2">
                        Select room to auto-place fire when YOLO detects fire
                      </p>
                      <select
                        value={autoFireRoom}
                        onChange={(e) => setAutoFireRoom(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-orange-300 rounded focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">-- Select Room --</option>
                        {routeNodes.filter(n => !n.id.startsWith('nav-')).map(node => (
                          <option key={node.roomId} value={node.roomId}>
                            {node.name}
                          </option>
                        ))}
                      </select>
                      {autoFireRoom && isConnectedToDetection && (
                        <p className="text-[10px] text-green-600 mt-1">
                          ✓ Listening for fire detections...
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Manual Fire Placement - disabled when auto is enabled */}
                <div className={autoFireEnabled ? 'opacity-50 pointer-events-none' : ''}>
                  <div>
                    <label htmlFor="fire-zones-select" className="text-xs text-gray-600 block mb-1">
                      Select Fire Zones {autoFireEnabled && '(Disabled in auto mode)'}:
                    </label>
                    <select
                      id="fire-zones-select"
                      multiple
                      value={selectedFireZones}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedFireZones(values);
                      }}
                      disabled={autoFireEnabled}
                      className="w-full px-2 py-1.5 text-xs border rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-28"
                      title="Select rooms where fire should be placed"
                    >
                      {routeNodes.map(node => (
                        <option key={node.roomId} value={node.roomId}>{node.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple rooms</p>
                  </div>

                  <div className="mt-3">
                    <label htmlFor="fire-severity-select" className="text-xs text-gray-600 block mb-1">Fire Severity:</label>
                    <select
                      id="fire-severity-select"
                      value={fireSeverity}
                      onChange={(e) => setFireSeverity(e.target.value as 'HIGH' | 'CRITICAL')}
                      disabled={autoFireEnabled}
                      className="w-full px-2 py-1.5 text-xs border rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      title="Select fire severity level"
                    >
                      <option value="HIGH">High (Dangerous - Avoid)</option>
                      <option value="CRITICAL">Critical (Life Threatening)</option>
                    </select>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={placeFireInZones}
                      disabled={selectedFireZones.length === 0 || autoFireEnabled}
                      className="flex-1 px-3 py-2 text-xs font-semibold bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      <span>🔥</span> Place Fire
                    </button>
                    <button
                      type="button"
                      onClick={clearFireZones}
                      disabled={activeFireZones.length === 0}
                      className="flex-1 px-3 py-2 text-xs font-semibold bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      <span>✓</span> Clear All
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Route Computation */}
          <div>
            <button
              type="button"
              onClick={() => setIsRoutePanelCollapsed(!isRoutePanelCollapsed)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                <span>🧭</span> Compute Shortest Route
              </h3>
              <span className={`text-gray-500 transition-transform duration-200 ${isRoutePanelCollapsed ? '' : 'rotate-180'}`}>
                ▼
              </span>
            </button>

            {!isRoutePanelCollapsed && (
              <div className="px-4 pb-4">
                <div className="space-y-2 mb-3">
                  <div>
                    <label htmlFor="start-location-select" className="text-xs text-gray-600 block mb-1">Start Location:</label>
                    <select
                      id="start-location-select"
                      value={selectedStart}
                      onChange={(e) => setSelectedStart(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      title="Select starting location for route"
                    >
                      <option value="">Select start...</option>
                      {routeNodes.map(node => (
                        <option key={node.id} value={node.nodeId}>{node.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="end-location-select" className="text-xs text-gray-600 block mb-1">End Location:</label>
                    <select
                      id="end-location-select"
                      value={selectedEnd}
                      onChange={(e) => setSelectedEnd(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      title="Select destination for route"
                    >
                      <option value="">Select end...</option>
                      {routeNodes.map(node => (
                        <option key={node.id} value={node.nodeId}>{node.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleComputeRoute}
                    disabled={!selectedStart || !selectedEnd || isComputingRoute}
                    className="flex-1 px-3 py-2 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <span>🧭</span> {isComputingRoute ? 'Computing...' : 'Compute'}
                  </button>
                  <button
                    type="button"
                    onClick={clearComputedRoute}
                    disabled={!hasComputedRoute}
                    className="px-3 py-2 text-xs font-semibold bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <span>✕</span> Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Isolation Alert - Shelter in Place Instructions */}
      {isolationAlert && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md mx-4 overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="bg-red-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🚨</span>
                <div>
                  <h2 className="text-white font-bold text-lg">LOCATION ISOLATED</h2>
                  <p className="text-red-100 text-sm">No safe evacuation path available</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Warning Message */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r">
                <p className="text-red-800 text-sm font-medium">
                  {isolationAlert.message}
                </p>
              </div>

              {/* Shelter Instructions */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <h3 className="text-amber-800 font-bold text-sm mb-2 flex items-center gap-2">
                  <span>🏠</span> SHELTER IN PLACE INSTRUCTIONS
                </h3>
                {Array.isArray(isolationAlert.shelterInstructions) ? (
                  <ul className="text-amber-700 text-sm space-y-1">
                    {isolationAlert.shelterInstructions.map((instruction, idx) => (
                      <li key={idx}>• {instruction}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-amber-700 text-sm whitespace-pre-line">
                    {isolationAlert.shelterInstructions}
                  </p>
                )}
              </div>

              {/* Safety Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-blue-800 font-bold text-sm mb-2 flex items-center gap-2">
                  <span>💡</span> WHILE WAITING FOR RESCUE
                </h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Stay low to avoid smoke inhalation</li>
                  <li>• Seal door gaps with wet towels</li>
                  <li>• Signal from window if possible</li>
                  <li>• Keep calm and conserve energy</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
              <p className="text-gray-500 text-xs">
                Rescue team has been notified
              </p>
              <button
                type="button"
                onClick={() => setIsolationAlert(null)}
                className="px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && <Notification message={notification.message} type={notification.type} />}

      {/* CSS for animation */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateX(-50%) translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
      </div>

      {/* Imported Building Indicator */}
      {isUsingImportedData && isMapLoaded && (
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-3 shadow-lg mt-3">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="font-semibold">Imported Floor Plan:</span>
              <span className="font-normal">{importedBuildingName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm opacity-90">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>From Map Editor</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend - Horizontal layout below map */}
      {showLegend && isMapLoaded && (
        <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg mt-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {/* Title */}
            <h3 className="text-sm font-bold text-gray-800">Legend:</h3>

            {/* Markers */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded-full border border-white shadow"></div>
                <span className="text-xs text-gray-700">Interior Door</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-500 rounded-full border border-white shadow"></div>
                <span className="text-xs text-gray-700">Main Entry</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-500 rounded-full border border-white shadow"></div>
                <span className="text-xs text-gray-700">Emergency Exit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-orange-500 rounded-full border border-white shadow"></div>
                <span className="text-xs text-gray-700">Stairs/Equipment</span>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-4 bg-gray-300"></div>

            {/* Routes */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-1 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-700">Primary</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-1 bg-yellow-500 rounded"></div>
                <span className="text-xs text-gray-700">Secondary</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-1 bg-red-600 rounded"></div>
                <span className="text-xs text-gray-700">Computed</span>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-4 bg-gray-300"></div>

            {/* Fire Zone */}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-500/40 border-2 border-red-600 rounded"></div>
              <span className="text-xs text-gray-700">Fire Zone</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

EvacuationMap.displayName = 'EvacuationMap';

export default EvacuationMap;
