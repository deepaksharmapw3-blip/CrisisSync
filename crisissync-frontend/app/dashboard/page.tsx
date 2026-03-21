"use client"

import { useState, useEffect, useCallback } from "react"
import { AppWrapper } from "@/components/app-wrapper"
import { useI18n } from "@/lib/i18n"
import { SirenSpinner } from "@/components/siren-spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Search, Filter, AlertTriangle, CheckCircle2, Clock, RefreshCw,
  Flame, HeartPulse, ShieldAlert, AlertCircle, MapPin, User,
  Calendar, Activity, Zap, Brain, Wifi, WifiOff, Tag,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { cn } from "@/lib/utils"
import { incidentsApi, aiApi, CrisisSyncWS, type Incident, type IncidentType, type IncidentStatus } from "@/lib/api"
import { toast } from "sonner"

// ── Incident Card ──────────────────────────────────────────────────────────
function IncidentCard({ incident, onClick }: { incident: Incident; onClick: () => void }) {
  const typeConfig = {
    fire:     { icon: Flame,      label: "Fire",     cls: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30" },
    medical:  { icon: HeartPulse, label: "Medical",  cls: "text-red-500",    bg: "bg-red-500/10 border-red-500/30" },
    security: { icon: ShieldAlert,label: "Security", cls: "text-blue-500",   bg: "bg-blue-500/10 border-blue-500/30" },
    other:    { icon: AlertCircle,label: "Other",    cls: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  }
  const statusConfig = {
    active:   { label: "Active",   cls: "bg-emergency text-emergency-foreground animate-pulse-emergency" },
    pending:  { label: "Pending",  cls: "bg-warning text-warning-foreground" },
    resolved: { label: "Resolved", cls: "bg-success text-success-foreground" },
    closed:   { label: "Closed",   cls: "bg-muted text-muted-foreground" },
  }
  const tc = typeConfig[incident.type]
  const sc = statusConfig[incident.status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = tc.icon

  return (
    <Card
      className={cn(
        "glass cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-primary/10 hover:border-primary/30",
        incident.status === "active" && "border-emergency/30 hover:border-emergency/50"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl border", tc.bg, incident.status === "active" && "animate-pulse")}>
              <Icon className={cn("h-6 w-6", tc.cls)} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{tc.label}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />{incident.location}
              </p>
            </div>
          </div>
          <Badge className={cn("shrink-0 rounded-lg", sc.cls)}>
            {incident.status === "active" && <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5 animate-pulse" />}
            {sc.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80 mb-3 line-clamp-2">{incident.description}</p>
        {/* AI Tags */}
        {incident.ai_tags && incident.ai_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {incident.ai_tags.slice(0, 3).map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Tag className="h-2.5 w-2.5" />{tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 border border-border/50">
            <User className="h-3 w-3" />{incident.reporter_name || "Staff"}
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 border border-border/50">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(incident.reported_at), { addSuffix: true })}
          </span>
          {incident.ai_severity_score !== undefined && (
            <span className={cn("flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px]",
              incident.ai_severity_score > 0.7 ? "bg-emergency/10 border-emergency/30 text-emergency" :
              incident.ai_severity_score > 0.4 ? "bg-warning/10 border-warning/30 text-warning" :
              "bg-success/10 border-success/30 text-success"
            )}>
              <Brain className="h-3 w-3" />
              AI: {Math.round(incident.ai_severity_score * 100)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── AI Triage Panel ────────────────────────────────────────────────────────
function AITriagePanel({ incident }: { incident: Incident }) {
  const [loading, setLoading] = useState(false)
  const [triage, setTriage] = useState<{
    summary?: string; suggested_actions?: string[]; requires_evacuation?: boolean; call_911?: boolean
  } | null>(incident.ai_triage_summary ? {
    summary: incident.ai_triage_summary,
    suggested_actions: incident.ai_suggested_actions || [],
  } : null)

  const runTriage = async () => {
    setLoading(true)
    try {
      const result = await aiApi.triage(incident.id)
      setTriage(result)
    } catch {
      toast.error("AI triage failed — check your API key")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
          <Brain className="h-4 w-4" />Claude AI Triage
        </h4>
        <Button size="sm" variant="outline" onClick={runTriage} disabled={loading}
          className="h-7 text-xs border-primary/30 hover:bg-primary/10">
          {loading ? <SirenSpinner size="sm" className="mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
          {triage ? "Re-analyze" : "Run Triage"}
        </Button>
      </div>
      {triage ? (
        <div className="space-y-3 text-sm">
          {triage.summary && <p className="text-foreground/80">{triage.summary}</p>}
          {triage.requires_evacuation && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emergency/10 border border-emergency/30 text-emergency text-xs font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />EVACUATION RECOMMENDED
            </div>
          )}
          {triage.call_911 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emergency/10 border border-emergency/30 text-emergency text-xs font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />CALL 911 IMMEDIATELY
            </div>
          )}
          {triage.suggested_actions && triage.suggested_actions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Suggested Actions:</p>
              <ol className="space-y-1.5">
                {triage.suggested_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Click "Run Triage" to get AI-powered analysis and action recommendations.</p>
      )}
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
function DashboardContent() {
  const { t } = useI18n()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState({ active: 0, pending: 0, resolved: 0, total: 0 })
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<IncidentType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "all">("all")
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)

  const fetchIncidents = useCallback(async () => {
    try {
      const data = await incidentsApi.list({
        status: statusFilter !== "all" ? statusFilter as IncidentStatus : undefined,
        type: typeFilter !== "all" ? typeFilter as IncidentType : undefined,
        search: searchQuery || undefined,
      })
      setIncidents(data.incidents)
      setStats({ active: data.active, pending: data.pending, resolved: data.resolved, total: data.total })
    } catch {
      // Fallback: use mock-like demo data if API not yet running
      toast.error("Could not connect to API — check backend is running")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [statusFilter, typeFilter, searchQuery])

  useEffect(() => { fetchIncidents() }, [fetchIncidents])

  // Real-time WebSocket subscription
  useEffect(() => {
    let ws: CrisisSyncWS | null = null
    try {
      ws = new CrisisSyncWS().connect(null)
      setWsConnected(true)
      ws.on("incident_new", () => {
        toast.info("🚨 New incident reported!", { duration: 4000 })
        fetchIncidents()
      })
      ws.on("incident_update", (payload: unknown) => {
        const p = payload as { incident_id: number; data: Partial<Incident> }
        setIncidents(prev => prev.map(i => i.id === p.incident_id ? { ...i, ...p.data } : i))
        setSelectedIncident(prev => prev?.id === p.incident_id ? { ...prev, ...p.data } : prev)
      })
    } catch {
      setWsConnected(false)
    }
    return () => { ws?.disconnect(); setWsConnected(false) }
  }, [fetchIncidents])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchIncidents()
  }

  const typeIcons: Record<string, typeof Flame> = {
    fire: Flame, medical: HeartPulse, security: ShieldAlert, other: AlertCircle,
  }

  return (
    <div className="min-h-screen relative">
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
              {/* Live indicator */}
              <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                wsConnected
                  ? "bg-success/10 border-success/30 text-success"
                  : "bg-muted border-border text-muted-foreground")}>
                {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {wsConnected ? "Live" : "Offline"}
              </div>
            </div>
            <p className="text-muted-foreground">Real-time monitoring of all incidents across your property</p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}
            className="w-fit rounded-xl border-primary/30 hover:bg-primary/10 hover:text-primary">
            {isRefreshing ? <SirenSpinner size="sm" className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: t("dashboard.activeCrises"), value: stats.active, icon: AlertTriangle, cls: "border-emergency/30 hover:border-emergency/50", valCls: "text-emergency", subCls: "bg-emergency/10 border-emergency/20", desc: "Requires immediate attention" },
            { label: t("dashboard.resolved"),     value: stats.resolved, icon: CheckCircle2, cls: "border-success/30 hover:border-success/50", valCls: "text-success", subCls: "bg-success/10 border-success/20", desc: "Successfully handled today" },
            { label: t("dashboard.pending"),      value: stats.pending, icon: Clock, cls: "border-warning/30 hover:border-warning/50", valCls: "text-warning", subCls: "bg-warning/10 border-warning/20", desc: "Awaiting response" },
          ].map(({ label, value, icon: Icon, cls, valCls, subCls, desc }) => (
            <Card key={label} className={cn("glass transition-all duration-300 group", cls)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", subCls)}>
                    <Icon className={cn("h-4 w-4", valCls)} />
                  </div>
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("text-4xl font-bold font-mono", valCls)}>{loading ? "—" : value}</div>
                <div className="text-xs text-muted-foreground mt-1">{desc}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6 glass border-primary/10">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t("dashboard.search")} value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl border-primary/20 bg-background/50 focus:border-primary/50" />
              </div>
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={v => setTypeFilter(v as IncidentType | "all")}>
                  <SelectTrigger className="w-[140px] rounded-xl border-primary/20 bg-background/50">
                    <Filter className="h-4 w-4 mr-2 text-primary" /><SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="glass border-primary/20">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="fire">Fire</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={v => setStatusFilter(v as IncidentStatus | "all")}>
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
                Type: {typeFilter}<button onClick={() => setTypeFilter("all")} className="ml-1 hover:text-foreground">×</button>
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                Status: {statusFilter}<button onClick={() => setStatusFilter("all")} className="ml-1 hover:text-foreground">×</button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                Search: {searchQuery}<button onClick={() => setSearchQuery("")} className="ml-1 hover:text-foreground">×</button>
              </Badge>
            )}
            <Button variant="ghost" size="sm"
              onClick={() => { setTypeFilter("all"); setStatusFilter("all"); setSearchQuery("") }}
              className="text-muted-foreground hover:text-primary">
              Clear all
            </Button>
          </div>
        )}

        {/* Incidents Grid */}
        {loading || isRefreshing ? (
          <div className="flex flex-col items-center justify-center py-20">
            <SirenSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading incidents...</p>
          </div>
        ) : incidents.length === 0 ? (
          <Card className="py-20 glass border-primary/10">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success/10 border border-success/20 mb-4">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No incidents found</h3>
              <p className="text-muted-foreground">
                {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters" : "All clear! No active incidents at this time."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incidents.map(incident => (
              <IncidentCard key={incident.id} incident={incident} onClick={() => setSelectedIncident(incident)} />
            ))}
          </div>
        )}

        {/* Incident Detail Dialog */}
        <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
          <DialogContent className="max-w-2xl glass border-primary/20 max-h-[90vh] overflow-y-auto">
            {selectedIncident && (() => {
              const Icon = typeIcons[selectedIncident.type] || AlertCircle
              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emergency/10 border border-emergency/30">
                        <Icon className="h-7 w-7 text-emergency" />
                      </div>
                      <div>
                        <DialogTitle className="capitalize text-xl">{selectedIncident.type} Emergency</DialogTitle>
                        <DialogDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />{selectedIncident.location}
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
                          <User className="h-3 w-3" />Reported By
                        </h4>
                        <p className="font-medium">{selectedIncident.reporter_name || "Staff"}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                        <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />Reported At
                        </h4>
                        <p className="font-medium">{format(new Date(selectedIncident.reported_at), "MMM d, h:mm a")}</p>
                      </div>
                    </div>

                    {/* AI Triage Panel */}
                    <AITriagePanel incident={selectedIncident} />

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(selectedIncident.reported_at), { addSuffix: true })}
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedIncident.status !== "resolved" && (
                          <Button size="sm" variant="outline"
                            className="border-success/30 text-success hover:bg-success/10"
                            onClick={async () => {
                              await incidentsApi.updateStatus(selectedIncident.id, "resolved")
                              toast.success("Incident marked as resolved")
                              setSelectedIncident(null)
                              fetchIncidents()
                            }}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Mark Resolved
                          </Button>
                        )}
                        <Badge className={cn(
                          selectedIncident.status === "active" ? "bg-emergency text-emergency-foreground" :
                          selectedIncident.status === "pending" ? "bg-warning text-warning-foreground" :
                          "bg-success text-success-foreground"
                        )}>
                          {selectedIncident.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>
              )
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <AppWrapper><DashboardContent /></AppWrapper>
}
