"use client"

import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { CamerasManagementContent } from "@/app/admin/cameras/page"

export default function ManagerCamerasPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'building_authority', 'commander']}>
      <CamerasManagementContent />
    </ProtectedRoute>
  )
}
