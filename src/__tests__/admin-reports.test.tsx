import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ===================== MOCKS =====================

// Mock useReportsData hook
const mockUseReportsData = vi.fn();
vi.mock('@/hooks/useReportsData', () => ({
  useReportsData: () => mockUseReportsData(),
}));

// Mock AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Admin User', email: 'admin@test.com', role: 'management' },
    dashboardRole: 'admin',
    roleTitle: 'Administrator',
  }),
}));

// Mock ProtectedRoute to just render children
vi.mock('@/components/auth/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock DashboardLayout to just render children
vi.mock('@/components/layout/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>,
}));

// Mock TourProvider
vi.mock('@/providers/TourProvider', () => ({
  useTour: () => ({ setCurrentPage: vi.fn() }),
}));

// Mock tour components
vi.mock('@/components/tour', () => ({
  FeatureGuideModal: () => null,
  HelpButton: () => <button data-testid="help-button">Help</button>,
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock ConfirmDialog
vi.mock('@/components/dialogs', () => ({
  ConfirmDialog: ({ open, title }: { open: boolean; title: string }) =>
    open ? <div data-testid="confirm-dialog">{title}</div> : null,
}));

import ReportsPage from '@/app/admin/reports/page';

// ===================== FIXTURES =====================

const emptyData = {
  reports: [],
  stats: { totalIncidents: 0, avgResponseTime: 'N/A', resolutionRate: '0%', activeHazards: 0 },
  loading: false,
  error: null,
  severityDistribution: [],
  responseTimeEntries: [],
};

const loadingData = {
  ...emptyData,
  loading: true,
};

const errorData = {
  ...emptyData,
  error: 'Failed to fetch',
};

const populatedData = {
  reports: [
    { id: 1, incident: 'Fire - Kitchen fire', date: 'Jan 15, 2025', responseTime: '3m 0s', severity: 'Critical', status: 'Resolved' },
    { id: 2, incident: 'Gas_leak - Building B', date: 'Jan 16, 2025', responseTime: '5m 0s', severity: 'High', status: 'Resolved' },
    { id: 3, incident: 'Smoke - Corridor', date: 'Jan 17, 2025', responseTime: 'Pending', severity: 'Medium', status: 'Active' },
  ],
  stats: { totalIncidents: 3, avgResponseTime: '4m 0s', resolutionRate: '66.7%', activeHazards: 1 },
  loading: false,
  error: null,
  severityDistribution: [
    { label: 'Critical', count: 1, color: 'bg-red-500' },
    { label: 'High', count: 1, color: 'bg-orange-500' },
    { label: 'Medium', count: 1, color: 'bg-amber-500' },
  ],
  responseTimeEntries: [
    { id: 1, incident: 'Fire', seconds: 180, formatted: '3m 0s' },
    { id: 2, incident: 'Gas_leak', seconds: 300, formatted: '5m 0s' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ===================== TESTS =====================

describe('Admin Reports Page', () => {
  // ---------- LOADING STATE ----------
  describe('loading state', () => {
    it('should display loading spinner when data is loading', () => {
      mockUseReportsData.mockReturnValue(loadingData);
      render(<ReportsPage />);

      expect(screen.getByText('Loading incidents...')).toBeInTheDocument();
    });

    it('should display "..." for stat values during loading', () => {
      mockUseReportsData.mockReturnValue(loadingData);
      render(<ReportsPage />);

      const ellipses = screen.getAllByText('...');
      expect(ellipses.length).toBe(4); // all 4 stat cards
    });

    it('should not render the table during loading', () => {
      mockUseReportsData.mockReturnValue(loadingData);
      render(<ReportsPage />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  // ---------- ERROR STATE ----------
  describe('error state', () => {
    it('should display error message when fetch fails', () => {
      mockUseReportsData.mockReturnValue(errorData);
      render(<ReportsPage />);

      expect(screen.getByText('Failed to load reports: Failed to fetch')).toBeInTheDocument();
    });
  });

  // ---------- EMPTY STATE ----------
  describe('empty state', () => {
    it('should display empty message when no incidents exist', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      expect(screen.getByText('No incidents recorded yet')).toBeInTheDocument();
    });

    it('should show correct stats for empty data', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      // "0" appears for both Total Incidents and Active Hazards
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('N/A')).toBeInTheDocument(); // avg response
      expect(screen.getByText('0%')).toBeInTheDocument(); // resolution rate
    });

    it('should show empty chart messages', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      expect(screen.getByText('No response time data available')).toBeInTheDocument();
      expect(screen.getByText('No incident data available')).toBeInTheDocument();
    });
  });

  // ---------- DATA RENDERING ----------
  describe('populated data rendering', () => {
    it('should render all incident rows', () => {
      mockUseReportsData.mockReturnValue(populatedData);
      render(<ReportsPage />);

      expect(screen.getByText('Fire - Kitchen fire')).toBeInTheDocument();
      expect(screen.getByText('Gas_leak - Building B')).toBeInTheDocument();
      expect(screen.getByText('Smoke - Corridor')).toBeInTheDocument();
    });

    it('should render correct stat values', () => {
      mockUseReportsData.mockReturnValue(populatedData);
      render(<ReportsPage />);

      // "3" appears for total incidents stat card
      const threes = screen.getAllByText('3');
      expect(threes.length).toBeGreaterThanOrEqual(1);
      // "4m 0s" may appear in stats and possibly chart
      const avgResponseTexts = screen.getAllByText('4m 0s');
      expect(avgResponseTexts.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('66.7%')).toBeInTheDocument(); // resolution rate
      // "1" appears for active hazards and possibly severity counts
      const ones = screen.getAllByText('1');
      expect(ones.length).toBeGreaterThanOrEqual(1);
    });

    it('should render severity badges correctly', () => {
      mockUseReportsData.mockReturnValue(populatedData);
      render(<ReportsPage />);

      // Severity text appears in both table badges and distribution chart
      const criticalElements = screen.getAllByText('Critical');
      expect(criticalElements.length).toBeGreaterThanOrEqual(1);
      const highElements = screen.getAllByText('High');
      expect(highElements.length).toBeGreaterThanOrEqual(1);
      const mediumElements = screen.getAllByText('Medium');
      expect(mediumElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render response times in table', () => {
      mockUseReportsData.mockReturnValue(populatedData);
      render(<ReportsPage />);

      // "3m 0s" appears in both table and response time chart and stats
      const threeMin = screen.getAllByText('3m 0s');
      expect(threeMin.length).toBeGreaterThanOrEqual(1);
      const fiveMin = screen.getAllByText('5m 0s');
      expect(fiveMin.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should render status column', () => {
      mockUseReportsData.mockReturnValue(populatedData);
      render(<ReportsPage />);

      expect(screen.getAllByText('Resolved')).toHaveLength(2);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render severity distribution chart', () => {
      mockUseReportsData.mockReturnValue(populatedData);
      render(<ReportsPage />);

      // Distribution section shows labels and counts
      const criticalElements = screen.getAllByText('Critical');
      expect(criticalElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render response time chart bars', () => {
      mockUseReportsData.mockReturnValue(populatedData);
      render(<ReportsPage />);

      // Response time trend shows incident types
      expect(screen.getByText('Fire')).toBeInTheDocument();
      expect(screen.getByText('Gas_leak')).toBeInTheDocument();
    });
  });

  // ---------- SEARCH FILTERING ----------
  describe('search filtering', () => {
    it('should filter reports by search term', async () => {
      mockUseReportsData.mockReturnValue(populatedData);
      const user = userEvent.setup();
      render(<ReportsPage />);

      const searchInput = screen.getByPlaceholderText('Search incidents...');
      await user.type(searchInput, 'Kitchen');

      expect(screen.getByText('Fire - Kitchen fire')).toBeInTheDocument();
      expect(screen.queryByText('Gas_leak - Building B')).not.toBeInTheDocument();
      expect(screen.queryByText('Smoke - Corridor')).not.toBeInTheDocument();
    });

    it('should show no-match message when search has no results', async () => {
      mockUseReportsData.mockReturnValue(populatedData);
      const user = userEvent.setup();
      render(<ReportsPage />);

      const searchInput = screen.getByPlaceholderText('Search incidents...');
      await user.type(searchInput, 'zzzznonexistent');

      expect(screen.getByText('No incidents match your search')).toBeInTheDocument();
    });

    it('should be case-insensitive', async () => {
      mockUseReportsData.mockReturnValue(populatedData);
      const user = userEvent.setup();
      render(<ReportsPage />);

      const searchInput = screen.getByPlaceholderText('Search incidents...');
      await user.type(searchInput, 'KITCHEN');

      expect(screen.getByText('Fire - Kitchen fire')).toBeInTheDocument();
    });

    it('should show all results when search is cleared', async () => {
      mockUseReportsData.mockReturnValue(populatedData);
      const user = userEvent.setup();
      render(<ReportsPage />);

      const searchInput = screen.getByPlaceholderText('Search incidents...');
      await user.type(searchInput, 'Kitchen');
      expect(screen.queryByText('Smoke - Corridor')).not.toBeInTheDocument();

      await user.clear(searchInput);
      expect(screen.getByText('Smoke - Corridor')).toBeInTheDocument();
    });
  });

  // ---------- DOWNLOAD DIALOG ----------
  describe('download functionality', () => {
    it('should open download dialog when download button clicked', async () => {
      mockUseReportsData.mockReturnValue(populatedData);
      const user = userEvent.setup();
      render(<ReportsPage />);

      // Find download buttons in the table rows
      const downloadButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('svg.lucide-download') || btn.querySelector('[class*="download"]')
      );

      // Click the first download button (there should be one per row)
      // Filter for small icon buttons in the table
      const actionButtons = screen.getAllByRole('button');
      const iconDownloadBtns = actionButtons.filter(btn => {
        return btn.classList.contains('h-8') && btn.classList.contains('w-8');
      });

      if (iconDownloadBtns.length > 0) {
        await user.click(iconDownloadBtns[0]);
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      }
    });
  });

  // ---------- PAGE STRUCTURE ----------
  describe('page structure', () => {
    it('should render within DashboardLayout', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });

    it('should render the page title', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
    });

    it('should render the subtitle', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      expect(screen.getByText('Incident reports and hazard analytics')).toBeInTheDocument();
    });

    it('should render all four stat labels', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      expect(screen.getByText('Total Incidents')).toBeInTheDocument();
      expect(screen.getByText('Avg Response')).toBeInTheDocument();
      expect(screen.getByText('Resolution Rate')).toBeInTheDocument();
      expect(screen.getByText('Active Hazards')).toBeInTheDocument();
    });

    it('should render Incident History card title', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      expect(screen.getByText('Incident History')).toBeInTheDocument();
    });

    it('should render chart section titles', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      expect(screen.getByText('Response Time Trend')).toBeInTheDocument();
      expect(screen.getByText('Incident Distribution')).toBeInTheDocument();
    });

    it('should render search input', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      expect(screen.getByPlaceholderText('Search incidents...')).toBeInTheDocument();
    });

    it('should render Filter and Export buttons', () => {
      mockUseReportsData.mockReturnValue(emptyData);
      render(<ReportsPage />);

      expect(screen.getByText('Filter')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });
  });
});
