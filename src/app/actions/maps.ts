'use server';

import { api } from '@/lib/api';

export interface FireLocation {
  id: string;
  buildingId: string;
  floor: number;
  coordinates: {
    x: number;
    y: number;
  };
  intensity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  status: 'active' | 'contained' | 'extinguished';
}

export interface OccupantLocation {
  id: string;
  name: string;
  apartmentNumber: string;
  floor: number;
  coordinates: {
    x: number;
    y: number;
  };
  status: 'safe' | 'evacuating' | 'at-risk';
}

export interface EvacuationRoute {
  id: string;
  buildingId: string;
  floor: number;
  path: Array<{ x: number; y: number }>;
  exitPoint: { x: number; y: number };
  isBlocked: boolean;
  estimatedTime: number;
}

export async function getFireLocations(buildingId?: string) {
  try {
    const endpoint = buildingId 
      ? `/api/fires?buildingId=${buildingId}` 
      : '/api/fires/active';
    
    const response = await api.get<FireLocation[]>(endpoint, 'no-store'); // Real-time data
    return response.data;
  } catch (error) {
    console.error('Failed to fetch fire locations:', error);
    return [];
  }
}

export async function getOccupantLocations(buildingId: string) {
  try {
    const response = await api.get<OccupantLocation[]>(
      `/api/buildings/${buildingId}/occupants`,
      'no-store' // Real-time data
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch occupant locations:', error);
    return [];
  }
}

export async function getEvacuationRoutes(buildingId: string, floor: number) {
  try {
    const response = await api.get<EvacuationRoute[]>(
      `/api/buildings/${buildingId}/evacuation-routes?floor=${floor}`,
      'no-store' // Real-time data
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch evacuation routes:', error);
    return [];
  }
}

export async function reportFire(data: {
  buildingId: string;
  floor: number;
  location: { x: number; y: number };
  description?: string;
}) {
  try {
    const response = await api.post<FireLocation>('/api/fires/report', data);
    return response;
  } catch (error) {
    console.error('Failed to report fire:', error);
    throw error;
  }
}
