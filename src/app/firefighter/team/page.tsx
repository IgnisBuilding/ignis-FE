'use client';

import { useState } from 'react';
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
import {
  Search,
  Filter,
  MoreVertical,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';

const personnelData = [
  {
    id: 1,
    name: 'Chief Marcus',
    role: 'Incident Commander',
    unit: 'IC-01',
    status: 'On Duty',
    certifications: ['Haz-Mat', 'Swift Water'],
    availability: 'Available',
    hours: '12h',
  },
  {
    id: 2,
    name: 'Lt. Sarah Chen',
    role: 'Squad Leader',
    unit: 'SQ-42',
    status: 'On Duty',
    certifications: ['Rope Rescue', 'Confined Space'],
    availability: 'Deployed',
    hours: '8h',
  },
  {
    id: 3,
    name: 'FF Jackson',
    role: 'Firefighter',
    unit: 'EN-12',
    status: 'On Duty',
    certifications: ['Basic Life Support'],
    availability: 'Available',
    hours: '10h',
  },
  {
    id: 4,
    name: 'Paramedic Davis',
    role: 'Rescue Specialist',
    unit: 'RE-02',
    status: 'Standby',
    certifications: ['Advanced Life Support', 'Tactical Combat Casualty Care'],
    availability: 'Available',
    hours: '0h',
  },
  {
    id: 5,
    name: 'FF Thompson',
    role: 'Firefighter',
    unit: 'EN-15',
    status: 'Off Duty',
    certifications: ['Basic Life Support'],
    availability: 'Off Duty',
    hours: '0h',
  },
];

function PersonnelPageContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCall = (person: { id: number; name: string }) => {
    setSelectedPersonnel(person);
    setShowCallDialog(true);
  };

  const handleConfirmCall = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast({
      title: 'Call Initiated',
      description: `Calling ${selectedPersonnel?.name}...`,
      duration: 3000,
    });
    setLoading(false);
    setShowCallDialog(false);
  };

  const handleMessage = (person: { id: number; name: string }) => {
    toast({
      title: 'Message',
      description: `Message box opened for ${person.name}`,
      duration: 3000,
    });
  };

  const filteredPersonnel = personnelData.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'On Duty':
        return <Badge className="bg-green-500 text-white">On Duty</Badge>;
      case 'Standby':
        return <Badge className="bg-amber-500 text-white">Standby</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Off Duty</Badge>;
    }
  };

  return (
    <DashboardLayout
      role="firefighter"
      userName={user?.name || 'Cmdr. Sterling'}
      userTitle="SENIOR DIRECTOR"
    >
      <div className="flex-1 space-y-4 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8 sm:space-y-6 w-full max-w-none">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Personnel Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Active personnel: {filteredPersonnel.length} /{' '}
              {personnelData.length}
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or role..."
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
                        {person.status === 'On Duty' && (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                        {person.status === 'Standby' && (
                          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {person.role} • {person.unit}
                      </p>
                      <div className="mt-1 flex gap-1 flex-wrap">
                        {person.certifications.map((cert) => (
                          <Badge key={cert} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="text-right flex-1 sm:flex-none">
                      {getStatusBadge(person.status)}
                      {person.hours && (
                        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" />
                          {person.hours}
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
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmCall} disabled={loading}>
                {loading ? 'Processing...' : 'Call'}
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
    <ProtectedRoute allowedRoles={['firefighter']}>
      <PersonnelPageContent />
    </ProtectedRoute>
  );
}
