// Map Configuration Constants

import type { MapConfig, FloorLayer } from './types';

// Default map configuration
export const DEFAULT_MAP_CONFIG: MapConfig = {
  center: [67.1125, 24.862],
  zoom: 19,
  minZoom: 17,
  maxZoom: 22,
  style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  apiBase: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:7000',
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
  // Building shadow
  buildingShadow: {
    'fill-color': '#2c3e50',
    'fill-opacity': 0.1,
    'fill-translate': [5, 5],
  },

  // Floor fill
  floorFill: {
    'fill-color': ['get', 'color'],
    'fill-opacity': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      0.9,
      0.8,
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

  // Corridors
  corridors: {
    'fill-color': '#e8f5e9',
    'fill-opacity': 0.3,
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
