"use client"

import { Building2, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/Button"

interface Building {
  id: number
  name: string
  address: string
  type: string
  occupancy?: number
  lastInspection?: string
  safetyScore?: number
  status?: "CERTIFIED" | "PENDING" | "AT RISK" | "REVIEW REQ."
  created_at?: string
}

interface BuildingsTableProps {
  buildings: Building[]
  onBuildingClick?: (building: Building) => void
  onEdit?: (building: Building) => void
  onDelete?: (id: number, name: string) => void
}

export function BuildingsTable({ buildings, onBuildingClick, onEdit, onDelete }: BuildingsTableProps) {
  const getStatusBadge = (status?: string) => {
    if (!status) return ""

    const badgeStyles: Record<string, string> = {
      CERTIFIED: "bg-green-100 text-green-700 font-semibold",
      PENDING: "bg-blue-100 text-blue-700 font-semibold",
      "AT RISK": "bg-red-100 text-red-700 font-semibold",
      "REVIEW REQ.": "bg-yellow-100 text-yellow-700 font-semibold",
    }
    return badgeStyles[status] || "bg-gray-100 text-gray-700"
  }

  const getSafetyScoreColor = (score?: number) => {
    if (!score) return "bg-gray-400"
    if (score >= 85) return "bg-green-600"
    if (score >= 70) return "bg-blue-600"
    if (score >= 50) return "bg-yellow-600"
    return "bg-red-600"
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'residential':
        return "bg-green-100 text-green-700"
      case 'commercial':
        return "bg-blue-100 text-blue-700"
      case 'industrial':
        return "bg-orange-100 text-orange-700"
      case 'mixed':
        return "bg-purple-100 text-purple-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary">
            <tr>
              <th className="px-6 py-4 text-left font-bold text-foreground">BUILDING NAME</th>
              <th className="px-6 py-4 text-left font-bold text-foreground">TYPE</th>
              {buildings.some(b => b.occupancy) && (
                <th className="px-6 py-4 text-left font-bold text-foreground">OCCUPANCY</th>
              )}
              {buildings.some(b => b.lastInspection) && (
                <th className="px-6 py-4 text-left font-bold text-foreground">LAST INSPECTION</th>
              )}
              {buildings.some(b => b.safetyScore) && (
                <th className="px-6 py-4 text-left font-bold text-foreground">SAFETY SCORE</th>
              )}
              {buildings.some(b => b.status) && (
                <th className="px-6 py-4 text-left font-bold text-foreground">STATUS</th>
              )}
              {(onEdit || onDelete) && (
                <th className="px-6 py-4 text-left font-bold text-foreground">ACTIONS</th>
              )}
            </tr>
          </thead>
          <tbody>
            {buildings.map((building, idx) => (
              <tr
                key={building.id}
                className={`${idx % 2 === 0 ? "bg-card" : "bg-secondary/50"} hover:bg-muted/30 transition-colors`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🏢</span>
                    <div>
                      <p className="font-semibold text-foreground">{building.name}</p>
                      <p className="text-xs text-muted-foreground">{building.address}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getTypeColor(building.type)}`}>
                    {building.type}
                  </span>
                </td>
                {buildings.some(b => b.occupancy) && (
                  <td className="px-6 py-4">
                    {building.occupancy ? (
                      <>
                        <p className="font-semibold text-foreground">{building.occupancy}</p>
                        <p className="text-xs text-muted-foreground">Residents</p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                )}
                {buildings.some(b => b.lastInspection) && (
                  <td className="px-6 py-4 text-muted-foreground">
                    {building.lastInspection || '-'}
                  </td>
                )}
                {buildings.some(b => b.safetyScore) && (
                  <td className="px-6 py-4">
                    {building.safetyScore ? (
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-16 rounded ${getSafetyScoreColor(building.safetyScore)}`} />
                        <span className="font-semibold text-foreground">{building.safetyScore}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                )}
                {buildings.some(b => b.status) && (
                  <td className="px-6 py-4">
                    {building.status ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${getStatusBadge(building.status)} border-0 cursor-pointer text-xs`}
                        onClick={() => onBuildingClick?.(building)}
                      >
                        {building.status}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                )}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700"
                          onClick={() => onEdit(building)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => onDelete(building.id, building.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
