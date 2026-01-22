"use client"

import React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { Language } from "@/lib/translations/types"
import { enTranslations } from "@/lib/translations/en"
import { urTranslations } from "@/lib/translations/ur"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof enTranslations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language | null
    const initialLanguage = (savedLanguage && (savedLanguage === "en" || savedLanguage === "ur")) ? savedLanguage : "en"

    setLanguageState(initialLanguage)
    document.documentElement.lang = initialLanguage
    document.documentElement.dir = initialLanguage === "ur" ? "rtl" : "ltr"

    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr"
  }

  const translations = language === "ur" ? urTranslations : enTranslations

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    return {
      language: "en" as Language,
      setLanguage: () => {},
      t: enTranslations,
    }
  }
  return context
}
