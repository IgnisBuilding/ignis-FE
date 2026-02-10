"use client"

import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { AdminDashboardContent } from "@/app/admin/page"

export default function ManagerDashboard() {
  return (
    <ProtectedRoute allowedRoles={['management', 'building_authority', 'commander']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
