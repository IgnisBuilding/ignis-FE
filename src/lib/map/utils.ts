// Map Utility Functions

import type { Sensor, HazardData, RouteNode } from './types';
import { DEFAULT_MAP_CONFIG, API_ENDPOINTS } from './config';

/**
 * Fetch data from backend API only (no static fallback)
 */
export async function fetchFromAPI<T>(
  endpoint: string
): Promise<T | null> {
  const apiBase = DEFAULT_MAP_CONFIG.apiBase;
  const fullUrl = `${apiBase}${endpoint}`;

  console.log(`[MapAPI] Fetching from: ${fullUrl} (apiBase: ${apiBase})`);

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[MapAPI] Success: ${endpoint}`);
      return data as T;
    } else {
      console.error(`[MapAPI] API returned ${response.status} for ${fullUrl}`);
    }
  } catch (error) {
    console.error(`[MapAPI] Failed to fetch from ${fullUrl}:`, error);
  }

  return null;
}

/**
 * Room-to-node mapping type from backend
 */
export interface RoomNodeMapping {
  room_id: number;
  room_name: string;
  node_id: number;
  node_type: string;
  floor_level: number;
  longitude: number;
  latitude: number;
}

/**
 * Load all map data sources from backend API
 */
export async function loadMapData() {
  const [rooms, features, details, nodes, sensors, occupancy, roomNodes] = await Promise.all([
    fetchFromAPI<GeoJSON.FeatureCollection>(API_ENDPOINTS.rooms),
    fetchFromAPI<GeoJSON.FeatureCollection>(API_ENDPOINTS.buildingFeatures),
    fetchFromAPI<GeoJSON.FeatureCollection>(API_ENDPOINTS.buildingDetails),
    fetchFromAPI<GeoJSON.FeatureCollection>(API_ENDPOINTS.nodes),
    fetchFromAPI<GeoJSON.FeatureCollection>(API_ENDPOINTS.sensors),
    fetchFromAPI<any>(API_ENDPOINTS.occupancy),
    fetchFromAPI<RoomNodeMapping[]>(API_ENDPOINTS.roomNodes),
  ]);

  return {
    rooms,
    features,
    details,
    nodes,
    sensors,
    occupancy,
    roomNodes,
  };
}

/**
 * Room type to color mapping (matching original app.js)
 */
const ROOM_TYPE_COLORS: Record<string, string> = {
  bedroom: '#5C6BC0',
  kitchen: '#FF9800',
  common: '#66BB6A',
  stairs: '#757575',
  bathroom: '#4FC3F7',
  office: '#7E57C2',
  outdoor: '#81C784',
  garage: '#9E9E9E',
  corridor: '#E8F5E9',
  evacuation_route: '#4caf50',
  living: '#66BB6A',
  dining: '#66BB6A',
  laundry: '#80DEEA',
  storage: '#BCAAA4',
  pantry: '#FFB74D',
  mudroom: '#A1887F',
  recreation: '#7E57C2',
  utility: '#90A4AE',
  walk_in: '#BCAAA4',
};

/**
 * Normalize a single feature - ensure color, level and useful props exist
 * This matches the ensureColorForFeature function from original app.js
 */
function normalizeFeature(feature: any, idx: number): GeoJSON.Feature {
  if (!feature.properties) feature.properties = {};
  const p = feature.properties;

  // Normalize level/floor to a string - check address first (matching backend data)
  const levelVal =
    p.level ??
    p.address ??
    p.level_id ??
    p.floor ??
    p.floor_id ??
    p.levelName ??
    p.levelNumber ??
    '';
  p.level = levelVal !== undefined && levelVal !== null && levelVal !== ''
    ? String(levelVal)
    : '0'; // Default to '0' (ground floor)

  // Also keep address in sync
  if (p.address === undefined && p.level !== undefined) {
    p.address = p.level;
  }

  // Normalize types to lowercase so filters match
  // Backend sends 'type' field, map it to room_type and feature_type
  if (p.room_type === undefined && p.type !== undefined)
    p.room_type = String(p.type).toLowerCase();
  if (p.room_type === undefined && p.feature_type !== undefined)
    p.room_type = String(p.feature_type).toLowerCase();
  if (p.feature_type === undefined && p.room_type !== undefined)
    p.feature_type = String(p.room_type).toLowerCase();
  if (p.feature_type === undefined && p.type !== undefined)
    p.feature_type = String(p.type).toLowerCase();
  if (p.room_type) p.room_type = String(p.room_type).toLowerCase();
  if (p.feature_type) p.feature_type = String(p.feature_type).toLowerCase();

  // Friendly name fallback
  if (!p.name)
    p.name = p.label || p.title || p.type || `Feature ${feature.id ?? idx}`;

  // Ensure a color exists (matching original app.js color logic)
  if (!p.color) {
    const rt = p.room_type || p.feature_type || 'default';
    p.color = ROOM_TYPE_COLORS[rt] || '#BDBDBD';
  }

  return {
    ...feature,
    id: feature.id ?? p.id ?? idx,
    properties: p,
  };
}

/**
 * Normalize GeoJSON data - ensure proper structure and properties
 * Matches original app.js ensureColorForFeature and convertGeometryIfMercator
 */
export function normalizeGeoJSON(data: any): GeoJSON.FeatureCollection {
  if (!data) {
    return { type: 'FeatureCollection', features: [] };
  }

  if (data.type === 'FeatureCollection') {
    return {
      ...data,
      features: data.features.map((f: any, idx: number) => {
        const normalized = normalizeFeature(f, idx);
        // Convert geometry if in Web Mercator
        if (normalized.geometry) {
          normalized.geometry = convertGeometryIfMercator(normalized.geometry);
        }
        return normalized;
      }),
    };
  }

  if (data.type === 'Feature') {
    const normalized = normalizeFeature(data, 0);
    if (normalized.geometry) {
      normalized.geometry = convertGeometryIfMercator(normalized.geometry);
    }
    return {
      type: 'FeatureCollection',
      features: [normalized],
    };
  }

  if (Array.isArray(data)) {
    return {
      type: 'FeatureCollection',
      features: data.map((f: any, idx: number) => {
        const feature = {
          type: 'Feature' as const,
          id: f.id ?? idx,
          geometry: f.geometry || f,
          properties: f.properties || {},
        };
        const normalized = normalizeFeature(feature, idx);
        if (normalized.geometry) {
          normalized.geometry = convertGeometryIfMercator(normalized.geometry);
        }
        return normalized;
      }),
    };
  }

  return { type: 'FeatureCollection', features: [] };
}

/**
 * Check if coordinates are in Web Mercator (EPSG:3857) format
 */
export function isWebMercator(coords: number[]): boolean {
  const [x, y] = coords;
  // Web Mercator coordinates are typically large numbers
  return Math.abs(x) > 180 || Math.abs(y) > 90;
}

/**
 * Convert Web Mercator to WGS84 (lon/lat)
 */
export function webMercatorToWGS84(x: number, y: number): [number, number] {
  const EARTH_RADIUS = 6378137;
  const lon = (x / EARTH_RADIUS) * (180 / Math.PI);
  const lat = (Math.atan(Math.exp(y / EARTH_RADIUS)) * 360) / Math.PI - 90;
  return [lon, lat];
}

/**
 * Convert geometry coordinates if they're in Web Mercator
 */
export function convertGeometryIfMercator(geometry: GeoJSON.Geometry): GeoJSON.Geometry {
  function convertCoords(coords: any): any {
    if (typeof coords[0] === 'number') {
      if (isWebMercator(coords)) {
        return webMercatorToWGS84(coords[0], coords[1]);
      }
      return coords;
    }
    return coords.map(convertCoords);
  }

  if (!geometry || !geometry.coordinates) return geometry;

  return {
    ...geometry,
    coordinates: convertCoords(geometry.coordinates),
  } as GeoJSON.Geometry;
}

/**
 * Calculate bounding box from GeoJSON
 */
export function calculateBounds(
  geojson: GeoJSON.FeatureCollection
): [[number, number], [number, number]] | null {
  if (!geojson.features?.length) return null;

  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;

  function processCoords(coords: any): void {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords;
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    } else {
      coords.forEach(processCoords);
    }
  }

  geojson.features.forEach((feature) => {
    if (feature.geometry?.coordinates) {
      processCoords(feature.geometry.coordinates);
    }
  });

  if (!isFinite(minLng) || !isFinite(minLat)) return null;

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/**
 * Get centroid of a feature
 */
export function getFeatureCentroid(feature: GeoJSON.Feature): [number, number] | null {
  if (!feature.geometry) return null;

  const { type, coordinates } = feature.geometry as any;

  if (type === 'Point') {
    return coordinates;
  }

  if (type === 'Polygon') {
    // Simple centroid calculation for polygons
    const ring = coordinates[0];
    let x = 0,
      y = 0;
    ring.forEach(([lng, lat]: number[]) => {
      x += lng;
      y += lat;
    });
    return [x / ring.length, y / ring.length];
  }

  if (type === 'LineString') {
    // Midpoint of line
    const mid = Math.floor(coordinates.length / 2);
    return coordinates[mid];
  }

  return null;
}

/**
 * Format room popup content
 */
export function formatRoomPopupContent(properties: Record<string, any>): string {
  let content = `
    <div style="font-family: Arial, sans-serif;">
      <h3 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 16px;">${properties.name || 'Unknown Room'}</h3>
      <div style="border-top: 2px solid ${properties.color || '#ccc'}; padding-top: 8px;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #555;">
          <strong>Type:</strong> ${properties.room_type || 'N/A'}
        </p>`;

  if (properties.dimensions) {
    content += `
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #555;">
          <strong>Dimensions:</strong> ${properties.dimensions}
        </p>`;
  }

  if (properties.ceiling) {
    content += `
        <p style="margin: 0; font-size: 13px; color: #555;">
          <strong>Note:</strong> ${properties.ceiling}
        </p>`;
  }

  content += `</div></div>`;
  return content;
}

/**
 * Format fire alert popup content
 */
export function formatFireAlertPopup(location: string, time: string = 'Just now'): string {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h3 style="margin: 0 0 5px 0; color: #d32f2f;">
        <span style="font-size: 20px;">&#128293;</span> Fire Alert!
      </h3>
      <p style="margin: 0; font-size: 13px;">Location: ${location}</p>
      <p style="margin: 0; font-size: 13px; color: #666;">Time: ${time}</p>
    </div>`;
}

