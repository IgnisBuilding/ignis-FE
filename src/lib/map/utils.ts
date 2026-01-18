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

  if (!geometry || geometry.type === 'GeometryCollection' || !('coordinates' in geometry)) return geometry;

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
    if (feature.geometry && 'coordinates' in feature.geometry) {
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
  shelterInstructions: string | string[];
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

/**
 * ============================================
 * CLIENT-SIDE ROUTING FOR IMPORTED BUILDINGS
 * ============================================
 * When using imported building data from Map Editor, routing is computed
 * locally using Dijkstra's algorithm instead of calling the backend API.
 */

/**
 * Routing graph node for client-side computation
 */
export interface LocalRoutingNode {
  id: string | number;
  name: string;
  type: string;
  level: string;
  lat: number;
  lng: number;
  is_exit?: boolean;
}

/**
 * Routing graph edge for client-side computation
 */
export interface LocalRoutingEdge {
  id: number;
  source: string | number;
  target: string | number;
  cost: number;
  reverse_cost: number;
  opening_type?: string;
}

/**
 * Local routing graph structure
 */
export interface LocalRoutingGraph {
  nodes: LocalRoutingNode[];
  edges: LocalRoutingEdge[];
}

/**
 * Local fire zone manager - tracks fire zones for client-side routing
 */
class LocalFireZoneManager {
  private fireZones: Map<string | number, FireZoneInput> = new Map();
  private blockedNodes: Set<string | number> = new Set();

  addFire(zone: FireZoneInput): void {
    const key = zone.nodeId;
    this.fireZones.set(key, zone);
    this.blockedNodes.add(zone.nodeId);
    console.log(`[LocalFireManager] Added fire at node ${key}, total fires: ${this.fireZones.size}`);
  }

  removeFire(nodeId: number): void {
    this.fireZones.delete(nodeId);
    this.blockedNodes.delete(nodeId);
    console.log(`[LocalFireManager] Removed fire at node ${nodeId}, remaining: ${this.fireZones.size}`);
  }

  clearAll(): number {
    const count = this.fireZones.size;
    this.fireZones.clear();
    this.blockedNodes.clear();
    console.log(`[LocalFireManager] Cleared ${count} fires`);
    return count;
  }

  isNodeBlocked(nodeId: string | number): boolean {
    return this.blockedNodes.has(nodeId);
  }

  getBlockedNodes(): Set<string | number> {
    return new Set(this.blockedNodes);
  }

  getFireZones(): FireZoneInput[] {
    return Array.from(this.fireZones.values());
  }
}

// Singleton instance for local fire management
export const localFireManager = new LocalFireZoneManager();

/**
 * Store for imported routing graph - set when building is imported
 */
let importedRoutingGraph: LocalRoutingGraph | null = null;

/**
 * Set the imported routing graph for client-side routing
 */
export function setImportedRoutingGraph(routing: LocalRoutingGraph | null): void {
  importedRoutingGraph = routing;
  console.log('[LocalRouter] Routing graph set:', routing ? `${routing.nodes.length} nodes, ${routing.edges.length} edges` : 'null');
}

/**
 * Get the imported routing graph
 */
export function getImportedRoutingGraph(): LocalRoutingGraph | null {
  return importedRoutingGraph;
}

/**
 * Check if we're using imported data (has local routing graph)
 */
export function isUsingImportedRouting(): boolean {
  return importedRoutingGraph !== null && importedRoutingGraph.nodes.length > 0;
}

/**
 * Dijkstra's algorithm for finding shortest path
 */
function dijkstra(
  graph: LocalRoutingGraph,
  startId: string | number,
  endId: string | number,
  blockedNodes: Set<string | number>
): { path: (string | number)[]; cost: number } | null {
  // Build adjacency list
  const adjacency = new Map<string | number, Array<{ target: string | number; cost: number }>>();

  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of graph.edges) {
    // Skip edges to/from blocked nodes (fire zones)
    if (blockedNodes.has(edge.source) || blockedNodes.has(edge.target)) {
      continue;
    }

    // Add forward edge
    const sourceAdj = adjacency.get(edge.source);
    if (sourceAdj) {
      sourceAdj.push({ target: edge.target, cost: edge.cost });
    }

    // Add reverse edge if cost is positive
    if (edge.reverse_cost > 0) {
      const targetAdj = adjacency.get(edge.target);
      if (targetAdj) {
        targetAdj.push({ target: edge.source, cost: edge.reverse_cost });
      }
    }
  }

  // Priority queue implementation using sorted array
  const distances = new Map<string | number, number>();
  const previous = new Map<string | number, string | number | null>();
  const visited = new Set<string | number>();

  // Initialize
  for (const node of graph.nodes) {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
  }
  distances.set(startId, 0);

  // Check if start node is blocked
  if (blockedNodes.has(startId)) {
    console.log('[Dijkstra] Start node is blocked by fire');
    return null;
  }

  const queue: Array<{ id: string | number; dist: number }> = [{ id: startId, dist: 0 }];

  while (queue.length > 0) {
    // Sort by distance and get minimum
    queue.sort((a, b) => a.dist - b.dist);
    const current = queue.shift()!;

    if (visited.has(current.id)) continue;
    visited.add(current.id);

    if (current.id === endId) {
      // Found path - reconstruct it
      const path: (string | number)[] = [];
      let node: string | number | null = endId;

      while (node !== null) {
        path.unshift(node);
        node = previous.get(node) ?? null;
      }

      return { path, cost: distances.get(endId) ?? Infinity };
    }

    // Explore neighbors
    const neighbors = adjacency.get(current.id) || [];
    for (const { target, cost } of neighbors) {
      if (visited.has(target)) continue;

      const newDist = current.dist + cost;
      const oldDist = distances.get(target) ?? Infinity;

      if (newDist < oldDist) {
        distances.set(target, newDist);
        previous.set(target, current.id);
        queue.push({ id: target, dist: newDist });
      }
    }
  }

  // No path found
  return null;
}

