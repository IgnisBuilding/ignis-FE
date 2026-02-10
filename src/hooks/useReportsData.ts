'use client';

import { useState, useEffect } from 'react';
import { api, Hazard } from '@/lib/api';

export interface ReportRow {
  id: number;
  incident: string;
  date: string;
  responseTime: string;
  severity: string;
  status: string;
}

export interface ReportsStats {
  totalIncidents: number;
  avgResponseTime: string;
  resolutionRate: string;
  activeHazards: number;
}

export interface SeverityCount {
  label: string;
  count: number;
  color: string;
}

export interface ResponseTimeEntry {
  id: number;
  incident: string;
  seconds: number;
  formatted: string;
}

export function useReportsData(buildingIds?: number[]) {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getHazards();
        if (!cancelled) {
          // Filter by jurisdiction building IDs if provided
          if (buildingIds && buildingIds.length > 0) {
            const filtered = data.filter(h => {
              const bid = h.apartment?.floor?.building?.id || h.floor?.building?.id || null;
              return bid !== null && buildingIds.includes(bid);
            });
            setHazards(filtered);
          } else {
            setHazards(data);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch reports data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [buildingIds?.join(',')]);

  // Compute stats
  const stats: ReportsStats = (() => {
    const total = hazards.length;

    // Avg response time: average of (responded_at - created_at) for hazards that have responded_at
    const respondedHazards = hazards.filter(h => h.responded_at);
    let avgResponseTime = 'N/A';
    if (respondedHazards.length > 0) {
      const totalSeconds = respondedHazards.reduce((sum, h) => {
        const created = new Date(h.created_at).getTime();
        const responded = new Date(h.responded_at!).getTime();
        return sum + Math.max(0, (responded - created) / 1000);
      }, 0);
      const avgSeconds = totalSeconds / respondedHazards.length;
      const mins = Math.floor(avgSeconds / 60);
      const secs = Math.round(avgSeconds % 60);
      avgResponseTime = `${mins}m ${secs}s`;
    }

    // Resolution rate
    const resolvedCount = hazards.filter(h => h.status === 'resolved').length;
    const resolutionRate = total > 0 ? `${((resolvedCount / total) * 100).toFixed(1)}%` : '0%';

    // Active hazards
    const activeStatuses = ['active', 'responded', 'pending', 'responding'];
    const activeHazards = hazards.filter(h => activeStatuses.includes(h.status)).length;

    return { totalIncidents: total, avgResponseTime, resolutionRate, activeHazards };
  })();

  // Transform to table rows
  const reports: ReportRow[] = hazards.map(h => {
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    let responseTime = 'Pending';
    if (h.responded_at) {
      const created = new Date(h.created_at).getTime();
      const responded = new Date(h.responded_at).getTime();
      const diffSeconds = Math.max(0, (responded - created) / 1000);
      const mins = Math.floor(diffSeconds / 60);
      const secs = Math.round(diffSeconds % 60);
      responseTime = `${mins}m ${secs}s`;
    }

    const date = new Date(h.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return {
      id: h.id,
      incident: `${capitalize(h.type)}${h.description ? ' - ' + h.description : ''}`,
      date: formattedDate,
      responseTime,
      severity: capitalize(h.severity),
      status: capitalize(h.status),
    };
  });

  // Severity distribution for chart
  const severityDistribution: SeverityCount[] = (() => {
    const counts: Record<string, number> = {};
    hazards.forEach(h => {
      const sev = h.severity.charAt(0).toUpperCase() + h.severity.slice(1);
      counts[sev] = (counts[sev] || 0) + 1;
    });
    const colorMap: Record<string, string> = {
      Critical: 'bg-red-500',
      High: 'bg-orange-500',
      Medium: 'bg-amber-500',
      Low: 'bg-blue-500',
    };
    return Object.entries(counts)
      .map(([label, count]) => ({
        label,
        count,
        color: colorMap[label] || 'bg-gray-500',
      }))
      .sort((a, b) => b.count - a.count);
  })();

  // Response time entries for chart (last 5 responded hazards)
  const responseTimeEntries: ResponseTimeEntry[] = hazards
    .filter(h => h.responded_at)
    .map(h => {
      const created = new Date(h.created_at).getTime();
      const responded = new Date(h.responded_at!).getTime();
      const seconds = Math.max(0, (responded - created) / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return {
        id: h.id,
        incident: h.type.charAt(0).toUpperCase() + h.type.slice(1),
        seconds,
        formatted: `${mins}m ${secs}s`,
      };
    })
    .slice(-5);

  return { reports, stats, loading, error, severityDistribution, responseTimeEntries };
}
