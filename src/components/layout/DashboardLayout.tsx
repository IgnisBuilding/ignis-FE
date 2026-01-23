"use client";

import { ReactNode, useState, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  children: ReactNode;
  role: "firefighter" | "resident" | "manager" | "admin";
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
  firefighter: {
    title: "IGNIS COMMAND",
    subtitle: "ELITE TACTICAL",
    navItems: [
      { label: "Dashboard", href: "/firefighter", icon: LayoutDashboard },
      { label: "Live Map", href: "/firefighter/map", icon: Map },
      { label: "Personnel", href: "/firefighter/team", icon: Users },
      { label: "Logistics", href: "/firefighter/logistics", icon: Truck },
      { label: "Reports", href: "/firefighter/reports", icon: BarChart3 },
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
      { label: "Residents", href: "/admin/residents", icon: Users },
      { label: "Sensors", href: "/admin/sensors", icon: Radio },
      { label: "Buildings", href: "/admin/buildings", icon: Building2 },
      { label: "Logistics", href: "/admin/logistics", icon: Truck },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
    dispatchButton: false,
  },
};

// Mobile Sidebar Context
const SidebarContext = createContext<{ isOpen: boolean; setIsOpen: (open: boolean) => void } | undefined>(undefined);

function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    return { isOpen: false, setIsOpen: () => {} };
  }
  return context;
}

export default function DashboardLayout({ children, role, userName, userTitle }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const config = roleConfig[role];

  const isActive = (href: string) => {
    if (href === "/firefighter" || href === "/admin" || href === "/resident") {
      return pathname === href;
    }
    return pathname.startsWith(href) && href !== "/settings";
  };

  const userInitials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const SidebarContent = () => (
    <>
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
    </>
  );

  return (
    <SidebarContext.Provider value={{ isOpen: sidebarOpen, setIsOpen: setSidebarOpen }}>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <aside className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-border bg-card lg:flex transition-all duration-300",
          "w-56"
        )}>
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        <aside className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-56 flex-col border-r border-border bg-card transition-all duration-300 lg:hidden",
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
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
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

        {/* Main Content Area */}
        <div className="lg:pl-56">
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-border bg-card gap-2 overflow-x-auto px-3 sm:px-6">
            <div className="flex items-center gap-3 sm:gap-6 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="text-muted-foreground hover:text-foreground flex-shrink-0 lg:hidden"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-green-500" />
                <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">{t.header.systemOptimal}</span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-muted-foreground flex-shrink-0">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm whitespace-nowrap">{t.header.gpsLocked}</span>
              </div>
            </div>

            <div className="mx-2 sm:mx-8 max-w-xs sm:max-w-md flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground flex-shrink-0" />
                <Input
                  type="search"
                  placeholder={t.header.searchIncidents}
                  className="w-full border-0 bg-secondary pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              <NotificationModal />
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hidden sm:flex h-8 w-8 sm:h-10 sm:w-10 p-0">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>

              <div className="hidden sm:flex items-center gap-2 sm:gap-3 border-l border-border pl-2 sm:pl-4">
                <div className="text-right hidden lg:block">
                  <p className="text-xs sm:text-sm font-semibold text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userTitle}</p>
                </div>
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-[#1f3d2f] flex-shrink-0">
                  <AvatarFallback className="bg-[#1f3d2f] text-xs sm:text-sm font-semibold text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main>
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
