"use client";

import { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import Link from "next/link";
import clsx from "clsx";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  role: "firefighter" | "resident" | "manager" | "admin";
  userName: string;
  userTitle: string;
  disablePadding?: boolean;
}

const roleConfig = {
  firefighter: {
    title: "Ignis Command",
    subtitle: "Elite Response",
    navItems: [
      { label: "Dashboard", href: "/firefighter", icon: "dashboard" },
      { label: "Live Map", href: "/firefighter/map", icon: "map" },
      { label: "Personnel", href: "/firefighter/team", icon: "group" },
      { label: "Logistics", href: "/firefighter/logistics", icon: "local_shipping" },
      { label: "Reports", href: "/firefighter/reports", icon: "bar_chart" },
      { label: "Directory", href: "/firefighter/directory", icon: "menu_book" },
    ],
    dispatchButton: true,
  },
  resident: {
    title: "Ignis Safety",
    subtitle: "Resident Portal",
    navItems: [
      { label: "Dashboard", href: "/resident", icon: "dashboard" },
      { label: "My Apartment", href: "/resident/apartment", icon: "apartment" },
      { label: "Alerts", href: "/resident/alerts", icon: "notifications" },
      { label: "Emergency", href: "/emergency", icon: "emergency" },
    ],
    dispatchButton: false,
  },
  manager: {
    title: "Ignis Control",
    subtitle: "Building Management",
    navItems: [
      { label: "Dashboard", href: "/admin", icon: "dashboard" },
      { label: "Buildings", href: "/admin/buildings", icon: "domain" },
      { label: "Residents", href: "/admin/residents", icon: "people" },
      { label: "Sensors", href: "/admin/sensors", icon: "sensors" },
      { label: "Emergency", href: "/emergency", icon: "emergency" },
    ],
    dispatchButton: false,
  },
  admin: {
    title: "Ignis Admin",
    subtitle: "Management Portal",
    navItems: [
      { label: "Dashboard", href: "/admin", icon: "dashboard" },
      { label: "Residents", href: "/admin/residents", icon: "people" },
      { label: "Sensors", href: "/admin/sensors", icon: "sensors" },
      { label: "Buildings", href: "/admin/buildings", icon: "domain" },
      { label: "Emergency", href: "/emergency", icon: "emergency" },
    ],
    dispatchButton: false,
  },
};

export default function DashboardLayout({ children, role, userName, userTitle }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const config = roleConfig[role];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-primary/10 flex flex-col justify-between bg-white dark:bg-background-dark h-screen sticky top-0 shrink-0 z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined">local_fire_department</span>
            </div>
            <div>
              <h1 className="text-primary dark:text-cream text-lg font-bold leading-tight">{config.title}</h1>
              <p className="text-primary/60 dark:text-cream/60 text-xs font-medium uppercase tracking-widest">{config.subtitle}</p>
            </div>
          </div>
          <nav className="space-y-2">
            {config.navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-primary/70 hover:bg-primary/5"
                  )}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 space-y-4">
          {config.dispatchButton && (
            <button
              onClick={() => router.push('/emergency')}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-bold transition-colors shadow-lg shadow-red-600/20"
            >
              <span className="material-symbols-outlined">emergency_share</span>
              <span>Dispatch</span>
            </button>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-primary/60 hover:text-red-600 transition-colors text-xs font-bold uppercase tracking-widest py-2"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-primary/5 bg-white/50 dark:bg-background-dark/50 backdrop-blur-md px-8 py-4 sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-primary font-semibold text-sm">System: Optimal</span>
            </div>
            <div className="flex items-center gap-3 text-primary/50">
              <span className="material-symbols-outlined text-lg">location_on</span>
              <span className="text-sm font-medium">GPS: Locked</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-primary/40">search</span>
              <input
                className="pl-10 pr-4 py-2 bg-primary/5 border-none rounded-full w-64 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-primary/30 outline-none"
                placeholder="Search incidents, units..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="size-10 flex items-center justify-center bg-primary/5 rounded-full text-primary hover:bg-primary/10 relative transition-colors">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="size-10 flex items-center justify-center bg-primary/5 rounded-full text-primary hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
              <div className="h-8 w-[1px] bg-primary/10 mx-2"></div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-primary">{userName}</p>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-primary/50">{userTitle}</p>
                </div>
                <div
                  className="size-10 rounded-full bg-primary/10 overflow-hidden bg-cover bg-center border-2 border-primary/10 flex items-center justify-center text-primary font-bold"
                >
                  {userName.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
