'use client';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Map, Bell, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ResidentSidebarLayoutProps {
  children: React.ReactNode;
}

export default function ResidentSidebarLayout({ children }: ResidentSidebarLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', href: '/resident' },
    { icon: Map, label: 'Building Map', href: '/emergency' },
    { icon: Bell, label: 'Alerts', href: '/resident/alerts' },
    { icon: Settings, label: 'Settings', href: '/resident/settings' },
  ];

  return (
    <div className="min-h-screen bg-accent flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-primary/10 flex flex-col justify-between bg-white h-screen sticky top-0">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-primary w-10 h-10 rounded-lg flex items-center justify-center text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-primary text-lg font-bold leading-tight">Ignis</h1>
              <p className="text-primary/60 text-xs font-medium uppercase tracking-widest">Resident Portal</p>
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

        {/* Bottom Section */}
        <div className="p-6">
          <button
            onClick={handleLogout}
            className="w-full border-2 border-primary/20 text-primary hover:bg-primary/5 rounded-xl py-3 flex items-center justify-center gap-2 font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-primary/5 bg-white/50 backdrop-blur-md px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span className="text-primary font-semibold text-sm">Building: Safe</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center bg-primary/5 rounded-full text-primary hover:bg-primary/10 relative">
              <Bell className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center bg-primary/5 rounded-full text-primary hover:bg-primary/10">
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-8 w-[1px] bg-primary/10 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{user?.name || 'User'}</p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-primary/50">Resident</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden border-2 border-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">{user?.name?.charAt(0) || 'U'}</span>
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
