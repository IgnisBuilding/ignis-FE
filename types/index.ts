// User Types
export type UserRole = 'building_authority' | 'resident' | 'firefighter';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  buildingId?: string;
  apartmentNumber?: string;
  avatar?: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  apartmentNumber?: string;
  buildingId?: string;
}

// Resident Types
export interface Resident {
  id: string;
  name: string;
  email: string;
  phone: string;
  apartmentNumber: string;
  floor: number;
  building: string;
  emergencyContact: string;
  moveInDate: Date;
  status: 'active' | 'inactive';
}

// Sensor Types
export interface Sensor {
  id: string;
  type: 'smoke' | 'heat' | 'co2' | 'sprinkler';
  location: string;
  floor: number;
  building: string;
  status: 'active' | 'inactive' | 'maintenance';
  lastChecked: Date;
  batteryLevel?: number;
  sensitivity: 'low' | 'medium' | 'high';
}

// Building Types
export interface Building {
  id: string;
  name: string;
  address: string;
  floors: number;
  apartments: number;
  sensors: number;
  residents: number;
  emergencyExits: number;
  lastInspection: Date;
  status: 'operational' | 'maintenance' | 'emergency';
}

// Emergency Types
export interface FireLocation {
  id: string;
  floor: number;
  room: string;
  intensity: 'low' | 'medium' | 'high';
  timestamp: Date;
  coordinates: { x: number; y: number };
}

export interface OccupantLocation {
  id: string;
  name: string;
  floor: number;
  room: string;
  status: 'safe' | 'evacuating' | 'needs_help';
  coordinates: { x: number; y: number };
}

export interface FireIncident {
  id: string;
  building: string;
  address: string;
  floors: number[];
  intensity: 'minor' | 'moderate' | 'severe' | 'critical';
  startTime: Date;
  occupantsAffected: number;
  occupantsEvacuated: number;
  status: 'active' | 'contained' | 'extinguished';
}

// Alert Types
export interface Alert {
  id: string;
  type: 'fire' | 'smoke' | 'maintenance' | 'info';
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
}

// Apartment Types
export interface Apartment {
  id: number;
  number: string;
  floor: number;
  residents: number;
  building: {
    id: number;
    name: string;
    address: string;
  };
  occupied: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApartmentInfo {
  number: string;
  floor: number;
  building: string;
  sensors: number;
  lastInspection: Date;
  safetyScore: number;
}

// Legacy Types (Keep for backward compatibility)
export interface Society {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  status: 'active' | 'inactive';
}

export interface Post {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
}

export interface Bill {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue';
}

export interface RentalItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
}