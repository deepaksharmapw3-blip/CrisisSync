"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
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

const typeConfig = {
  fire: { icon: Flame, label: "Fire", cls: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30" },
  medical: { icon: HeartPulse, label: "Medical", cls: "text-red-500", bg: "bg-red-500/10 border-red-500/30" },
  security: { icon: ShieldAlert, label: "Security", cls: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30" },
  other: { icon: AlertCircle, label: "Other", cls: "text-muted-foreground", bg: "bg-muted/50 border-border" },
}

const statusConfig = {
  active: { label: "Active", cls: "bg-red-500 text-white" },
  pending: { label: "Pending", cls: "bg-amber-500 text-white" },
  resolved: { label: "Resolved", cls: "bg-emerald-500 text-white" },
  closed: { label: "Closed", cls: "bg-gray-500 text-white" },
}

// ── Incident Card ──────────────────────────────────────────────────────────
function IncidentCard({ incident, onClick, index }: { incident: Incident; onClick: () => void; index: number }) {
  const tc = typeConfig[incident.type as IncidentType] || typeConfig.other
  const sc = statusConfig[incident.status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = tc.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card
        className={cn(
          "glass cursor-pointer transition-all duration-300 border-white/5 hover:border-primary/50 relative group overflow-hidden",
          incident.status === "active" && "border-red-500/30 hover:border-red-500/50 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]"
        )}
        onClick={onClick}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <CardHeader className="pb-2 relative">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl border relative overflow-hidden", tc.bg)}>
                <Icon className={cn("h-6 w-6 relative z-10", tc.cls)} />
                {incident.status === "active" && (
                  <motion.div
                    className="absolute inset-0 bg-red-500/20"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg tracking-tight">{tc.label}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 opacity-70">
                  <MapPin className="h-3 w-3" />{incident.location}
                </p>
              </div>
            </div>
            <Badge className={cn("shrink-0 rounded-lg font-mono text-[10px] uppercase tracking-wider px-2 py-0.5", sc.cls)}>
              {sc.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <p className="text-sm text-foreground/70 mb-4 line-clamp-2 leading-relaxed">{incident.description}</p>

          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 uppercase">
              <User className="h-3 w-3" />{incident.reporter_name || "Staff"}
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 uppercase">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(incident.reported_at), { addSuffix: true })}
            </span>
            {incident.ai_severity_score !== undefined && (
              <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md border uppercase font-bold",
                incident.ai_severity_score > 0.7 ? "bg-red-500/10 border-red-500/30 text-red-400" :
                  incident.ai_severity_score > 0.4 ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                    "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              )}>
                <Zap className="h-3 w-3" />
                LVL: {Math.round(incident.ai_severity_score * 100)}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function AITriagePanel({ incident }: { incident: Incident }) {
  const [loading, setLoading] = useState(false)
  const [triage, setTriage] = useState<any>(null)

  const runTriage = async () => {
    setLoading(true)
    try {
      const result = await aiApi.triage(incident.id)
      setTriage(result)
    } catch {
      toast.error("AI service is currently unavailable")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
          <Brain className="h-4 w-4" />CLAUDE AI ANALYSIS
        </h4>
        <Button size="sm" variant="outline" onClick={runTriage} disabled={loading} className="h-7 text-[10px] uppercase tracking-wider font-bold">
          {loading ? "ANALYZING..." : "RUN TRIAGE"}
        </Button>
      </div>
      {triage && (
        <div className="text-xs space-y-2 text-white/80 leading-relaxed font-mono uppercase">
          <p>{triage.summary}</p>
        </div>
      )}
    </div>
  )
}

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
      // toast.error("Connecting to local API...")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [statusFilter, typeFilter, searchQuery])

  useEffect(() => { fetchIncidents() }, [fetchIncidents])

  useEffect(() => {
    let ws: CrisisSyncWS | null = null
    try {
      ws = new CrisisSyncWS().connect(null)
      setWsConnected(true)
      ws.on("incident_new", () => {
        toast.info("🚨 SYSTEM ALERT: NEW INCIDENT DETECTED")
        fetchIncidents()
      })
      ws.on("incident_update", () => fetchIncidents())
    } catch {
      setWsConnected(false)
    }
    return () => { ws?.disconnect(); setWsConnected(false) }
  }, [fetchIncidents])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchIncidents()
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0A0A0A] text-white">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
      </div>

      <div className="container px-4 py-8 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(0,209,255,0.1)]">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tighter">CRISIS SYNC</h1>
              <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono border uppercase",
                wsConnected ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-white/40")}>
                <div className={cn("h-1.5 w-1.5 rounded-full bg-current", wsConnected && "animate-pulse")} />
                {wsConnected ? "System Live" : "Offline"}
              </div>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] opacity-60">Operations Dashboard // Terminal-v1.0</p>
          </motion.div>

          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}
            className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-all font-mono text-xs tracking-widest">
            {isRefreshing ? <RefreshCw className="h-3 w-3 mr-2 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-2" />}
            SYNC SYSTEM
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "ACTIVE INCIDENTS", icon: AlertTriangle, val: stats.active, color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
            { label: "PENDING REVIEW", icon: Clock, val: stats.pending, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
            { label: "RESOLVED TODAY", icon: CheckCircle2, val: stats.resolved, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" }
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={cn("glass border-white/5", stat.bg)}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono tracking-widest opacity-60">{stat.label}</span>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                  <div className={cn("text-4xl font-black font-mono tracking-tighter", stat.color)}>{stat.val}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search & Filter */}
        <Card className="mb-6 glass border-white/5 p-4 bg-white/[0.02]">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <Input placeholder="SEARCH MISSION CODES..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl border-white/5 bg-white/5 focus:bg-white/10 transition-all font-mono text-xs uppercase" />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={v => setTypeFilter(v as any)}>
                <SelectTrigger className="w-[140px] rounded-xl border-white/5 bg-white/5 uppercase font-mono text-[10px]">
                  <SelectValue placeholder="TYPE" />
                </SelectTrigger>
                <SelectContent className="glass border-white/10 bg-[#0A0A0A] text-white">
                  <SelectItem value="all">ALL TYPES</SelectItem>
                  <SelectItem value="fire">FIRE</SelectItem>
                  <SelectItem value="medical">MEDICAL</SelectItem>
                  <SelectItem value="security">SECURITY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Incidents Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
            <p className="font-mono text-[10px] tracking-widest uppercase">Initializing Secure Link...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incidents.map((incident, i) => (
              <IncidentCard key={incident.id} incident={incident} index={i} onClick={() => setSelectedIncident(incident)} />
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
          <DialogContent className="max-w-xl glass border-white/10 bg-[#0A0A0A] text-white p-0 overflow-hidden">
            {selectedIncident && (
              <div className="relative">
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-black tracking-tighter uppercase">{selectedIncident.type} MISSION</DialogTitle>
                      <DialogDescription className="font-mono text-[10px] uppercase opacity-50 tracking-widest">
                        LOCATION: {selectedIncident.location} // ID: {selectedIncident.id}
                      </DialogDescription>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm leading-relaxed text-white/80">{selectedIncident.description}</p>
                  </div>

                  <AITriagePanel incident={selectedIncident} />

                  <div className="flex gap-2 pt-4 border-t border-white/5">
                    <Button className="flex-1 bg-primary text-black font-black uppercase tracking-widest text-xs hover:bg-primary/90" onClick={() => setSelectedIncident(null)}>
                      CLOSE TERMINAL
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <AppWrapper><DashboardContent /></AppWrapper>
}
