"use client"

import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { ResidentsManagementContent } from "@/app/admin/residents/page"

export default function ManagerResidentsPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'building_authority', 'commander']}>
      <ResidentsManagementContent />
    </ProtectedRoute>
  )
}
