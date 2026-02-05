'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole, SignupData } from '@/types';
import { api } from '@/lib/api';

// Dashboard role type used by DashboardLayout
export type DashboardRole = 'firefighter' | 'firefighter_hq' | 'firefighter_state' | 'firefighter_district' | 'resident' | 'manager' | 'admin';

// Map backend/user roles to dashboard layout roles
export function mapToDashboardRole(role: UserRole | null | undefined): DashboardRole {
  if (!role) return 'firefighter';
  switch (role) {
    case 'admin':
      return 'admin';
    // Firefighter hierarchy - keep specific roles for different nav menus
    case 'firefighter_hq':
      return 'firefighter_hq';
    case 'firefighter_state':
      return 'firefighter_state';
    case 'firefighter_district':
      return 'firefighter_district';
    case 'firefighter':
      return 'firefighter';
    // Management roles
    case 'commander':
    case 'building_authority':
    case 'management':
      return 'manager';
    case 'resident':
      return 'resident';
    default:
      return 'firefighter';
  }
}

// Get user-friendly title from role
export function getRoleTitle(role: UserRole | null | undefined): string {
  if (!role) return 'USER';
  switch (role) {
    case 'admin':
      return 'ADMINISTRATOR';
    case 'firefighter_hq':
      return 'HQ FIREFIGHTER';
    case 'firefighter_state':
      return 'STATE FIREFIGHTER';
    case 'firefighter_district':
      return 'DISTRICT FIREFIGHTER';
    case 'firefighter':
      return 'FIREFIGHTER';
    case 'commander':
      return 'FIRE COMMANDER';
    case 'resident':
      return 'RESIDENT';
    case 'building_authority':
      return 'BUILDING AUTHORITY';
    case 'management':
      return 'MANAGEMENT';
    default:
      return 'USER';
  }
}

// Helper to check if a role is any firefighter role
export function isFirefighterRole(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return ['firefighter', 'firefighter_hq', 'firefighter_state', 'firefighter_district'].includes(role);
}

// Helper to check if a role is any management role
export function isManagementRole(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return ['admin', 'commander', 'management', 'building_authority'].includes(role);
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  dashboardRole: DashboardRole;
  roleTitle: string;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (data: SignupData) => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const storedUser = localStorage.getItem('ignis_user');
    const token = localStorage.getItem('ignis_token');

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('ignis_user');
        localStorage.removeItem('ignis_token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await api.login(email, password);

      if (response.access_token && response.user) {
        // Map backend user to frontend User type
        const mappedUser: User = {
          id: response.user.id.toString(),
          name: response.user.name,
          email: response.user.email,
          role: response.user.role as UserRole,
        };

        setUser(mappedUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('ignis_user', JSON.stringify(mappedUser));
        }
        setLoading(false);
        return true;
      }

      setLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    api.clearToken();
    router.push('/login');
  }, [router]);

  const signup = useCallback(async (data: SignupData): Promise<boolean> => {
    setLoading(true);
    try {
      const registerData = {
        email: data.email,
        password: data.password || 'default123',
        name: data.name,
        role: data.role,
      };

      const response = await api.register(registerData);

      if (response) {
        // Auto-login after successful signup
        const loginSuccess = await login(data.email, registerData.password);
        return loginSuccess;
      }

      setLoading(false);
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      setLoading(false);
      return false;
    }
  }, [login]);

  const value: AuthContextType = useMemo(() => ({
    user,
    role: user?.role || null,
    dashboardRole: mapToDashboardRole(user?.role),
    roleTitle: getRoleTitle(user?.role),
    isAuthenticated: !!user,
    login,
    logout,
    signup,
    loading
  }), [user, login, logout, signup, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a default loading state instead of throwing
    // This handles the case during SSR/hydration
    return {
      user: null,
      role: null,
      dashboardRole: 'firefighter_district' as DashboardRole,
      roleTitle: 'USER',
      isAuthenticated: false,
      login: async () => false,
      logout: () => {},
      signup: async () => false,
      loading: true,
    };
  }
  return context;
};