/**
 * Build route geometry from path nodes
 */
function buildRouteGeometry(
  path: (string | number)[],
  nodes: LocalRoutingNode[]
): GeoJSON.Feature<GeoJSON.LineString> {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const coordinates: [number, number][] = path.map(nodeId => {
    const node = nodeMap.get(nodeId);
    if (!node) {
      console.warn(`[LocalRouter] Node ${nodeId} not found in graph`);
      return [0, 0] as [number, number];
    }
    return [node.lng, node.lat];
  });

  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates,
    },
    properties: {
      route_type: 'computed',
      source: 'local',
    },
  };
}

/**
 * Compute route using local routing graph (for imported buildings)
 */
export function computeLocalRoute(
  startNodeId: string | number,
  endNodeId: string | number
): RouteComputationResult {
  if (!importedRoutingGraph) {
    return { success: false, error: 'No routing graph available' };
  }

  console.log(`[LocalRouter] Computing route from ${startNodeId} to ${endNodeId}`);
  console.log(`[LocalRouter] Graph has ${importedRoutingGraph.nodes.length} nodes, ${importedRoutingGraph.edges.length} edges`);
  console.log(`[LocalRouter] Blocked nodes: ${localFireManager.getBlockedNodes().size}`);

  // Check if start node is in a fire zone
  if (localFireManager.isNodeBlocked(startNodeId)) {
    const nodeInfo = importedRoutingGraph.nodes.find(n => n.id === startNodeId);
    return {
      success: false,
      isolated: true,
      isolationData: {
        isolated: true,
        message: 'Your location is in a fire zone. Seek shelter immediately.',
        shelterInstructions: [
          'Stay low to avoid smoke inhalation',
          'Seal door gaps with wet cloth',
          'Signal for help from window',
          'Call emergency services',
        ],
        roomName: nodeInfo?.name || 'Unknown Location',
      },
    };
  }

  // Run Dijkstra
  const result = dijkstra(
    importedRoutingGraph,
    startNodeId,
    endNodeId,
    localFireManager.getBlockedNodes()
  );

  if (!result) {
    // Check if it's because of fire blocking the path
    const blockedNodes = localFireManager.getBlockedNodes();
    if (blockedNodes.size > 0) {
      const nodeInfo = importedRoutingGraph.nodes.find(n => n.id === startNodeId);
      return {
        success: false,
        isolated: true,
        isolationData: {
          isolated: true,
          message: 'All evacuation routes are blocked by fire. Shelter in place.',
          shelterInstructions: [
            'Move to a room with a window',
            'Close the door and seal gaps',
            'Signal your location to rescuers',
            'Stay low to avoid smoke',
          ],
          roomName: nodeInfo?.name || 'Current Location',
        },
      };
    }
    return { success: false, error: 'No route found between selected locations' };
  }

  console.log(`[LocalRouter] Found path with ${result.path.length} nodes, cost: ${result.cost.toFixed(2)}`);

  // Build route geometry
  const routeFeature = buildRouteGeometry(result.path, importedRoutingGraph.nodes);

  return {
    success: true,
    route: routeFeature,
  };
}

