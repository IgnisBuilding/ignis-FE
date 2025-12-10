'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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
  extractFeatureFromResponse,
  convertGeometryIfMercator,
  isValidLonLat,
} from '@/lib/map';

import type { EmergencyState, MapCallbacks, Sensor, HazardData } from '@/lib/map';

// Props interface
interface EvacuationMapProps {
  className?: string;
  initialFloor?: 'floor1' | 'floor2';
  showControls?: boolean;
  showLegend?: boolean;
  showEmergencyControls?: boolean;
  onRoomClick?: (room: GeoJSON.Feature) => void;
  onEmergencyStateChange?: (state: EmergencyState) => void;
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
  showControls = true,
  showLegend = true,
  showEmergencyControls = true,
  onRoomClick,
  onEmergencyStateChange,
}: EvacuationMapProps) => {
  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const fireMarkersRef = useRef<maplibregl.Marker[]>([]);
  const startMarkerRef = useRef<maplibregl.Marker | null>(null);
  const endMarkerRef = useRef<maplibregl.Marker | null>(null);

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
  const [routeNodes, setRouteNodes] = useState<{ id: string; name: string; nodeId?: string; roomId?: string; coordinates?: [number, number] }[]>([]);
  const [selectedStart, setSelectedStart] = useState<string>('');
  const [selectedEnd, setSelectedEnd] = useState<string>('');
  const [isComputingRoute, setIsComputingRoute] = useState(false);
  const [hasComputedRoute, setHasComputedRoute] = useState(false);

  // Fire zone management state
  const [selectedFireZones, setSelectedFireZones] = useState<string[]>([]);
  const [fireSeverity, setFireSeverity] = useState<'low' | 'medium' | 'high'>('high');
  const [activeFireZones, setActiveFireZones] = useState<Array<{ roomId: string; roomName: string; severity: string }>>([]);

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

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: DEFAULT_MAP_CONFIG.style,
      center: DEFAULT_MAP_CONFIG.center,
      zoom: DEFAULT_MAP_CONFIG.zoom,
      minZoom: DEFAULT_MAP_CONFIG.minZoom,
      maxZoom: DEFAULT_MAP_CONFIG.maxZoom,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', async () => {
      try {
        // Load map data from backend API
        const { rooms, features, details, nodes, sensors, occupancy } = await loadMapData();

        // Check if rooms data was loaded successfully
        if (!rooms || !rooms.features || rooms.features.length === 0) {
          console.error('Rooms data not loaded - backend may be unavailable');
          showNotification('Backend server not available. Please ensure the backend is running.', 'error');
          setIsMapLoaded(true); // Still mark as loaded to show error state
          return;
        }

        // Normalize and add sources
        const roomsData = normalizeGeoJSON(rooms);
        const featuresData = normalizeGeoJSON(features);
        const detailsData = normalizeGeoJSON(details);
        const nodesData = normalizeGeoJSON(nodes);

        // Add stairs pattern image
        const stairsCanvas = createStairsPattern();
        map.addImage('stairs-pattern', { width: 32, height: 32, data: new Uint8Array(stairsCanvas.getContext('2d')!.getImageData(0, 0, 32, 32).data) });

        // Add sources
        map.addSource('building', { type: 'geojson', data: roomsData, generateId: true });
        map.addSource('building-features', { type: 'geojson', data: featuresData });
        map.addSource('building-details', { type: 'geojson', data: detailsData });
        map.addSource('navigation-nodes', { type: 'geojson', data: nodesData });

        // Add all layers
        addMapLayers(map);

        // Fit to building bounds
        const bounds = calculateBounds(roomsData);
        if (bounds) {
          map.fitBounds(bounds, { padding: 50, duration: 1000 });
        }

        // Populate route node options from rooms data with coordinates for fire placement
        const roomNodes = roomsData.features
          .filter(f => f.properties?.name)
          .map(f => {
            // Get centroid of the room for fire placement
            let coordinates: [number, number] | undefined;
            if (f.geometry && f.geometry.type === 'Polygon') {
              const ring = (f.geometry as GeoJSON.Polygon).coordinates[0];
              let cx = 0, cy = 0;
              ring.forEach(([lng, lat]) => { cx += lng; cy += lat; });
              coordinates = [cx / ring.length, cy / ring.length];
            }
            return {
              id: String(f.properties?.id || f.id),
              name: f.properties?.name || 'Unknown',
              nodeId: String(f.properties?.id || f.id),
              roomId: String(f.properties?.id || f.id),
              coordinates,
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

        setRouteNodes([...roomNodes, ...navNodes]);

        // Store data globally for debugging
        if (typeof window !== 'undefined') {
          (window as any)._mapInstance = map;
          (window as any)._roomsData = roomsData;
          (window as any)._nodesData = nodesData;
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
        showNotification('Map loaded successfully from backend', 'success');
      } catch (error) {
        console.error('Failed to initialize map:', error);
        showNotification('Failed to load map data. Please check if the backend server is running.', 'error');
        setIsMapLoaded(true);
      }
    });

    map.on('error', (e) => {
      console.error('Map error:', e);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [showControls, showNotification]);

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

    // Building shadow
    map.addLayer({
      id: 'building-shadow',
      type: 'fill',
      source: 'building',
      filter: ['==', ['get', 'level'], '1'],
      paint: LAYER_STYLES.buildingShadow as any,
    });

    // Floor 1 layers
    map.addLayer({
      id: 'floor1-fill',
      type: 'fill',
      source: 'building',
      filter: ['==', ['get', 'level'], '1'],
      paint: LAYER_STYLES.floorFill as any,
    });

    map.addLayer({
      id: 'floor1-outline',
      type: 'line',
      source: 'building',
      filter: ['==', ['get', 'level'], '1'],
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

    // Room labels
    map.addLayer({
      id: 'floor1-labels',
      type: 'symbol',
      source: 'building',
      filter: ['==', ['get', 'level'], '1'],
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

    // Windows
    map.addLayer({
      id: 'windows',
      type: 'line',
      source: 'building-features',
      filter: ['==', ['get', 'feature_type'], 'window'],
      paint: LAYER_STYLES.windows as any,
    });

    // Evacuation routes
    map.addLayer({
      id: 'evacuation-routes',
      type: 'line',
      source: 'building-features',
      filter: ['==', ['get', 'feature_type'], 'evacuation_route'],
      paint: LAYER_STYLES.evacuationRoutes as any,
    });

    // Interior doors (blue circles)
    map.addLayer({
      id: 'doors',
      type: 'circle',
      source: 'building-features',
      filter: [
        'all',
        ['==', ['get', 'feature_type'], 'door'],
        ['!=', ['get', 'door_type'], 'main'],
        ['!=', ['get', 'door_type'], 'garage'],
      ],
      paint: {
        'circle-radius': 6,
        'circle-color': '#3b82f6', // Blue for interior doors
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });

    // Main entry doors (green circles)
    map.addLayer({
      id: 'main-entry-doors',
      type: 'circle',
      source: 'building-features',
      filter: [
        'any',
        ['==', ['get', 'door_type'], 'main'],
        ['==', ['get', 'door_type'], 'garage'],
      ],
      paint: {
        'circle-radius': 8,
        'circle-color': '#22c55e', // Green for main entry
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });

    // Emergency exits (red circles)
    map.addLayer({
      id: 'emergency-exits',
      type: 'circle',
      source: 'building-features',
      filter: ['==', ['get', 'feature_type'], 'emergency_exit'],
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
      filter: ['==', ['get', 'feature_type'], 'emergency_exit'],
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

    // Floor 2 layers (hidden initially)
    map.addLayer({
      id: 'floor2-fill',
      type: 'fill',
      source: 'building',
      filter: ['==', ['get', 'level'], '2'],
      layout: { visibility: 'none' },
      paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.8 },
    });

    map.addLayer({
      id: 'floor2-outline',
      type: 'line',
      source: 'building',
      filter: ['==', ['get', 'level'], '2'],
      layout: { visibility: 'none' },
      paint: { 'line-color': '#2c3e50', 'line-width': 2 },
    });

    map.addLayer({
      id: 'floor2-labels',
      type: 'symbol',
      source: 'building',
      filter: ['==', ['get', 'level'], '2'],
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
  const placeFireInZones = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedFireZones.length === 0) {
      showNotification('Please select at least one room to place fire', 'warning');
      return;
    }

    // Get room details for selected zones
    const fireZones = selectedFireZones.map(roomId => {
      const room = routeNodes.find(n => n.roomId === roomId);
      return {
        roomId,
        roomName: room?.name || 'Unknown Room',
        severity: fireSeverity,
        coordinates: room?.coordinates,
      };
    });

    // Clear existing fire markers
    fireMarkersRef.current.forEach(marker => marker.remove());
    fireMarkersRef.current = [];

    // Add fire markers for each selected zone
    fireZones.forEach(zone => {
      if (zone.coordinates) {
        const marker = new maplibregl.Marker({ color: 'red', scale: 1.2 })
          .setLngLat(zone.coordinates)
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(formatFireAlertPopup(zone.roomName)))
          .addTo(map);
        fireMarkersRef.current.push(marker);
      }
    });

    // Add fire zone visualization layer
    const source = map.getSource('building') as maplibregl.GeoJSONSource;
    if (source) {
      const data = (source as any)._data as GeoJSON.FeatureCollection;
      const fireRoomIds = selectedFireZones.map(id => parseInt(id));

      // Create fire zone overlay
      const fireZoneFeatures = data.features.filter(f =>
        fireRoomIds.includes(f.properties?.id) || fireRoomIds.includes(parseInt(String(f.id)))
      );

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

    // Update state
    setActiveFireZones(fireZones);
    setSelectedFireZones([]);

    updateEmergencyState({
      isActive: true,
      mode: 'fire_detected',
      fireMarkers: fireMarkersRef.current,
    });

    showNotification(`🔥 Fire placed in ${fireZones.length} zone(s)! Click "Start Evacuation" to begin.`, 'error');
  }, [selectedFireZones, fireSeverity, routeNodes, showNotification, updateEmergencyState]);

  // Clear all fire zones
  const clearFireZones = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

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
  }, []);

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

    setIsComputingRoute(true);
    showNotification('Computing shortest route...', 'info');

    try {
      const routeFeature = await computeRoute(selectedStart, selectedEnd);

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
    <div className={`relative w-full h-full ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full rounded-lg overflow-hidden" />

      {/* Floor Selector */}
      {isMapLoaded && (
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
        <div className="absolute top-4 right-[140px] z-10 flex flex-col gap-2 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-[220px]">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Emergency Controls</h3>

          <div className="flex items-center gap-2 mb-2">
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

      {/* Left Side Panel - Fire Zone Management & Route Computation */}
      {isMapLoaded && (
        <div className="absolute top-20 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg max-w-[280px] max-h-[calc(100%-120px)] overflow-y-auto">
          {/* Fire Zone Management */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-bold text-orange-600 mb-3 flex items-center gap-2">
              <span>🔥</span> Fire Zone Management
            </h3>

            <div className="space-y-3">
              <div>
                <label htmlFor="fire-zones-select" className="text-xs text-gray-600 block mb-1">Select Fire Zones:</label>
                <select
                  id="fire-zones-select"
                  multiple
                  value={selectedFireZones}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedFireZones(values);
                  }}
                  className="w-full px-2 py-1.5 text-xs border rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-28"
                  title="Select rooms where fire should be placed"
                >
                  {routeNodes.map(node => (
                    <option key={node.roomId} value={node.roomId}>{node.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple rooms</p>
              </div>

              <div>
                <label htmlFor="fire-severity-select" className="text-xs text-gray-600 block mb-1">Fire Severity:</label>
                <select
                  id="fire-severity-select"
                  value={fireSeverity}
                  onChange={(e) => setFireSeverity(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full px-2 py-1.5 text-xs border rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  title="Select fire severity level"
                >
                  <option value="low">Low (Manageable)</option>
                  <option value="medium">Medium (Spreading)</option>
                  <option value="high">High (Dangerous - Avoid)</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={placeFireInZones}
                  disabled={selectedFireZones.length === 0}
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

          {/* Route Computation */}
          <div className="p-4">
            <h3 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2">
              <span>🧭</span> Compute Shortest Route
            </h3>

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
        </div>
      )}

      {/* Legend */}
      {showLegend && isMapLoaded && (
        <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Legend</h3>
          <div className="space-y-2">
            {/* Markers */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>
              <span className="text-xs text-gray-700">Interior Door</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow"></div>
              <span className="text-xs text-gray-700">Main Entry</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow"></div>
              <span className="text-xs text-gray-700">Emergency Exit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow"></div>
              <span className="text-xs text-gray-700">Stairs / Fire Equipment</span>
            </div>
            {/* Routes */}
            <div className="border-t border-gray-200 my-2 pt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-1 bg-green-500"></div>
                <span className="text-xs text-gray-700">Primary Route</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-1 bg-yellow-500"></div>
                <span className="text-xs text-gray-700">Secondary Route</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 bg-red-600"></div>
                <span className="text-xs text-gray-700">Computed Route</span>
              </div>
            </div>
            {/* Fire Zone */}
            <div className="border-t border-gray-200 my-2 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500/40 border-2 border-red-600"></div>
                <span className="text-xs text-gray-700">Fire Zone</span>
              </div>
            </div>
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
  );
});

EvacuationMap.displayName = 'EvacuationMap';

export default EvacuationMap;
