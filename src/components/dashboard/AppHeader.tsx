"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Settings, MapPin, Menu } from "lucide-react"
import { useLanguage } from "@/providers/LanguageProvider"
import { NotificationModal } from "@/components/notifications"
import { useAppSidebar } from "@/components/dashboard/AppSidebar"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"

interface AppHeaderProps {
  searchPlaceholder?: string
  showSystemStatus?: boolean
}

export function AppHeader({
  searchPlaceholder,
  showSystemStatus = true,
}: AppHeaderProps) {
  const { t } = useLanguage()
  const { setIsOpen } = useAppSidebar()
  const { user } = useAuth()

  const userName = user?.name || "User"
  const userRole = user?.role?.toUpperCase() || "USER"
  const userInitials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-border bg-card gap-2 overflow-x-auto px-3 sm:px-6">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="text-muted-foreground hover:text-foreground flex-shrink-0 lg:hidden"
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        {showSystemStatus && (
          <>
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-green-500" />
              <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">{t.header.systemOptimal}</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-muted-foreground flex-shrink-0">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm whitespace-nowrap">{t.header.gpsLocked}</span>
            </div>
          </>
        )}
      </div>

      <div className="mx-2 sm:mx-8 max-w-xs sm:max-w-md flex-1 min-w-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground flex-shrink-0" />
          <Input
            type="search"
            placeholder={searchPlaceholder || t.header.searchIncidents}
            className="w-full border-0 bg-secondary pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        <NotificationModal />
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hidden sm:flex h-8 w-8 sm:h-10 sm:w-10 p-0">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </Link>

        <div className="hidden sm:flex items-center gap-2 sm:gap-3 border-l border-border pl-2 sm:pl-4">
          <div className="text-right hidden lg:block">
            <p className="text-xs sm:text-sm font-semibold text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">{userRole}</p>
          </div>
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-[#1f3d2f] dark:border-primary flex-shrink-0">
            <AvatarFallback className="bg-[#1f3d2f] text-xs sm:text-sm font-semibold text-white">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
