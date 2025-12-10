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
 * Load all map data sources from backend API
 */
export async function loadMapData() {
  const [rooms, features, details, nodes, sensors, occupancy] = await Promise.all([
    fetchFromAPI<GeoJSON.FeatureCollection>(API_ENDPOINTS.rooms),
    fetchFromAPI<GeoJSON.FeatureCollection>(API_ENDPOINTS.buildingFeatures),
    fetchFromAPI<GeoJSON.FeatureCollection>(API_ENDPOINTS.buildingDetails),
    fetchFromAPI<GeoJSON.FeatureCollection>(API_ENDPOINTS.nodes),
    fetchFromAPI<GeoJSON.FeatureCollection>(API_ENDPOINTS.sensors),
    fetchFromAPI<any>(API_ENDPOINTS.occupancy),
  ]);

  return {
    rooms,
    features,
    details,
    nodes,
    sensors,
    occupancy,
  };
}

/**
 * Normalize GeoJSON data - ensure proper structure
 */
export function normalizeGeoJSON(data: any): GeoJSON.FeatureCollection {
  if (!data) {
    return { type: 'FeatureCollection', features: [] };
  }

  if (data.type === 'FeatureCollection') {
    return {
      ...data,
      features: data.features.map((f: any, idx: number) => ({
        ...f,
        id: f.id ?? f.properties?.id ?? idx,
      })),
    };
  }

  if (data.type === 'Feature') {
    return {
      type: 'FeatureCollection',
      features: [{ ...data, id: data.id ?? data.properties?.id ?? 0 }],
    };
  }

  if (Array.isArray(data)) {
    return {
      type: 'FeatureCollection',
      features: data.map((f: any, idx: number) => ({
        type: 'Feature',
        id: f.id ?? idx,
        geometry: f.geometry || f,
        properties: f.properties || {},
      })),
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
 * Compute evacuation route via API
 */
export async function computeRoute(
  startNodeId: string | number,
  endNodeId: string | number
): Promise<GeoJSON.Feature | null> {
  const fullUrl = `${DEFAULT_MAP_CONFIG.apiBase}${API_ENDPOINTS.compute}`;
  console.log(`[MapAPI] Computing route from ${startNodeId} to ${endNodeId} via ${fullUrl}`);

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startNodeId, endNodeId }),
    });

    if (!response.ok) {
      throw new Error(`Route computation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[MapAPI] Route computation success:`, data);
    return extractFeatureFromResponse(data);
  } catch (error) {
    console.error(`[MapAPI] Failed to compute route via ${fullUrl}:`, error);
    return null;
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
