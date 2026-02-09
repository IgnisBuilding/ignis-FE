import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ===================== MOCKS =====================

const mockUseReportsData = vi.fn();
vi.mock('@/hooks/useReportsData', () => ({
  useReportsData: () => mockUseReportsData(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'FF Commander', email: 'ff@test.com', role: 'firefighter_hq' },
    dashboardRole: 'firefighter',
    roleTitle: 'HQ Commander',
  }),
}));

vi.mock('@/components/auth/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/layout/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock the Dialog components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import ReportsPage from '@/app/firefighter/reports/page';

// ===================== FIXTURES =====================

const emptyData = {
  reports: [],
  stats: { totalIncidents: 0, avgResponseTime: 'N/A', resolutionRate: '0%', activeHazards: 0 },
  loading: false,
  error: null,
  severityDistribution: [],
  responseTimeEntries: [],
};

const loadingData = { ...emptyData, loading: true };

const errorData = { ...emptyData, error: 'Server unreachable' };

const populatedData = {
  reports: [
    { id: 1, incident: 'Fire - Apartment 3A', date: 'Feb 1, 2025', responseTime: '2m 15s', severity: 'Critical', status: 'Resolved' },
    { id: 2, incident: 'Smoke - Lobby', date: 'Feb 2, 2025', responseTime: 'Pending', severity: 'Medium', status: 'Active' },
  ],
  stats: { totalIncidents: 2, avgResponseTime: '2m 15s', resolutionRate: '50.0%', activeHazards: 1 },
  loading: false,
  error: null,
  severityDistribution: [
    { label: 'Critical', count: 1, color: 'bg-red-500' },
    { label: 'Medium', count: 1, color: 'bg-amber-500' },
  ],
  responseTimeEntries: [
    { id: 1, incident: 'Fire', seconds: 135, formatted: '2m 15s' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ===================== TESTS =====================

describe('Firefighter Reports Page', () => {
  // ---------- LOADING STATE ----------
  describe('loading state', () => {
    it('should display loading spinner', () => {
      mockUseReportsData.mockReturnValue(loadingData);
      render(<ReportsPage />);

      expect(screen.getByText('Loading incidents...')).toBeInTheDocument();
    });

    it('should show "..." placeholders in stats during loading', () => {
      mockUseReportsData.mockReturnValue(loadingData);
      render(<ReportsPage />);

      const dots = screen.getAllByText('...');
      expect(dots.length).toBe(4);
    });
  });

  // ---------- ERROR STATE ----------
  describe('error state', () => {
    it('should display error message', () => {
      mockUseReportsData.mockReturnValue(errorData);
      render(<ReportsPage />);

      expect(screen.getByText('Failed to load reports: Server unreachable')).toBeInTheDocument();
    });

    it('should still render page structure alongside error', () => {
      mockUseReportsData.mockReturnValue(errorData);
      render(<ReportsPage />);

      expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      expect(screen.getByText('Incident History')).toBeInTheDocument();
    });
  });

  // ---------- EMPTY STATE ----------
  describe('empty state', () => {
    it('should display empty message when no incidents exist', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      expect(screen.getByText('No incidents recorded yet')).toBeInTheDocument();
    });

    it('should show zero-state stats', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      // "0" appears for both Total Incidents and Active Hazards
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('N/A')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should show empty chart placeholders', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      expect(screen.getByText('No response time data available')).toBeInTheDocument();
      expect(screen.getByText('No incident data available')).toBeInTheDocument();
    });
  });

  // ---------- DATA RENDERING ----------
  describe('data rendering', () => {
    it('should render all incident rows', () => {
      mockUseReportsData.mockReturnValue(populatedData);
      render(<ReportsPage />);

      expect(screen.getByText('Fire - Apartment 3A')).toBeInTheDocument();
      expect(screen.getByText('Smoke - Lobby')).toBeInTheDocument();
    });

    it('should render stat values from hook', () => {
      mockUseReportsData.mockReturnValue(populatedData);
      render(<ReportsPage />);

      expect(screen.getByText('2')).toBeInTheDocument(); // total incidents
      expect(screen.getByText('50.0%')).toBeInTheDocument(); // resolution rate
    });

    it('should render severity badges', () => {
      mockUseReportsData.mockReturnValue(populatedData);
      render(<ReportsPage />);

      // Severity text appears in both table badges and distribution chart
      const criticalElements = screen.getAllByText('Critical');
      expect(criticalElements.length).toBeGreaterThanOrEqual(1);
      const mediumElements = screen.getAllByText('Medium');
      expect(mediumElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render Pending for unresponded hazards', () => {
      mockUseReportsData.mockReturnValue(populatedData);
      render(<ReportsPage />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should render severity distribution bars', () => {
      mockUseReportsData.mockReturnValue(populatedData);
      render(<ReportsPage />);

      // Distribution chart shows counts
      const criticalElements = screen.getAllByText('Critical');
      expect(criticalElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render response time trend bars', () => {
      mockUseReportsData.mockReturnValue(populatedData);
      render(<ReportsPage />);

      expect(screen.getByText('Fire')).toBeInTheDocument();
    });
  });

  // ---------- SEARCH ----------
  describe('search', () => {
    it('should filter by search term', async () => {
      mockUseReportsData.mockReturnValue(populatedData);
      const user = userEvent.setup();
      render(<ReportsPage />);

      const input = screen.getByPlaceholderText('Search incidents...');
      await user.type(input, 'Apartment');

      expect(screen.getByText('Fire - Apartment 3A')).toBeInTheDocument();
      expect(screen.queryByText('Smoke - Lobby')).not.toBeInTheDocument();
    });

    it('should show "No incidents match your search" on no results', async () => {
      mockUseReportsData.mockReturnValue(populatedData);
      const user = userEvent.setup();
      render(<ReportsPage />);

      const input = screen.getByPlaceholderText('Search incidents...');
      await user.type(input, 'xyznonexistent');

      expect(screen.getByText('No incidents match your search')).toBeInTheDocument();
    });
  });

  // ---------- TABLE STRUCTURE ----------
  describe('table structure', () => {
    it('should render table headers including Status column', () => {
      mockUseReportsData.mockReturnValue(populatedData);
      render(<ReportsPage />);

      expect(screen.getByText('Incident')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Response')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Severity')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });

  // ---------- PAGE STRUCTURE ----------
  describe('page structure', () => {
    it('should render within DashboardLayout', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });

    it('should render page title and subtitle', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      expect(screen.getByText('Incident reports and hazard analytics')).toBeInTheDocument();
    });

    it('should render all four stat card labels', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      expect(screen.getByText('Total Incidents')).toBeInTheDocument();
      expect(screen.getByText('Avg Response')).toBeInTheDocument();
      expect(screen.getByText('Resolution Rate')).toBeInTheDocument();
      expect(screen.getByText('Active Hazards')).toBeInTheDocument();
    });

    it('should render chart section titles', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      expect(screen.getByText('Response Time Trend')).toBeInTheDocument();
      expect(screen.getByText('Incident Distribution')).toBeInTheDocument();
    });
  });
});
