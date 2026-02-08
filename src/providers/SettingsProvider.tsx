"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"

export interface UserSettings {
  id: number
  userId: number
  theme: "light" | "dark" | "system"
  language: "en" | "ur"
  notifyPush: boolean
  notifyEmail: boolean
  notifySms: boolean
  notifyMaintenance: boolean
  notifyCommunity: boolean
}

interface SettingsContextType {
  settings: UserSettings | null
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>
  refreshSettings: () => Promise<void>
  loading: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get<UserSettings>("/settings/my")
      setSettings(data)
    } catch {
      // Silently fail — defaults will be used
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings()
    } else {
      setSettings(null)
    }
  }, [isAuthenticated, fetchSettings])

  // Persist to DB and update local state
  const updateSettings = useCallback(async (partial: Partial<UserSettings>) => {
    try {
      const { data } = await api.put<UserSettings>("/settings/my", partial)
      setSettings(data)
    } catch (err) {
      console.error("Failed to update settings:", err)
      throw err
    }
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, refreshSettings: fetchSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    return {
      settings: null,
      updateSettings: async () => {},
      refreshSettings: async () => {},
      loading: false,
    }
  }
  return context
}
