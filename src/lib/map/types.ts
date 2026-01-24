// Map Types and Interfaces

export interface MapConfig {
  center: [number, number];
  zoom: number;
  minZoom: number;
  maxZoom: number;
  pitch?: number;    // Tilt angle for isometric view
  bearing?: number;  // Rotation angle
  style: string;
  apiBase: string;
}

export interface FloorLayer {
  id: string;
  layers: string[];
}

export interface Sensor {
  id: string;
  name?: string;
  type: string;
  location: [number, number];
  status: 'normal' | 'alert' | 'offline';
  value?: number;
  floor?: number;
}

export interface EvacuationPlan {
  id: string;
  name: string;
  exits: {
    id: string;
    name: string;
    location: [number, number];
    capacity?: number;
  }[];
  routes: {
    id: string;
    name: string;
    priority: 'primary' | 'secondary';
  }[];
}

export interface HazardData {
  id: string;
  type: 'fire' | 'blocked' | 'smoke' | 'chemical';
  geometry: GeoJSON.Geometry;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: Date;
}

export interface RouteNode {
  id: string | number;
  name?: string;
  coordinates: [number, number];
  floor?: number;
  type?: 'room' | 'corridor' | 'exit' | 'stairway';
}

export interface ComputedRoute {
  startNodeId: string | number;
  endNodeId: string | number;
  geometry: GeoJSON.Geometry;
  distance?: number;
  estimatedTime?: number;
}

export interface EmergencyState {
  isActive: boolean;
  mode: 'idle' | 'fire_detected' | 'evacuation_in_progress' | 'evacuation_complete';
  occupancy: number;
  fireMarkers: maplibregl.Marker[];
  evacuationProgress: number;
}

export interface MapCallbacks {
  onRoomClick?: (room: GeoJSON.Feature) => void;
  onHazardUpdate?: (hazard: HazardData) => void;
  onEvacuationStart?: () => void;
  onEvacuationComplete?: () => void;
  onError?: (error: Error) => void;
}

// Re-export maplibregl for type compatibility
import type maplibregl from 'maplibre-gl';
export type { maplibregl };
