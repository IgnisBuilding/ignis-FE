"use client"

import { useState, useEffect } from "react"
import { Building2, Download, FileDown, Layers, Plus, Search, X } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { buildingApi } from "../../../lib/api"
import DashboardLayout from "@/components/layout/DashboardLayout"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { BuildingsTable } from "@/components/buildings"
import { FilterSidebar } from "@/components/buildings"
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Building {
  id: number
  name: string
  type: string
  address: string
  society_id: number
  created_at: string
  updated_at: string
}

interface BuildingFormData {
  name: string
  address: string
  type: string
}

interface DeleteState {
  isOpen: boolean
  buildingId: number | null
  buildingName: string
}

function BuildingsManagementContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [filteredBuildings, setFilteredBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null)
  const [formData, setFormData] = useState<BuildingFormData>({
    name: "",
    address: "",
    type: "residential",
  })
  const [deleteState, setDeleteState] = useState<DeleteState>({
    isOpen: false,
    buildingId: null,
    buildingName: "",
  })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchBuildings()
  }, [])

  useEffect(() => {
    let filtered = buildings.filter(
      (building) =>
        building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        building.address.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (selectedFilters.length > 0) {
      filtered = filtered.filter((building) => {
        const typeMatch = selectedFilters.some((filter) =>
          filter.toLowerCase().includes(building.type.toLowerCase())
        )
        return typeMatch || selectedFilters.length === 0
      })
    }

    setFilteredBuildings(filtered)
    setCurrentPage(1)
  }, [searchTerm, buildings, selectedFilters])

  const fetchBuildings = async () => {
    try {
      setLoading(true)
      const data = await buildingApi.getBuildings()
      setBuildings(data)
      setFilteredBuildings(data)
    } catch (err: any) {
      console.error("Error fetching buildings:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to load buildings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (building?: Building) => {
    if (building) {
      setEditingBuilding(building)
      setFormData({
        name: building.name,
        address: building.address,
        type: building.type,
      })
    } else {
      setEditingBuilding(null)
      setFormData({
        name: "",
        address: "",
        type: "residential",
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingBuilding(null)
    setFormData({
      name: "",
      address: "",
      type: "residential",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingBuilding) {
        await buildingApi.updateBuilding(editingBuilding.id, formData)
        toast({
          title: "Success",
          description: "Building updated successfully!",
        })
      } else {
        await buildingApi.createBuilding(formData)
        toast({
          title: "Success",
          description: "Building created successfully!",
        })
      }

      await fetchBuildings()
      handleCloseModal()
    } catch (err: any) {
      console.error("Error saving building:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to save building",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (id: number, name: string) => {
    setDeleteState({
      isOpen: true,
      buildingId: id,
      buildingName: name,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteState.buildingId) return

    try {
      setDeleteLoading(true)
      await buildingApi.deleteBuilding(deleteState.buildingId)
      toast({
        title: "Success",
        description: "Building deleted successfully!",
      })
      await fetchBuildings()
      setDeleteState({ isOpen: false, buildingId: null, buildingName: "" })
    } catch (err: any) {
      console.error("Error deleting building:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete building",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteState({ isOpen: false, buildingId: null, buildingName: "" })
  }

  const handleFilterChange = (filter: string) => {
    setSelectedFilters((prev) => {
      if (prev.includes(filter)) {
        return prev.filter((f) => f !== filter)
      } else {
        return [...prev, filter]
      }
    })
  }

  const handleExportReport = () => {
    // TODO: Implement export functionality
    toast({
      title: "Export Report",
      description: "Export functionality will be implemented soon",
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setSearchTerm("")
  }

  const totalPages = Math.ceil(filteredBuildings.length / itemsPerPage)
  const paginatedBuildings = filteredBuildings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Calculate stats
  const totalBuildings = buildings.length
  const totalFloors = 0 // TODO: Add total_floors field to Building interface when available
  const avgFloors = totalBuildings > 0 ? (totalFloors / totalBuildings).toFixed(1) : "0"

  return (
    <DashboardLayout role="admin" userName={user?.name || "Admin"} userTitle="ADMINISTRATOR">
      <div className="flex h-[calc(100vh-4rem)] w-full max-w-none">
        {/* Filter Sidebar */}
        <FilterSidebar selectedFilters={selectedFilters} onFilterChange={handleFilterChange} />

        {/* Main Content */}
        <div className="flex-1 overflow-auto w-full">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-none">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-1">Buildings Directory</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage and monitor all building assets across the portfolio
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportReport}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button size="sm" onClick={() => handleOpenModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Building
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Buildings</p>
                      <p className="text-2xl font-bold text-foreground">{totalBuildings}</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-2.5 h-10 w-10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Floors</p>
                      <p className="text-2xl font-bold text-foreground">{totalFloors}</p>
                      <p className="text-xs text-muted-foreground mt-1">Across all buildings</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-2.5 h-10 w-10 flex items-center justify-center">
                      <Layers className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Avg Floors</p>
                      <p className="text-2xl font-bold text-foreground">{avgFloors}</p>
                      <p className="text-xs text-muted-foreground mt-1">Per building</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-2.5 h-10 w-10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Search and Active Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search buildings by name or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {(selectedFilters.length > 0 || searchTerm) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {selectedFilters.map((filter) => (
                      <span
                        key={filter}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-foreground text-sm rounded-md"
                      >
                        {filter}
                        <button
                          onClick={() => handleFilterChange(filter)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {searchTerm && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-foreground text-sm rounded-md">
                        Search: {searchTerm}
                        <button onClick={() => setSearchTerm("")} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                      Clear all
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Buildings Table */}
            {loading ? (
              <Card className="p-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  <p className="mt-4 text-muted-foreground">Loading buildings...</p>
                </div>
              </Card>
            ) : filteredBuildings.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No buildings found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm || selectedFilters.length > 0
                      ? "Try adjusting your search or filters"
                      : "Get started by adding your first building"}
                  </p>
                  {!searchTerm && selectedFilters.length === 0 && (
                    <Button onClick={() => handleOpenModal()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Building
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <>
                <BuildingsTable
                  buildings={paginatedBuildings}
                  onEdit={handleOpenModal}
                  onDelete={handleDeleteClick}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredBuildings.length)} of{" "}
                      {filteredBuildings.length} buildings
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
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBuilding ? "Edit Building" : "Add New Building"}</DialogTitle>
            <DialogDescription>
              {editingBuilding
                ? "Update the building information below"
                : "Enter the details for the new building"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Building Name *
              </label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Tower A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Address *</label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="e.g., 123 Main Street, City, State 12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Building Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="mixed">Mixed Use</option>
              </select>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit">{editingBuilding ? "Update Building" : "Create Building"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteState.isOpen}
        title="Delete Building"
        description={`Are you sure you want to delete "${deleteState.buildingName}"? This action cannot be undone.`}
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

export default function BuildingsManagementPage() {
  return (
    <ProtectedRoute allowedRoles={["management", "building_authority"]}>
      <BuildingsManagementContent />
    </ProtectedRoute>
  )
}
