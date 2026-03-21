"use client"

import { useState, useMemo } from "react"
import { AppWrapper } from "@/components/app-wrapper"
import { useI18n } from "@/lib/i18n"
import { IncidentCard } from "@/components/incident-card"
import { SirenSpinner } from "@/components/siren-spinner"
import { mockIncidents, type IncidentType, type IncidentStatus } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Flame,
  HeartPulse,
  ShieldAlert,
  AlertCircle,
  MapPin,
  User,
  Calendar,
  Activity,
  Zap,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

function DashboardContent() {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<IncidentType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "all">("all")
  const [selectedIncident, setSelectedIncident] = useState<typeof mockIncidents[0] | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filteredIncidents = useMemo(() => {
    return mockIncidents.filter((incident) => {
      const matchesSearch =
        incident.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.reportedBy.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = typeFilter === "all" || incident.type === typeFilter
      const matchesStatus = statusFilter === "all" || incident.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [searchQuery, typeFilter, statusFilter])

  const stats = useMemo(() => {
    return {
      active: mockIncidents.filter((i) => i.status === "active").length,
      resolved: mockIncidents.filter((i) => i.status === "resolved").length,
      pending: mockIncidents.filter((i) => i.status === "pending").length,
    }
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  const typeIcons: Record<IncidentType, typeof Flame> = {
    fire: Flame,
    medical: HeartPulse,
    security: ShieldAlert,
    other: AlertCircle,
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-pattern opacity-30" />
      </div>

      <div className="container px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/30">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
            </div>
            <p className="text-muted-foreground">
              Real-time monitoring of all incidents across your property
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-fit rounded-xl border-primary/30 hover:bg-primary/10 hover:text-primary transition-all duration-200"
          >
            {isRefreshing ? (
              <SirenSpinner size="sm" className="mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="glass border-emergency/30 hover:border-emergency/50 transition-all duration-300 group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emergency/10 border border-emergency/20 group-hover:glow-orange transition-all duration-300">
                  <AlertTriangle className="h-4 w-4 text-emergency" />
                </div>
                {t("dashboard.activeCrises")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-emergency font-mono">{stats.active}</div>
              <div className="text-xs text-muted-foreground mt-1">Requires immediate attention</div>
            </CardContent>
          </Card>

          <Card className="glass border-success/30 hover:border-success/50 transition-all duration-300 group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 border border-success/20 transition-all duration-300">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                {t("dashboard.resolved")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-success font-mono">{stats.resolved}</div>
              <div className="text-xs text-muted-foreground mt-1">Successfully handled today</div>
            </CardContent>
          </Card>

          <Card className="glass border-warning/30 hover:border-warning/50 transition-all duration-300 group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 border border-warning/20 transition-all duration-300">
                  <Clock className="h-4 w-4 text-warning" />
                </div>
                {t("dashboard.pending")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-warning font-mono">{stats.pending}</div>
              <div className="text-xs text-muted-foreground mt-1">Awaiting response</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 glass border-primary/10">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("dashboard.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl border-primary/20 bg-background/50 focus:border-primary/50 transition-all duration-200"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as IncidentType | "all")}
                >
                  <SelectTrigger className="w-[140px] rounded-xl border-primary/20 bg-background/50">
                    <Filter className="h-4 w-4 mr-2 text-primary" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="glass border-primary/20">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="fire">Fire</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as IncidentStatus | "all")}
                >
                  <SelectTrigger className="w-[140px] rounded-xl border-primary/20 bg-background/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="glass border-primary/20">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Filter Tags */}
        {(typeFilter !== "all" || statusFilter !== "all" || searchQuery) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {typeFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                Type: {typeFilter}
                <button
                  onClick={() => setTypeFilter("all")}
                  className="ml-1 hover:text-foreground"
                >
                  ×
                </button>
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                Status: {statusFilter}
                <button
                  onClick={() => setStatusFilter("all")}
                  className="ml-1 hover:text-foreground"
                >
                  ×
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                Search: {searchQuery}
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-1 hover:text-foreground"
                >
                  ×
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypeFilter("all")
                setStatusFilter("all")
                setSearchQuery("")
              }}
              className="text-muted-foreground hover:text-primary"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Incidents Grid */}
        {isRefreshing ? (
          <div className="flex flex-col items-center justify-center py-20">
            <SirenSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading incidents...</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <Card className="py-20 glass border-primary/10">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success/10 border border-success/20 mb-4">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No incidents found</h3>
              <p className="text-muted-foreground">
                {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "All clear! No active incidents at this time."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onClick={() => setSelectedIncident(incident)}
              />
            ))}
          </div>
        )}

        {/* Incident Detail Dialog */}
        <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
          <DialogContent className="max-w-lg glass border-primary/20">
            {selectedIncident && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = typeIcons[selectedIncident.type]
                      return (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emergency/10 border border-emergency/30">
                          <Icon className="h-7 w-7 text-emergency" />
                        </div>
                      )
                    })()}
                    <div>
                      <DialogTitle className="capitalize text-xl">
                        {selectedIncident.type} Emergency
                      </DialogTitle>
                      <DialogDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {selectedIncident.location}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                    <p>{selectedIncident.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                      <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Reported By
                      </h4>
                      <p className="font-medium">{selectedIncident.reportedBy}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                      <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Reported At
                      </h4>
                      <p className="font-medium">{format(selectedIncident.reportedAt, "MMM d, h:mm a")}</p>
                    </div>
                  </div>

                  {selectedIncident.assignedTo && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Assigned To</h4>
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        <Zap className="h-3 w-3 mr-1" />
                        {selectedIncident.assignedTo}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="text-sm text-muted-foreground">
                      Last updated: {formatDistanceToNow(selectedIncident.reportedAt, { addSuffix: true })}
                    </div>
                    <Badge
                      className={
                        selectedIncident.status === "active"
                          ? "bg-emergency text-emergency-foreground"
                          : selectedIncident.status === "pending"
                          ? "bg-warning text-warning-foreground"
                          : "bg-success text-success-foreground"
                      }
                    >
                      {t(`common.status.${selectedIncident.status}`)}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AppWrapper>
      <DashboardContent />
    </AppWrapper>
  )
}
