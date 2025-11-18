import { User, Resident, Sensor, Building, FireLocation, OccupantLocation, FireIncident, Alert, ApartmentInfo } from '../../types';

// Mock Users for Authentication
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@ignis.com',
    role: 'building_authority',
    buildingId: 'b1'
  },
  {
    id: '2',
    name: 'John Resident',
    email: 'resident@ignis.com',
    role: 'resident',
    buildingId: 'b1',
    apartmentNumber: 'A-101'
  },
  {
    id: '3',
    name: 'Sarah Firefighter',
    email: 'firefighter@ignis.com',
    role: 'firefighter'
  }
];

// Mock Residents
export const mockResidents: Resident[] = [
  {
    id: 'r1',
    name: 'John Resident',
    email: 'john@example.com',
    phone: '+1-555-0101',
    apartmentNumber: 'A-101',
    floor: 1,
    building: 'Tower A',
    emergencyContact: '+1-555-0102',
    moveInDate: new Date('2023-01-15'),
    status: 'active'
  },
  {
    id: 'r2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1-555-0103',
    apartmentNumber: 'A-205',
    floor: 2,
    building: 'Tower A',
    emergencyContact: '+1-555-0104',
    moveInDate: new Date('2023-03-20'),
    status: 'active'
  },
  {
    id: 'r3',
    name: 'Robert Johnson',
    email: 'robert@example.com',
    phone: '+1-555-0105',
    apartmentNumber: 'B-301',
    floor: 3,
    building: 'Tower B',
    emergencyContact: '+1-555-0106',
    moveInDate: new Date('2022-11-10'),
    status: 'active'
  },
  {
    id: 'r4',
    name: 'Emily Davis',
    email: 'emily@example.com',
    phone: '+1-555-0107',
    apartmentNumber: 'A-405',
    floor: 4,
    building: 'Tower A',
    emergencyContact: '+1-555-0108',
    moveInDate: new Date('2023-06-05'),
    status: 'active'
  },
  {
    id: 'r5',
    name: 'Michael Brown',
    email: 'michael@example.com',
    phone: '+1-555-0109',
    apartmentNumber: 'B-102',
    floor: 1,
    building: 'Tower B',
    emergencyContact: '+1-555-0110',
    moveInDate: new Date('2023-02-28'),
    status: 'inactive'
  }
];

// Mock Sensors
export const mockSensors: Sensor[] = [
  {
    id: 's1',
    type: 'smoke',
    location: 'Hallway A1',
    floor: 1,
    building: 'Tower A',
    status: 'active',
    lastChecked: new Date('2024-11-05'),
    batteryLevel: 85,
    sensitivity: 'high'
  },
  {
    id: 's2',
    type: 'heat',
    location: 'Apartment A-101',
    floor: 1,
    building: 'Tower A',
    status: 'active',
    lastChecked: new Date('2024-11-06'),
    batteryLevel: 92,
    sensitivity: 'medium'
  },
  {
    id: 's3',
    type: 'co2',
    location: 'Parking Level 1',
    floor: 0,
    building: 'Tower A',
    status: 'active',
    lastChecked: new Date('2024-11-04'),
    batteryLevel: 78,
    sensitivity: 'high'
  },
  {
    id: 's4',
    type: 'sprinkler',
    location: 'Hallway A2',
    floor: 2,
    building: 'Tower A',
    status: 'active',
    lastChecked: new Date('2024-11-07'),
    sensitivity: 'medium'
  },
  {
    id: 's5',
    type: 'smoke',
    location: 'Hallway B1',
    floor: 1,
    building: 'Tower B',
    status: 'maintenance',
    lastChecked: new Date('2024-10-28'),
    batteryLevel: 45,
    sensitivity: 'high'
  },
  {
    id: 's6',
    type: 'heat',
    location: 'Apartment B-301',
    floor: 3,
    building: 'Tower B',
    status: 'active',
    lastChecked: new Date('2024-11-06'),
    batteryLevel: 88,
    sensitivity: 'high'
  }
];

// Mock Buildings
export const mockBuildings: Building[] = [
  {
    id: 'b1',
    name: 'Tower A',
    address: '123 Fire Safety Blvd, Metropolis',
    floors: 10,
    apartments: 50,
    sensors: 120,
    residents: 135,
    emergencyExits: 6,
    lastInspection: new Date('2024-09-15'),
    status: 'operational'
  },
  {
    id: 'b2',
    name: 'Tower B',
    address: '125 Fire Safety Blvd, Metropolis',
    floors: 8,
    apartments: 40,
    sensors: 95,
    residents: 108,
    emergencyExits: 5,
    lastInspection: new Date('2024-09-20'),
    status: 'operational'
  },
  {
    id: 'b3',
    name: 'Tower C',
    address: '127 Fire Safety Blvd, Metropolis',
    floors: 12,
    apartments: 60,
    sensors: 145,
    residents: 162,
    emergencyExits: 7,
    lastInspection: new Date('2024-08-30'),
    status: 'maintenance'
  }
];

