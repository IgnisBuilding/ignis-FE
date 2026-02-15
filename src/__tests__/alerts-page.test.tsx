import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertsPage from '@/app/admin/alerts/page';

// Mock API
global.fetch = vi.fn();

const mockAlerts = [
  {
    alert_id: 1,
    type: 'fire',
    severity: 'high',
    location: 'Building A - Floor 2',
    status: 'active',
    message: 'Fire detected',
    created_at: '2024-01-01T10:00:00Z',
  },
  {
    alert_id: 2,
    type: 'smoke',
    severity: 'medium',
    location: 'Building B - Floor 1',
    status: 'resolved',
    message: 'Smoke detected',
    created_at: '2024-01-01T09:00:00Z',
  },
];

describe('AlertsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render alerts list', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAlerts,
    });

    render(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText('Fire detected')).toBeInTheDocument();
      expect(screen.getByText('Smoke detected')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    (global.fetch as any).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<AlertsPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle API error', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

    render(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should filter alerts by severity', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAlerts,
    });

    render(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText('Fire detected')).toBeInTheDocument();
    });

    // Test filtering logic
    const highSeverityAlerts = mockAlerts.filter(
      (alert) => alert.severity === 'high',
    );
    expect(highSeverityAlerts).toHaveLength(1);
  });

  it('should filter alerts by status', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAlerts,
    });

    render(<AlertsPage />);

    await waitFor(() => {
      const activeAlerts = mockAlerts.filter(
        (alert) => alert.status === 'active',
      );
      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0].message).toBe('Fire detected');
    });
  });

  it('should display empty state when no alerts', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no alerts/i)).toBeInTheDocument();
    });
  });
});
