"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  Settings,
  Sliders,
  X,
  Home,
  AlertTriangle,
  LogOut,
  MapPin,
} from "lucide-react"

const getFirefighterNavItems = (t: any) => [
  { icon: LayoutDashboard, label: t.nav.dashboard, href: "/firefighter" },
  { icon: Map, label: t.nav.liveMap, href: "/firefighter/map" },
  { icon: MapPin, label: t.nav.societies, href: "/firefighter/societies" },
  { icon: Users, label: t.nav.team, href: "/firefighter/team" },
  { icon: AlertTriangle, label: t.nav.activeFires, href: "/firefighter/fires" },
  { icon: Truck, label: t.nav.logistics, href: "/firefighter/logistics" },
  { icon: BarChart3, label: t.nav.reports, href: "/firefighter/reports" },
  { icon: Settings, label: t.nav.settings, href: "/settings" },
]

const getAdminNavItems = (t: any) => [
  { icon: LayoutDashboard, label: t.nav.dashboard, href: "/admin" },
  { icon: Building2, label: t.nav.buildings, href: "/admin/buildings" },
  { icon: MapPin, label: t.nav.societies, href: "/admin/societies" },
  { icon: Users, label: t.nav.residents, href: "/admin/residents" },
  { icon: Radio, label: t.nav.sensors, href: "/admin/sensors" },
  { icon: Settings, label: t.nav.settings, href: "/settings" },
]

const getResidentNavItems = (t: any) => [
  { icon: Home, label: t.nav.home, href: "/resident" },
  { icon: Map, label: t.nav.buildingMap, href: "/resident/map" },
  { icon: AlertTriangle, label: t.nav.alerts, href: "/resident/alerts" },
  { icon: Building2, label: t.nav.myApartment, href: "/resident/apartment" },
  { icon: Settings, label: t.nav.settings, href: "/settings" },
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
        <div className="flex items-center justify-center p-3 border-b border-border">
          <Image src="/sidebaropened.png" alt="Ignis" width={120} height={36} className="h-9 w-auto object-contain" />
        </div>

        <nav className="flex-1 px-3 pt-2 pb-4">
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
            {t.buttons.logout}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 flex h-screen w-56 flex-col border-r border-border bg-card transition-all duration-300 lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="relative flex items-center justify-center p-3 border-b border-border">
          <Image src="/sidebaropened.png" alt="Ignis" width={120} height={36} className="h-9 w-auto object-contain" />
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 pt-2 pb-4">
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
            {t.buttons.logout}
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
