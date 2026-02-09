"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useTour } from "@/providers/TourProvider"
import { FeatureGuideModal, HelpButton } from "@/components/tour"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/dialogs"
import {
  Search,
  Filter,
  MoreVertical,
  AlertTriangle,
  Wrench,
  Package,
  Zap,
  Droplets,
} from "lucide-react"

const equipmentData = [
  { id: 1, name: "Ladder Truck 42", type: "Vehicle", status: "Available", location: "Station 7", lastMaintenance: "2 days ago", condition: "Excellent" },
  { id: 2, name: "Rescue Equipment Kit", type: "Supplies", status: "In Use", location: "Field - Warehouse 15", lastMaintenance: "1 week ago", condition: "Good" },
  { id: 3, name: "Thermal Imaging Camera", type: "Equipment", status: "Available", location: "Station 7", lastMaintenance: "3 days ago", condition: "Excellent" },
  { id: 4, name: "Hazmat Containment Unit", type: "Equipment", status: "Maintenance", location: "Central Depot", lastMaintenance: "Today", condition: "Maintenance In Progress" },
  { id: 5, name: "Oxygen Tanks Supply", type: "Supplies", status: "Low", location: "Station 7", lastMaintenance: "Current", condition: "Adequate Stock" },
]

const logisticsFeatures = [
  { id: "equipment", title: "Equipment Inventory", description: "Track all equipment and vehicles with real-time status. See current location, maintenance schedule, and availability. Request equipment for incidents directly from this view." },
  { id: "supplies", title: "Supply Management", description: "Monitor critical supplies like oxygen tanks, hazmat containment kits, and rescue gear. Get alerts when supplies run low or require replenishment." },
  { id: "maintenance", title: "Maintenance Schedule", description: "Track maintenance history and upcoming maintenance windows. Schedule preventive maintenance to ensure equipment reliability during critical operations." },
  { id: "allocation", title: "Resource Allocation", description: "Optimize resource deployment by viewing equipment across all stations. Allocate equipment to incidents based on proximity and availability." },
]

function LogisticsContent() {
  const { user, dashboardRole, roleTitle } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [showGuide, setShowGuide] = useState(false)
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<{ id: number; name: string } | null>(null)
  const { setCurrentPage } = useTour()
  const { toast } = useToast()

  useEffect(() => {
    setCurrentPage("logistics")
  }, [setCurrentPage])

  const handleMaintenanceClick = (equipment: { id: number; name: string }) => {
    setSelectedEquipment(equipment)
    setShowMaintenanceDialog(true)
  }

  const handleScheduleMaintenance = async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    toast({
      title: "Maintenance Scheduled",
      description: `Maintenance scheduled for ${selectedEquipment?.name}`,
      duration: 3000,
    })
    setShowMaintenanceDialog(false)
  }

  const handleCheckout = (equipment: { id: number; name: string }) => {
    toast({
      title: "Equipment Checked Out",
      description: `${equipment.name} has been checked out`,
      duration: 3000,
    })
  }

  const filteredEquipment = equipmentData.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return <Badge className="bg-green-500 text-white hover:bg-green-500">Available</Badge>
      case "In Use":
        return <Badge className="bg-blue-500 text-white hover:bg-blue-500">In Use</Badge>
      case "Maintenance":
        return <Badge className="bg-amber-500 text-white hover:bg-amber-500">Maintenance</Badge>
      case "Low":
        return <Badge className="bg-orange-500 text-white hover:bg-orange-500">Low Stock</Badge>
      default:
        return <Badge className="bg-gray-500 text-white hover:bg-gray-500">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Vehicle":
        return <Package className="h-4 w-4" />
      case "Equipment":
        return <Wrench className="h-4 w-4" />
      default:
        return <Droplets className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout role={dashboardRole} userName={user?.name || "Admin"} userTitle={roleTitle}>
      <div className="flex-1 space-y-4 sm:space-y-6 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-none">
        <FeatureGuideModal
          features={logisticsFeatures}
          isOpen={showGuide}
          onClose={() => setShowGuide(false)}
          title="Logistics & Resources Features"
        />

        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 mb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Logistics & Resources</h1>
            <p className="text-sm text-muted-foreground">Total assets: {filteredEquipment.length} items</p>
          </div>
          <HelpButton onClick={() => setShowGuide(true)} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">3</p>
                </div>
                <div className="rounded-lg bg-secondary p-2.5 h-10 w-10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">In Use</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">1</p>
                </div>
                <div className="rounded-lg bg-secondary p-2.5 h-10 w-10 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Maintenance</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">1</p>
                </div>
                <div className="rounded-lg bg-secondary p-2.5 h-10 w-10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Low Stock</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">1</p>
                </div>
                <div className="rounded-lg bg-secondary p-2.5 h-10 w-10 flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search equipment..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Equipment Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Asset Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredEquipment.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="rounded-lg bg-secondary p-2 flex-shrink-0">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground">{item.name}</div>
                      <p className="text-sm text-muted-foreground">{item.type} • {item.location}</p>
                      <p className="text-xs text-muted-foreground mt-1">Last maintenance: {item.lastMaintenance}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      {getStatusBadge(item.status)}
                      <p className="mt-1 text-xs text-muted-foreground">{item.condition}</p>
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

        <ConfirmDialog
          open={showMaintenanceDialog}
          title="Schedule Maintenance"
          description={`Schedule maintenance for ${selectedEquipment?.name}?`}
          confirmText="Schedule"
          cancelText="Cancel"
          onConfirm={handleScheduleMaintenance}
          onCancel={() => setShowMaintenanceDialog(false)}
        />
      </div>
    </DashboardLayout>
  )
}

export default function LogisticsPage() {
  return (
    <ProtectedRoute allowedRoles={["management", "building_authority"]}>
      <LogisticsContent />
    </ProtectedRoute>
  )
}
