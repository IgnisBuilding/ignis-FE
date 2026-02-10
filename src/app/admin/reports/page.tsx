"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useTour } from "@/providers/TourProvider"
import { FeatureGuideModal, HelpButton } from "@/components/tour"
import { useToast } from "@/hooks/use-toast"
import { useReportsData } from "@/hooks/useReportsData"
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
  Loader2,
  Inbox,
} from "lucide-react"

const reportsFeatures = [
  { id: "incidents", title: "Incident Reports", description: "View detailed reports for all completed incidents including response times, units deployed, and outcomes. Download full incident records for documentation and analysis." },
  { id: "analytics", title: "Performance Analytics", description: "Track key performance indicators like average response time, resource efficiency, and incident trends. Identify patterns and optimize response strategies." },
  { id: "statistics", title: "System Statistics", description: "View real-time statistics on personnel availability, equipment status, incident frequency, and seasonal trends. Use data for resource planning." },
  { id: "export", title: "Report Export", description: "Generate and download incident reports, statistics, and analytics in multiple formats. Share reports with stakeholders and government agencies." },
]

function ReportsContent() {
  const { user, dashboardRole, roleTitle } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [showGuide, setShowGuide] = useState(false)
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [selectedReport, setSelectedReport] = useState<{ id: number; incident: string } | null>(null)
  const { setCurrentPage } = useTour()
  const { toast } = useToast()
  const { reports, stats, loading, error, severityDistribution, responseTimeEntries } = useReportsData()

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

  const filteredReports = reports.filter((r) =>
    r.incident.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical":
        return <Badge className="bg-red-500 text-white hover:bg-red-500">Critical</Badge>
      case "High":
        return <Badge className="bg-orange-500 text-white hover:bg-orange-500">High</Badge>
      case "Medium":
        return <Badge className="bg-amber-500 text-white hover:bg-amber-500">Medium</Badge>
      case "Low":
        return <Badge className="bg-blue-500 text-white hover:bg-blue-500">Low</Badge>
      default:
        return <Badge className="bg-gray-500 text-white hover:bg-gray-500">{severity}</Badge>
    }
  }

  const statsDisplay = [
    { label: "Total Incidents", value: loading ? "..." : String(stats.totalIncidents), icon: AlertCircle, color: "text-red-500" },
    { label: "Avg Response", value: loading ? "..." : stats.avgResponseTime, icon: Clock, color: "text-blue-500" },
    { label: "Resolution Rate", value: loading ? "..." : stats.resolutionRate, icon: CheckCircle, color: "text-green-500" },
    { label: "Active Hazards", value: loading ? "..." : String(stats.activeHazards), icon: TrendingUp, color: "text-amber-500" },
  ]

  const maxResponseTime = responseTimeEntries.length > 0
    ? Math.max(...responseTimeEntries.map(e => e.seconds))
    : 1

  return (
    <DashboardLayout role={dashboardRole} userName={user?.name || "Admin"} userTitle={roleTitle}>
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
            <p className="text-sm text-muted-foreground">Incident reports and hazard analytics</p>
          </div>
          <HelpButton onClick={() => setShowGuide(true)} />
        </div>

        {/* Error State */}
        {error && (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-sm text-red-600">Failed to load reports: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
          {statsDisplay.map((stat) => (
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
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-sm text-muted-foreground">Loading incidents...</span>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Inbox className="h-12 w-12 opacity-30 mb-3" />
                <p className="text-sm">{searchTerm ? "No incidents match your search" : "No incidents recorded yet"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Incident</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
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
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{report.status}</td>
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
            )}
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Response Time Trend */}
          <Card className="border border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Response Time Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-48 sm:h-56 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : responseTimeEntries.length === 0 ? (
                <div className="h-48 sm:h-56 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 sm:h-16 sm:w-16 opacity-30 mx-auto mb-3" />
                    <p className="text-sm">No response time data available</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {responseTimeEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20 truncate flex-shrink-0">{entry.incident}</span>
                      <div className="flex-1 bg-secondary rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                          style={{ width: `${Math.max(15, (entry.seconds / maxResponseTime) * 100)}%` }}
                        >
                          <span className="text-[10px] font-medium text-white whitespace-nowrap">{entry.formatted}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incident Distribution */}
          <Card className="border border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Incident Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-48 sm:h-56 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : severityDistribution.length === 0 ? (
                <div className="h-48 sm:h-56 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 sm:h-16 sm:w-16 opacity-30 mx-auto mb-3" />
                    <p className="text-sm">No incident data available</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {severityDistribution.map((item) => {
                    const maxCount = Math.max(...severityDistribution.map(s => s.count))
                    return (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{item.label}</span>
                          <span className="text-sm text-muted-foreground">{item.count}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                          <div
                            className={`${item.color} h-full rounded-full transition-all`}
                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
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
    <ProtectedRoute allowedRoles={["admin"]}>
      <ReportsContent />
    </ProtectedRoute>
  )
}
