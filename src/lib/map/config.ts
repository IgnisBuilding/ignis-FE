// Map Configuration Constants

import type { MapConfig, FloorLayer } from './types';

// Default map configuration
export const DEFAULT_MAP_CONFIG: MapConfig = {
  center: [67.1128, 24.8621],
  zoom: 18,
  minZoom: 14,  // Allow zooming out to see more context
  maxZoom: 22,
  pitch: 45,    // Tilt angle for isometric-like view
  bearing: -20, // Rotation angle for better perspective
  style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  apiBase: process.env.NEXT_PUBLIC_API_URL!,
};

// Floor layer definitions
export const FLOOR_LAYERS: Record<string, FloorLayer> = {
  floor1: {
    id: 'floor1',
    layers: [
      'building-shadow',
      'floor1-fill',
      'floor1-outline',
      'stairs-pattern',
      'stairs-icons',
      'floor1-labels',
      'room-labels',
      'corridors',
      'exterior-walls',
      'windows',
      'evacuation-routes',
      'doors',
      'emergency-exits',
      'fire-equipment',
      'beds',
      'toilets',
      'bathtubs',
      'showers',
      'sinks',
      'kitchen-fixtures',
      'furniture-outlines',
      'chairs',
      'door-swings',
      'dimension-lines',
      'dimension-text',
      'exit-signs',
      'stairs-labels',
      'floor1-walls',
      'north-arrow',
    ],
  },
  floor2: {
    id: 'floor2',
    layers: ['floor2-fill', 'floor2-outline', 'floor2-labels'],
  },
};

// Layer paint properties
export const LAYER_STYLES = {
  // Building shadow - subtle for clean look
  buildingShadow: {
    'fill-color': '#9e9e9e',
    'fill-opacity': 0.15,
    'fill-translate': [8, 8],
  },

  // Floor fill - Simple white/light theme
  floorFill: {
    'fill-color': '#f5f5f5',  // Light gray/white for all rooms
    'fill-opacity': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      0.95,
      0.9,
    ],
  },

  // Floor outline - black boundaries matching EvacuationSystem
  floorOutline: {
    'line-color': [
      'case',
      ['==', ['get', 'room_type'], 'furniture'],
      '#bdbdbd',
      '#000000',  // Black for room boundaries
    ],
    'line-width': [
      'case',
      ['==', ['get', 'room_type'], 'outdoor'],
      3,
      ['==', ['get', 'room_type'], 'stairs'],
      4,
      ['==', ['get', 'room_type'], 'furniture'],
      1,
      3,  // Default 3px width
    ],
  },

  // Stairs pattern
  stairsPattern: {
    'fill-pattern': 'stairs-pattern',
    'fill-opacity': 0.3,
  },

  // Corridors - light gray to match white theme
  corridors: {
    'fill-color': '#eeeeee',
    'fill-opacity': 0.5,
  },

  // Exterior walls
  exteriorWalls: {
    'line-color': '#000000',
    'line-width': 6,
  },

  // Windows
  windows: {
    'line-color': '#64b5f6',
    'line-width': 6,
    'line-opacity': 0.8,
  },

  // Evacuation routes (default)
  evacuationRoutes: {
    'line-color': [
      'case',
      ['==', ['get', 'route_type'], 'primary'],
      '#4caf50',
      '#ffc107',
    ],
    'line-width': 3,
    'line-dasharray': [2, 1],
    'line-opacity': 0.8,
  },

  // Emergency exits
  emergencyExits: {
    'text-color': '#d32f2f',
    'text-halo-color': '#ffffff',
    'text-halo-width': 2,
  },

  // Fire equipment
  fireEquipment: {
    'text-color': '#d32f2f',
  },

  // Highlighted route
  highlightedRoute: {
    'line-color': '#ff3d00',
    'line-width': 6,
  },
};

// Room type colors
export const ROOM_COLORS: Record<string, string> = {
  bedroom: '#7986cb',
  bathroom: '#4dd0e1',
  kitchen: '#ffb74d',
  living_room: '#81c784',
  office: '#90a4ae',
  hallway: '#e8f5e9',
  garage: '#bdbdbd',
  stairs: '#9e9e9e',
  storage: '#bcaaa4',
  laundry: '#80deea',
};

// Notification colors
export const NOTIFICATION_COLORS = {
  info: { bg: '#e3f2fd', text: '#1976d2' },
  error: { bg: '#ffebee', text: '#c62828' },
  success: { bg: '#e8f5e9', text: '#2e7d32' },
  warning: { bg: '#fff3e0', text: '#ef6c00' },
};

// API endpoints - matching EvacuationSystem backend
export const API_ENDPOINTS = {
  building: '/fireSafety/building',
  rooms: '/fireSafety/rooms',
  roomNodes: '/fireSafety/room-nodes',
  buildingFeatures: '/fireSafety/building-features',
  buildingDetails: '/fireSafety/building-details',
  nodes: '/fireSafety/nodes',
  sensors: '/fireSafety/sensors',
  occupancy: '/fireSafety/occupancy',
  compute: '/fireSafety/compute',
  placeFires: '/fireSafety/place-fires',
  clearFires: '/fireSafety/clear-fires',
  savedRoutes: '/fireSafety',
};

// Note: All data is fetched from backend API only (no static fallbacks)