// Mock Fire Locations
export const mockFireLocations: FireLocation[] = [
  {
    id: 'f1',
    floor: 3,
    room: 'A-305',
    intensity: 'high',
    timestamp: new Date(),
    coordinates: { x: 150, y: 200 }
  },
  {
    id: 'f2',
    floor: 3,
    room: 'A-307',
    intensity: 'medium',
    timestamp: new Date(Date.now() - 120000),
    coordinates: { x: 250, y: 200 }
  },
  {
    id: 'f3',
    floor: 2,
    room: 'Hallway A2',
    intensity: 'low',
    timestamp: new Date(Date.now() - 300000),
    coordinates: { x: 200, y: 150 }
  }
];

// Mock Occupant Locations
export const mockOccupantLocations: OccupantLocation[] = [
  {
    id: 'o1',
    name: 'John Resident',
    floor: 1,
    room: 'A-101',
    status: 'safe',
    coordinates: { x: 100, y: 100 }
  },
  {
    id: 'o2',
    name: 'Jane Smith',
    floor: 2,
    room: 'A-205',
    status: 'evacuating',
    coordinates: { x: 180, y: 150 }
  },
  {
    id: 'o3',
    name: 'Robert Johnson',
    floor: 3,
    room: 'B-301',
    status: 'safe',
    coordinates: { x: 120, y: 210 }
  },
  {
    id: 'o4',
    name: 'Emily Davis',
    floor: 4,
    room: 'A-405',
    status: 'safe',
    coordinates: { x: 160, y: 250 }
  },
  {
    id: 'o5',
    name: 'Senior Resident',
    floor: 3,
    room: 'A-310',
    status: 'needs_help',
    coordinates: { x: 280, y: 220 }
  },
  {
    id: 'o6',
    name: 'Family Unit',
    floor: 2,
    room: 'A-210',
    status: 'evacuating',
    coordinates: { x: 220, y: 160 }
  }
];

// Mock Fire Incidents
export const mockFireIncidents: FireIncident[] = [
  {
    id: 'i1',
    building: 'Tower A',
    address: '123 Fire Safety Blvd',
    floors: [2, 3],
    intensity: 'severe',
    startTime: new Date(Date.now() - 600000),
    occupantsAffected: 15,
    occupantsEvacuated: 12,
    status: 'active'
  },
  {
    id: 'i2',
    building: 'Tower B',
    address: '125 Fire Safety Blvd',
    floors: [1],
    intensity: 'minor',
    startTime: new Date(Date.now() - 1800000),
    occupantsAffected: 4,
    occupantsEvacuated: 4,
    status: 'contained'
  }
];

// Mock Alerts
export const mockAlerts: Alert[] = [
  {
    id: 'a1',
    type: 'fire',
    message: 'Fire detected on Floor 3 - Apartment A-305',
    timestamp: new Date(),
    priority: 'critical',
    read: false
  },
  {
    id: 'a2',
    type: 'smoke',
    message: 'Smoke detected in Hallway A2',
    timestamp: new Date(Date.now() - 300000),
    priority: 'high',
    read: false
  },
  {
    id: 'a3',
    type: 'maintenance',
    message: 'Sensor S5 requires battery replacement',
    timestamp: new Date(Date.now() - 86400000),
    priority: 'medium',
    read: true
  },
  {
    id: 'a4',
    type: 'info',
    message: 'Fire safety inspection scheduled for next week',
    timestamp: new Date(Date.now() - 172800000),
    priority: 'low',
    read: true
  },
  {
    id: 'a5',
    type: 'fire',
    message: 'Fire alarm test completed successfully',
    timestamp: new Date(Date.now() - 259200000),
    priority: 'low',
    read: true
  }
];

// Mock Apartment Info
export const mockApartmentInfo: ApartmentInfo = {
  number: 'A-101',
  floor: 1,
  building: 'Tower A',
  sensors: 4,
  lastInspection: new Date('2024-10-15'),
  safetyScore: 95
};

// Helper function to simulate authentication
export const authenticateUser = (email: string, password: string): User | null => {
  // Simple mock authentication
  const mockPasswords: Record<string, string> = {
    'admin@ignis.com': 'admin123',
    'resident@ignis.com': 'resident123',
    'firefighter@ignis.com': 'firefighter123'
  };

  if (mockPasswords[email] === password) {
    return mockUsers.find(u => u.email === email) || null;
  }
  return null;
};
