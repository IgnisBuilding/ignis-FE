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
  Filter,
  MoreVertical,
  AlertTriangle,
  Wrench,
  Package,
  Zap,
  Droplets,
} from 'lucide-react';

const equipmentData = [
  {
    id: 1,
    name: 'Ladder Truck 42',
    type: 'Vehicle',
    status: 'Available',
    location: 'Station 7',
    lastMaintenance: '2 days ago',
    condition: 'Excellent',
  },
  {
    id: 2,
    name: 'Rescue Equipment Kit',
    type: 'Supplies',
    status: 'In Use',
    location: 'Field - Warehouse 15',
    lastMaintenance: '1 week ago',
    condition: 'Good',
  },
  {
    id: 3,
    name: 'Thermal Imaging Camera',
    type: 'Equipment',
    status: 'Available',
    location: 'Station 7',
    lastMaintenance: '3 days ago',
    condition: 'Excellent',
  },
  {
    id: 4,
    name: 'Hazmat Containment Unit',
    type: 'Equipment',
    status: 'Maintenance',
    location: 'Central Depot',
    lastMaintenance: 'Today',
    condition: 'Maintenance In Progress',
  },
  {
    id: 5,
    name: 'Oxygen Tanks Supply',
    type: 'Supplies',
    status: 'Low',
    location: 'Station 7',
    lastMaintenance: 'Current',
    condition: 'Adequate Stock',
  },
];

function LogisticsPageContent() {
  const { user, dashboardRole, roleTitle } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMaintenanceClick = (equipment: { id: number; name: string }) => {
    setSelectedEquipment(equipment);
    setShowMaintenanceDialog(true);
  };

  const handleScheduleMaintenance = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast({
      title: 'Maintenance Scheduled',
      description: `Maintenance scheduled for ${selectedEquipment?.name}`,
      duration: 3000,
    });
    setLoading(false);
    setShowMaintenanceDialog(false);
  };

  const handleCheckout = (equipment: { id: number; name: string }) => {
    toast({
      title: 'Equipment Checked Out',
      description: `${equipment.name} has been checked out`,
      duration: 3000,
    });
  };

  const filteredEquipment = equipmentData.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
        return <Badge className="bg-green-500 text-white">Available</Badge>;
      case 'In Use':
        return <Badge className="bg-blue-500 text-white">In Use</Badge>;
      case 'Maintenance':
        return <Badge className="bg-amber-500 text-white">Maintenance</Badge>;
      case 'Low':
        return <Badge className="bg-orange-500 text-white">Low Stock</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Vehicle':
        return <Package className="h-4 w-4" />;
      case 'Equipment':
        return <Wrench className="h-4 w-4" />;
      default:
        return <Droplets className="h-4 w-4" />;
    }
  };

  // Stats calculations
  const availableCount = equipmentData.filter(
    (e) => e.status === 'Available'
  ).length;
  const inUseCount = equipmentData.filter((e) => e.status === 'In Use').length;
  const maintenanceCount = equipmentData.filter(
    (e) => e.status === 'Maintenance'
  ).length;
  const lowStockCount = equipmentData.filter((e) => e.status === 'Low').length;

  return (
    <DashboardLayout
      role={dashboardRole}
      userName={user?.name || 'Cmdr. Sterling'}
      userTitle={roleTitle}
    >
      <div className="flex-1 space-y-4 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8 sm:space-y-6 w-full max-w-none">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Logistics & Resources
            </h1>
            <p className="text-sm text-muted-foreground">
              Total assets: {filteredEquipment.length} items
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Available
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {availableCount}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary p-2.5">
                  <Zap className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    In Use
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {inUseCount}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary p-2.5">
                  <Wrench className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Maintenance
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {maintenanceCount}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary p-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Low Stock
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {lowStockCount}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary p-2.5">
                  <Droplets className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search equipment..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Equipment Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Asset Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredEquipment.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="rounded-lg bg-secondary p-2">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">
                        {item.name}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.type} • {item.location}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last maintenance: {item.lastMaintenance}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {getStatusBadge(item.status)}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.condition}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => handleMaintenanceClick(item)}
                    >
                      <Wrench className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => handleCheckout(item)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Dialog */}
        <Dialog
          open={showMaintenanceDialog}
          onOpenChange={setShowMaintenanceDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Maintenance</DialogTitle>
              <DialogDescription>
                {`Schedule maintenance for ${selectedEquipment?.name}?`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowMaintenanceDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleScheduleMaintenance} disabled={loading}>
                {loading ? 'Processing...' : 'Schedule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default function LogisticsPage() {
  return (
    <ProtectedRoute allowedRoles={['firefighter_hq', 'admin']}>
      <LogisticsPageContent />
    </ProtectedRoute>
  );
}
