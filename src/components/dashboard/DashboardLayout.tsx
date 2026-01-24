"use client"

import { ReactNode } from "react"
import { AppSidebar, AppSidebarProvider } from "./AppSidebar"
import { AppHeader } from "./AppHeader"

interface DashboardLayoutProps {
  children: ReactNode
  searchPlaceholder?: string
  showSystemStatus?: boolean
}

export function DashboardLayout({
  children,
  searchPlaceholder,
  showSystemStatus = true,
}: DashboardLayoutProps) {
  return (
    <AppSidebarProvider>
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <div className="lg:pl-56">
          <AppHeader
            searchPlaceholder={searchPlaceholder}
            showSystemStatus={showSystemStatus}
          />
          <main className="p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </AppSidebarProvider>
  )
}
