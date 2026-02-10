"use client"

import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { BuildingsManagementContent } from "@/app/admin/buildings/page"

export default function ManagerBuildingsPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'building_authority', 'commander']}>
      <BuildingsManagementContent />
    </ProtectedRoute>
  )
}
