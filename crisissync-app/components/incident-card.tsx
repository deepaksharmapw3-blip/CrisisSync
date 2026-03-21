"use client"

import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import type { Incident, IncidentType, IncidentStatus } from "@/lib/mock-data"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Flame,
  HeartPulse,
  ShieldAlert,
  AlertCircle,
  MapPin,
  Clock,
  User,
  Zap,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface IncidentCardProps {
  incident: Incident
  className?: string
  onClick?: () => void
}

const typeConfig: Record<IncidentType, { icon: typeof Flame; label: string; className: string; iconBg: string }> = {
  fire: {
    icon: Flame,
    label: "Fire",
    className: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/30",
  },
  medical: {
    icon: HeartPulse,
    label: "Medical",
    className: "text-red-500",
    iconBg: "bg-red-500/10 border-red-500/30",
  },
  security: {
    icon: ShieldAlert,
    label: "Security",
    className: "text-blue-500",
    iconBg: "bg-blue-500/10 border-blue-500/30",
  },
  other: {
    icon: AlertCircle,
    label: "Other",
    className: "text-muted-foreground",
    iconBg: "bg-muted/50 border-border",
  },
}

const statusConfig: Record<IncidentStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-emergency text-emergency-foreground animate-pulse-emergency",
  },
  pending: {
    label: "Pending",
    className: "bg-warning text-warning-foreground",
  },
  resolved: {
    label: "Resolved",
    className: "bg-success text-success-foreground",
  },
}

export function IncidentCard({ incident, className, onClick }: IncidentCardProps) {
  const { t } = useI18n()
  const typeInfo = typeConfig[incident.type]
  const statusInfo = statusConfig[incident.status]
  const TypeIcon = typeInfo.icon

  return (
    <Card
      className={cn(
        "glass cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-primary/10 hover:border-primary/30",
        incident.status === "active" && "border-emergency/30 hover:border-emergency/50",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300",
                typeInfo.iconBg,
                incident.status === "active" && "animate-pulse"
              )}
            >
              <TypeIcon className={cn("h-6 w-6", typeInfo.className)} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{typeInfo.label}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {incident.location}
              </p>
            </div>
          </div>
          <Badge className={cn("shrink-0 rounded-lg", statusInfo.className)}>
            {incident.status === "active" && (
              <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
            )}
            {t(`common.status.${incident.status}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80 mb-4 line-clamp-2">
          {incident.description}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 border border-border/50">
            <User className="h-3 w-3" />
            {incident.reportedBy}
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 border border-border/50">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(incident.reportedAt, { addSuffix: true })}
          </span>
          {incident.assignedTo && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Zap className="h-3 w-3" />
              {incident.assignedTo}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
