import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useReportsData } from '@/hooks/useReportsData';

// Mock the api module
vi.mock('@/lib/api', () => ({
  api: {
    getHazards: vi.fn(),
  },
  Hazard: {},
}));

import { api } from '@/lib/api';

const mockedGetHazards = vi.mocked(api.getHazards);

// ===================== TEST DATA FIXTURES =====================

const createHazard = (overrides: Record<string, any> = {}) => ({
  id: 1,
  type: 'fire',
  severity: 'high',
  status: 'resolved',
  description: 'Kitchen fire',
  created_at: '2025-01-15T10:00:00.000Z',
  updated_at: '2025-01-15T10:05:00.000Z',
  responded_at: '2025-01-15T10:03:00.000Z', // 3 minutes after creation
  resolved_at: '2025-01-15T10:10:00.000Z',
  ...overrides,
});

const multipleHazards = [
  createHazard({
    id: 1,
    type: 'fire',
    severity: 'critical',
    status: 'resolved',
    description: 'Large warehouse fire',
    created_at: '2025-01-15T10:00:00.000Z',
    responded_at: '2025-01-15T10:02:00.000Z', // 2 min
    resolved_at: '2025-01-15T10:30:00.000Z',
  }),
  createHazard({
    id: 2,
    type: 'gas_leak',
    severity: 'high',
    status: 'resolved',
    description: 'Gas leak in building B',
    created_at: '2025-01-16T08:00:00.000Z',
    responded_at: '2025-01-16T08:05:00.000Z', // 5 min
    resolved_at: '2025-01-16T09:00:00.000Z',
  }),
  createHazard({
    id: 3,
    type: 'smoke',
    severity: 'medium',
    status: 'active',
    description: 'Smoke detected in corridor',
    created_at: '2025-01-17T14:00:00.000Z',
    responded_at: undefined,
    resolved_at: undefined,
  }),
  createHazard({
    id: 4,
    type: 'fire',
    severity: 'critical',
    status: 'responding',
    description: null,
    created_at: '2025-01-18T09:00:00.000Z',
    responded_at: '2025-01-18T09:04:00.000Z', // 4 min
    resolved_at: undefined,
  }),
  createHazard({
    id: 5,
    type: 'electrical',
    severity: 'high',
    status: 'pending',
    created_at: '2025-01-19T12:00:00.000Z',
    responded_at: undefined,
    resolved_at: undefined,
    description: undefined,
  }),
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ===================== TESTS =====================

describe('useReportsData', () => {
  // ---------- LOADING STATE ----------
  describe('loading state', () => {
    it('should start in loading state', () => {
      mockedGetHazards.mockReturnValue(new Promise(() => {})); // never resolves
      const { result } = renderHook(() => useReportsData());

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.reports).toEqual([]);
    });

    it('should set loading to false after data is fetched', async () => {
      mockedGetHazards.mockResolvedValue([]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  // ---------- ERROR HANDLING ----------
  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockedGetHazards.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.reports).toEqual([]);
    });

    it('should handle non-Error thrown values', async () => {
      mockedGetHazards.mockRejectedValue('some string error');
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch reports data');
    });
  });

  // ---------- EMPTY DATA ----------
  describe('empty data', () => {
    it('should handle empty hazards array', async () => {
      mockedGetHazards.mockResolvedValue([]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reports).toEqual([]);
      expect(result.current.stats.totalIncidents).toBe(0);
      expect(result.current.stats.avgResponseTime).toBe('N/A');
      expect(result.current.stats.resolutionRate).toBe('0%');
      expect(result.current.stats.activeHazards).toBe(0);
      expect(result.current.severityDistribution).toEqual([]);
      expect(result.current.responseTimeEntries).toEqual([]);
    });
  });

  // ---------- STATS COMPUTATION ----------
  describe('stats computation', () => {
    it('should compute total incidents correctly', async () => {
      mockedGetHazards.mockResolvedValue(multipleHazards);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.totalIncidents).toBe(5);
    });

    it('should compute average response time correctly', async () => {
      mockedGetHazards.mockResolvedValue(multipleHazards);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Hazards with responded_at: id1 (2min=120s), id2 (5min=300s), id4 (4min=240s)
      // Average = (120 + 300 + 240) / 3 = 220s = 3m 40s
      expect(result.current.stats.avgResponseTime).toBe('3m 40s');
    });

    it('should compute resolution rate correctly', async () => {
      mockedGetHazards.mockResolvedValue(multipleHazards);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 2 resolved out of 5 total = 40%
      expect(result.current.stats.resolutionRate).toBe('40.0%');
    });

    it('should count active hazards correctly', async () => {
      mockedGetHazards.mockResolvedValue(multipleHazards);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // active statuses: active, responded, pending, responding
      // id3 = active, id4 = responding, id5 = pending => 3
      expect(result.current.stats.activeHazards).toBe(3);
    });

    it('should show N/A for avg response when no hazards have responded_at', async () => {
      const noResponseHazards = [
        createHazard({ id: 1, status: 'active', responded_at: undefined }),
        createHazard({ id: 2, status: 'pending', responded_at: undefined }),
      ];
      mockedGetHazards.mockResolvedValue(noResponseHazards);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.avgResponseTime).toBe('N/A');
    });

    it('should compute 100% resolution rate when all are resolved', async () => {
      const allResolved = [
        createHazard({ id: 1, status: 'resolved' }),
        createHazard({ id: 2, status: 'resolved' }),
      ];
      mockedGetHazards.mockResolvedValue(allResolved);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.resolutionRate).toBe('100.0%');
    });
  });

  // ---------- REPORT ROW TRANSFORMATION ----------
  describe('report row transformation', () => {
    it('should format incident with type and description', async () => {
      mockedGetHazards.mockResolvedValue([
        createHazard({ id: 1, type: 'fire', description: 'Kitchen fire' }),
      ]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reports[0].incident).toBe('Fire - Kitchen fire');
    });

    it('should format incident with only type when no description', async () => {
      mockedGetHazards.mockResolvedValue([
        createHazard({ id: 1, type: 'gas_leak', description: undefined }),
      ]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reports[0].incident).toBe('Gas_leak');
    });

    it('should format date correctly', async () => {
      mockedGetHazards.mockResolvedValue([
        createHazard({ id: 1, created_at: '2025-06-15T10:00:00.000Z' }),
      ]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Date should be formatted like "Jun 15, 2025"
      expect(result.current.reports[0].date).toContain('2025');
      expect(result.current.reports[0].date).toContain('Jun');
      expect(result.current.reports[0].date).toContain('15');
    });

    it('should compute response time for responded hazards', async () => {
      mockedGetHazards.mockResolvedValue([
        createHazard({
          id: 1,
          created_at: '2025-01-15T10:00:00.000Z',
          responded_at: '2025-01-15T10:03:30.000Z', // 3min 30s
        }),
      ]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reports[0].responseTime).toBe('3m 30s');
    });

    it('should show "Pending" for hazards without responded_at', async () => {
      mockedGetHazards.mockResolvedValue([
        createHazard({ id: 1, responded_at: undefined }),
      ]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reports[0].responseTime).toBe('Pending');
    });

    it('should capitalize severity', async () => {
      mockedGetHazards.mockResolvedValue([
        createHazard({ id: 1, severity: 'critical' }),
      ]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reports[0].severity).toBe('Critical');
    });

    it('should capitalize status', async () => {
      mockedGetHazards.mockResolvedValue([
        createHazard({ id: 1, status: 'responding' }),
      ]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reports[0].status).toBe('Responding');
    });

    it('should preserve hazard id', async () => {
      mockedGetHazards.mockResolvedValue([createHazard({ id: 42 })]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reports[0].id).toBe(42);
    });
  });

  // ---------- SEVERITY DISTRIBUTION ----------
  describe('severity distribution', () => {
    it('should compute severity counts correctly', async () => {
      mockedGetHazards.mockResolvedValue(multipleHazards);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const dist = result.current.severityDistribution;
      // critical: 2, high: 2, medium: 1
      const criticalEntry = dist.find(d => d.label === 'Critical');
      const highEntry = dist.find(d => d.label === 'High');
      const mediumEntry = dist.find(d => d.label === 'Medium');

      expect(criticalEntry?.count).toBe(2);
      expect(highEntry?.count).toBe(2);
      expect(mediumEntry?.count).toBe(1);
    });

    it('should sort distribution by count descending', async () => {
      mockedGetHazards.mockResolvedValue(multipleHazards);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const dist = result.current.severityDistribution;
      for (let i = 0; i < dist.length - 1; i++) {
        expect(dist[i].count).toBeGreaterThanOrEqual(dist[i + 1].count);
      }
    });

    it('should assign correct colors to severity levels', async () => {
      mockedGetHazards.mockResolvedValue([
        createHazard({ id: 1, severity: 'critical' }),
        createHazard({ id: 2, severity: 'high' }),
        createHazard({ id: 3, severity: 'medium' }),
        createHazard({ id: 4, severity: 'low' }),
      ]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const dist = result.current.severityDistribution;
      expect(dist.find(d => d.label === 'Critical')?.color).toBe('bg-red-500');
      expect(dist.find(d => d.label === 'High')?.color).toBe('bg-orange-500');
      expect(dist.find(d => d.label === 'Medium')?.color).toBe('bg-amber-500');
      expect(dist.find(d => d.label === 'Low')?.color).toBe('bg-blue-500');
    });

    it('should use gray for unknown severity levels', async () => {
      mockedGetHazards.mockResolvedValue([
        createHazard({ id: 1, severity: 'extreme' }),
      ]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const dist = result.current.severityDistribution;
      expect(dist[0].color).toBe('bg-gray-500');
    });
  });

  // ---------- RESPONSE TIME ENTRIES ----------
  describe('response time entries', () => {
    it('should only include hazards with responded_at', async () => {
      mockedGetHazards.mockResolvedValue(multipleHazards);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // id1, id2, id4 have responded_at
      expect(result.current.responseTimeEntries).toHaveLength(3);
    });

    it('should limit to last 5 entries', async () => {
      const manyResponded = Array.from({ length: 8 }, (_, i) =>
        createHazard({
          id: i + 1,
          created_at: `2025-01-${String(10 + i).padStart(2, '0')}T10:00:00.000Z`,
          responded_at: `2025-01-${String(10 + i).padStart(2, '0')}T10:03:00.000Z`,
        })
      );
      mockedGetHazards.mockResolvedValue(manyResponded);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.responseTimeEntries).toHaveLength(5);
    });

    it('should compute seconds and formatted time correctly', async () => {
      mockedGetHazards.mockResolvedValue([
        createHazard({
          id: 1,
          created_at: '2025-01-15T10:00:00.000Z',
          responded_at: '2025-01-15T10:07:30.000Z', // 7min 30s
        }),
      ]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.responseTimeEntries[0].seconds).toBe(450);
      expect(result.current.responseTimeEntries[0].formatted).toBe('7m 30s');
    });

    it('should capitalize the incident type in entries', async () => {
      mockedGetHazards.mockResolvedValue([
        createHazard({ id: 1, type: 'fire' }),
      ]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.responseTimeEntries[0].incident).toBe('Fire');
    });
  });

  // ---------- EDGE CASES ----------
  describe('edge cases', () => {
    it('should handle hazard with zero response time', async () => {
      mockedGetHazards.mockResolvedValue([
        createHazard({
          id: 1,
          created_at: '2025-01-15T10:00:00.000Z',
          responded_at: '2025-01-15T10:00:00.000Z', // instant response
        }),
      ]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reports[0].responseTime).toBe('0m 0s');
      expect(result.current.stats.avgResponseTime).toBe('0m 0s');
    });

    it('should handle responded_at before created_at (clock skew)', async () => {
      mockedGetHazards.mockResolvedValue([
        createHazard({
          id: 1,
          created_at: '2025-01-15T10:05:00.000Z',
          responded_at: '2025-01-15T10:00:00.000Z', // before created!
        }),
      ]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should clamp to 0 (Math.max(0, ...))
      expect(result.current.reports[0].responseTime).toBe('0m 0s');
      expect(result.current.responseTimeEntries[0].seconds).toBe(0);
    });

    it('should handle single hazard data', async () => {
      mockedGetHazards.mockResolvedValue([createHazard({ id: 1 })]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reports).toHaveLength(1);
      expect(result.current.stats.totalIncidents).toBe(1);
    });

    it('should handle very large response times (hours)', async () => {
      mockedGetHazards.mockResolvedValue([
        createHazard({
          id: 1,
          created_at: '2025-01-15T10:00:00.000Z',
          responded_at: '2025-01-15T12:30:00.000Z', // 2h 30min = 150min
        }),
      ]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reports[0].responseTime).toBe('150m 0s');
    });

    it('should handle hazard with empty string description', async () => {
      mockedGetHazards.mockResolvedValue([
        createHazard({ id: 1, type: 'fire', description: '' }),
      ]);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Empty string is falsy, so it should be just the type
      expect(result.current.reports[0].incident).toBe('Fire');
    });

    it('should not count resolved hazards as active', async () => {
      const allResolved = [
        createHazard({ id: 1, status: 'resolved' }),
        createHazard({ id: 2, status: 'resolved' }),
      ];
      mockedGetHazards.mockResolvedValue(allResolved);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.activeHazards).toBe(0);
    });

    it('should handle all active status variants', async () => {
      const activeVariants = [
        createHazard({ id: 1, status: 'active' }),
        createHazard({ id: 2, status: 'responded' }),
        createHazard({ id: 3, status: 'pending' }),
        createHazard({ id: 4, status: 'responding' }),
      ];
      mockedGetHazards.mockResolvedValue(activeVariants);
      const { result } = renderHook(() => useReportsData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.activeHazards).toBe(4);
    });
  });

  // ---------- CLEANUP ----------
  describe('cleanup', () => {
    it('should not update state after unmount', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockedGetHazards.mockReturnValue(promise as Promise<any[]>);

      const { unmount } = renderHook(() => useReportsData());
      unmount();

      // Resolve after unmount - should not throw
      resolvePromise!([createHazard()]);

      // No assertion needed - just verifying no errors are thrown
    });
  });
});
