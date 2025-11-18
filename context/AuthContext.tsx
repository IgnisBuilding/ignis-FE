'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { User, UserRole, SignupData } from '../types';
import { authenticateUser, mockUsers } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (data: SignupData) => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }
    
    const storedUser = localStorage.getItem('ignis_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('ignis_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Simulate API delay (reduced for better UX)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const authenticatedUser = authenticateUser(email, password);
      
      if (authenticatedUser) {
        setUser(authenticatedUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('ignis_user', JSON.stringify(authenticatedUser));
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ignis_user');
    }
  }, []);

  const signup = useCallback(async (data: SignupData): Promise<boolean> => {
    setLoading(true);
    try {
      // Simulate API delay (reduced for better UX)
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Check if user already exists
      const existingUser = mockUsers.find(u => u.email === data.email);
      if (existingUser) {
        setLoading(false);
        return false;
      }

      // Create new user
      const newUser: User = {
        id: `u${Date.now()}`,
        name: data.name,
        email: data.email,
        role: data.role,
        buildingId: data.buildingId,
        apartmentNumber: data.apartmentNumber
      };

      // In a real app, this would be saved to backend
      mockUsers.push(newUser);
      
      setUser(newUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ignis_user', JSON.stringify(newUser));
      }
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      setLoading(false);
      return false;
    }
  }, []);

  const value: AuthContextType = useMemo(() => ({
    user,
    role: user?.role || null,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
