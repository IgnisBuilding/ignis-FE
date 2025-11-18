'use server';

import { api } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export interface Resident {
  id: string;
  name: string;
  email: string;
  phone: string;
  apartmentNumber: string;
  buildingId: string;
  status: 'active' | 'inactive';
  moveInDate: string;
}

export async function getResidents(buildingId?: string) {
  try {
    const endpoint = buildingId 
      ? `/api/residents?buildingId=${buildingId}` 
      : '/api/residents';
    
    const response = await api.get<Resident[]>(endpoint);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch residents:', error);
    return [];
  }
}

export async function getResidentById(id: string) {
  try {
    const response = await api.get<Resident>(`/api/residents/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch resident:', error);
    return null;
  }
}

export async function createResident(data: Partial<Resident>) {
  try {
    const response = await api.post<Resident>('/api/residents', data);
    revalidatePath('/admin/residents');
    revalidatePath('/resident');
    return response;
  } catch (error) {
    console.error('Failed to create resident:', error);
    throw error;
  }
}

export async function updateResident(id: string, data: Partial<Resident>) {
  try {
    const response = await api.put<Resident>(`/api/residents/${id}`, data);
    revalidatePath('/admin/residents');
    revalidatePath('/resident');
    return response;
  } catch (error) {
    console.error('Failed to update resident:', error);
    throw error;
  }
}

export async function deleteResident(id: string) {
  try {
    await api.delete(`/api/residents/${id}`);
    revalidatePath('/admin/residents');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete resident:', error);
    throw error;
  }
}
