import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAlerts } from '@/hooks/useAlerts';
import { useSensors } from '@/hooks/useSensors';

// Mock fetch
global.fetch = vi.fn();

describe('Custom Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAlerts', () => {
    const mockAlerts = [
      {
        alert_id: 1,
        type: 'fire',
        severity: 'high',
        location: 'Building A',
        status: 'active',
        message: 'Fire detected',
      },
    ];

    it('should fetch alerts on mount', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlerts,
      });

      const { result } = renderHook(() => useAlerts());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.alerts).toEqual(mockAlerts);
      });
    });

    it('should handle fetch error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useAlerts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should filter alerts by status', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          ...mockAlerts,
          { ...mockAlerts[0], alert_id: 2, status: 'resolved' },
        ],
      });

      const { result } = renderHook(() => useAlerts({ status: 'active' }));

      await waitFor(() => {
        expect(result.current.alerts).toHaveLength(1);
        expect(result.current.alerts[0].status).toBe('active');
      });
    });

    it('should refetch alerts', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockAlerts,
      });

      const { result } = renderHook(() => useAlerts());

      await waitFor(() => {
        expect(result.current.alerts).toEqual(mockAlerts);
      });

      // Clear mock
      (global.fetch as any).mockClear();

      // Refetch
      result.current.refetch();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('useSensors', () => {
    const mockSensors = [
      {
        sensor_id: 1,
        type: 'smoke',
        location: 'Room 101',
        status: 'active',
        building_id: 1,
      },
    ];

    it('should fetch sensors on mount', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSensors,
      });

      const { result } = renderHook(() => useSensors());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.sensors).toEqual(mockSensors);
      });
    });

    it('should handle fetch error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useSensors());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should filter sensors by building', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          ...mockSensors,
          { ...mockSensors[0], sensor_id: 2, building_id: 2 },
        ],
      });

      const { result } = renderHook(() => useSensors({ buildingId: 1 }));

      await waitFor(() => {
        expect(result.current.sensors).toHaveLength(1);
        expect(result.current.sensors[0].building_id).toBe(1);
      });
    });

    it('should filter sensors by type', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          ...mockSensors,
          { ...mockSensors[0], sensor_id: 2, type: 'heat' },
        ],
      });

      const { result } = renderHook(() => useSensors({ type: 'smoke' }));

      await waitFor(() => {
        expect(result.current.sensors).toHaveLength(1);
        expect(result.current.sensors[0].type).toBe('smoke');
      });
    });
  });
});
