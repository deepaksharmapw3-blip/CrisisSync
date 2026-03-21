"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppWrapper } from "@/components/app-wrapper"
import { useI18n } from "@/lib/i18n"

function LandingContent() {
  const router = useRouter()

  useEffect(() => {
    // Force redirect to login page first as requested by USER
    router.push("/login")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/20 border border-primary/30 animate-pulse" />
        <p className="text-muted-foreground animate-pulse">Redirecting to Identity Verification...</p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <AppWrapper>
      <LandingContent />
    </AppWrapper>
  )
}
