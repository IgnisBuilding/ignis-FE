"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Building2, Search, Loader2, Inbox, MapPin } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import DashboardLayout from "@/components/layout/DashboardLayout"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface SocietyBuilding {
  id: number
  name: string
  address: string
  type: string
  total_floors: number
  apartments_per_floor: number
  has_floor_plan: boolean
  center_lat: number | null
  center_lng: number | null
  created_at: string
  society_name: string
  society_location: string
}

interface Society {
  id: number
  name: string
  location: string
  brigade_id: number
}

function SocietyBuildingsContent() {
  const params = useParams()
  const router = useRouter()
  const { user, dashboardRole, roleTitle } = useAuth()
  const [society, setSociety] = useState<Society | null>(null)
  const [buildings, setBuildings] = useState<SocietyBuilding[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const societyId = params.id as string

  useEffect(() => {
    if (societyId) {
      fetchData()
    }
  }, [societyId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [societyRes, buildingsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/buildings/societies/${societyId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/buildings/societies/${societyId}/buildings`),
      ])

      if (societyRes.ok) {
        const societyData = await societyRes.json()
        if (!societyData.error) {
          setSociety(societyData)
        }
      }

      if (buildingsRes.ok) {
        const buildingsData = await buildingsRes.json()
        setBuildings(buildingsData)
      }
    } catch (err) {
      console.error("Error fetching society buildings:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredBuildings = buildings.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getFloorPlanBadge = (hasFloorPlan: boolean) => {
    if (hasFloorPlan) {
      return <Badge className="bg-green-100 text-green-700 font-semibold hover:bg-green-100 border-0 text-xs">FLOOR PLAN</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-700 font-semibold hover:bg-gray-100 border-0 text-xs">NO PLAN</Badge>
  }

  return (
    <DashboardLayout role={dashboardRole} userName={user?.name || "Firefighter"} userTitle={roleTitle}>
      <div className="flex-1 space-y-4 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8 sm:space-y-6 w-full max-w-none">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:gap-6 md:flex-row md:items-end">
          <div className="flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/firefighter/societies")}
              className="mb-2 -ml-2 text-muted-foreground hover:text-foreground gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Societies
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                {loading ? "Loading..." : society?.name || "Society"}
              </h1>
            </div>
            {society && (
              <div className="flex items-center gap-2 mt-1 sm:mt-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {society.location}
                </p>
                <span className="text-muted-foreground">-</span>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {buildings.length} building{buildings.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by building name or address..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Buildings Table */}
        <Card className="rounded-lg border border-border bg-card overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-sm text-muted-foreground">Loading buildings...</span>
              </div>
            ) : filteredBuildings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Inbox className="h-12 w-12 opacity-30 mb-3" />
                <p className="text-sm">{searchTerm ? "No buildings match your search" : "No buildings in this society"}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-foreground">BUILDING NAME</th>
                    <th className="px-6 py-4 text-left font-bold text-foreground hidden sm:table-cell">FLOORS</th>
                    <th className="px-6 py-4 text-left font-bold text-foreground hidden md:table-cell">UNITS/FLOOR</th>
                    <th className="px-6 py-4 text-left font-bold text-foreground hidden lg:table-cell">REGISTERED</th>
                    <th className="px-6 py-4 text-left font-bold text-foreground">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuildings.map((building, idx) => (
                    <tr
                      key={building.id}
                      className={`${idx % 2 === 0 ? "bg-card" : "bg-secondary/50"} hover:bg-secondary/80 transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-secondary p-2">
                            <Building2 className="h-4 w-4 text-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{building.name}</p>
                            <p className="text-xs text-muted-foreground">{building.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <p className="font-semibold text-foreground">{building.total_floors}</p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-muted-foreground">{building.apartments_per_floor}</p>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground hidden lg:table-cell">
                        {building.created_at ? new Date(building.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        {getFloorPlanBadge(building.has_floor_plan)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Results count */}
        {!loading && filteredBuildings.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Showing {filteredBuildings.length} of {buildings.length} building{buildings.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function SocietyBuildingsPage() {
  return (
    <ProtectedRoute allowedRoles={["firefighter", "firefighter_hq", "firefighter_state", "firefighter_district", "admin"]}>
      <SocietyBuildingsContent />
    </ProtectedRoute>
  )
}
