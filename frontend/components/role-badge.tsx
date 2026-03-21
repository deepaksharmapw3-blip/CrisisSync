"use client"

import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import type { UserRole } from "@/lib/mock-data"
import { User, UserCog, Shield } from "lucide-react"

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const { t } = useI18n()

  const roleConfig = {
    guest: {
      label: t("role.guest"),
      icon: User,
      className: "bg-secondary text-secondary-foreground",
    },
    staff: {
      label: t("role.staff"),
      icon: UserCog,
      className: "bg-primary/10 text-primary",
    },
    responder: {
      label: t("role.responder"),
      icon: Shield,
      className: "bg-emergency/10 text-emergency",
    },
  }

  const config = roleConfig[role]
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}
