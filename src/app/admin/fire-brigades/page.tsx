"use client"

import { useState, useEffect } from "react"
import { Building2, ChevronRight, MapPin, Phone, Mail, Plus, Search, Shield, Users, Flame } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import DashboardLayout from "@/components/layout/DashboardLayout"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface HQ {
  id: number
  name: string
  address: string
  phone: string
  email: string
  status: string
  state_count: number
  employee_count: number
  created_at: string
}

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

type EntityType = "hq" | "state" | "station"

interface DeleteState {
  isOpen: boolean
  entityType: EntityType | null
  entityId: number | null
  entityName: string
}

function FireBrigadeManagementContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<EntityType>("hq")
  const [hqs, setHqs] = useState<HQ[]>([])
  const [states, setStates] = useState<State[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEntity, setEditingEntity] = useState<any>(null)
  const [modalType, setModalType] = useState<EntityType>("hq")

  // Form data
  const [formData, setFormData] = useState<any>({})

  // Delete state
  const [deleteState, setDeleteState] = useState<DeleteState>({
    isOpen: false,
    entityType: null,
    entityId: null,
    entityName: "",
  })
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchHQs(), fetchStates(), fetchStations()])
    setLoading(false)
  }

  const fetchHQs = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-hqs`)
      if (response.ok) {
        const data = await response.json()
        setHqs(data)
      }
    } catch (err) {
      console.error("Error fetching HQs:", err)
    }
  }

  const fetchStates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-states`)
      if (response.ok) {
        const data = await response.json()
        setStates(data)
      }
    } catch (err) {
      console.error("Error fetching states:", err)
    }
  }

  const fetchStations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-stations`)
      if (response.ok) {
        const data = await response.json()
        setStations(data)
      }
    } catch (err) {
      console.error("Error fetching stations:", err)
    }
  }

  const handleOpenModal = (type: EntityType, entity?: any) => {
    setModalType(type)
    setEditingEntity(entity || null)

    if (entity) {
      setFormData({ ...entity })
    } else {
      if (type === "hq") {
        setFormData({ name: "", address: "", phone: "", email: "" })
      } else if (type === "state") {
        setFormData({ name: "", state: "", hq_id: hqs[0]?.id, address: "", phone: "" })
      } else {
        setFormData({ name: "", location: "", state_id: states[0]?.id, address: "", phone: "", email: "", capacity: 10 })
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
      let method = editingEntity ? "PATCH" : "POST"

      if (modalType === "hq") {
        url = editingEntity
          ? `${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-hqs/${editingEntity.id}`
          : `${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-hqs`
      } else if (modalType === "state") {
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

      toast({
        title: "Success",
        description: editingEntity ? "Updated successfully!" : "Created successfully!",
      })

      await fetchAll()
      handleCloseModal()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (type: EntityType, id: number, name: string) => {
    setDeleteState({ isOpen: true, entityType: type, entityId: id, entityName: name })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteState.entityId || !deleteState.entityType) return

    try {
      setDeleteLoading(true)
      let url = ""
      if (deleteState.entityType === "hq") {
        url = `${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-hqs/${deleteState.entityId}`
      } else if (deleteState.entityType === "state") {
        url = `${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-states/${deleteState.entityId}`
      } else {
        url = `${process.env.NEXT_PUBLIC_API_URL}/buildings/fire-brigade-stations/${deleteState.entityId}`
      }

      const response = await fetch(url, { method: "DELETE" })
      const data = await response.json()

      if (data.error) throw new Error(data.error)

      toast({ title: "Success", description: "Deleted successfully!" })
      await fetchAll()
      setDeleteState({ isOpen: false, entityType: null, entityId: null, entityName: "" })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredHQs = hqs.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredStates = states.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.state.toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredStations = stations.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.location.toLowerCase().includes(searchTerm.toLowerCase()))

  const getModalTitle = () => {
    const action = editingEntity ? "Edit" : "Add"
    if (modalType === "hq") return `${action} Fire Brigade HQ`
    if (modalType === "state") return `${action} State/Region Office`
    return `${action} Fire Station`
  }

  return (
    <DashboardLayout role="admin" userName={user?.name || "Admin"} userTitle="SUPER ADMIN">
      <div className="h-[calc(100vh-4rem)] w-full overflow-auto">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-none">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">Fire Brigade Management</h1>
                <p className="text-sm text-muted-foreground">
                  Manage fire brigade hierarchy: HQs, States, and Stations
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab("hq")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fire Brigade HQs</p>
                    <p className="text-2xl font-bold text-foreground">{hqs.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Regional headquarters</p>
                  </div>
                  <div className={`rounded-lg p-2.5 h-10 w-10 flex items-center justify-center ${activeTab === "hq" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    <Flame className="h-5 w-5" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab("state")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">State Offices</p>
                    <p className="text-2xl font-bold text-foreground">{states.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">State/Region level</p>
                  </div>
                  <div className={`rounded-lg p-2.5 h-10 w-10 flex items-center justify-center ${activeTab === "state" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab("station")}>
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
                  placeholder={`Search ${activeTab === "hq" ? "HQs" : activeTab === "state" ? "states" : "stations"}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => handleOpenModal(activeTab)}>
                <Plus className="h-4 w-4 mr-2" />
                Add {activeTab === "hq" ? "HQ" : activeTab === "state" ? "State" : "Station"}
              </Button>
            </div>
          </div>

          {/* Content based on active tab */}
          {loading ? (
            <Card className="p-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                <p className="mt-4 text-muted-foreground">Loading...</p>
              </div>
            </Card>
          ) : (
            <>
              {/* HQs Tab */}
              {activeTab === "hq" && (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left p-4 font-medium text-muted-foreground">HQ Name</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Contact</th>
                          <th className="text-center p-4 font-medium text-muted-foreground">States</th>
                          <th className="text-center p-4 font-medium text-muted-foreground">Employees</th>
                          <th className="text-center p-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHQs.map((hq) => (
                          <tr key={hq.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                  <Flame className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{hq.name}</p>
                                  {hq.address && <p className="text-xs text-muted-foreground">{hq.address}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm space-y-1">
                                {hq.phone && <p className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{hq.phone}</p>}
                                {hq.email && <p className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{hq.email}</p>}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {hq.state_count}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                {hq.employee_count}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${hq.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground"}`}>
                                {hq.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleOpenModal("hq", hq)}>Edit</Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteClick("hq", hq.id, hq.name)}>Delete</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredHQs.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              No HQs found. Click "Add HQ" to create one.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* States Tab */}
              {activeTab === "state" && (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left p-4 font-medium text-muted-foreground">State Office</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Parent HQ</th>
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
                              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                <Flame className="h-3 w-3 text-red-500" />
                                {state.hq_name || "No HQ"}
                              </span>
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
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              No states found. Click "Add State" to create one.
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
                placeholder={modalType === "hq" ? "e.g., Karachi Fire Brigade HQ" : modalType === "state" ? "e.g., Sindh Fire Service" : "e.g., Model Colony Fire Station"}
              />
            </div>

            {modalType === "state" && (
              <>
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
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Parent HQ *</label>
                  <select
                    required
                    value={formData.hq_id || ""}
                    onChange={(e) => setFormData({ ...formData, hq_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">-- Select HQ --</option>
                    {hqs.map((hq) => (
                      <option key={hq.id} value={hq.id}>{hq.name}</option>
                    ))}
                  </select>
                </div>
              </>
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
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Parent State *</label>
                  <select
                    required
                    value={formData.state_id || ""}
                    onChange={(e) => setFormData({ ...formData, state_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">-- Select State --</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>{state.name} ({state.state})</option>
                    ))}
                  </select>
                </div>
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
              {(modalType === "hq" || modalType === "station") && (
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
        title={`Delete ${deleteState.entityType === "hq" ? "HQ" : deleteState.entityType === "state" ? "State" : "Station"}`}
        description={`Are you sure you want to delete "${deleteState.entityName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteState({ isOpen: false, entityType: null, entityId: null, entityName: "" })}
      />
    </DashboardLayout>
  )
}

export default function FireBrigadeManagementPage() {
  return (
    <ProtectedRoute allowedRoles={["management", "building_authority"]}>
      <FireBrigadeManagementContent />
    </ProtectedRoute>
  )
}
