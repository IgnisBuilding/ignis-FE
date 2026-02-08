'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin,
  Volume2,
  Users,
  HardDrive,
  Timer,
  TrendingUp,
  TrendingDown,
  Share2,
  Siren,
  MoreVertical,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Hazard {
  id: number;
  type: string;
  severity: string;
  status: string;
  description?: string;
  apartment: {
    id: number;
    unit_number: string;
    floor: {
      id: number;
      level: number;
      building: {
        id: number;
        name: string;
        address: string;
      };
    };
  };
  node?: {
    id: number;
  };
  created_at: string;
  updated_at: string;
  responded_at?: string;
  resolved_at?: string;
}

function getStatusColor(status: string) {
  const statusLower = status?.toLowerCase();
  switch (statusLower) {
    case 'active':
    case 'reported':
      return { dot: 'bg-amber-500', text: 'text-amber-600' };
    case 'responding':
    case 'responded':
      return { dot: 'bg-blue-500', text: 'text-blue-600' };
    case 'resolved':
      return { dot: 'bg-green-500', text: 'text-green-600' };
    default:
      return { dot: 'bg-gray-500', text: 'text-gray-600' };
  }
}

function FirefighterDashboardContent() {
  const { user, dashboardRole, roleTitle } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'priority'>('all');

  useEffect(() => {
    fetchHazards();
  }, []);

  const fetchHazards = async () => {
    try {
      const token = localStorage.getItem('ignis_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hazards/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('Fetched active hazards:', JSON.stringify(data, null, 2));
      setHazards(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch hazards:', error);
      setHazards([]);
    } finally {
      setLoading(false);
    }
  };

  const activeIncidents = hazards.filter((e) => {
    const status = e.status?.toLowerCase();
    return (
      status === 'active' ||
      status === 'reported' ||
      status === 'responding' ||
      status === 'responded'
    );
  });

  const criticalIncident =
    activeIncidents.find((h) => h.severity?.toLowerCase() === 'critical') ||
    activeIncidents[0];
  const feedIncidents = activeIncidents.filter(
    (h) => h.id !== criticalIncident?.id
  );

  // Stats data
  const statsData = [
    {
      label: 'Active Alarms',
      value: String(activeIncidents.length),
      icon: Volume2,
      trend: '+2%',
      isUp: true,
      note: 'vs yesterday',
    },
    {
      label: 'Personnel On-Site',
      value: '148',
      icon: Users,
      trend: '-5%',
      isUp: false,
      note: 'current shift',
    },
    {
      label: 'Resource Ready',
      value: '94%',
      icon: HardDrive,
      trend: '+1%',
      isUp: true,
      note: 'optimized',
    },
    {
      label: 'Avg Response',
      value: '4m 12s',
      icon: Timer,
      trend: '-12%',
      isUp: false,
      note: 'target efficiency',
    },
  ];

  const handleRespondClick = () => {
    if (criticalIncident) {
      router.push(
        `/emergency/${criticalIncident.apartment?.floor?.building?.id}`
      );
    }
  };

  const handleShareClick = () => {
    toast({
      title: 'Incident Shared',
      description: 'Incident details copied to clipboard',
      duration: 3000,
    });
  };

  if (loading) {
    return (
      <DashboardLayout
        role={dashboardRole}
        userName={user?.name || 'Commander'}
        userTitle={roleTitle}
      >
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="text-center">
            <div className="rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4 animate-spin" />
            <p className="text-xl font-semibold text-primary">
              Loading Command Center...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role={dashboardRole}
      userName={user?.name || 'Cmdr. Sterling'}
      userTitle={roleTitle}
    >
      <div className="flex-1 space-y-4 sm:space-y-6 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8 lg:space-y-8 w-full max-w-none">
        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-1 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat) => (
            <Card key={stat.label} className="border border-border">
              <CardContent className="p-3 sm:p-4 md:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#1f3d2f] break-words">
                      {stat.value}
                    </p>
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      {stat.isUp ? (
                        <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600 flex-shrink-0" />
                      )}
                      <span
                        className={cn(
                          'text-xs font-medium truncate',
                          stat.isUp ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {stat.trend} {stat.note}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-secondary p-2 sm:p-2.5 flex-shrink-0">
                    <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Critical Incident */}
        {criticalIncident ? (
          <section>
            <div className="mb-3 sm:mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-pulse rounded-full bg-red-500 flex-shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Critical Priority Incident
                </h2>
              </div>
              <button
                type="button"
                onClick={() => router.push('/emergency')}
                className="text-xs sm:text-sm font-medium text-foreground underline underline-offset-4 hover:text-[#1f3d2f] w-fit"
              >
                View Full Incident Queue
              </button>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  <div className="relative h-48 w-full flex-shrink-0 bg-neutral-200 sm:h-56 lg:h-auto lg:w-80">
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100">
                      <span className="text-4xl">🔥</span>
                    </div>
                    <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
                      <Badge
                        variant="secondary"
                        className="gap-1 sm:gap-1.5 bg-white dark:bg-card px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-foreground shadow-sm"
                      >
                        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500 flex-shrink-0" />
                        <span className="truncate">
                          {criticalIncident.apartment?.floor?.building?.name ||
                            'Unknown Location'}
                        </span>
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4 sm:p-5 md:p-6">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-red-500 px-2 py-0.5 sm:px-2.5 text-xs font-semibold text-white hover:bg-red-500">
                        SEVERITY:{' '}
                        {criticalIncident.severity?.toUpperCase() || 'CRITICAL'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-amber-500 bg-amber-50 px-2 py-0.5 sm:px-2.5 text-xs font-semibold text-amber-700"
                      >
                        GRADE A RESPONSE
                      </Badge>
                    </div>

                    <h3 className="mt-3 sm:mt-4 text-lg sm:text-2xl font-bold text-foreground">
                      {criticalIncident.type || 'Fire Incident'} -{' '}
                      {criticalIncident.apartment?.floor?.building?.name}
                    </h3>
                    <p className="mt-2 sm:mt-3 text-sm leading-relaxed text-muted-foreground">
                      {criticalIncident.description ||
                        `Reported at Floor ${criticalIncident.apartment?.floor?.level}, Unit ${criticalIncident.apartment?.unit_number}. Immediate response required.`}{' '}
                      <span className="font-semibold text-foreground">
                        Units Assigned: Engine 42, Truck 18, Rescue 09.
                      </span>
                    </p>

                    <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4 border-t border-border pt-3 sm:pt-4">
                      <div className="flex gap-6 sm:gap-8">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Elapsed
                          </p>
                          <p className="mt-0.5 text-lg sm:text-xl font-bold text-foreground">
                            08:42
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Backup ETA
                          </p>
                          <p className="mt-0.5 text-lg sm:text-xl font-bold text-foreground">
                            03m 15s
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <Button
                          onClick={handleRespondClick}
                          className="gap-2 bg-[#1f3d2f] px-4 sm:px-6 text-sm text-white hover:bg-[#2a4f3d] w-full sm:w-auto"
                        >
                          <Siren className="h-4 w-4 flex-shrink-0" />
                          Respond to Incident
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleShareClick}
                          className="w-10 h-10 flex-shrink-0"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        ) : (
          <section>
            <Card className="overflow-hidden">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-3">
                  All Clear
                </h3>
                <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                  No active incidents at this time. All systems operational and
                  monitoring.
                </p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Incident Feed */}
        {activeIncidents.length > 0 && (
          <section>
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4">
                <CardTitle className="text-sm sm:text-base font-bold uppercase tracking-wider text-foreground">
                  Active Incident Feed
                </CardTitle>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant={filter === 'all' ? 'outline' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className={cn(
                      'text-xs sm:text-sm font-medium',
                      filter === 'all' && 'border-foreground'
                    )}
                  >
                    All Units
                  </Button>
                  <Button
                    variant={filter === 'priority' ? 'outline' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('priority')}
                    className={cn(
                      'text-xs sm:text-sm font-medium text-muted-foreground',
                      filter === 'priority' && 'border-foreground text-foreground'
                    )}
                  >
                    Priority Only
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="hidden grid-cols-[100px_1fr_120px_80px_50px] gap-3 border-b border-border bg-muted/50 px-4 sm:px-6 py-2 sm:py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
                  <div>ID / Status</div>
                  <div>Incident Details</div>
                  <div className="text-center">Resources</div>
                  <div>Duration</div>
                  <div>Actions</div>
                </div>

                <div className="divide-y divide-border">
                  {activeIncidents.map((incident) => {
                    const colors = getStatusColor(incident.status);
                    return (
                      <div
                        key={incident.id}
                        className="flex flex-col gap-3 px-4 sm:px-6 py-3 sm:py-4 transition-colors hover:bg-muted/30 md:grid md:grid-cols-[100px_1fr_120px_80px_50px] md:items-center md:gap-3"
                      >
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                            #{incident.id}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span
                              className={cn('h-2 w-2 rounded-full', colors.dot)}
                            />
                            <span
                              className={cn('text-xs font-bold', colors.text)}
                            >
                              {incident.status?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {incident.type} -{' '}
                            {incident.apartment?.floor?.building?.name}
                          </p>
                          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                            {incident.apartment?.floor?.building?.address ||
                              `Floor ${incident.apartment?.floor?.level}, Unit ${incident.apartment?.unit_number}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 md:justify-center flex-wrap">
                          <Badge
                            variant="secondary"
                            className="px-2 py-0.5 text-xs font-semibold"
                          >
                            U1
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="px-2 py-0.5 text-xs font-semibold bg-muted text-muted-foreground"
                          >
                            +2
                          </Badge>
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-foreground">
                          --:--
                        </div>
                        <div className="flex md:justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function FirefighterDashboard() {
  return (
    <ProtectedRoute allowedRoles={['firefighter', 'firefighter_hq', 'firefighter_state', 'firefighter_district', 'admin']}>
      <FirefighterDashboardContent />
    </ProtectedRoute>
  );
}
