'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useTour } from '@/providers/TourProvider';
import { FeatureGuideModal, HelpButton } from '@/components/tour';
import { ConfirmDialog } from '@/components/dialogs';
import { useToast } from '@/hooks/use-toast';
import { api, Resident as ApiResident } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Filter,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Home,
  Edit2,
  Trash2,
  Plus,
  X,
} from 'lucide-react';

// Feature guide content for residents
const residentsFeatures = [
  { id: "roster", title: "Residents Roster", description: "View all residents with their current status, apartment assignment, and contact information. Filter by type (owner, tenant, resident) or search by name and email." },
  { id: "management", title: "Resident Management", description: "Add, edit, or remove residents from the system. Track resident type, apartment assignments, and emergency contacts for safety and communication purposes." },
  { id: "types", title: "Resident Types & Status", description: "Residents are categorized as Owner, Tenant, or Resident. Each has active/inactive status for tracking current occupancy and managing access permissions." },
  { id: "communication", title: "Direct Communication", description: "Use the phone and email buttons to communicate directly with residents. Quick communication ensures efficient resident services and emergency coordination." },
];

function ResidentsManagementContent() {
  const { user, role } = useAuth();
  const { setCurrentPage } = useTour();
  const { toast } = useToast();

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState<ApiResident | null>(null);
  const [editingResident, setEditingResident] = useState<ApiResident | null>(null);

  // Data State
  const [residents, setResidents] = useState<ApiResident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    apartmentId: undefined as number | undefined,
    type: 'resident',
    isActive: true,
    emergencyContact: '',
  });

  // Set current page for tour
  useEffect(() => {
    setCurrentPage("residents");
  }, [setCurrentPage]);

  // Load residents from API
  useEffect(() => {
    if (user && (role === 'building_authority' || role === 'management')) {
      loadResidents();
    }
  }, [user, role]);

  const loadResidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getResidents();
      setResidents(data);
    } catch (err: any) {
      console.error('Failed to load residents:', err);
      setError(err.message || 'Failed to load residents');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (resident: ApiResident) => {
    toast({
      title: "Call Initiated",
      description: `Calling ${resident.name} at ${resident.phone || 'No phone number'}...`,
      duration: 3000,
    });
  };

  const handleEmail = (resident: ApiResident) => {
    window.location.href = `mailto:${resident.email}`;
  };

  const handleAdd = () => {
    setEditingResident(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      apartmentId: undefined,
      type: 'resident',
      isActive: true,
      emergencyContact: '',
    });
    setShowModal(true);
  };

  const handleEdit = (resident: ApiResident) => {
    setEditingResident(resident);
    setFormData({
      name: resident.name,
      email: resident.email,
      phone: resident.phone || '',
      apartmentId: resident.apartmentId,
      type: resident.type,
      isActive: resident.isActive,
      emergencyContact: resident.emergencyContact || '',
    });
    setShowModal(true);
  };

  const handleDeleteClick = (resident: ApiResident) => {
    setSelectedResident(resident);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedResident) return;

    try {
      await api.deleteResident(selectedResident.id);
      toast({
        title: "Resident Deleted",
        description: `${selectedResident.name} has been removed from the system.`,
        duration: 3000,
      });
      setShowDeleteDialog(false);
      await loadResidents();
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to delete resident: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingResident) {
        await api.updateResident(editingResident.id, formData);
        toast({
          title: "Resident Updated",
          description: `${formData.name} has been updated successfully.`,
          duration: 3000,
        });
      } else {
        await api.createResident(formData);
        toast({
          title: "Resident Added",
          description: `${formData.name} has been added to the system.`,
          duration: 3000,
        });
      }
      setShowModal(false);
      await loadResidents();
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to save resident: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const filteredResidents = residents.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (resident: ApiResident) => {
    if (resident.isActive) {
      return <Badge className="bg-green-500 text-white">Active</Badge>;
    }
    return <Badge className="bg-gray-500 text-white">Inactive</Badge>;
  };

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'owner':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Owner</Badge>;
      case 'tenant':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">Tenant</Badge>;
      default:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Resident</Badge>;
    }
  };

  if (!user || (role !== 'building_authority' && role !== 'management')) return null;

  return (
    <DashboardLayout role="admin" userName={user?.name || 'Admin'} userTitle="ADMINISTRATOR">
      <main className="flex-1 space-y-4 overflow-auto p-4 sm:space-y-6 sm:p-6 md:p-8">
        <FeatureGuideModal
          features={residentsFeatures}
          isOpen={showGuide}
          onClose={() => setShowGuide(false)}
          title="Residents Management Features"
        />

        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Residents Management</h1>
            <p className="text-sm text-muted-foreground">
              Active residents: {filteredResidents.filter(r => r.isActive).length} / {residents.length} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleAdd} className="gap-2 bg-[#1f3d2f] text-white hover:bg-[#2a4f3d]">
              <Plus className="h-4 w-4" />
              Add Resident
            </Button>
            <HelpButton onClick={() => setShowGuide(true)} />
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or type..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent w-full sm:w-auto">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Residents List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Active Residents</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1f3d2f]"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-red-600">
                <AlertCircle className="w-6 h-6 mr-2" />
                <span>{error}</span>
              </div>
            ) : filteredResidents.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <span>No residents found matching your search.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredResidents.map((resident) => (
                  <div
                    key={resident.id}
                    className="flex flex-col items-start gap-4 sm:items-center sm:flex-row sm:justify-between lg:gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <Avatar className="flex-shrink-0">
                        <AvatarImage src={`https://avatar.vercel.sh/${resident.name}`} />
                        <AvatarFallback>
                          {resident.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{resident.name}</span>
                          {resident.isActive && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
                          {!resident.isActive && <AlertCircle className="h-4 w-4 text-gray-500 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{resident.email}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Home className="h-3 w-3 flex-shrink-0" />
                            <span>Apt: {resident.apartment?.unit_number || resident.apartmentId || 'N/A'}</span>
                          </div>
                          {resident.phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span>{resident.phone}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-1 flex gap-1 flex-wrap">
                          {getTypeBadge(resident.type)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="text-right flex-1 sm:flex-none">
                        {getStatusBadge(resident)}
                      </div>
                      <div className="flex items-center gap-1">
                        {resident.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground h-8 w-8"
                            onClick={() => handleCall(resident)}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground h-8 w-8"
                          onClick={() => handleEmail(resident)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-600 hover:text-blue-700 h-8 w-8"
                          onClick={() => handleEdit(resident)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 h-8 w-8"
                          onClick={() => handleDeleteClick(resident)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{editingResident ? 'Edit Resident' : 'Add New Resident'}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowModal(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Full Name *
                      </label>
                      <Input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Ahmed Khan"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ahmed@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Phone
                      </label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+92-300-1234567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Apartment ID
                      </label>
                      <Input
                        type="number"
                        value={formData.apartmentId || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            apartmentId: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-border rounded-lg focus:border-[#1f3d2f] focus:ring-2 focus:ring-[#1f3d2f]/20 focus:outline-none"
                      >
                        <option value="resident">Resident</option>
                        <option value="owner">Owner</option>
                        <option value="tenant">Tenant</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Emergency Contact
                      </label>
                      <Input
                        type="text"
                        value={formData.emergencyContact}
                        onChange={(e) =>
                          setFormData({ ...formData, emergencyContact: e.target.value })
                        }
                        placeholder="e.g., Ali Khan: +92-301-7654321"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) =>
                            setFormData({ ...formData, isActive: e.target.checked })
                          }
                          className="w-5 h-5 text-[#1f3d2f] border-border rounded focus:ring-[#1f3d2f]"
                        />
                        <span className="text-sm font-semibold text-foreground">Active</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-[#1f3d2f] text-white hover:bg-[#2a4f3d]"
                    >
                      {editingResident ? 'Update Resident' : 'Add Resident'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          title="Delete Resident"
          description={
            selectedResident
              ? `Are you sure you want to delete ${selectedResident.name}? This action cannot be undone.`
              : ''
          }
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      </main>
    </DashboardLayout>
  );
}

export default function ResidentsManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'building_authority']}>
      <ResidentsManagementContent />
    </ProtectedRoute>
  );
}
