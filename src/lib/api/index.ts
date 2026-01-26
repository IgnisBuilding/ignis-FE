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
  created_at: string;
  updated_at: string;
}

export interface Floor {
  id: number;
  name: string;
  level: number;
  building_id: number;
  created_at: string;
  updated_at: string;
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

  async createBuilding(data: { name: string; address: string; type?: string }): Promise<Building> {
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

  async getBuildingRooms(buildingId: number | string): Promise<any> {
    return this.request<any>(`/buildings/${buildingId}/rooms`, {
      method: 'GET',
    });
  }
}

// Export singleton instance
export const api = new ApiService();

// Export buildingApi for backwards compatibility
export const buildingApi = {
  getBuildings: () => api.getBuildings(),
  getBuildingById: (id: number) => api.getBuildingById(id),
  getBuildingStats: () => api.getBuildingStats(),
  createBuilding: (data: { name: string; address: string; type?: string }) => api.createBuilding(data),
  updateBuilding: (id: number, data: { name?: string; address?: string; type?: string }) => api.updateBuilding(id, data),
  deleteBuilding: (id: number) => api.deleteBuilding(id),
};
