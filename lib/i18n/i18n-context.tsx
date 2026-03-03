"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { translations, type Locale, type TranslationKey } from "./translations"

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en"
  const saved = localStorage.getItem("trailmo-locale")
  if (saved === "fr" || saved === "en") return saved
  return "en"
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem("trailmo-locale", newLocale)
    document.documentElement.lang = newLocale
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      const entry = translations[key]
      if (!entry) return key
      let text: string = entry[locale] ?? entry.en
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
        }
      }
      return text
    },
    [locale]
  )

  return (
    <I18nContext value={{ locale, setLocale, t }}>
      {children}
    </I18nContext>
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider")
  return ctx
}
