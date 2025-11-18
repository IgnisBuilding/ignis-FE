'use server';

import { api } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export interface Society {
  id: string;
  name: string;
  address: string;
  totalBuildings: number;
  totalResidents: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export async function getSocieties() {
  try {
    const response = await api.get<Society[]>('/api/societies');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch societies:', error);
    return [];
  }
}

export async function getSocietyById(id: string) {
  try {
    const response = await api.get<Society>(`/api/societies/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch society:', error);
    return null;
  }
}

export async function createSociety(data: Partial<Society>) {
  try {
    const response = await api.post<Society>('/api/societies', data);
    revalidatePath('/societyManagement');
    revalidatePath('/ignis');
    return response;
  } catch (error) {
    console.error('Failed to create society:', error);
    throw error;
  }
}

export async function updateSociety(id: string, data: Partial<Society>) {
  try {
    const response = await api.put<Society>(`/api/societies/${id}`, data);
    revalidatePath('/societyManagement');
    revalidatePath('/ignis');
    revalidatePath(`/ignis/${id}`);
    return response;
  } catch (error) {
    console.error('Failed to update society:', error);
    throw error;
  }
}

export async function deleteSociety(id: string) {
  try {
    await api.delete(`/api/societies/${id}`);
    revalidatePath('/societyManagement');
    revalidatePath('/ignis');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete society:', error);
    throw error;
  }
}