/**
 * Create stairs pattern image for map
 */
export function createStairsPattern(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 32, 32);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;

    // Draw diagonal lines for stairs pattern
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 8, 0);
      ctx.lineTo(i * 8, 32);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 8);
      ctx.lineTo(32, i * 8);
      ctx.stroke();
    }
  }

  return canvas;
}

/**
 * Isolation response when person is trapped by fire
 */
export interface IsolationResponse {
  isolated: true;
  message: string;
  shelterInstructions: string;
  roomName?: string;
}

/**
 * Route computation result - either a route or isolation info
 */
export interface RouteComputationResult {
  success: boolean;
  route?: GeoJSON.Feature | null;
  isolated?: boolean;
  isolationData?: IsolationResponse;
  error?: string;
}

/**
 * Compute evacuation route via API
 * Returns route on success, or isolation data if person is trapped by fire
 */
export async function computeRoute(
  startNodeId: string | number,
  endNodeId: string | number
): Promise<RouteComputationResult> {
  const fullUrl = `${DEFAULT_MAP_CONFIG.apiBase}${API_ENDPOINTS.compute}`;

  // Backend expects integer node IDs
  const startId = typeof startNodeId === 'string' ? parseInt(startNodeId, 10) : startNodeId;
  const endId = typeof endNodeId === 'string' ? parseInt(endNodeId, 10) : endNodeId;

  console.log(`[MapAPI] Computing route from ${startId} to ${endId} via ${fullUrl}`);

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startNodeId: startId, endNodeId: endId }),
    });

    const data = await response.json();

    // Handle 422 LOCATION_ISOLATED - person is trapped by fire
    if (response.status === 422 && data.error === 'LOCATION_ISOLATED') {
      console.log(`[MapAPI] Location isolated - person trapped:`, data);
      return {
        success: false,
        isolated: true,
        isolationData: {
          isolated: true,
          message: data.message,
          shelterInstructions: data.shelterInstructions,
          roomName: data.roomName,
        },
      };
    }

    if (!response.ok) {
      console.error(`[MapAPI] Route computation failed: ${response.status}`, data);
      return {
        success: false,
        error: data.message || `Route computation failed: ${response.status}`,
      };
    }

    console.log(`[MapAPI] Route computation success:`, data);
    return {
      success: true,
      route: extractFeatureFromResponse(data),
    };
  } catch (error) {
    console.error(`[MapAPI] Failed to compute route via ${fullUrl}:`, error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Place fires in selected zones - calls backend to create hazard records
 * This is REQUIRED for route computation to avoid fire zones
 */
export interface FireZoneInput {
  nodeId: number;
  roomId: number;
  roomName: string;
  longitude: number;
  latitude: number;
  floorLevel: number;
}

export async function placeFires(
  fireZones: FireZoneInput[],
  severity: 'HIGH' | 'CRITICAL' = 'HIGH'
): Promise<{ success: boolean; hazardIds?: number[]; error?: string }> {
  const apiBase = DEFAULT_MAP_CONFIG.apiBase;
  const url = `${apiBase}${API_ENDPOINTS.placeFires}`;

  console.log(`[MapAPI] Placing fires at ${fireZones.length} zone(s):`, fireZones);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fireZones,
        severity,
        type: 'manual_fire',
        status: 'ACTIVE',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[MapAPI] Place fires failed: ${response.status}`, errorText);
      return { success: false, error: `Failed to place fires: ${response.statusText}` };
    }

    const result = await response.json();
    console.log(`[MapAPI] Place fires success:`, result);
    return { success: true, hazardIds: result.hazardIds };
  } catch (error) {
    console.error(`[MapAPI] Place fires error:`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * Clear all active fire zones - removes hazard records from database
 */
export async function clearFires(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  const apiBase = DEFAULT_MAP_CONFIG.apiBase;
  const url = `${apiBase}${API_ENDPOINTS.clearFires}`;

  console.log(`[MapAPI] Clearing all fire zones`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[MapAPI] Clear fires failed: ${response.status}`, errorText);
      return { success: false, error: `Failed to clear fires: ${response.statusText}` };
    }

    const result = await response.json();
    console.log(`[MapAPI] Clear fires success:`, result);
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error(`[MapAPI] Clear fires error:`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * Extract feature from various API response formats
 */
export function extractFeatureFromResponse(data: any): GeoJSON.Feature | null {
  if (!data) return null;

  if (data.type === 'FeatureCollection' && data.features?.length) {
    return data.features[0];
  }

  if (data.type === 'Feature' && data.geometry) {
    return data;
  }

  if (data.path?.type === 'Feature') {
    return data.path;
  }

  if (data.path?.type === 'FeatureCollection' && data.path.features?.length) {
    return data.path.features[0];
  }

  if (data.geojson?.type === 'FeatureCollection' && data.geojson.features?.length) {
    return data.geojson.features[0];
  }

  if (data.geojson?.type === 'Feature') {
    return data.geojson;
  }

  if (Array.isArray(data.features) && data.features.length) {
    return data.features[0];
  }

  return null;
}

/**
 * Validate coordinates are within valid lon/lat range
 */
export function isValidLonLat(coords: number[]): boolean {
  const [lng, lat] = coords;
  return (
    isFinite(lng) &&
    isFinite(lat) &&
    Math.abs(lng) <= 180 &&
    Math.abs(lat) <= 90
  );
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
