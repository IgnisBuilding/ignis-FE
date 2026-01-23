'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Download,
  Filter,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3,
} from 'lucide-react';

const reportsData = [
  {
    id: 1,
    incident: 'Structure Fire - Central Plaza',
    date: '2024-01-20',
    responseTime: '4m 12s',
    units: 8,
    status: 'Completed',
    severity: 'Critical',
  },
  {
    id: 2,
    incident: 'Warehouse Fire - Pier 15',
    date: '2024-01-19',
    responseTime: '3m 45s',
    units: 12,
    status: 'Completed',
    severity: 'Extreme',
  },
  {
    id: 3,
    incident: 'Gas Leak - Industrial Park',
    date: '2024-01-18',
    responseTime: '5m 20s',
    units: 5,
    status: 'Completed',
    severity: 'High',
  },
  {
    id: 4,
    incident: 'Vehicle Accident - Highway 101',
    date: '2024-01-17',
    responseTime: '6m 15s',
    units: 4,
    status: 'Completed',
    severity: 'Medium',
  },
  {
    id: 5,
    incident: 'Medical Emergency - Downtown',
    date: '2024-01-16',
    responseTime: '3m 30s',
    units: 3,
    status: 'Completed',
    severity: 'High',
  },
];

function ReportsPageContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<{
    id: number;
    incident: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDownload = (report: { id: number; incident: string }) => {
    setSelectedReport(report);
    setShowDownloadDialog(true);
  };

  const handleConfirmDownload = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    toast({
      title: 'Report Downloaded',
      description: `${selectedReport?.incident} report has been downloaded`,
      duration: 3000,
    });
    setLoading(false);
    setShowDownloadDialog(false);
  };

  const filteredReports = reportsData.filter((r) =>
    r.incident.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Extreme':
        return <Badge className="bg-red-500 text-white">Extreme</Badge>;
      case 'Critical':
        return <Badge className="bg-orange-500 text-white">Critical</Badge>;
      case 'High':
        return <Badge className="bg-amber-500 text-white">High</Badge>;
      default:
        return <Badge className="bg-blue-500 text-white">Medium</Badge>;
    }
  };

  const stats = [
    {
      label: 'Total Incidents',
      value: '124',
      icon: AlertCircle,
      color: 'text-red-500',
    },
    {
      label: 'Avg Response',
      value: '4m 32s',
      icon: Clock,
      color: 'text-blue-500',
    },
    {
      label: 'Success Rate',
      value: '98.2%',
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      label: 'Personnel Hours',
      value: '2,847h',
      icon: TrendingUp,
      color: 'text-amber-500',
    },
  ];

  return (
    <DashboardLayout
      role="firefighter"
      userName={user?.name || 'Cmdr. Sterling'}
      userTitle="SENIOR DIRECTOR"
    >
      <main className="flex-1 space-y-4 overflow-auto p-4 sm:space-y-6 sm:p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Reports & Analytics
            </h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
              Incident reports from the last 30 days
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border border-border">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold text-[#1f3d2f]">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`flex-shrink-0 ${stat.color}`}>
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search incidents..."
              className="pl-10 h-9 sm:h-10 text-xs sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="gap-2 bg-transparent flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm"
            >
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Button className="gap-2 bg-[#1f3d2f] text-white hover:bg-[#2a4f3d] flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Reports Table */}
        <Card className="border border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">
              Incident History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Incident
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Date
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Response
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Units
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Severity
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-border hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-foreground truncate">
                        {report.incident}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        {report.date}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">
                        {report.responseTime}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        {report.units}
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        {getSeverityBadge(report.severity)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleDownload(report)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">
                Response Time Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="h-48 sm:h-56 flex items-center justify-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 sm:h-16 sm:w-16 opacity-30" />
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">
                Incident Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="h-48 sm:h-56 flex items-center justify-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 sm:h-16 sm:w-16 opacity-30" />
            </CardContent>
          </Card>
        </div>

        {/* Download Dialog */}
        <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Download Report</DialogTitle>
              <DialogDescription>
                {`Download report for: ${selectedReport?.incident}`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDownloadDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmDownload} disabled={loading}>
                {loading ? 'Processing...' : 'Download'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </DashboardLayout>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute allowedRoles={['firefighter']}>
      <ReportsPageContent />
    </ProtectedRoute>
  );
}
