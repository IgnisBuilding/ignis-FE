// Central API configuration for NestJS backend (ignis-be)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

// Type definitions
export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface Sensor {
  id: number;
  name: string;
  type: string;
  value?: number;
  unit?: string;
  status: string;
  roomId?: number;
  room?: { id: number; name: string };
  latitude?: number;
  longitude?: number;
  lastReading?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resident {
  id: number;
  name: string;
  email: string;
  phone?: string;
  apartmentId?: number;
  apartment?: { id: number; unit_number: string };
  type: string;
  isActive: boolean;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Building {
  id: number;
  name: string;
  type: string;
  address: string;
  geometry?: string;
  society_id: number;
  total_floors?: number;
  apartments_per_floor?: number;
  has_floor_plan?: boolean;
  floor_plan_updated_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuildingWithStatus {
  id: number;
  name: string;
  address: string;
  type: string;
  total_floors: number;
  apartments_per_floor: number;
  has_floor_plan: boolean;
  floor_plan_updated_at: string | null;
  created_at: string;
}

export interface BuildingFull {
  id: number;
  name: string;
  address: string;
  type: string;
  total_floors: number;
  apartments_per_floor: number;
  has_floor_plan: boolean;
  floor_plan_updated_at: string | null;
  scale_pixels_per_meter: number | null;
  center_lat: number | null;
  center_lng: number | null;
  floors: Array<{
    id: number;
    name: string;
    level: number;
    apartments: Array<{
      id: number;
      unit_number: string;
      occupied: boolean;
    }>;
  }>;
}

export interface Floor {
  id: number;
  name: string;
  level: number;
  building_id: number;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: number;
  name: string;
  type: string;
  floor_id: number;
  apartment_id?: number;
  floor?: Floor;
}

export interface FloorPlanImportResult {
  success: boolean;
  imported?: {
    floors: number;
    rooms: number;
    nodes: number;
    edges: number;
    exits: number;
    cameras: number;
  };
  warnings?: string[];
  error?: string;
  message?: string;
}

export interface Camera {
  id: number;
  name: string;
  rtsp_url: string;
  camera_id: string;
  building_id: number;
  floor_id?: number;
  room_id?: number;
  status: string;
  location_description?: string;
  is_fire_detection_enabled: boolean;
  building?: Building;
  floor?: Floor;
  room?: Room;
  created_at: string;
  updated_at: string;
}

export interface CameraStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  fireDetectionEnabled: number;
}

export interface FireDetectionStats {
  total: number;
  alertsTriggered: number;
  detectionsToday: number;
  alertRate: string;
}

export interface FireAlertConfig {
  id: number;
  building_id: number;
  min_confidence: number;
  consecutive_detections: number;
  cooldown_seconds: number;
  auto_create_hazard: boolean;
  auto_notify_firefighters: boolean;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('ignis_token');
    }
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ignis_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ignis_token');
      localStorage.removeItem('ignis_user');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // Only log non-network errors (network errors are expected when backend is offline)
      if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message.includes('NetworkError'))) {
        // Silent fail for network errors - backend is likely offline
      } else {
        console.error('API Request failed:', error);
      }
      throw error;
    }
  }

  // ==================== GENERIC HTTP METHODS ====================

  async get<T>(endpoint: string, cache?: RequestCache): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint, {
      method: 'GET',
      cache: cache,
    });
    return { data };
  }

  async post<T>(endpoint: string, body?: unknown): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  }

  async put<T>(endpoint: string, body?: unknown): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  }

  async delete<T>(endpoint: string): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint, {
      method: 'DELETE',
    });
    return { data };
  }

  // ==================== AUTH ENDPOINTS ====================

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.access_token) {
      this.setToken(response.access_token);
    }

    return response;
  }

  async register(data: RegisterDto): Promise<any> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile(): Promise<any> {
    return this.request('/auth/profile', {
      method: 'GET',
    });
  }

  // ==================== SENSOR ENDPOINTS ====================

  async getSensors(): Promise<any[]> {
    return this.request<any[]>('/sensors', {
      method: 'GET',
    });
  }

  async getSensorStats(): Promise<any> {
    return this.request<any>('/sensors/stats', {
      method: 'GET',
    });
  }

  async createSensor(data: Partial<Sensor>): Promise<Sensor> {
    return this.request<Sensor>('/sensors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSensor(id: number, data: Partial<Sensor>): Promise<Sensor> {
    return this.request<Sensor>(`/sensors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSensor(id: number): Promise<void> {
    return this.request<void>(`/sensors/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== RESIDENT ENDPOINTS ====================

  async getResidents(): Promise<any[]> {
    return this.request<any[]>('/residents', {
      method: 'GET',
    });
  }

  async getResidentStats(): Promise<any> {
    return this.request<any>('/residents/stats', {
      method: 'GET',
    });
  }

  async createResident(data: Partial<Resident>): Promise<Resident> {
    return this.request<Resident>('/residents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateResident(id: number, data: Partial<Resident>): Promise<Resident> {
    return this.request<Resident>(`/residents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteResident(id: number): Promise<void> {
    return this.request<void>(`/residents/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== BUILDING ENDPOINTS ====================

  async getBuildings(): Promise<Building[]> {
    return this.request<Building[]>('/buildings', {
      method: 'GET',
    });
  }

  async getBuildingStats(): Promise<any> {
    return this.request<any>('/buildings/stats', {
      method: 'GET',
    });
  }

  async getBuildingById(id: number): Promise<Building> {
    return this.request<Building>(`/buildings/${id}`, {
      method: 'GET',
    });
  }

  async getBuildingFloors(buildingId: number): Promise<Floor[]> {
    return this.request<Floor[]>(`/buildings/${buildingId}/floors`, {
      method: 'GET',
    });
  }

  async getBuildingsWithStatus(): Promise<BuildingWithStatus[]> {
    return this.request<BuildingWithStatus[]>('/buildings/with-status', {
      method: 'GET',
    });
  }

  async getBuildingFull(id: number): Promise<BuildingFull> {
    return this.request<BuildingFull>(`/buildings/${id}/full`, {
      method: 'GET',
    });
  }

  async createBuilding(data: {
    name: string;
    address: string;
    type?: string;
    total_floors?: number;
    apartments_per_floor?: number;
  }): Promise<Building> {
    return this.request<Building>('/buildings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBuilding(id: number, data: { name?: string; address?: string; type?: string }): Promise<Building> {
    return this.request<Building>(`/buildings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteBuilding(id: number): Promise<void> {
    return this.request<void>(`/buildings/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== DASHBOARD ENDPOINTS ====================

  async getDashboardStats(): Promise<any> {
    return this.request('/dashboard/stats', {
      method: 'GET',
    });
  }

  // ==================== APARTMENT ENDPOINTS ====================

  async getApartments(): Promise<any[]> {
    return this.request<any[]>('/apartments', {
      method: 'GET',
    });
  }

  async getMyApartment(): Promise<any> {
    return this.request('/apartments/my-apartment', {
      method: 'GET',
    });
  }

  // ==================== ALERT ENDPOINTS ====================

  async getAlerts(): Promise<any[]> {
    return this.request<any[]>('/alerts', {
      method: 'GET',
    });
  }

  async getActiveAlerts(): Promise<any[]> {
    return this.request<any[]>('/alerts/active', {
      method: 'GET',
    });
  }

  async getMyAlerts(): Promise<any[]> {
    return this.request<any[]>('/alerts/my-alerts', {
      method: 'GET',
    });
  }

  // ==================== HAZARD ENDPOINTS ====================

  async getHazards(): Promise<any[]> {
    return this.request<any[]>('/hazards', {
      method: 'GET',
    });
  }

  async respondToHazard(id: number, data: { status: string; notes?: string }): Promise<any> {
    return this.request<any>(`/hazards/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resolveHazard(id: number, data: { resolution: string; notes?: string }): Promise<any> {
    return this.request<any>(`/hazards/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== FLOOR PLAN / BUILDING DATA ENDPOINTS ====================

  async getBuildingFloorPlan(buildingId: number | string): Promise<any> {
    return this.request<any>(`/buildings/${buildingId}/floor-plan`, {
      method: 'GET',
    });
  }

  async getBuildingRooms(buildingId: number | string): Promise<Room[]> {
    return this.request<Room[]>(`/buildings/${buildingId}/rooms`, {
      method: 'GET',
    });
  }

  async getFloorRooms(floorId: number): Promise<Room[]> {
    return this.request<Room[]>(`/floors/${floorId}/rooms`, {
      method: 'GET',
    });
  }

  async importFloorPlan(buildingId: number, geojson: any): Promise<FloorPlanImportResult> {
    return this.request<FloorPlanImportResult>(`/buildings/${buildingId}/import-floor-plan`, {
      method: 'POST',
      body: JSON.stringify(geojson),
    });
  }

  // ==================== CAMERA ENDPOINTS ====================

  async getCameras(filters?: { building_id?: number; floor_id?: number; room_id?: number; status?: string }): Promise<Camera[]> {
    const params = new URLSearchParams();
    if (filters?.building_id) params.append('building_id', filters.building_id.toString());
    if (filters?.floor_id) params.append('floor_id', filters.floor_id.toString());
    if (filters?.room_id) params.append('room_id', filters.room_id.toString());
    if (filters?.status) params.append('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Camera[]>(`/cameras${query}`, {
      method: 'GET',
    });
  }

  async getCameraStats(): Promise<CameraStats> {
    return this.request<CameraStats>('/cameras/stats', {
      method: 'GET',
    });
  }

  async getCameraById(id: number): Promise<Camera> {
    return this.request<Camera>(`/cameras/${id}`, {
      method: 'GET',
    });
  }

  async getCameraByCode(cameraCode: string): Promise<Camera> {
    return this.request<Camera>(`/cameras/by-code/${cameraCode}`, {
      method: 'GET',
    });
  }

  async getCamerasByBuilding(buildingId: number): Promise<Camera[]> {
    return this.request<Camera[]>(`/cameras/building/${buildingId}`, {
      method: 'GET',
    });
  }

  async createCamera(data: Partial<Camera>): Promise<Camera> {
    return this.request<Camera>('/cameras', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCamera(id: number, data: Partial<Camera>): Promise<Camera> {
    return this.request<Camera>(`/cameras/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateCameraStatus(id: number, status: string): Promise<Camera> {
    return this.request<Camera>(`/cameras/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteCamera(id: number): Promise<void> {
    return this.request<void>(`/cameras/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== FIRE DETECTION ENDPOINTS ====================

  async getFireDetectionStats(buildingId?: number): Promise<FireDetectionStats> {
    const query = buildingId ? `?building_id=${buildingId}` : '';
    return this.request<FireDetectionStats>(`/fire-detection/stats${query}`, {
      method: 'GET',
    });
  }

  async getFireDetectionLogs(cameraId: number, limit?: number): Promise<any[]> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<any[]>(`/fire-detection/logs/camera/${cameraId}${query}`, {
      method: 'GET',
    });
  }

  async getFireAlertConfig(buildingId: number): Promise<FireAlertConfig> {
    return this.request<FireAlertConfig>(`/fire-detection/config/${buildingId}`, {
      method: 'GET',
    });
  }

  async updateFireAlertConfig(buildingId: number, data: Partial<FireAlertConfig>): Promise<FireAlertConfig> {
    return this.request<FireAlertConfig>(`/fire-detection/config/${buildingId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const api = new ApiService();

// Export buildingApi for backwards compatibility
export const buildingApi = {
  getBuildings: () => api.getBuildings(),
  getBuildingsWithStatus: () => api.getBuildingsWithStatus(),
  getBuildingById: (id: number) => api.getBuildingById(id),
  getBuildingFull: (id: number) => api.getBuildingFull(id),
  getBuildingStats: () => api.getBuildingStats(),
  createBuilding: (data: { name: string; address: string; type?: string; total_floors?: number; apartments_per_floor?: number }) => api.createBuilding(data),
  updateBuilding: (id: number, data: { name?: string; address?: string; type?: string }) => api.updateBuilding(id, data),
  deleteBuilding: (id: number) => api.deleteBuilding(id),
};
