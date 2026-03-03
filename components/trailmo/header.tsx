"use client"

import Image from "next/image"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Button } from "@/components/ui/button"

export function Header() {
  const { locale, setLocale, t } = useTranslation()

  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6">
      <div className="flex items-center gap-2.5">
        <Image
          src="/logo.png"
          alt="Trailmo"
          width={32}
          height={32}
          className="h-8 w-8 rounded-lg"
        />
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold leading-tight text-foreground">
            Trailmo
          </h1>
          <p className="text-[11px] leading-tight text-muted-foreground">
            {t("header.subtitle")}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={() => setLocale(locale === "en" ? "fr" : "en")}
        aria-label={locale === "en" ? "Switch to French" : "Passer en anglais"}
      >
        {locale === "en" ? "FR" : "EN"}
      </Button>
    </header>
  )
}
