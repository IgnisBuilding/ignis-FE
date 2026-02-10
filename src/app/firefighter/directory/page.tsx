'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useJurisdiction, JurisdictionBuilding } from '@/hooks/useJurisdiction';
import { Building2, Search, Download, Loader2, Inbox } from 'lucide-react';

function DirectoryContent() {
  const { user, dashboardRole, roleTitle } = useAuth();
  const { toast } = useToast();
  const { buildings, jurisdiction, count, loading } = useJurisdiction();
  const [searchTerm, setSearchTerm] = useState('');

  const handleExportReport = () => {
    toast({
      title: 'Report Generated',
      description: 'Building safety report is being prepared for download',
      duration: 3000,
    });
  };

  const handleBuildingClick = (building: JurisdictionBuilding) => {
    toast({
      title: building.name,
      description: `${building.address} • ${building.total_floors} floor${building.total_floors !== 1 ? 's' : ''}`,
      duration: 3000,
    });
  };

  const filteredBuildings = buildings.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.society_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFloorPlanBadge = (hasFloorPlan: boolean) => {
    if (hasFloorPlan) {
      return <Badge className="bg-green-100 text-green-700 font-semibold hover:bg-green-100 border-0 text-xs">FLOOR PLAN</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-700 font-semibold hover:bg-gray-100 border-0 text-xs">NO PLAN</Badge>;
  };

  return (
    <DashboardLayout
      role={dashboardRole}
      userName={user?.name || 'Cmdr. Sterling'}
      userTitle={roleTitle}
    >
      <div className="flex-1 space-y-4 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8 sm:space-y-6 w-full max-w-none">
        {/* Header Section */}
        <div className="flex flex-col items-start justify-between gap-4 sm:gap-6 md:flex-row md:items-end">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                Building Safety Directory
              </h1>
              {jurisdiction && (
                <Badge variant="outline" className="text-xs font-medium border-[#1f3d2f] text-[#1f3d2f]">
                  {jurisdiction.level.toUpperCase()}: {jurisdiction.name}
                </Badge>
              )}
            </div>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
              {loading ? 'Loading...' : `Managing safety protocols for ${count} monitored building${count !== 1 ? 's' : ''}`}
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
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by building name, address, or society..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Buildings Table */}
        <Card className="rounded-lg border border-border bg-card overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-sm text-muted-foreground">Loading buildings...</span>
              </div>
            ) : filteredBuildings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Inbox className="h-12 w-12 opacity-30 mb-3" />
                <p className="text-sm">{searchTerm ? 'No buildings match your search' : 'No buildings found in your jurisdiction'}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-foreground">
                      BUILDING NAME
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-foreground hidden sm:table-cell">
                      FLOORS
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-foreground hidden md:table-cell">
                      SOCIETY
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-foreground hidden lg:table-cell">
                      REGISTERED
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-foreground">
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuildings.map((building, idx) => (
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
                          {building.total_floors}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {building.apartments_per_floor} units/floor
                        </p>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">
                        {building.society_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground hidden lg:table-cell">
                        {building.created_at ? new Date(building.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {getFloorPlanBadge(building.has_floor_plan)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Results count */}
        {!loading && filteredBuildings.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Showing {filteredBuildings.length} of {count} building{count !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function Directory() {
  return (
    <ProtectedRoute allowedRoles={['firefighter', 'firefighter_hq', 'firefighter_state', 'firefighter_district', 'admin']}>
      <DirectoryContent />
    </ProtectedRoute>
  );
}
