'use client';
import { useState, useMemo, memo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Users, Building, Flame, Activity, Bell, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { user, role, isAuthenticated, logout, loading } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getRedirectPath = () => {
    if (role === "building_authority") return "/authority/dashboard";
    if (role === "firefighter") return "/firefighter";
    if (role === "management") return "/admin";
    if (role === "resident") return "/resident";
    return "/login";
  };

  const getNavItems = useMemo(() => (userRole: UserRole | null) => {
    if (userRole === 'building_authority' || userRole === 'management') {
      return [
        { href: '/admin', label: 'Dashboard', icon: Home },
        { href: '/admin/residents', label: 'Residents', icon: Users },
        { href: '/admin/sensors', label: 'Sensors', icon: Activity },
        { href: '/admin/buildings', label: 'Buildings', icon: Building },
        { href: '/editor', label: 'Editor', icon: Pencil },
        { href: '/emergency', label: 'Emergency', icon: AlertTriangle }
      ];
    }
    if (userRole === 'resident') {
      return [
        { href: '/resident', label: 'Dashboard', icon: Home },
        { href: '/resident/apartment', label: 'My Apartment', icon: Building },
        { href: '/resident/alerts', label: 'Alerts', icon: Bell },
        { href: '/emergency', label: 'Emergency', icon: AlertTriangle }
      ];
    }
    if (userRole === 'firefighter') {
      return [
        { href: '/firefighter', label: 'Dashboard', icon: Home },
        { href: '/firefighter/fires', label: 'Active Fires', icon: Flame },
        { href: '/emergency', label: 'Emergency', icon: AlertTriangle }
      ];
    }
    return [];
  }, []);

  const navItems = useMemo(() => getNavItems(role), [role, getNavItems]);

  // Don't render header during SSR/initial load - prevents hydration mismatch
  if (!isMounted) {
    return null;
  }

  // Don't show nav items if we don't have a valid user and nav items
  const shouldShowNav = isAuthenticated && user && navItems.length > 0;

  // Prevent hydration mismatch by not animating on initial server render
  const headerVariants = isMounted ? {
    initial: { y: -100 },
    animate: { y: 0 }
  } : {
    initial: { y: 0 },
    animate: { y: 0 }
  };

  return (
    <motion.header 
      initial={headerVariants.initial}
      animate={headerVariants.animate}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="bg-white/90 backdrop-blur-lg border-b border-dark-green-100 sticky top-0 z-50 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={getRedirectPath()} className="flex items-center space-x-2 group" prefetch={true}>
            {isMounted ? (
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-8 h-8 green-gradient rounded-lg flex items-center justify-center shadow-md"
              >
                <span className="text-white font-bold text-lg">I</span>
              </motion.div>
            ) : (
              <div className="w-8 h-8 green-gradient rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">I</span>
              </div>
            )}
            <span className="text-2xl font-bold text-dark-green-700 group-hover:text-dark-green-800 transition-colors">Ignis</span>
          </Link>

          {shouldShowNav ? (
            <>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-4 items-center">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg text-dark-green-600 hover:text-dark-green-800 hover:bg-dark-green-50 transition-all"
                  >
                    <item.icon size={18} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-all"
                >
                  <LogOut size={18} />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-lg text-dark-green-600 hover:bg-dark-green-50 transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </>
          ) : (
            isAuthenticated && (
              <button
                onClick={logout}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-all"
              >
                <LogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            )
          )}
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && shouldShowNav && (
            <motion.nav 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="md:hidden py-4 border-t border-dark-green-100"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className="flex items-center space-x-2 px-4 py-3 text-dark-green-600 hover:text-dark-green-800 hover:bg-cream-100 transition-all rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon size={18} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="flex items-center space-x-2 px-4 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 transition-all rounded-lg w-full"
              >
                <LogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default memo(Header);