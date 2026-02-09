'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Map, Users, BarChart3, Settings, Bell, LogOut, Flame, Search, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/firefighter' },
    { icon: Map, label: 'Live Map', href: '/emergency' },
    { icon: Users, label: 'Personnel', href: '/firefighter/personnel' },
    { icon: BarChart3, label: 'Reports', href: '/firefighter/reports' },
  ];

  return (
    <div className="min-h-screen bg-accent dark:bg-background flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-primary/10 dark:border-border flex flex-col justify-between bg-white dark:bg-card h-screen sticky top-0">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-primary w-10 h-10 rounded-lg flex items-center justify-center text-white">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-primary text-lg font-bold leading-tight">Ignis Command</h1>
              <p className="text-primary/60 text-xs font-medium uppercase tracking-widest">Elite Response</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-primary/70 hover:bg-primary/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section - Dispatch Button */}
        <div className="p-6">
          <button
            onClick={() => router.push('/emergency')}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-bold transition-colors shadow-lg shadow-red-600/20"
          >
            <Flame className="w-5 h-5" />
            <span>Dispatch</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-primary/5 dark:border-border bg-white/50 dark:bg-card/50 backdrop-blur-md px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span className="text-primary font-semibold text-sm">System: Optimal</span>
            </div>
            <div className="flex items-center gap-3 text-primary/50">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">GPS: Locked</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-primary/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-primary/5 border-none rounded-full w-64 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none placeholder:text-primary/30"
                placeholder="Search incidents, units..."
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="w-10 h-10 flex items-center justify-center bg-primary/5 rounded-full text-primary hover:bg-primary/10 relative transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-card"></span>
              </button>
              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center bg-primary/5 rounded-full text-primary hover:bg-primary/10 transition-colors"
                title="Logout"
              >
                <Settings className="w-5 h-5" />
              </button>
              <div className="h-8 w-[1px] bg-primary/10 mx-2"></div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{user?.name || 'Cmdr. Sterling'}</p>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-primary/50">{user?.role || 'Senior Director'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden border-2 border-primary/10 flex items-center justify-center bg-cover bg-center">
                  <span className="text-primary font-bold">{user?.name?.charAt(0) || 'C'}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