/**
 * Place fires locally (for imported buildings)
 */
export function placeLocalFires(
  fireZones: FireZoneInput[],
  severity: 'HIGH' | 'CRITICAL' = 'HIGH'
): { success: boolean; hazardIds: number[] } {
  console.log(`[LocalRouter] Placing ${fireZones.length} local fire(s)`);

  const hazardIds: number[] = [];

  for (const zone of fireZones) {
    localFireManager.addFire(zone);
    hazardIds.push(zone.nodeId);
  }

  return { success: true, hazardIds };
}

/**
 * Clear all local fires (for imported buildings)
 */
export function clearLocalFires(): { success: boolean; deletedCount: number } {
  const deletedCount = localFireManager.clearAll();
  return { success: true, deletedCount };
}

/**
 * Imported building data structure from Map Editor
 */
export interface ImportedBuildingData {
  buildingId: string;
  building?: {
    name: string;
    center: { lat: number; lng: number };
    scale_pixels_per_meter: number;
    levels: string[];
    generated_at: string;
  };
  geojson: GeoJSON.FeatureCollection;
  routing?: {
    nodes: Array<{
      id: string | number;
      name: string;
      type: string;
      level: string;
      lat: number;
      lng: number;
      is_exit?: boolean;
    }>;
    edges: Array<{
      id: number;
      source: string | number;
      target: string | number;
      cost: number;
      reverse_cost: number;
      opening_type?: string;
    }>;
  };
  safePoints?: Array<{
    id: string;
    name: string;
    level: string;
    capacity: number;
    coordinates: { lat: number; lng: number };
  }>;
  metadata: {
    uploadedAt: string;
    roomCount: number;
    openingCount: number;
    safePointCount: number;
    routingNodes?: number;
    routingEdges?: number;
  };
}

/**
 * Check if imported building data is available
 */
export async function checkImportedBuilding(): Promise<boolean> {
  try {
    const response = await fetch('/api/building/upload', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const result = await response.json();
      return result.success && result.data != null;
    }
    return false;
  } catch (error) {
    console.log('[MapAPI] No imported building data available');
    return false;
  }
}

/**
 * Load imported building data from Map Editor upload API
 */
export async function loadImportedBuilding(): Promise<ImportedBuildingData | null> {
  console.log('[MapAPI] Checking for imported building data...');

  try {
    const response = await fetch('/api/building/upload', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.log('[MapAPI] No imported building data available');
      return null;
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      console.log('[MapAPI] Imported building data not found');
      return null;
    }

    console.log('[MapAPI] Loaded imported building data:', {
      buildingId: result.data.buildingId,
      roomCount: result.data.metadata?.roomCount,
      openingCount: result.data.metadata?.openingCount,
    });

    return result.data as ImportedBuildingData;
  } catch (error) {
    console.error('[MapAPI] Failed to load imported building:', error);
    return null;
  }
}

/**
 * Convert imported building data to the format expected by EvacuationMap
 */
