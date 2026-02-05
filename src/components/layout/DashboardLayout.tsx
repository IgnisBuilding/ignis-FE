"use client";

import { ReactNode, useState, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/providers/LanguageProvider";
import { NotificationModal } from "@/components/notifications";
import {
  LayoutDashboard,
  Map,
  Users,
  Truck,
  BarChart3,
  Radio,
  Flame,
  Settings,
  Building2,
  AlertTriangle,
  Home,
  LogOut,
  Search,
  MapPin,
  Menu,
  X,
  BookOpen,
  Bell,
  User,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Video,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  children: ReactNode;
  role: "firefighter" | "firefighter_hq" | "firefighter_state" | "firefighter_district" | "resident" | "manager" | "admin";
  userName: string;
  userTitle: string;
  disablePadding?: boolean;
}

const roleConfig: Record<string, {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  dispatchButton: boolean;
}> = {
  // Firefighter HQ - Full access to all firefighter pages
  firefighter_hq: {
    title: "IGNIS COMMAND",
    subtitle: "HQ OPERATIONS",
    navItems: [
      { label: "Dashboard", href: "/firefighter", icon: LayoutDashboard },
      { label: "Live Map", href: "/firefighter/map", icon: Map },
      { label: "Societies", href: "/firefighter/societies", icon: MapPin },
      { label: "Personnel", href: "/firefighter/team", icon: Users },
      { label: "Logistics", href: "/firefighter/logistics", icon: Truck },
      { label: "Reports", href: "/firefighter/reports", icon: BarChart3 },
      { label: "Directory", href: "/firefighter/directory", icon: BookOpen },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
    dispatchButton: true,
  },
  // Firefighter State - No Logistics access
  firefighter_state: {
    title: "IGNIS COMMAND",
    subtitle: "STATE OPERATIONS",
    navItems: [
      { label: "Dashboard", href: "/firefighter", icon: LayoutDashboard },
      { label: "Live Map", href: "/firefighter/map", icon: Map },
      { label: "Societies", href: "/firefighter/societies", icon: MapPin },
      { label: "Personnel", href: "/firefighter/team", icon: Users },
      { label: "Reports", href: "/firefighter/reports", icon: BarChart3 },
      { label: "Directory", href: "/firefighter/directory", icon: BookOpen },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
    dispatchButton: true,
  },
  // Firefighter District - Limited access (no Personnel, Logistics, Reports)
  firefighter_district: {
    title: "IGNIS COMMAND",
    subtitle: "DISTRICT OPS",
    navItems: [
      { label: "Dashboard", href: "/firefighter", icon: LayoutDashboard },
      { label: "Live Map", href: "/firefighter/map", icon: Map },
      { label: "Societies", href: "/firefighter/societies", icon: MapPin },
      { label: "Directory", href: "/firefighter/directory", icon: BookOpen },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
    dispatchButton: true,
  },
  // Legacy firefighter role - maps to district level
  firefighter: {
    title: "IGNIS COMMAND",
    subtitle: "TACTICAL OPS",
    navItems: [
      { label: "Dashboard", href: "/firefighter", icon: LayoutDashboard },
      { label: "Live Map", href: "/firefighter/map", icon: Map },
      { label: "Societies", href: "/firefighter/societies", icon: MapPin },
      { label: "Directory", href: "/firefighter/directory", icon: BookOpen },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
    dispatchButton: true,
  },
  resident: {
    title: "IGNIS SAFETY",
    subtitle: "RESIDENT PORTAL",
    navItems: [
      { label: "Dashboard", href: "/resident", icon: Home },
      { label: "Live Map", href: "/resident/map", icon: Map },
      { label: "My Apartment", href: "/resident/apartment", icon: Building2 },
      { label: "Alerts", href: "/resident/alerts", icon: AlertTriangle },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
    dispatchButton: false,
  },
  manager: {
    title: "IGNIS CONTROL",
    subtitle: "BUILDING MGMT",
    navItems: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Buildings", href: "/admin/buildings", icon: Building2 },
      { label: "Cameras", href: "/admin/cameras", icon: Video },
      { label: "Residents", href: "/admin/residents", icon: Users },
      { label: "Sensors", href: "/admin/sensors", icon: Radio },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
    dispatchButton: false,
  },
  admin: {
    title: "IGNIS ADMIN",
    subtitle: "MANAGEMENT",
    navItems: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Live Map", href: "/admin/map", icon: Map },
      { label: "Fire Brigades", href: "/admin/fire-brigades", icon: Flame },
      { label: "Buildings", href: "/admin/buildings", icon: Building2 },
      { label: "Societies", href: "/admin/societies", icon: MapPin },
      { label: "Cameras", href: "/admin/cameras", icon: Video },
      { label: "Residents", href: "/admin/residents", icon: Users },
      { label: "Sensors", href: "/admin/sensors", icon: Radio },
      { label: "Logistics", href: "/admin/logistics", icon: Truck },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
    dispatchButton: false,
  },
};

// Sidebar Context
const SidebarContext = createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
} | undefined>(undefined);

function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    return { isOpen: false, setIsOpen: () => {}, isCollapsed: false, setIsCollapsed: () => {} };
  }
  return context;
}

export default function DashboardLayout({ children, role, userName, userTitle }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const config = roleConfig[role];

  const isActive = (href: string) => {
    if (href === "/firefighter" || href === "/admin" || href === "/resident") {
      return pathname === href;
    }
    return pathname.startsWith(href) && href !== "/settings";
  };

  const userInitials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <SidebarContext.Provider value={{ isOpen: sidebarOpen, setIsOpen: setSidebarOpen, isCollapsed: sidebarCollapsed, setIsCollapsed: setSidebarCollapsed }}>
      <div className="flex min-h-screen w-full bg-background">
        {/* Desktop Sidebar */}
        <aside className={cn(
          "fixed left-0 top-0 z-40 h-screen flex-col border-r border-border bg-card transition-all duration-300",
          "hidden lg:flex",
          sidebarCollapsed ? "w-16" : "w-56"
        )}>
          {/* Sidebar Header */}
          <div className={cn("flex items-center py-5", sidebarCollapsed ? "px-3 justify-center" : "px-4 justify-between")}>
            {sidebarCollapsed ? (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f3d2f] flex-shrink-0 hover:bg-[#2a5040] transition-colors cursor-pointer"
                title="Expand sidebar"
              >
                <Flame className="h-5 w-5 text-white" />
              </button>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f3d2f] flex-shrink-0">
                    <Flame className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg font-bold leading-tight text-foreground truncate">{config.title}</h1>
                    <p className="text-xs tracking-wide text-muted-foreground truncate">{config.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="flex items-center justify-center h-10 w-8 ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all self-center"
                  title="Collapse sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className={cn("flex-1 py-4", sidebarCollapsed ? "px-2" : "px-3")}>
            <ul className="space-y-1">
              {config.navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
                        sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3",
                        active
                          ? "bg-[#1f3d2f] text-white"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className={cn("space-y-2", sidebarCollapsed ? "p-2" : "p-4")}>
            {config.dispatchButton && (
              <Button
                onClick={() => router.push('/emergency')}
                className={cn(
                  "bg-red-600 text-white hover:bg-red-700",
                  sidebarCollapsed ? "w-full p-2" : "w-full gap-2 py-6 text-base font-semibold"
                )}
                title={sidebarCollapsed ? t.sidebar.newDispatch : undefined}
              >
                <Radio className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && t.sidebar.newDispatch}
              </Button>
            )}
            <Button
              variant="outline"
              className={cn("w-full", sidebarCollapsed ? "p-2" : "gap-2")}
              onClick={logout}
              title={sidebarCollapsed ? "Logout" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!sidebarCollapsed && "Logout"}
            </Button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <aside className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex items-center justify-between px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f3d2f]">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight text-foreground">{config.title}</h1>
                <p className="text-xs tracking-wide text-muted-foreground">{config.subtitle}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 px-3 py-4">
            <ul className="space-y-1">
              {config.navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-[#1f3d2f] text-white"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 space-y-2">
            {config.dispatchButton && (
              <Button
                onClick={() => router.push('/emergency')}
                className="w-full gap-2 bg-red-600 py-6 text-base font-semibold text-white hover:bg-red-700"
              >
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
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area - responsive to sidebar state */}
        <div className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          sidebarCollapsed
            ? "lg:ml-16 lg:w-[calc(100%-4rem)]"
            : "lg:ml-56 lg:w-[calc(100%-14rem)]"
        )}>
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="text-muted-foreground hover:text-foreground lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="hidden sm:flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-foreground">{t.header.systemOptimal}</span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{t.header.gpsLocked}</span>
              </div>
            </div>

            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t.header.searchIncidents}
                  className="w-full border-0 bg-secondary pl-10 text-sm h-9 sm:h-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationModal />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 sm:gap-3 border-l border-border pl-2 sm:pl-4 hover:opacity-80 transition-opacity cursor-pointer">
                    <div className="text-right hidden lg:block">
                      <p className="text-sm font-semibold text-foreground">{userName}</p>
                      <p className="text-xs text-muted-foreground">{userTitle}</p>
                    </div>
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-[#1f3d2f]">
                      <AvatarFallback className="bg-[#1f3d2f] text-sm font-semibold text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{userName}</p>
                      <p className="text-xs text-muted-foreground">{userTitle}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 w-full overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
