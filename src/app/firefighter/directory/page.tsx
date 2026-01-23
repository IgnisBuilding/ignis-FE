'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, Plus, X, Building2 } from 'lucide-react';

interface Building {
  id: number;
  name: string;
  address: string;
  occupancy: number;
  lastInspection: string;
  safetyScore: number;
  status: 'CERTIFIED' | 'PENDING' | 'AT RISK' | 'REVIEW REQ.';
  icon: 'building' | 'highrise' | 'complex' | 'alert';
}

const buildingsData: Building[] = [
  {
    id: 1,
    name: 'Grandview Heights',
    address: '1022 Marina Way, North District',
    occupancy: 450,
    lastInspection: 'Oct 12, 2023',
    safetyScore: 92,
    status: 'CERTIFIED',
    icon: 'highrise',
  },
  {
    id: 2,
    name: 'The Meridian',
    address: '404 Skyline Dr, North District',
    occupancy: 820,
    lastInspection: 'Nov 05, 2023',
    safetyScore: 78,
    status: 'PENDING',
    icon: 'building',
  },
  {
    id: 3,
    name: 'Oakwood Lofts',
    address: '88 Forest Ave, East District',
    occupancy: 120,
    lastInspection: 'Sep 28, 2023',
    safetyScore: 45,
    status: 'AT RISK',
    icon: 'alert',
  },
  {
    id: 4,
    name: 'Harbor Plaza',
    address: '22 Port St, Harbor District',
    occupancy: 1100,
    lastInspection: 'Dec 01, 2023',
    safetyScore: 88,
    status: 'CERTIFIED',
    icon: 'highrise',
  },
  {
    id: 5,
    name: 'Emerald Towers',
    address: '71 Central Ave, Main District',
    occupancy: 640,
    lastInspection: 'Oct 20, 2023',
    safetyScore: 62,
    status: 'REVIEW REQ.',
    icon: 'building',
  },
];

const filterCategories = [
  { title: 'Area Districts', icon: '📍' },
  { title: 'Risk Priority', icon: '⚠️' },
  { title: 'Occupancy Range', icon: '👥' },
  { title: 'Structure Type', icon: '🏢' },
  { title: 'Inspection Status', icon: '📋' },
];

const savedViews = [
  { name: 'High-Rise Residential', count: 12 },
  { name: 'Overdue Inspections', count: 4 },
];

function DirectoryContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([
    'NORTH DISTRICT',
    'RESIDENTIAL HIGH-RISE',
  ]);
  const [currentPage, setCurrentPage] = useState(1);

  const handleExportReport = () => {
    toast({
      title: 'Report Generated',
      description: 'Building safety report is being prepared for download',
      duration: 3000,
    });
  };

  const handleRegisterFacility = () => {
    toast({
      title: 'New Building Registration',
      description: 'Opening building registration form',
      duration: 3000,
    });
  };

  const handleRemoveFilter = (filter: string) => {
    setSelectedFilters(selectedFilters.filter((f) => f !== filter));
    toast({
      title: 'Filter Removed',
      description: `${filter} filter has been removed`,
      duration: 2000,
    });
  };

  const handleBuildingClick = (building: Building) => {
    toast({
      title: `${building.name} Safety Score: ${building.safetyScore}`,
      description: `Status: ${building.status}`,
      duration: 3000,
    });
  };

  const getStatusBadge = (status: string) => {
    const badgeStyles: Record<string, string> = {
      CERTIFIED: 'bg-green-100 text-green-700 font-semibold hover:bg-green-100',
      PENDING: 'bg-blue-100 text-blue-700 font-semibold hover:bg-blue-100',
      'AT RISK': 'bg-red-100 text-red-700 font-semibold hover:bg-red-100',
      'REVIEW REQ.':
        'bg-yellow-100 text-yellow-700 font-semibold hover:bg-yellow-100',
    };
    return badgeStyles[status] || 'bg-gray-100 text-gray-700';
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 85) return 'bg-green-600';
    if (score >= 70) return 'bg-blue-600';
    if (score >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <DashboardLayout
      role="firefighter"
      userName={user?.name || 'Cmdr. Sterling'}
      userTitle="SENIOR DIRECTOR"
    >
      <main className="flex-1 space-y-4 overflow-auto p-4 sm:space-y-6 sm:p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Filter Sidebar */}
          <aside className="w-full flex-shrink-0 lg:w-64">
            <Card className="border border-border">
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-foreground">
                    DIRECTORY FILTERS
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Refine monitored building list
                  </p>
                </div>

                <div className="space-y-3">
                  {filterCategories.map((category) => (
                    <Button
                      key={category.title}
                      variant="outline"
                      className="w-full justify-start gap-2 rounded-lg border-0 bg-secondary px-4 py-2 text-foreground hover:bg-[#1f3d2f] hover:text-white"
                    >
                      <span>{category.icon}</span>
                      {category.title}
                    </Button>
                  ))}
                </div>

                <div className="space-y-3 border-t border-border pt-6">
                  <h3 className="text-xs font-bold tracking-wide text-muted-foreground">
                    SAVED VIEWS
                  </h3>
                  {savedViews.map((view) => (
                    <div
                      key={view.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <button className="text-foreground hover:text-[#1f3d2f]">
                        {view.name}
                      </button>
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                        {String(view.count).padStart(2, '0')}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 border border-border bg-transparent"
                >
                  <X className="h-4 w-4" /> CLEAR FILTERS
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-4 sm:space-y-6 min-w-0">
            {/* Header Section */}
            <div className="flex flex-col items-start justify-between gap-4 sm:gap-6 md:flex-row md:items-end">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                  Building Safety Directory
                </h1>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                  Managing safety protocols for 1,284 monitored complexes
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row w-full sm:w-auto flex-shrink-0">
                <Button
                  variant="outline"
                  className="gap-2 bg-transparent text-xs sm:text-sm h-9 sm:h-10 w-full sm:w-auto"
                  onClick={handleExportReport}
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Export Report</span>
                </Button>
                <Button
                  className="gap-2 bg-[#1f3d2f] text-white hover:bg-[#2a4f3d] text-xs sm:text-sm h-9 sm:h-10 w-full sm:w-auto"
                  onClick={handleRegisterFacility}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Register Facility</span>
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2">
              {selectedFilters.map((filter) => (
                <div
                  key={filter}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium flex-shrink-0"
                >
                  {filter}
                  <button
                    onClick={() => handleRemoveFilter(filter)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button className="rounded-lg border-2 border-dashed border-border px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:bg-secondary flex-shrink-0">
                + DISTRICT
              </button>
            </div>

            {/* Buildings Table */}
            <Card className="rounded-lg border border-border bg-card overflow-hidden">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-secondary">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-foreground">
                        BUILDING NAME
                      </th>
                      <th className="px-6 py-4 text-left font-bold text-foreground hidden sm:table-cell">
                        OCCUPANCY
                      </th>
                      <th className="px-6 py-4 text-left font-bold text-foreground hidden md:table-cell">
                        LAST INSPECTION
                      </th>
                      <th className="px-6 py-4 text-left font-bold text-foreground hidden lg:table-cell">
                        SAFETY SCORE
                      </th>
                      <th className="px-6 py-4 text-left font-bold text-foreground">
                        STATUS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildingsData.map((building, idx) => (
                      <tr
                        key={building.id}
                        className={`${
                          idx % 2 === 0 ? 'bg-card' : 'bg-secondary/50'
                        } hover:bg-secondary/80 cursor-pointer transition-colors`}
                        onClick={() => handleBuildingClick(building)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-secondary p-2">
                              <Building2 className="h-4 w-4 text-foreground" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {building.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {building.address}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <p className="font-semibold text-foreground">
                            {building.occupancy}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Residents
                          </p>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">
                          {building.lastInspection}
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-2 w-16 rounded ${getSafetyScoreColor(
                                building.safetyScore
                              )}`}
                            />
                            <span className="font-semibold text-foreground">
                              {building.safetyScore}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className={`${getStatusBadge(
                              building.status
                            )} border-0 text-xs`}
                          >
                            {building.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex flex-col items-start justify-between gap-4 pt-6 sm:flex-row sm:items-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Showing 1 - 5 of 1,284 results
              </p>
              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 text-xs flex-shrink-0 bg-transparent"
                >
                  &lt;
                </Button>
                {[1, 2, 3].map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="icon"
                    className={`h-8 w-8 sm:h-9 sm:w-9 text-xs flex-shrink-0 ${
                      page === currentPage ? 'bg-[#1f3d2f]' : ''
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  className="h-8 px-2 sm:h-9 text-xs flex-shrink-0 bg-transparent"
                >
                  ...
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 text-xs flex-shrink-0 bg-transparent"
                >
                  257
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 text-xs flex-shrink-0 bg-transparent"
                >
                  &gt;
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}

export default function Directory() {
  return (
    <ProtectedRoute allowedRoles={['firefighter']}>
      <DirectoryContent />
    </ProtectedRoute>
  );
}