export function convertImportedToMapData(imported: ImportedBuildingData) {
  const geojson = imported.geojson;

  // Extract rooms (Polygons)
  const roomFeatures = geojson.features?.filter((f: any) =>
    f.geometry?.type === 'Polygon'
  ) || [];

  // Extract openings/doors (LineStrings with opening type)
  const openingFeatures = geojson.features?.filter((f: any) =>
    f.geometry?.type === 'LineString' &&
    (f.properties?.type === 'opening' || f.properties?.opening_type)
  ) || [];

  // Extract safe points (Points)
  const safePointFeatures = geojson.features?.filter((f: any) =>
    f.geometry?.type === 'Point' &&
    (f.properties?.type === 'safe_point' || f.properties?.is_safe_point)
  ) || [];

  // Helper to normalize level values (Map Editor uses '1' for ground floor, EvacuationMap uses '0')
  const normalizeLevel = (level: string | undefined): string => {
    // Convert Map Editor levels to EvacuationMap levels
    // Map Editor: '1' = ground floor, '2' = second floor, etc.
    // EvacuationMap: '0' = ground floor, '1' = second floor, etc.
    if (!level) return '0';
    const numLevel = parseInt(level, 10);
    if (isNaN(numLevel)) return '0';
    return String(numLevel - 1);
  };

  // Create rooms GeoJSON (normalized for map display)
  const rooms: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: roomFeatures.map((f: any, idx: number) => ({
      type: 'Feature',
      id: f.properties?.id || idx,
      geometry: f.geometry,
      properties: {
        ...f.properties,
        id: f.properties?.id || idx,
        name: f.properties?.name || `Room ${idx + 1}`,
        room_type: f.properties?.room_type || 'common',
        color: f.properties?.color || '#999999',
        level: normalizeLevel(f.properties?.level),
        area_sqm: f.properties?.area_sqm,
      },
    })),
  };

  // Create building features (openings/doors)
  const features: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: openingFeatures.map((f: any, idx: number) => ({
      type: 'Feature',
      id: f.properties?.id || `opening-${idx}`,
      geometry: f.geometry,
      properties: {
        ...f.properties,
        id: f.properties?.id || `opening-${idx}`,
        type: 'opening',
        opening_type: f.properties?.opening_type || 'door',
        level: normalizeLevel(f.properties?.level),
      },
    })),
  };

  // Create navigation nodes from routing data or room centroids
  let nodes: GeoJSON.FeatureCollection;

  if (imported.routing?.nodes && imported.routing.nodes.length > 0) {
    // Use routing nodes from Map Editor
    nodes = {
      type: 'FeatureCollection',
      features: imported.routing.nodes.map((n, idx) => ({
        type: 'Feature' as const,
        id: n.id,
        geometry: {
          type: 'Point' as const,
          coordinates: [n.lng, n.lat],
        },
        properties: {
          id: n.id,
          name: n.name,
          type: n.type,
          level: normalizeLevel(n.level),
          is_exit: n.is_exit || false,
        },
      })),
    };
  } else {
    // Generate nodes from room centroids
    nodes = {
      type: 'FeatureCollection',
      features: roomFeatures.map((f: any, idx: number) => {
        const centroid = getFeatureCentroid(f);
        return {
          type: 'Feature' as const,
          id: f.properties?.id || idx,
          geometry: {
            type: 'Point' as const,
            coordinates: centroid || [0, 0],
          },
          properties: {
            id: f.properties?.id || idx,
            name: f.properties?.name || `Node ${idx + 1}`,
            type: 'room',
            level: normalizeLevel(f.properties?.level),
          },
        };
      }),
    };
  }

  // Add safe points to nodes
  if (safePointFeatures.length > 0 || imported.safePoints?.length) {
    const safeNodes = safePointFeatures.map((f: any, idx: number) => ({
      type: 'Feature' as const,
      id: f.properties?.id || `safe-${idx}`,
      geometry: f.geometry,
      properties: {
        id: f.properties?.id || `safe-${idx}`,
        name: f.properties?.name || `Safe Point ${idx + 1}`,
        type: 'safe_point',
        is_exit: true,
        level: normalizeLevel(f.properties?.level),
        capacity: f.properties?.capacity,
      },
    }));

    // Also add safe points from the safePoints array if available
    if (imported.safePoints?.length) {
      imported.safePoints.forEach((sp, idx) => {
        safeNodes.push({
          type: 'Feature' as const,
          id: sp.id || `safe-arr-${idx}`,
          geometry: {
            type: 'Point' as const,
            coordinates: [sp.coordinates.lng, sp.coordinates.lat],
          },
          properties: {
            id: sp.id || `safe-arr-${idx}`,
            name: sp.name || `Safe Point ${idx + 1}`,
            type: 'safe_point',
            is_exit: true,
            level: normalizeLevel(sp.level),
            capacity: sp.capacity,
          },
        });
      });
    }

    nodes.features.push(...safeNodes);
  }

  // Create details GeoJSON (empty for now, can be enhanced later)
  const details: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };

  // Get building center for map view
  let buildingCenter: [number, number] | null = null;

  if (imported.building?.center) {
    buildingCenter = [imported.building.center.lng, imported.building.center.lat] as [number, number];
    console.log('[convertImportedToMapData] Using building center from metadata:', buildingCenter);
  } else {
    const bounds = calculateBounds(rooms);
    if (bounds) {
      buildingCenter = [
        (bounds[0][0] + bounds[1][0]) / 2,
        (bounds[0][1] + bounds[1][1]) / 2,
      ] as [number, number];
      console.log('[convertImportedToMapData] Calculated building center from bounds:', buildingCenter);
    }
  }

  // Set up local routing graph for client-side route computation
  if (imported.routing?.nodes && imported.routing.nodes.length > 0) {
    const localRoutingNodes: LocalRoutingNode[] = imported.routing.nodes.map(n => ({
      id: n.id,
      name: n.name,
      type: n.type,
      level: normalizeLevel(n.level),
      lat: n.lat,
      lng: n.lng,
      is_exit: n.is_exit,
    }));

    const localRoutingEdges: LocalRoutingEdge[] = (imported.routing.edges || []).map((e, idx) => ({
      id: e.id || idx,
      source: e.source,
      target: e.target,
      cost: e.cost,
      reverse_cost: e.reverse_cost,
      opening_type: e.opening_type,
    }));

    setImportedRoutingGraph({ nodes: localRoutingNodes, edges: localRoutingEdges });
    console.log('[convertImportedToMapData] Set up local routing graph:', {
      nodes: localRoutingNodes.length,
      edges: localRoutingEdges.length,
    });
  } else {
    // No routing data - generate simple routing from room centroids
    console.log('[convertImportedToMapData] No routing data provided, using room centroids');
    const centroidNodes: LocalRoutingNode[] = roomFeatures.map((f: any, idx: number) => {
      const centroid = getFeatureCentroid(f);
      return {
        id: f.properties?.id || idx,
        name: f.properties?.name || `Room ${idx + 1}`,
        type: 'room',
        level: normalizeLevel(f.properties?.level),
        lat: centroid ? centroid[1] : 0,
        lng: centroid ? centroid[0] : 0,
      };
    });

    // Create edges connecting all rooms (fully connected graph for basic routing)
    const edges: LocalRoutingEdge[] = [];
    let edgeId = 0;
    for (let i = 0; i < centroidNodes.length; i++) {
      for (let j = i + 1; j < centroidNodes.length; j++) {
        const dx = centroidNodes[i].lng - centroidNodes[j].lng;
        const dy = centroidNodes[i].lat - centroidNodes[j].lat;
        const cost = Math.sqrt(dx * dx + dy * dy) * 111000; // Approximate meters
        edges.push({
          id: edgeId++,
          source: centroidNodes[i].id,
          target: centroidNodes[j].id,
          cost,
          reverse_cost: cost,
        });
      }
    }

    setImportedRoutingGraph({ nodes: centroidNodes, edges });
    console.log('[convertImportedToMapData] Generated routing graph from centroids:', {
      nodes: centroidNodes.length,
      edges: edges.length,
    });
  }

  // Clear any existing local fires when loading new building
  clearLocalFires();

  console.log('[convertImportedToMapData] Final data:', {
    roomCount: rooms.features.length,
    nodeCount: nodes.features.length,
    buildingCenter,
    sampleRoomCoords: rooms.features[0]?.geometry,
  });

  return {
    rooms: normalizeGeoJSON(rooms),
    features: normalizeGeoJSON(features),
    details: normalizeGeoJSON(details),
    nodes: normalizeGeoJSON(nodes),
    sensors: null as GeoJSON.FeatureCollection | null,
    occupancy: null,
    roomNodes: null,
    buildingInfo: imported.building,
    buildingCenter,
    routing: imported.routing,
    isImported: true,
  };
}
