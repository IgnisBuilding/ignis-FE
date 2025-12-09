'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { User, UserRole, SignupData } from '../types';
import { api } from '@/lib/api';

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
  }, []);

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
