"use client"

import { useState, useEffect } from "react"
import { Building2, ChevronRight, MapPin, Phone, Mail, Plus, Search, Shield, Flame, Copy, Check } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import DashboardLayout from "@/components/layout/DashboardLayout"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface State {
  id: number
  name: string
  state: string
  address: string
  phone: string
  status: string
  hq_id: number
  hq_name: string
  brigade_count: number
  employee_count: number
  created_at: string
}

interface Station {
  id: number
  name: string
  location: string
  address: string
  phone: string
  email: string
  capacity: number
  status: string
  state_id: number
  state_name: string
  state_code: string
  hq_name: string
  hq_id: number
  society_count: number
  employee_count: number
  created_at: string
}

interface EmployeeInfo {
  id: number
  hq_id: number | null
  state_id: number | null
  brigade_id: number | null
  hq_name: string | null
  jurisdiction_level: "hq" | "state" | "district" | null
}

type EntityType = "state" | "station"

interface DeleteState {
  isOpen: boolean
  entityType: EntityType | null
  entityId: number | null
  entityName: string
}

function StationsManagementContent() {
  const { user, dashboardRole, roleTitle } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<EntityType>("station")
  const [states, setStates] = useState<State[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEntity, setEditingEntity] = useState<any>(null)
  const [modalType, setModalType] = useState<EntityType>("station")
  const [formData, setFormData] = useState<any>({})

  // Delete state
  const [deleteState, setDeleteState] = useState<DeleteState>({
    isOpen: false,
    entityType: null,
    entityId: null,
    entityName: "",
  })
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Credentials modal state
  const [credentialsModal, setCredentialsModal] = useState<{
    isOpen: boolean
    email: string
    password: string
    role: string
    entityName: string
  }>({ isOpen: false, email: "", password: "", role: "", entityName: "" })
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      checkAccessAndFetchData()
    }
  }, [user?.id])

  const checkAccessAndFetchData = async () => {
    try {
      setLoading(true)
      const empResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/buildings/by-jurisdiction/${user?.id}`
      )

      if (empResponse.ok) {
        const data = await empResponse.json()

        // Support both response formats
        const level = data.jurisdictionLevel || data.jurisdiction?.level
        const emp = data.employee || {}

        const info: EmployeeInfo = {
          id: emp.id,
          hq_id: emp.hq_id,
          state_id: emp.state_id,
          brigade_id: emp.brigade_id,
          hq_name: emp.hq_name,
          jurisdiction_level: level,
        }
        setEmployeeInfo(info)

        if (level === "hq") {
          setActiveTab("state")
          await Promise.all([
            fetchStatesForHQ(emp.hq_id),
            fetchStationsForHQ(emp.hq_id),
          ])
        } else if (level === "state") {
          setActiveTab("station")
          await fetchStationsForState(emp.state_id)
        }
      }
    } catch (err) {
      console.error("Error checking access:", err)
      toast({ title: "Error", description: "Failed to verify access", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchStatesForHQ = async (hqId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-states/by-hq/${hqId}`)
      if (response.ok) {
        setStates(await response.json())
      } else {
        // Fallback: fetch all states and filter
        const allResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-states`)
        if (allResponse.ok) {
          const allStates = await allResponse.json()
          setStates(allStates.filter((s: State) => s.hq_id === hqId))
        }
      }
    } catch (err) {
      console.error("Error fetching states:", err)
    }
  }

  const fetchStationsForHQ = async (hqId: number) => {
    try {
      // Fetch all stations then filter by hq_id
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-stations`)
      if (response.ok) {
        const allStations = await response.json()
        setStations(allStations.filter((s: Station) => s.hq_id === hqId))
      }
    } catch (err) {
      console.error("Error fetching stations:", err)
    }
  }

  const fetchStationsForState = async (stateId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-stations/by-state/${stateId}`)
      if (response.ok) {
        setStations(await response.json())
      } else {
        // Fallback: fetch all stations and filter
        const allResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-stations`)
        if (allResponse.ok) {
          const allStations = await allResponse.json()
          setStations(allStations.filter((s: Station) => s.state_id === stateId))
        }
      }
    } catch (err) {
      console.error("Error fetching stations:", err)
    }
  }

  const refreshData = async () => {
    if (!employeeInfo) return
    if (employeeInfo.jurisdiction_level === "hq" && employeeInfo.hq_id) {
      await Promise.all([
        fetchStatesForHQ(employeeInfo.hq_id),
        fetchStationsForHQ(employeeInfo.hq_id),
      ])
    } else if (employeeInfo.jurisdiction_level === "state" && employeeInfo.state_id) {
      await fetchStationsForState(employeeInfo.state_id)
    }
  }

  const handleOpenModal = (type: EntityType, entity?: any) => {
    setModalType(type)
    setEditingEntity(entity || null)

    if (entity) {
      setFormData({ ...entity })
    } else {
      if (type === "state") {
        setFormData({ name: "", state: "", hq_id: employeeInfo?.hq_id, address: "", phone: "" })
      } else {
        setFormData({
          name: "",
          location: "",
          state_id: states[0]?.id || employeeInfo?.state_id,
          address: "",
          phone: "",
          email: "",
          capacity: 10,
        })
      }
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingEntity(null)
    setFormData({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let url = ""
      const method = editingEntity ? "PATCH" : "POST"

      if (modalType === "state") {
        url = editingEntity
          ? `${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-states/${editingEntity.id}`
          : `${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-states`
      } else {
        url = editingEntity
          ? `${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-stations/${editingEntity.id}`
          : `${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-stations`
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      toast({ title: "Success", description: editingEntity ? "Updated successfully!" : "Created successfully!" })
      await refreshData()
      handleCloseModal()

      // Show credentials if a new entity was created
      if (!editingEntity && data.credentials) {
        setCredentialsModal({
          isOpen: true,
          email: data.credentials.email,
          password: data.credentials.password,
          role: data.credentials.role,
          entityName: formData.name,
        })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save", variant: "destructive" })
    }
  }

  const handleDeleteClick = (type: EntityType, id: number, name: string) => {
    setDeleteState({ isOpen: true, entityType: type, entityId: id, entityName: name })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteState.entityId || !deleteState.entityType) return
    try {
      setDeleteLoading(true)
      const url = deleteState.entityType === "state"
        ? `${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-states/${deleteState.entityId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-stations/${deleteState.entityId}`

      const response = await fetch(url, { method: "DELETE" })
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      toast({ title: "Success", description: "Deleted successfully!" })
      await refreshData()
      setDeleteState({ isOpen: false, entityType: null, entityId: null, entityName: "" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete", variant: "destructive" })
    } finally {
      setDeleteLoading(false)
    }
  }

  const isHQ = employeeInfo?.jurisdiction_level === "hq"
  const filteredStates = states.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.state.toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredStations = stations.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.location?.toLowerCase().includes(searchTerm.toLowerCase()))

  const getModalTitle = () => {
    const action = editingEntity ? "Edit" : "Add"
    return modalType === "state" ? `${action} State/Region Office` : `${action} Fire Station`
  }

  // Available states for station form dropdown
  const availableStates = states

  return (
    <DashboardLayout role={dashboardRole} userName={user?.name || "Firefighter"} userTitle={roleTitle}>
      <div className="h-[calc(100vh-4rem)] w-full overflow-auto">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-none">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-foreground">Fire Stations</h1>
                  {employeeInfo?.hq_name && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <Shield className="h-3 w-3" />
                      {employeeInfo.hq_name}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isHQ ? "Manage state offices and district fire stations" : "Manage fire stations under your jurisdiction"}
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className={`grid grid-cols-1 ${isHQ ? "md:grid-cols-2" : "md:grid-cols-1"} gap-4 mb-6`}>
              {isHQ && (
                <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab("state")}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">State Offices</p>
                      <p className="text-2xl font-bold text-foreground">{states.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Under your HQ</p>
                    </div>
                    <div className={`rounded-lg p-2.5 h-10 w-10 flex items-center justify-center ${activeTab === "state" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      <Building2 className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              )}

              <Card className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors`} onClick={() => setActiveTab("station")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fire Stations</p>
                    <p className="text-2xl font-bold text-foreground">{stations.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">District/Local stations</p>
                  </div>
                  <div className={`rounded-lg p-2.5 h-10 w-10 flex items-center justify-center ${activeTab === "station" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    <Shield className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Search and Add */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder={`Search ${activeTab === "state" ? "states" : "stations"}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => handleOpenModal(activeTab)}>
                <Plus className="h-4 w-4 mr-2" />
                Add {activeTab === "state" ? "State" : "Station"}
              </Button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <Card className="p-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                <p className="mt-4 text-muted-foreground">Loading...</p>
              </div>
            </Card>
          ) : (
            <>
              {/* States Tab (HQ only) */}
              {activeTab === "state" && isHQ && (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left p-4 font-medium text-muted-foreground">State Office</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Contact</th>
                          <th className="text-center p-4 font-medium text-muted-foreground">Stations</th>
                          <th className="text-center p-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStates.map((state) => (
                          <tr key={state.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{state.name}</p>
                                  <p className="text-xs text-muted-foreground">{state.state}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm">
                                {state.phone && <p className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{state.phone}</p>}
                                {state.address && <p className="text-xs text-muted-foreground mt-1">{state.address}</p>}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                {state.brigade_count}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${state.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground"}`}>
                                {state.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleOpenModal("state", state)}>Edit</Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteClick("state", state.id, state.name)}>Delete</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredStates.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                              No state offices found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Stations Tab */}
              {activeTab === "station" && (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left p-4 font-medium text-muted-foreground">Station</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Hierarchy</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Contact</th>
                          <th className="text-center p-4 font-medium text-muted-foreground">Capacity</th>
                          <th className="text-center p-4 font-medium text-muted-foreground">Societies</th>
                          <th className="text-center p-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStations.map((station) => (
                          <tr key={station.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                  <Shield className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{station.name}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{station.location}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="text-red-500">{station.hq_name || "?"}</span>
                                <ChevronRight className="h-3 w-3" />
                                <span className="text-blue-500">{station.state_name || "?"}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm space-y-1">
                                {station.phone && <p className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{station.phone}</p>}
                                {station.email && <p className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{station.email}</p>}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                {station.capacity}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                {station.society_count}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${station.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground"}`}>
                                {station.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleOpenModal("station", station)}>Edit</Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteClick("station", station.id, station.name)}>Delete</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredStations.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                              No stations found. Click "Add Station" to create one.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getModalTitle()}</DialogTitle>
            <DialogDescription>
              {editingEntity ? "Update the information below" : "Enter the details for the new entry"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Name *</label>
              <Input
                type="text"
                required
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={modalType === "state" ? "e.g., Sindh Fire Service" : "e.g., Model Colony Fire Station"}
              />
            </div>

            {modalType === "state" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">State/Province *</label>
                <Input
                  type="text"
                  required
                  value={formData.state || ""}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g., Sindh"
                />
              </div>
            )}

            {modalType === "station" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Location *</label>
                  <Input
                    type="text"
                    required
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Model Colony, Karachi"
                  />
                </div>
                {availableStates.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Parent State *</label>
                    <select
                      required
                      value={formData.state_id || ""}
                      onChange={(e) => setFormData({ ...formData, state_id: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">-- Select State --</option>
                      {availableStates.map((state) => (
                        <option key={state.id} value={state.id}>{state.name} ({state.state})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Capacity</label>
                  <Input
                    type="number"
                    value={formData.capacity || 10}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    placeholder="10"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Address</label>
              <Input
                type="text"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                <Input
                  type="text"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+92-XXX-XXXXXXX"
                />
              </div>
              {modalType === "station" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <Input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit">{editingEntity ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteState.isOpen}
        title={`Delete ${deleteState.entityType === "state" ? "State Office" : "Station"}`}
        description={`Are you sure you want to delete "${deleteState.entityName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteState({ isOpen: false, entityType: null, entityId: null, entityName: "" })}
      />

      {/* Credentials Modal */}
      <Dialog open={credentialsModal.isOpen} onOpenChange={(open) => !open && setCredentialsModal(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Credentials Created</DialogTitle>
            <DialogDescription>
              Save these credentials for <strong>{credentialsModal.entityName}</strong>. The password cannot be retrieved later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                  <p className="text-sm font-mono font-semibold text-foreground mt-1">{credentialsModal.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(credentialsModal.email)
                    setCopiedField("email")
                    setTimeout(() => setCopiedField(null), 2000)
                  }}
                >
                  {copiedField === "email" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</p>
                  <p className="text-sm font-mono font-semibold text-foreground mt-1">{credentialsModal.password}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(credentialsModal.password)
                    setCopiedField("password")
                    setTimeout(() => setCopiedField(null), 2000)
                  }}
                >
                  {copiedField === "password" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</p>
                <p className="text-sm font-semibold text-foreground mt-1">{credentialsModal.role}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This user can now log in and see data scoped to their jurisdiction.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setCredentialsModal(prev => ({ ...prev, isOpen: false }))}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

export default function FirefighterStationsPage() {
  return (
    <ProtectedRoute allowedRoles={["firefighter_hq", "firefighter_state", "admin"]}>
      <StationsManagementContent />
    </ProtectedRoute>
  )
}
