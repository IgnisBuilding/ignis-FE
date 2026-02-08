'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, MapPin, Users, Activity, Calendar, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Apartment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ApartmentDetailsPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && role === 'resident') {
      const fetchApartment = async () => {
        try {
          const data = await api.getMyApartment();
          setApartment(data);
        } catch (error) {
          console.error('Failed to fetch apartment:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchApartment();
    } else {
      setLoading(false);
    }
  }, [user, role]);

  if (!user || role !== 'resident') return null;

  if (loading) {
    return (
      <DashboardLayout role="resident" userName={user?.name || 'Resident'} userTitle="RESIDENT">
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
      <DashboardLayout role="resident" userName={user?.name || 'Resident'} userTitle="RESIDENT">
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
    <DashboardLayout role="resident" userName={user?.name || 'Resident'} userTitle="RESIDENT">
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
              <div className="p-3 border border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-foreground text-sm">Smoke Detector</span>
                  <Badge className="bg-green-500 text-white text-xs">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Last checked: 2 days ago</p>
                <div className="flex items-center gap-2">
                  <div className="w-full h-2 bg-gray-200 dark:bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[95%]" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">95%</span>
                </div>
              </div>
              <div className="p-3 border border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-foreground text-sm">Heat Sensor</span>
                  <Badge className="bg-green-500 text-white text-xs">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Last checked: 1 day ago</p>
                <div className="flex items-center gap-2">
                  <div className="w-full h-2 bg-gray-200 dark:bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[98%]" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">98%</span>
                </div>
              </div>
              <div className="p-3 border border-yellow-200 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-foreground text-sm">CO2 Monitor</span>
                  <Badge className="bg-yellow-500 text-white text-xs">Maintenance Due</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Last checked: 28 days ago</p>
                <div className="flex items-center gap-2">
                  <div className="w-full h-2 bg-gray-200 dark:bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 w-[78%]" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">78%</span>
                </div>
              </div>
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
