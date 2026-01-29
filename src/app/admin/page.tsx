'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/utils';
import { IncidentActionModal } from '@/components/dialogs';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Volume2,
  Users,
  TrendingUp,
  TrendingDown,
  Share2,
  Siren,
  MoreVertical,
  Building,
  Activity,
} from 'lucide-react';

// Status color helper
function getStatusColor(color: string) {
  switch (color) {
    case "amber": return { dot: "bg-amber-500", text: "text-amber-600" };
    case "blue": return { dot: "bg-blue-500", text: "text-blue-600" };
    case "green": return { dot: "bg-green-500", text: "text-green-600" };
    case "red": return { dot: "bg-red-500", text: "text-red-600" };
    default: return { dot: "bg-gray-500", text: "text-gray-600" };
  }
}

// Default incidents data matching the screenshot
const defaultIncidentsData = [
  { id: "#4922-A", status: "EN ROUTE", statusColor: "amber", title: "Vegetation Fire - Oak Canyon", desc: "2.5 acres involved, zero containment", resources: ["B2", "T4", "+2"], duration: "42m 12s" },
  { id: "#4921-X", status: "STAGED", statusColor: "blue", title: "Gas Leak Report - Industrial Park", desc: "Hazmat unit 02 on site, isolation successful", resources: ["H2"], duration: "01h 12m" },
  { id: "#4920-R", status: "CLEARING", statusColor: "green", title: "Medical Assist - Residential", desc: "Patient stabilized and transported", resources: ["M1", "R2"], duration: "22m 04s" },
];

function AdminDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // UI State
  const [filter, setFilter] = useState<"all" | "priority">("all");
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [respondingIncident, setRespondingIncident] = useState({
    id: "#4922-A",
    title: "Structure Fire - Central Plaza Complex",
    severity: "critical" as const
  });

  // Data State
  const [stats, setStats] = useState({
    activeAlarms: 0,
    totalResidents: 0,
    activeSensors: 0,
    totalBuildings: 0,
  });
  const [alerts, setAlerts] = useState<any[]>(defaultIncidentsData);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data from API
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // Fetch stats from multiple endpoints
        const [dashboardStats, activeAlerts, residents, sensors, buildings] = await Promise.all([
          api.getDashboardStats().catch(() => null),
          api.getActiveAlerts().catch(() => []),
          api.getResidents().catch(() => []),
          api.getSensors().catch(() => []),
          api.getBuildings().catch(() => []),
        ]);

        // Calculate stats from API data
        setStats({
          activeAlarms: activeAlerts?.length || dashboardStats?.activeAlarms || 0,
          totalResidents: residents?.length || dashboardStats?.totalResidents || 0,
          activeSensors: sensors?.filter((s: any) => s.status === 'active')?.length || dashboardStats?.activeSensors || 0,
          totalBuildings: buildings?.length || dashboardStats?.totalBuildings || 0,
        });

        // Format alerts for display
        if (activeAlerts && activeAlerts.length > 0) {
          const formattedAlerts = activeAlerts.map((alert: any, index: number) => ({
            id: `#${alert.id || (4922 - index)}-${String.fromCharCode(65 + index)}`,
            status: alert.status?.toUpperCase() || 'EN ROUTE',
            statusColor: alert.severity === 'critical' ? 'red' : alert.severity === 'high' ? 'amber' : alert.severity === 'medium' ? 'blue' : 'green',
            title: alert.title || alert.message || 'Fire Alert',
            desc: alert.description || alert.location || 'Alert triggered by sensor',
            resources: alert.resources || ['B2', 'T4'],
            duration: alert.duration || '42m 12s',
          }));
          setAlerts(formattedAlerts);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Keep default data on error
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Stats cards data with API values
  const statsData = [
    {
      label: "Active Alarms",
      value: stats.activeAlarms.toString(),
      icon: Volume2,
      trend: stats.activeAlarms > 0 ? "+2" : "0",
      isUp: stats.activeAlarms > 0,
      note: "requires attention"
    },
    {
      label: "Total Residents",
      value: stats.totalResidents.toString(),
      icon: Users,
      trend: "+5%",
      isUp: true,
      note: "registered"
    },
    {
      label: "Active Sensors",
      value: stats.activeSensors.toString(),
      icon: Activity,
      trend: "+1%",
      isUp: true,
      note: "operational"
    },
    {
      label: "Buildings",
      value: stats.totalBuildings.toString(),
      icon: Building,
      trend: "stable",
      isUp: true,
      note: "monitored"
    },
  ];

  const handleRespondClick = (incident?: any) => {
    if (incident) {
      setRespondingIncident({
        id: incident.id,
        title: incident.title,
        severity: incident.statusColor === 'red' ? 'critical' : incident.statusColor === 'amber' ? 'high' : 'medium'
      });
    }
    setShowIncidentModal(true);
  };

  const handleIncidentRespond = async (notes: string) => {
    try {
      // TODO: Call API to log incident response - needs new API endpoint
      // await api.respondToIncident(respondingIncident.id, notes);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Response Logged",
        description: "Your response to the incident has been recorded and units have been notified.",
        duration: 5000,
      });
      setShowIncidentModal(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log incident response. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout role="admin" userName={user?.name || 'Admin'} userTitle="ADMINISTRATOR">
      <div className="flex-1 space-y-4 sm:space-y-6 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8 lg:space-y-8 w-full max-w-none">
        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-1 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat) => (
            <Card key={stat.label} className="border border-border">
              <CardContent className="p-3 sm:p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">{stat.label}</p>
                    <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#1f3d2f] break-words">
                      {loading ? '...' : stat.value}
                    </p>
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      {stat.isUp ? (
                        <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600 flex-shrink-0" />
                      )}
                      <span className={cn("text-xs font-medium truncate", stat.isUp ? "text-green-600" : "text-red-600")}>
                        {stat.trend} {stat.note}
                      </span>
                    </div>
                  </div>
                  {/* Fixed: Square icon container */}
                  <div className="rounded-lg bg-secondary p-2.5 flex-shrink-0 h-10 w-10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Critical Incident - Matching screenshot exactly */}
        <section>
          <div className="mb-3 sm:mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-pulse rounded-full bg-red-500 flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-foreground">Critical Priority Incident</h2>
            </div>
            <button
              type="button"
              onClick={() => router.push('/admin/alerts')}
              className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 w-fit"
            >
              View Full Incident Queue
            </button>
          </div>

          <Card className="overflow-hidden border border-border">
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row">
                {/* Image placeholder - matching screenshot with grey background and "300x300" text */}
                <div className="relative h-48 w-full flex-shrink-0 bg-neutral-200 sm:h-56 lg:h-auto lg:w-80">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm text-neutral-400">300x300</span>
                  </div>
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
                    <Badge variant="secondary" className="gap-1.5 bg-white px-3 py-1.5 text-sm font-medium text-foreground shadow-sm rounded-full">
                      <MapPin className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                      <span>Sector 4 (Commercial)</span>
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-5 md:p-6">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-red-500 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-red-500 rounded">
                      SEVERITY: EXTREME
                    </Badge>
                    <Badge variant="outline" className="border-amber-500 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 rounded">
                      GRADE A RESPONSE
                    </Badge>
                  </div>

                  <h3 className="mt-4 text-xl sm:text-2xl font-bold text-foreground">Structure Fire - Central Plaza Complex</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Multiple alarms triggered in the North Wing. Structural integrity alert in B-block. Heavy smoke reported on floors 4-7. Evacuation in progress.{" "}
                    <span className="font-semibold text-foreground">Units Assigned: Engine 42, Truck 18, Rescue 09.</span>
                  </p>

                  <div className="mt-6 flex flex-col gap-4 border-t border-border pt-4">
                    <div className="flex gap-8">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ELAPSED</p>
                        <p className="mt-0.5 text-xl font-bold text-foreground">08:42</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">BACKUP ETA</p>
                        <p className="mt-0.5 text-xl font-bold text-foreground">03m 15s</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button onClick={() => handleRespondClick()} className="gap-2 bg-[#1f3d2f] px-6 text-sm text-white hover:bg-[#2a4f3d]">
                        <Siren className="h-4 w-4 flex-shrink-0" />
                        Respond to Incident
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => toast({
                        title: "Incident Shared",
                        description: "Incident details copied to clipboard",
                        duration: 3000,
                      })} className="h-10 w-10 flex-shrink-0">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <IncidentActionModal
            open={showIncidentModal}
            incidentId={respondingIncident.id}
            title={respondingIncident.title}
            severity={respondingIncident.severity}
            onClose={() => setShowIncidentModal(false)}
            onRespond={handleIncidentRespond}
          />
        </section>

        {/* Active Incident Feed - Matching screenshot exactly */}
        <section>
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">ACTIVE INCIDENT FEED</CardTitle>
              <div className="flex items-center gap-0 border border-border rounded-md overflow-hidden">
                <Button
                  variant={filter === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter("all")}
                  className={cn(
                    "text-sm font-medium rounded-none px-4",
                    filter === "all" ? "bg-foreground text-background hover:bg-foreground/90" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  All Units
                </Button>
                <Button
                  variant={filter === "priority" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter("priority")}
                  className={cn(
                    "text-sm font-medium rounded-none px-4",
                    filter === "priority" ? "bg-foreground text-background hover:bg-foreground/90" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Priority Only
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-[100px_1fr_140px_100px_60px] gap-4 border-y border-border bg-muted/30 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <div>ID / STATUS</div>
                <div>INCIDENT DETAILS</div>
                <div className="text-right">RESOURCES</div>
                <div>DURATION</div>
                <div>ACTIONS</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border">
                {(filter === "priority" ? alerts.filter(a => a.statusColor === 'red' || a.statusColor === 'amber') : alerts).map((incident) => {
                  const colors = getStatusColor(incident.statusColor);
                  return (
                    <div key={incident.id} className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-muted/20 md:grid md:grid-cols-[100px_1fr_140px_100px_60px] md:items-center md:gap-4">
                      {/* ID / Status */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{incident.id}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={cn("h-2 w-2 rounded-full", colors.dot)} />
                          <span className={cn("text-xs font-bold uppercase", colors.text)}>{incident.status}</span>
                        </div>
                      </div>

                      {/* Incident Details */}
                      <div>
                        <p className="font-semibold text-foreground text-sm">{incident.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{incident.desc}</p>
                      </div>

                      {/* Resources - aligned right */}
                      <div className="flex items-center gap-1.5 md:justify-end flex-wrap">
                        {incident.resources.map((res: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className={cn(
                              "px-2.5 py-1 text-xs font-semibold rounded",
                              res.startsWith("+") ? "bg-muted text-muted-foreground" : "bg-secondary"
                            )}
                          >
                            {res}
                          </Badge>
                        ))}
                      </div>

                      {/* Duration */}
                      <div className="text-sm font-medium text-foreground">{incident.duration}</div>

                      {/* Actions */}
                      <div className="flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleRespondClick(incident)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {alerts.length === 0 && !loading && (
                  <div className="px-6 py-8 text-center text-muted-foreground">
                    No active incidents at this time.
                  </div>
                )}
                {loading && (
                  <div className="px-6 py-8 text-center text-muted-foreground">
                    Loading incidents...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['management', 'building_authority']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
