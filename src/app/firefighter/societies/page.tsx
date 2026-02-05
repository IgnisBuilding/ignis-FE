"use client"

import { useState, useEffect } from "react"
import { Building2, MapPin, Plus, Search, Shield, Users, AlertTriangle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import DashboardLayout from "@/components/layout/DashboardLayout"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Society {
  id: number
  name: string
  location: string
  brigade_id: number
  owner_id: number
  brigade_name: string
  state_name: string
  hq_name: string
  building_count: number
  created_at: string
  display_label: string
}

interface Brigade {
  id: number
  name: string
  location: string
  state_name: string
  hq_name: string
  display_label: string
}

interface SocietyFormData {
  name: string
  location: string
  brigade_id: number | undefined
}

interface DeleteState {
  isOpen: boolean
  societyId: number | null
  societyName: string
}

interface EmployeeInfo {
  id: number
  hq_id: number | null
  state_id: number | null
  brigade_id: number | null
  hq_name: string | null
  jurisdiction_level: "hq" | "state" | "district" | null
}

function SocietiesManagementContent() {
  const { user, dashboardRole, roleTitle } = useAuth()
  const { toast } = useToast()
  const [societies, setSocieties] = useState<Society[]>([])
  const [brigades, setBrigades] = useState<Brigade[]>([])
  const [filteredSocieties, setFilteredSocieties] = useState<Society[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSociety, setEditingSociety] = useState<Society | null>(null)
  const [formData, setFormData] = useState<SocietyFormData>({
    name: "",
    location: "",
    brigade_id: undefined,
  })
  const [deleteState, setDeleteState] = useState<DeleteState>({
    isOpen: false,
    societyId: null,
    societyName: "",
  })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    if (user?.id) {
      checkAccessAndFetchData()
    }
  }, [user?.id])

  useEffect(() => {
    const filtered = societies.filter(
      (society) =>
        society.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        society.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (society.brigade_name && society.brigade_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredSocieties(filtered)
    setCurrentPage(1)
  }, [searchTerm, societies])

  const checkAccessAndFetchData = async () => {
    try {
      setLoading(true)

      // First check if user is an HQ firefighter
      const empResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/buildings/by-jurisdiction/${user?.id}`
      )

      if (empResponse.ok) {
        const data = await empResponse.json()

        // Check if user has HQ level access
        if (data.jurisdictionLevel !== "hq") {
          setAccessDenied(true)
          setLoading(false)
          return
        }

        setEmployeeInfo({
          id: data.employee?.id,
          hq_id: data.employee?.hq_id,
          state_id: data.employee?.state_id,
          brigade_id: data.employee?.brigade_id,
          hq_name: data.employee?.hq_name,
          jurisdiction_level: data.jurisdictionLevel,
        })

        // Fetch societies and brigades
        await Promise.all([fetchSocieties(), fetchBrigades()])
      }
    } catch (err: any) {
      console.error("Error checking access:", err)
      toast({
        title: "Error",
        description: "Failed to verify access permissions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSocieties = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buildings/societies`)
      if (response.ok) {
        const data = await response.json()
        setSocieties(data)
        setFilteredSocieties(data)
      }
    } catch (err: any) {
      console.error("Error fetching societies:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to load societies",
        variant: "destructive",
      })
    }
  }

  const fetchBrigades = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buildings/brigades`)
      if (response.ok) {
        const data = await response.json()
        setBrigades(data)
      }
    } catch (err) {
      console.error("Error fetching brigades:", err)
    }
  }

  const handleOpenModal = (society?: Society) => {
    if (society) {
      setEditingSociety(society)
      setFormData({
        name: society.name,
        location: society.location,
        brigade_id: society.brigade_id,
      })
    } else {
      setEditingSociety(null)
      setFormData({
        name: "",
        location: "",
        brigade_id: brigades.length > 0 ? brigades[0].id : undefined,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingSociety(null)
    setFormData({
      name: "",
      location: "",
      brigade_id: undefined,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.brigade_id) {
      toast({
        title: "Error",
        description: "Please select a fire brigade/district",
        variant: "destructive",
      })
      return
    }

    try {
      const url = editingSociety
        ? `${process.env.NEXT_PUBLIC_API_URL}/buildings/societies/${editingSociety.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/buildings/societies`

      const response = await fetch(url, {
        method: editingSociety ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      toast({
        title: "Success",
        description: editingSociety ? "Society updated successfully!" : "Society created successfully!",
      })

      await fetchSocieties()
      handleCloseModal()
    } catch (err: any) {
      console.error("Error saving society:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to save society",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (id: number, name: string) => {
    setDeleteState({
      isOpen: true,
      societyId: id,
      societyName: name,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteState.societyId) return

    try {
      setDeleteLoading(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/buildings/societies/${deleteState.societyId}`,
        { method: "DELETE" }
      )
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      toast({
        title: "Success",
        description: "Society deleted successfully!",
      })
      await fetchSocieties()
      setDeleteState({ isOpen: false, societyId: null, societyName: "" })
    } catch (err: any) {
      console.error("Error deleting society:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete society",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteState({ isOpen: false, societyId: null, societyName: "" })
  }

  const totalPages = Math.ceil(filteredSocieties.length / itemsPerPage)
  const paginatedSocieties = filteredSocieties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalSocieties = societies.length
  const totalBuildings = societies.reduce((sum, s) => sum + s.building_count, 0)

  // Access denied view for non-HQ firefighters
  if (accessDenied) {
    return (
      <DashboardLayout role={dashboardRole} userName={user?.name || "Firefighter"} userTitle={roleTitle}>
        <div className="h-[calc(100vh-4rem)] w-full overflow-auto">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-none">
            <Card className="p-12">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h2>
                <p className="text-muted-foreground mb-4">
                  Society management is only available to HQ-level firefighters.
                </p>
                <p className="text-sm text-muted-foreground">
                  Contact your HQ administrator if you need to add or modify societies.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role={dashboardRole} userName={user?.name || "Firefighter"} userTitle={roleTitle}>
      <div className="h-[calc(100vh-4rem)] w-full overflow-auto">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-none">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-foreground">Societies Directory</h1>
                  {employeeInfo?.hq_name && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <Shield className="h-3 w-3" />
                      {employeeInfo.hq_name}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Manage societies and their fire brigade assignments
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleOpenModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Society
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Societies</p>
                    <p className="text-2xl font-bold text-foreground">{totalSocieties}</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-2.5 h-10 w-10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Buildings</p>
                    <p className="text-2xl font-bold text-foreground">{totalBuildings}</p>
                    <p className="text-xs text-muted-foreground mt-1">Across all societies</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-2.5 h-10 w-10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fire Brigades</p>
                    <p className="text-2xl font-bold text-foreground">{brigades.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Available districts</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-2.5 h-10 w-10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search societies by name, location, or brigade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Societies Table */}
          {loading ? (
            <Card className="p-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                <p className="mt-4 text-muted-foreground">Loading societies...</p>
              </div>
            </Card>
          ) : filteredSocieties.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No societies found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm
                    ? "Try adjusting your search"
                    : "Get started by adding your first society"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => handleOpenModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Society
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-4 font-medium text-muted-foreground">Society</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Location</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Fire Brigade</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Jurisdiction</th>
                        <th className="text-center p-4 font-medium text-muted-foreground">Buildings</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSocieties.map((society) => (
                        <tr key={society.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{society.name}</p>
                                <p className="text-xs text-muted-foreground">ID: {society.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {society.location}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <Shield className="h-3 w-3" />
                              {society.brigade_name || "Not Assigned"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              {society.state_name && (
                                <p className="text-muted-foreground">State: {society.state_name}</p>
                              )}
                              {society.hq_name && (
                                <p className="text-xs text-muted-foreground">HQ: {society.hq_name}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              {society.building_count}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenModal(society)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteClick(society.id, society.name)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredSocieties.length)} of{" "}
                    {filteredSocieties.length} societies
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSociety ? "Edit Society" : "Add New Society"}</DialogTitle>
            <DialogDescription>
              {editingSociety
                ? "Update the society information below"
                : "Enter the details for the new society"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Society Name *
              </label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Model Colony Society"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Location *</label>
              <Input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Model Colony, Karachi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Fire Brigade / District *
              </label>
              <select
                required
                value={formData.brigade_id || ""}
                onChange={(e) => setFormData({ ...formData, brigade_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">-- Select Fire Brigade --</option>
                {brigades.map((brigade) => (
                  <option key={brigade.id} value={brigade.id}>
                    {brigade.display_label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                All buildings in this society will be under this fire brigade's jurisdiction
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit">{editingSociety ? "Update Society" : "Create Society"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteState.isOpen}
        title="Delete Society"
        description={`Are you sure you want to delete "${deleteState.societyName}"? This action cannot be undone. Note: Societies with buildings cannot be deleted.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </DashboardLayout>
  )
}

export default function FirefighterSocietiesPage() {
  return (
    <ProtectedRoute allowedRoles={["firefighter", "firefighter_hq", "firefighter_state", "firefighter_district", "admin"]}>
      <SocietiesManagementContent />
    </ProtectedRoute>
  )
}
