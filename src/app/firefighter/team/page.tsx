'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  Search,
  Filter,
  MoreVertical,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Inbox,
} from 'lucide-react';

interface EmployeeData {
  id: number;
  userId: number;
  name: string;
  email: string;
  role: string;
  position: string;
  rank: string;
  badgeNumber: string;
  status: string;
  hireDate: string;
  brigadeName: string | null;
  stateName: string | null;
}

function PersonnelPageContent() {
  const { user, dashboardRole, roleTitle } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [callLoading, setCallLoading] = useState(false);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [jurisdiction, setJurisdiction] = useState<{ level: string; name: string; id: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchEmployees();
    }
  }, [user?.id]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.getEmployeesByJurisdiction(Number(user!.id));
      setEmployees(data.employees);
      setJurisdiction(data.jurisdiction);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (person: { id: number; name: string }) => {
    setSelectedPersonnel(person);
    setShowCallDialog(true);
  };

  const handleConfirmCall = async () => {
    setCallLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast({
      title: 'Call Initiated',
      description: `Calling ${selectedPersonnel?.name}...`,
      duration: 3000,
    });
    setCallLoading(false);
    setShowCallDialog(false);
  };

  const handleMessage = (person: { id: number; name: string }) => {
    toast({
      title: 'Message',
      description: `Message box opened for ${person.name}`,
      duration: 3000,
    });
  };

  const filteredPersonnel = employees.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.position || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.rank || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case 'on_leave':
        return <Badge className="bg-amber-500 text-white">On Leave</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500 text-white">Inactive</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status || 'Unknown'}</Badge>;
    }
  };

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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Personnel Management
              </h1>
              {jurisdiction && (
                <Badge variant="outline" className="text-xs font-medium border-[#1f3d2f] text-[#1f3d2f]">
                  {jurisdiction.level.toUpperCase()}: {jurisdiction.name}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading...' : `${filteredPersonnel.length} personnel in jurisdiction`}
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, position, or rank..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="gap-2 bg-transparent w-full sm:w-auto"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Personnel Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Active Personnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-sm text-muted-foreground">Loading personnel...</span>
              </div>
            ) : filteredPersonnel.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Inbox className="h-12 w-12 opacity-30 mb-3" />
                <p className="text-sm">{searchTerm ? 'No personnel match your search' : 'No personnel found in your jurisdiction'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPersonnel.map((person) => (
                  <div
                    key={person.id}
                    className="flex flex-col items-start gap-4 sm:items-center sm:flex-row sm:justify-between lg:gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <Avatar className="flex-shrink-0">
                        <AvatarImage
                          src={`https://avatar.vercel.sh/${person.name}`}
                        />
                        <AvatarFallback>
                          {person.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {person.name}
                          </span>
                          {person.status === 'active' && (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                          {person.status === 'on_leave' && (
                            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {person.position || 'No position'} {person.badgeNumber ? `• ${person.badgeNumber}` : ''}
                        </p>
                        <div className="mt-1 flex gap-1 flex-wrap">
                          {person.rank && (
                            <Badge variant="outline" className="text-xs">
                              {person.rank}
                            </Badge>
                          )}
                          {person.brigadeName && (
                            <Badge variant="outline" className="text-xs">
                              {person.brigadeName}
                            </Badge>
                          )}
                          {person.stateName && (
                            <Badge variant="outline" className="text-xs">
                              {person.stateName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="text-right flex-1 sm:flex-none">
                        {getStatusBadge(person.status)}
                        {person.hireDate && (
                          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" />
                            Since {new Date(person.hireDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground h-8 w-8"
                          onClick={() => handleCall(person)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground h-8 w-8"
                          onClick={() => handleMessage(person)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground h-8 w-8"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call Dialog */}
        <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Initiate Call</DialogTitle>
              <DialogDescription>
                {selectedPersonnel
                  ? `Call ${selectedPersonnel.name}`
                  : ''}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCallDialog(false)}
                disabled={callLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmCall} disabled={callLoading}>
                {callLoading ? 'Processing...' : 'Call'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default function PersonnelPage() {
  return (
    <ProtectedRoute allowedRoles={['firefighter_hq', 'firefighter_state', 'admin']}>
      <PersonnelPageContent />
    </ProtectedRoute>
  );
}
