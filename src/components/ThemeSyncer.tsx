"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { useSettings } from "@/providers/SettingsProvider"
import { useLanguage } from "@/providers/LanguageProvider"

export function ThemeSyncer() {
  const { settings } = useSettings()
  const { setTheme } = useTheme()
  const { setLanguage } = useLanguage()

  // Use refs to avoid re-triggering effects when setter references change
  const setThemeRef = useRef(setTheme)
  const setLanguageRef = useRef(setLanguage)
  setThemeRef.current = setTheme
  setLanguageRef.current = setLanguage

  useEffect(() => {
    if (settings?.theme) {
      setThemeRef.current(settings.theme)
    }
  }, [settings?.theme])

  useEffect(() => {
    if (settings?.language) {
      setLanguageRef.current(settings.language as "en" | "ur")
    }
  }, [settings?.language])

  return null
}
