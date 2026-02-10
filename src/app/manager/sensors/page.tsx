"use client"

import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { SensorsManagementContent } from "@/app/admin/sensors/page"

export default function ManagerSensorsPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'building_authority', 'commander']}>
      <SensorsManagementContent />
    </ProtectedRoute>
  )
}
