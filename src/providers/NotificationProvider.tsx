"use client"

import React, { createContext, useCallback, useContext, useState } from "react"

export interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  timestamp: number
  read: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (type: Notification["type"], title: string, message: string) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  clearAll: () => void
  unreadCount: number
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((type: Notification["type"], title: string, message: string) => {
    const id = `${Date.now()}-${Math.random()}`
    const newNotification: Notification = {
      id,
      type,
      title,
      message,
      timestamp: Date.now(),
      read: false,
    }
    setNotifications((prev) => [newNotification, ...prev])
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        markAsRead,
        clearAll,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider")
  }
  return context
}
