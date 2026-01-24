// Sample Floor Plan Data for Demo/Testing
// This provides a basic building layout when no backend data is available

export interface SampleBuildingData {
  building: {
    name: string;
    address: string;
    type: string;
  };
  rooms: GeoJSON.FeatureCollection;
  routing: {
    nodes: Array<{
      id: string;
      lng: number;
      lat: number;
      level: string;
      type: string;
      name: string;
      is_exit?: boolean;
    }>;
    edges: Array<{
      from: string;
      to: string;
      weight: number;
    }>;
  };
  safePoints: Array<{
    id: string;
    coordinates: { lng: number; lat: number };
    level: string;
    name: string;
    capacity: number;
  }>;
}

// Sample coordinates (approximately centered for indoor display)
const CENTER_LNG = 67.1128;
const CENTER_LAT = 24.8621;

// Helper to create room polygon coordinates
const createRoomCoords = (offsetX: number, offsetY: number, width: number, height: number): number[][] => {
  const scale = 0.0001; // Small scale for indoor coordinates
  const x = CENTER_LNG + offsetX * scale;
  const y = CENTER_LAT + offsetY * scale;
  const w = width * scale;
  const h = height * scale;

  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
    [x, y], // Close the polygon
  ];
};

export const sampleFloorPlanData: SampleBuildingData = {
  building: {
    name: "Sample Building",
    address: "123 Demo Street",
    type: "residential",
  },
  rooms: {
    type: "FeatureCollection",
    features: [
      // Living Room
      {
        type: "Feature",
        id: "room-1",
        geometry: {
          type: "Polygon",
          coordinates: [createRoomCoords(0, 0, 40, 30)],
        },
        properties: {
          id: "room-1",
          name: "Living Room",
          room_type: "living",
          level: "1",
          color: "#66BB6A",
          area_sqm: 35,
        },
      },
      // Kitchen
      {
        type: "Feature",
        id: "room-2",
        geometry: {
          type: "Polygon",
          coordinates: [createRoomCoords(40, 0, 25, 20)],
        },
        properties: {
          id: "room-2",
          name: "Kitchen",
          room_type: "kitchen",
          level: "1",
          color: "#FF9800",
          area_sqm: 15,
        },
      },
      // Bedroom 1
      {
        type: "Feature",
        id: "room-3",
        geometry: {
          type: "Polygon",
          coordinates: [createRoomCoords(0, 30, 25, 25)],
        },
        properties: {
          id: "room-3",
          name: "Bedroom 1",
          room_type: "bedroom",
          level: "1",
          color: "#5C6BC0",
          area_sqm: 20,
        },
      },
      // Bedroom 2
      {
        type: "Feature",
        id: "room-4",
        geometry: {
          type: "Polygon",
          coordinates: [createRoomCoords(25, 30, 25, 25)],
        },
        properties: {
          id: "room-4",
          name: "Bedroom 2",
          room_type: "bedroom",
          level: "1",
          color: "#5C6BC0",
          area_sqm: 20,
        },
      },
      // Bathroom
      {
        type: "Feature",
        id: "room-5",
        geometry: {
          type: "Polygon",
          coordinates: [createRoomCoords(50, 30, 15, 15)],
        },
        properties: {
          id: "room-5",
          name: "Bathroom",
          room_type: "bathroom",
          level: "1",
          color: "#4FC3F7",
          area_sqm: 8,
        },
      },
      // Corridor
      {
        type: "Feature",
        id: "room-6",
        geometry: {
          type: "Polygon",
          coordinates: [createRoomCoords(40, 20, 25, 10)],
        },
        properties: {
          id: "room-6",
          name: "Corridor",
          room_type: "corridor",
          level: "1",
          color: "#E8F5E9",
          area_sqm: 10,
        },
      },
      // Front Door (opening)
      {
        type: "Feature",
        id: "door-1",
        geometry: {
          type: "LineString",
          coordinates: [
            [CENTER_LNG, CENTER_LAT + 0.001],
            [CENTER_LNG + 0.0008, CENTER_LAT + 0.001],
          ],
        },
        properties: {
          id: "door-1",
          type: "opening",
          opening_type: "door",
          level: "1",
          name: "Front Door",
          connects: ["room-1", "exterior"],
          is_emergency_exit: true,
        },
      },
      // Back Door (opening)
      {
        type: "Feature",
        id: "door-2",
        geometry: {
          type: "LineString",
          coordinates: [
            [CENTER_LNG + 0.0065, CENTER_LAT + 0.002],
            [CENTER_LNG + 0.0065, CENTER_LAT + 0.0028],
          ],
        },
        properties: {
          id: "door-2",
          type: "opening",
          opening_type: "door",
          level: "1",
          name: "Back Door",
          connects: ["room-2", "exterior"],
          is_emergency_exit: true,
        },
      },
      // Safe Point (Assembly Area)
      {
        type: "Feature",
        id: "safe-1",
        geometry: {
          type: "Point",
          coordinates: [CENTER_LNG - 0.002, CENTER_LAT + 0.001],
        },
        properties: {
          id: "safe-1",
          type: "safe_point",
          is_safe_point: true,
          level: "1",
          name: "Assembly Point A",
          capacity: 50,
        },
      },
    ],
  },
  routing: {
    nodes: [
      { id: "n1", lng: 67.1148, lat: 24.8636, level: "1", type: "room", name: "Living Room Node" },
      { id: "n2", lng: 67.1178, lat: 24.8631, level: "1", type: "room", name: "Kitchen Node" },
      { id: "n3", lng: 67.1138, lat: 24.8661, level: "1", type: "room", name: "Bedroom 1 Node" },
      { id: "n4", lng: 67.1168, lat: 24.8661, level: "1", type: "room", name: "Bedroom 2 Node" },
      { id: "n5", lng: 67.1188, lat: 24.8661, level: "1", type: "room", name: "Bathroom Node" },
      { id: "n6", lng: 67.1178, lat: 24.8646, level: "1", type: "corridor", name: "Corridor Node" },
      { id: "exit1", lng: 67.1128, lat: 24.8631, level: "1", type: "exit", name: "Front Exit", is_exit: true },
      { id: "exit2", lng: 67.1193, lat: 24.8641, level: "1", type: "exit", name: "Back Exit", is_exit: true },
    ],
    edges: [
      { from: "n1", to: "n6", weight: 1 },
      { from: "n2", to: "n6", weight: 1 },
      { from: "n3", to: "n6", weight: 1.5 },
      { from: "n4", to: "n6", weight: 1.5 },
      { from: "n5", to: "n6", weight: 1 },
      { from: "n1", to: "exit1", weight: 1 },
      { from: "n6", to: "exit2", weight: 1 },
    ],
  },
  safePoints: [
    {
      id: "safe-1",
      coordinates: { lng: 67.1108, lat: 24.8631 },
      level: "1",
      name: "Assembly Point A",
      capacity: 50,
    },
  ],
};

/**
 * Upload sample floor plan data to the building upload API
 */
export async function uploadSampleFloorPlan(buildingName?: string): Promise<boolean> {
  try {
    const dataToUpload = {
      ...sampleFloorPlanData,
      building: {
        ...sampleFloorPlanData.building,
        name: buildingName || sampleFloorPlanData.building.name,
      },
    };

    const response = await fetch('/api/building/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToUpload),
    });

    if (!response.ok) {
      console.error('[SampleFloorPlan] Failed to upload:', response.statusText);
      return false;
    }

    const result = await response.json();
    console.log('[SampleFloorPlan] Uploaded successfully:', result);
    return result.success;
  } catch (error) {
    console.error('[SampleFloorPlan] Error uploading:', error);
    return false;
  }
}

/**
 * Check if building data is already available
 */
export async function hasBuildingData(): Promise<boolean> {
  try {
    const response = await fetch('/api/building/upload', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.success && result.data != null;
  } catch {
    return false;
  }
}
