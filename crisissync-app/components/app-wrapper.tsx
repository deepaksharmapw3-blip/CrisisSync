"use client"

import { ReactNode } from "react"
import { I18nProvider } from "@/lib/i18n"
import { Navbar } from "@/components/navbar"

interface AppWrapperProps {
  children: ReactNode
  showNavbar?: boolean
}

export function AppWrapper({ children, showNavbar = true }: AppWrapperProps) {
  return (
    <I18nProvider>
      <div className="min-h-screen flex flex-col">
        {showNavbar && <Navbar />}
        <main className="flex-1">{children}</main>
      </div>
    </I18nProvider>
  )
}
