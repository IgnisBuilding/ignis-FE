// Central API configuration for NestJS backend (ignis-be)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  latitude?: number;
  longitude?: number;
  lastReading?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SensorStats {
  total: number;
  active: number;
  alert: number;
  inactive: number;
}

export interface Resident {
  id: number;
  name: string;
  email: string;
  phone?: string;
  apartmentId?: number;
  type: string;
  isActive: boolean;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResidentStats {
  total: number;
  residents: number;
  owners: number;
  tenants: number;
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

export interface BuildingStats {
  total: number;
  floors: number;
  apartments: number;
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
      console.error('API Request failed:', error);
      throw error;
    }
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
  
  async getSensors(): Promise<Sensor[]> {
    return this.request<Sensor[]>('/sensors', {
      method: 'GET',
    });
  }

  async getSensorStats(): Promise<SensorStats> {
    return this.request<SensorStats>('/sensors/stats', {
      method: 'GET',
    });
  }

  async getSensorById(id: number): Promise<Sensor> {
    return this.request<Sensor>(`/sensors/${id}`, {
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

  async updateSensorReading(id: number, value: number): Promise<Sensor> {
    return this.request<Sensor>(`/sensors/${id}/reading`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    });
  }

  // ==================== RESIDENT ENDPOINTS ====================
  
  async getResidents(): Promise<Resident[]> {
    return this.request<Resident[]>('/residents', {
      method: 'GET',
    });
  }

  async getResidentStats(): Promise<ResidentStats> {
    return this.request<ResidentStats>('/residents/stats', {
      method: 'GET',
    });
  }

  async getResidentById(id: number): Promise<Resident> {
    return this.request<Resident>(`/residents/${id}`, {
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
  
  getBuildings = async (): Promise<Building[]> => {
    return this.request<Building[]>('/buildings', {
      method: 'GET',
    });
  }

  getBuildingStats = async (): Promise<BuildingStats> => {
    return this.request<BuildingStats>('/buildings/stats', {
      method: 'GET',
    });
  }

  getBuildingById = async (id: number): Promise<Building> => {
    return this.request<Building>(`/buildings/${id}`, {
      method: 'GET',
    });
  }

  getBuildingFloors = async (id: number): Promise<any[]> => {
    return this.request<any[]>(`/buildings/${id}/floors`, {
      method: 'GET',
    });
  }

  getBuildingApartments = async (id: number): Promise<any[]> => {
    return this.request<any[]>(`/buildings/${id}/apartments`, {
      method: 'GET',
    });
  }

  createBuilding = async (data: { name: string; address: string; type?: string }): Promise<Building> => {
    return this.request<Building>('/buildings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateBuilding = async (id: number, data: { name?: string; address?: string; type?: string }): Promise<Building> => {
    return this.request<Building>(`/buildings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  deleteBuilding = async (id: number): Promise<void> => {
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

  async getRecentAlerts(): Promise<any[]> {
    return this.request<any[]>('/dashboard/recent-alerts', {
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

  async getApartmentById(id: number): Promise<any> {
    return this.request(`/apartments/${id}`, {
      method: 'GET',
    });
  }

  // ==================== ALERT ENDPOINTS ====================

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

  async getAlertsByBuilding(buildingId: number): Promise<any[]> {
    return this.request<any[]>(`/alerts/building/${buildingId}`, {
      method: 'GET',
    });
  }

  async getAlertsByApartment(apartmentId: number): Promise<any[]> {
    return this.request<any[]>(`/alerts/apartment/${apartmentId}`, {
      method: 'GET',
    });
  }

  async createAlert(data: any): Promise<any> {
    return this.request('/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAlert(id: number, data: any): Promise<any> {
    return this.request(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async resolveAlert(id: number): Promise<any> {
    return this.request(`/alerts/${id}/resolve`, {
      method: 'PATCH',
    });
  }

  // ==================== HAZARD ENDPOINTS ====================
  
  async getHazards(): Promise<any[]> {
    return this.request<any[]>('/hazards', {
      method: 'GET',
    });
  }

  async getActiveHazards(): Promise<any[]> {
    return this.request<any[]>('/hazards/active', {
      method: 'GET',
    });
  }

  async getHazardById(id: number): Promise<any> {
    return this.request(`/hazards/${id}`, {
      method: 'GET',
    });
  }

  async createHazard(data: any): Promise<any> {
    return this.request('/hazards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async respondToHazard(id: number): Promise<any> {
    return this.request(`/hazards/${id}/respond`, {
      method: 'PATCH',
    });
  }

  async resolveHazard(id: number): Promise<any> {
    return this.request(`/hazards/${id}/resolve`, {
      method: 'PATCH',
    });
  }

  // ==================== SAFETY EQUIPMENT ENDPOINTS ====================
  
  async getSafetyEquipment(): Promise<any[]> {
    return this.request<any[]>('/safety-equipment', {
      method: 'GET',
    });
  }

  async getSafetyEquipmentByApartment(apartmentId: number): Promise<any[]> {
    return this.request<any[]>(`/safety-equipment/apartment/${apartmentId}`, {
      method: 'GET',
    });
  }

  async getSafetyEquipmentByBuilding(buildingId: number): Promise<any[]> {
    return this.request<any[]>(`/safety-equipment/building/${buildingId}`, {
      method: 'GET',
    });
  }

  async getDueSafetyEquipment(): Promise<any[]> {
    return this.request<any[]>('/safety-equipment/due', {
      method: 'GET',
    });
  }
}

const apiInstance = new ApiService();

// Export api as default
export const api = apiInstance;

// Explicit exports for building operations to fix Turbopack bundling issues
export const buildingApi = {
  getBuildings: async () => {
    return apiInstance.getBuildings();
  },
  createBuilding: async (data: { name: string; address: string; type?: string }) => {
    return apiInstance.createBuilding(data);
  },
  updateBuilding: async (id: number, data: { name?: string; address?: string; type?: string }) => {
    return apiInstance.updateBuilding(id, data);
  },
  deleteBuilding: async (id: number) => {
    return apiInstance.deleteBuilding(id);
  },
  getBuildingById: async (id: number) => {
    return apiInstance.getBuildingById(id);
  },
  getBuildingStats: async () => {
    return apiInstance.getBuildingStats();
  },
};
