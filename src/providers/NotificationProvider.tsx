"use client"

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"

export interface Notification {
  id: number
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  priority: string
  status: "unread" | "read"
  roleTarget: string | null
  createdAt: string
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (type: Notification["type"], title: string, message: string) => void
  removeNotification: (id: number) => void
  markAsRead: (id: number) => void
  markAllAsRead: () => void
  clearAll: () => void
  unreadCount: number
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get<Notification[]>("/notifications/my")
      setNotifications(data)
    } catch {
      // Silently fail
    }
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get<{ count: number }>("/notifications/unread-count")
      setUnreadCount(data.count)
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
      fetchUnreadCount()

      // Poll unread count every 30s
      pollRef.current = setInterval(fetchUnreadCount, 30000)
      return () => {
        if (pollRef.current) clearInterval(pollRef.current)
      }
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount])

  const addNotification = useCallback((type: Notification["type"], title: string, message: string) => {
    // Local/optimistic notification with a temporary negative id
    const tempNotification: Notification = {
      id: -Date.now(),
      type,
      title,
      message,
      priority: "medium",
      status: "unread",
      roleTarget: null,
      createdAt: new Date().toISOString(),
    }
    setNotifications((prev) => [tempNotification, ...prev])
    setUnreadCount((prev) => prev + 1)
  }, [])

  const removeNotification = useCallback(async (id: number) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    const wasUnread = notifications.find((n) => n.id === id)?.status === "unread"
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1))

    if (id > 0) {
      try {
        await api.delete(`/notifications/${id}`)
      } catch {
        // Re-fetch on failure
        fetchNotifications()
        fetchUnreadCount()
      }
    }
  }, [notifications, fetchNotifications, fetchUnreadCount])

  const markAsRead = useCallback(async (id: number) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "read" as const } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    if (id > 0) {
      try {
        await api.patch(`/notifications/${id}/read`)
      } catch {
        fetchNotifications()
        fetchUnreadCount()
      }
    }
  }, [fetchNotifications, fetchUnreadCount])

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" as const })))
    setUnreadCount(0)

    try {
      await api.patch("/notifications/read-all")
    } catch {
      fetchNotifications()
      fetchUnreadCount()
    }
  }, [fetchNotifications, fetchUnreadCount])

  const clearAll = useCallback(() => {
    // Clear local state only (doesn't delete from backend)
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
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
