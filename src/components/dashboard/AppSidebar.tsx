"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { useLanguage } from "@/providers/LanguageProvider"
import { useAuth } from "@/context/AuthContext"
import {
  LayoutDashboard,
  Map,
  Building2,
  Users,
  Truck,
  BarChart3,
  Radio,
  Flame,
  Settings,
  Sliders,
  X,
  Home,
  AlertTriangle,
  LogOut,
} from "lucide-react"

const getFirefighterNavItems = (t: any) => [
  { icon: LayoutDashboard, label: t.sidebar.dashboard, href: "/firefighter" },
  { icon: Map, label: t.sidebar.liveMap, href: "/firefighter/map" },
  { icon: Users, label: "Team", href: "/firefighter/team" },
  { icon: AlertTriangle, label: "Active Fires", href: "/firefighter/fires" },
  { icon: Truck, label: t.sidebar.logistics, href: "/firefighter/logistics" },
  { icon: BarChart3, label: t.sidebar.reports, href: "/firefighter/reports" },
  { icon: Settings, label: t.sidebar.settings, href: "/settings" },
]

const getAdminNavItems = (t: any) => [
  { icon: LayoutDashboard, label: t.sidebar.dashboard, href: "/admin" },
  { icon: Building2, label: "Buildings", href: "/admin/buildings" },
  { icon: Users, label: "Residents", href: "/admin/residents" },
  { icon: Radio, label: "Sensors", href: "/admin/sensors" },
  { icon: Settings, label: t.sidebar.settings, href: "/settings" },
]

const getResidentNavItems = (t: any) => [
  { icon: Home, label: "Home", href: "/resident" },
  { icon: AlertTriangle, label: "Alerts", href: "/resident/alerts" },
  { icon: Building2, label: "My Apartment", href: "/resident/apartment" },
  { icon: Settings, label: t.sidebar.settings, href: "/settings" },
]

// Create context for sidebar state
const AppSidebarContext = createContext<{ isOpen: boolean; setIsOpen: (open: boolean) => void } | undefined>(undefined)

export function AppSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <AppSidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </AppSidebarContext.Provider>
  )
}

export function useAppSidebar() {
  const context = useContext(AppSidebarContext)
  if (!context) {
    return { isOpen: false, setIsOpen: () => {} }
  }
  return context
}

export function AppSidebar() {
  const { isOpen, setIsOpen } = useAppSidebar()
  const pathname = usePathname()
  const { t } = useLanguage()
  const { user, logout } = useAuth()

  // Determine which nav items to use based on user role
  const getNavItems = () => {
    if (!user) return []
    switch (user.role) {
      case "firefighter":
        return getFirefighterNavItems(t)
      case "admin":
        return getAdminNavItems(t)
      case "resident":
        return getResidentNavItems(t)
      default:
        return getFirefighterNavItems(t)
    }
  }

  const navItems = getNavItems()

  const isActive = (href: string) => {
    if (href === "/firefighter" || href === "/admin" || href === "/resident") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-border bg-card lg:flex transition-all duration-300",
        "w-56"
      )}>
        <div className="flex items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f3d2f]">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-foreground">{t.sidebar.ignis}</h1>
              <p className="text-xs tracking-wide text-muted-foreground">{t.sidebar.eliteTactical}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-[#1f3d2f] text-white"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 space-y-2">
          {user?.role === "firefighter" && (
            <Button className="w-full gap-2 bg-red-600 py-6 text-base font-semibold text-white hover:bg-red-700">
              <Radio className="h-5 w-5 flex-shrink-0" />
              {t.sidebar.newDispatch}
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 flex h-screen w-56 flex-col border-r border-border bg-card transition-all duration-300 lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f3d2f]">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-foreground">{t.sidebar.ignis}</h1>
              <p className="text-xs tracking-wide text-muted-foreground">{t.sidebar.eliteTactical}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-[#1f3d2f] text-white"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 space-y-2">
          {user?.role === "firefighter" && (
            <Button className="w-full gap-2 bg-red-600 py-6 text-base font-semibold text-white hover:bg-red-700">
              <Radio className="h-5 w-5 flex-shrink-0" />
              {t.sidebar.newDispatch}
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
