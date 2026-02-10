'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, MapPin, Users, Activity, Calendar, Shield, AlertTriangle, CheckCircle, Radio } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { api, Sensor } from '@/lib/api';
import { Apartment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

function getSensorStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'active': return { badge: 'bg-green-500', border: 'border-green-200 dark:border-green-900/30', bg: 'bg-green-50 dark:bg-green-950/20' };
    case 'maintenance': return { badge: 'bg-yellow-500', border: 'border-yellow-200 dark:border-yellow-900/30', bg: 'bg-yellow-50 dark:bg-yellow-950/20' };
    case 'inactive': return { badge: 'bg-red-500', border: 'border-red-200 dark:border-red-900/30', bg: 'bg-red-50 dark:bg-red-950/20' };
    default: return { badge: 'bg-gray-500', border: 'border-gray-200 dark:border-gray-900/30', bg: 'bg-gray-50 dark:bg-gray-950/20' };
  }
}

export default function ApartmentDetailsPage() {
  const router = useRouter();
  const { user, role, dashboardRole, roleTitle } = useAuth();
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && role === 'resident') {
      const fetchData = async () => {
        try {
          const [aptData, sensorData] = await Promise.all([
            api.getMyApartment(),
            api.getSensors(),
          ]);
          setApartment(aptData);

          // Filter sensors relevant to this apartment's building/floor
          if (aptData && sensorData) {
            const buildingId = aptData.building?.id;
            const floorId = aptData.floor?.id;
            const filtered = sensorData.filter((s: any) => {
              if (s.buildingId && buildingId && s.buildingId === buildingId) return true;
              if (s.floorId && floorId && s.floorId === floorId) return true;
              if (s.room?.id && aptData.id) return true;
              return false;
            });
            setSensors(filtered.length > 0 ? filtered : sensorData);
          }
        } catch (error) {
          console.error('Failed to fetch data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, role]);

  if (!user || role !== 'resident') return null;

  if (loading) {
    return (
      <DashboardLayout role={dashboardRole} userName={user?.name || 'Resident'} userTitle={roleTitle}>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="text-center">
            <div className="rounded-full h-12 w-12 border-4 border-[#1f3d2f] border-t-transparent mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading apartment details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!apartment) {
    return (
      <DashboardLayout role={dashboardRole} userName={user?.name || 'Resident'} userTitle={roleTitle}>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="text-center">
            <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No apartment found</h3>
            <p className="text-muted-foreground">No apartment information available.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={dashboardRole} userName={user?.name || 'Resident'} userTitle={roleTitle}>
      <div className="flex-1 space-y-4 sm:space-y-6 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-none">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center w-full">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Apartment Details</h1>
            <p className="text-sm text-muted-foreground">
              Complete information about your residence
            </p>
          </div>
          <Button
            onClick={() => router.push('/resident/map')}
            variant="outline"
          >
            <MapPin className="h-4 w-4 mr-2" />
            View on Map
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-1 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border border-border">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Apartment
                  </p>
                  <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#1f3d2f]">
                    {apartment.number}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {apartment.floor?.name || `Floor ${apartment.floor?.level || 0}`} • {apartment.building?.name || 'N/A'}
                  </div>
                </div>
                <div className="rounded-lg bg-green-100 p-2.5 flex-shrink-0 h-10 w-10 flex items-center justify-center">
                  <Home className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Occupancy Status
                  </p>
                  <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#1f3d2f]">
                    {apartment.occupied ? 'Occupied' : 'Vacant'}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${apartment.occupied ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-xs text-muted-foreground">
                      {apartment.occupied ? 'Active Residence' : 'Unoccupied'}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-100 p-2.5 flex-shrink-0 h-10 w-10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Last Updated
                  </p>
                  <p className="mt-2 text-lg font-bold text-[#1f3d2f]">
                    {new Date(apartment.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Created: {new Date(apartment.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="rounded-lg bg-purple-100 p-2.5 flex-shrink-0 h-10 w-10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Location Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <Home className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">Building: {apartment.building?.name || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">{apartment.building?.address || 'Main residential tower'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{apartment.floor?.name || `Floor ${apartment.floor?.level || 0}`}</p>
                  <p className="text-xs text-muted-foreground">{apartment.residents} residents on this floor</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">Unit {apartment.number}</p>
                  <p className="text-xs text-muted-foreground">{apartment.occupied ? 'Currently occupied' : 'Currently vacant'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Systems */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Safety Systems
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sensors.length === 0 ? (
                <div className="text-center py-6">
                  <Radio className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No sensors assigned to your area</p>
                </div>
              ) : (
                sensors.map((sensor) => {
                  const colors = getSensorStatusColor(sensor.status);
                  return (
                    <div key={sensor.id} className={`p-3 border ${colors.border} ${colors.bg} rounded-lg`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-foreground text-sm">{sensor.name}</span>
                        <Badge className={`${colors.badge} text-white text-xs capitalize`}>{sensor.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Type: {sensor.type}{sensor.room ? ` • ${sensor.room.name}` : ''}
                      </p>
                      {sensor.lastReading && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Last reading: {timeAgo(sensor.lastReading)}
                          {sensor.value != null && sensor.unit ? ` — ${sensor.value} ${sensor.unit}` : ''}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Apartment Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Apartment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <div>
                  <p className="font-semibold text-foreground text-sm">Created Date</p>
                  <p className="text-xs text-muted-foreground">{new Date(apartment.createdAt).toLocaleDateString()}</p>
                </div>
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-blue-200 bg-blue-50">
                <div>
                  <p className="font-semibold text-foreground text-sm">Last Updated</p>
                  <p className="text-xs text-muted-foreground">{new Date(apartment.updatedAt).toLocaleDateString()}</p>
                </div>
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-purple-200 bg-purple-50">
                <div>
                  <p className="font-semibold text-foreground text-sm">Residents</p>
                  <p className="text-xs text-muted-foreground">{apartment.residents} people</p>
                </div>
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Emergency Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
                <h4 className="font-semibold text-foreground text-sm mb-2">Fire Evacuation Route</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-red-500" />
                    Exit apartment, turn left
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-red-500" />
                    Use stairwell A (emergency exit)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-red-500" />
                    Assembly point: Front parking lot
                  </li>
                </ul>
              </div>
              <div className="p-3 border border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <h4 className="font-semibold text-foreground text-sm mb-2">Emergency Contacts</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>Fire Department: 911</li>
                  <li>Building Security: (555) 123-4567</li>
                  <li>Maintenance: (555) 123-4568</li>
                </ul>
              </div>
              <Button
                onClick={() => router.push('/emergency')}
                className="w-full bg-red-500 hover:bg-red-600 text-white"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                View Emergency Map
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
