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
  Download,
  Filter,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3,
} from "lucide-react"

const reportsData = [
  { id: 1, incident: "Structure Fire - Central Plaza", date: "2024-01-20", responseTime: "4m 12s", units: 8, status: "Completed", severity: "Critical" },
  { id: 2, incident: "Warehouse Fire - Pier 15", date: "2024-01-19", responseTime: "3m 45s", units: 12, status: "Completed", severity: "Extreme" },
  { id: 3, incident: "Gas Leak - Industrial Park", date: "2024-01-18", responseTime: "5m 20s", units: 5, status: "Completed", severity: "High" },
  { id: 4, incident: "Vehicle Accident - Highway 101", date: "2024-01-17", responseTime: "6m 15s", units: 4, status: "Completed", severity: "Medium" },
  { id: 5, incident: "Medical Emergency - Downtown", date: "2024-01-16", responseTime: "3m 30s", units: 3, status: "Completed", severity: "High" },
]

const reportsFeatures = [
  { id: "incidents", title: "Incident Reports", description: "View detailed reports for all completed incidents including response times, units deployed, and outcomes. Download full incident records for documentation and analysis." },
  { id: "analytics", title: "Performance Analytics", description: "Track key performance indicators like average response time, resource efficiency, and incident trends. Identify patterns and optimize response strategies." },
  { id: "statistics", title: "System Statistics", description: "View real-time statistics on personnel availability, equipment status, incident frequency, and seasonal trends. Use data for resource planning." },
  { id: "export", title: "Report Export", description: "Generate and download incident reports, statistics, and analytics in multiple formats. Share reports with stakeholders and government agencies." },
]

function ReportsContent() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [showGuide, setShowGuide] = useState(false)
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [selectedReport, setSelectedReport] = useState<{ id: number; incident: string } | null>(null)
  const { setCurrentPage } = useTour()
  const { toast } = useToast()

  useEffect(() => {
    setCurrentPage("reports")
  }, [setCurrentPage])

  const handleDownload = (report: { id: number; incident: string }) => {
    setSelectedReport(report)
    setShowDownloadDialog(true)
  }

  const handleConfirmDownload = async () => {
    await new Promise(resolve => setTimeout(resolve, 800))
    toast({
      title: "Report Downloaded",
      description: `${selectedReport?.incident} report has been downloaded`,
      duration: 3000,
    })
    setShowDownloadDialog(false)
  }

  const handleExportAll = () => {
    toast({
      title: "Export Started",
      description: "Exporting all reports. This may take a few moments.",
      duration: 3000,
    })
  }

  const filteredReports = reportsData.filter((r) =>
    r.incident.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Extreme":
        return <Badge className="bg-red-500 text-white hover:bg-red-500">Extreme</Badge>
      case "Critical":
        return <Badge className="bg-orange-500 text-white hover:bg-orange-500">Critical</Badge>
      case "High":
        return <Badge className="bg-amber-500 text-white hover:bg-amber-500">High</Badge>
      default:
        return <Badge className="bg-blue-500 text-white hover:bg-blue-500">Medium</Badge>
    }
  }

  const stats = [
    { label: "Total Incidents", value: "124", icon: AlertCircle, color: "text-red-500" },
    { label: "Avg Response", value: "4m 32s", icon: Clock, color: "text-blue-500" },
    { label: "Success Rate", value: "98.2%", icon: CheckCircle, color: "text-green-500" },
    { label: "Personnel Hours", value: "2,847h", icon: TrendingUp, color: "text-amber-500" },
  ]

  return (
    <DashboardLayout role="admin" userName={user?.name || "Admin"} userTitle="ADMINISTRATOR">
      <div className="flex-1 space-y-4 sm:space-y-6 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-none">
        <FeatureGuideModal
          features={reportsFeatures}
          isOpen={showGuide}
          onClose={() => setShowGuide(false)}
          title="Reports & Analytics Features"
        />

        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 mb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground">Incident reports from the last 30 days</p>
          </div>
          <HelpButton onClick={() => setShowGuide(true)} />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`rounded-lg bg-secondary p-2.5 h-10 w-10 flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Controls */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search incidents..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button
            className="gap-2 bg-[#1f3d2f] text-white hover:bg-[#2a4f3d]"
            onClick={handleExportAll}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Reports Table */}
        <Card className="border border-border mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Incident History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Incident</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Units</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Severity</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-foreground">{report.incident}</td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{report.date}</td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">{report.responseTime}</td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{report.units}</td>
                      <td className="px-3 sm:px-4 py-3">{getSeverityBadge(report.severity)}</td>
                      <td className="px-3 sm:px-4 py-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleDownload(report)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Response Time Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-48 sm:h-56 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 sm:h-16 sm:w-16 opacity-30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Chart visualization coming soon</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Incident Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-48 sm:h-56 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 sm:h-16 sm:w-16 opacity-30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Chart visualization coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <ConfirmDialog
          open={showDownloadDialog}
          title="Download Report"
          description={`Download report for: ${selectedReport?.incident}`}
          confirmText="Download"
          cancelText="Cancel"
          onConfirm={handleConfirmDownload}
          onCancel={() => setShowDownloadDialog(false)}
        />
      </div>
    </DashboardLayout>
  )
}

export default function ReportsPage() {
  return (
    <ProtectedRoute allowedRoles={["management", "building_authority"]}>
      <ReportsContent />
    </ProtectedRoute>
  )
}
