'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface JurisdictionBuilding {
  id: number;
  name: string;
  address: string;
  type: string;
  total_floors: number;
  apartments_per_floor: number;
  has_floor_plan: boolean;
  floor_plan_updated_at: string | null;
  center_lat: number | null;
  center_lng: number | null;
  society_name?: string;
  brigade_name?: string;
  state_name?: string;
  created_at: string;
}

export interface JurisdictionInfo {
  level: string;
  name: string;
  id: number;
}

export interface UseJurisdictionResult {
  buildings: JurisdictionBuilding[];
  buildingIds: number[];
  jurisdiction: JurisdictionInfo | null;
  count: number;
  loading: boolean;
  error: string | null;
}

export function useJurisdiction(): UseJurisdictionResult {
  const { user } = useAuth();
  const [buildings, setBuildings] = useState<JurisdictionBuilding[]>([]);
  const [jurisdiction, setJurisdiction] = useState<JurisdictionInfo | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchJurisdiction() {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('ignis_token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/buildings/by-jurisdiction/${user!.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch jurisdiction data: ${response.statusText}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setBuildings(data.buildings || []);
          setJurisdiction(data.jurisdiction || null);
          setCount(data.count || 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch jurisdiction');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchJurisdiction();
    return () => { cancelled = true; };
  }, [user?.id]);

  const buildingIds = buildings.map(b => b.id);

  return { buildings, buildingIds, jurisdiction, count, loading, error };
}
