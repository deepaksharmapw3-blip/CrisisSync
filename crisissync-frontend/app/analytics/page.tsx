"use client"

import { useState, useEffect } from "react"
import { AppWrapper } from "@/components/app-wrapper"
import { useI18n } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts"
import {
  Clock, TrendingDown, CheckCircle2, AlertTriangle, BarChart3,
  Activity, Target, Zap, Brain, Shield, TrendingUp, AlertOctagon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { analyticsApi, aiApi, type AnalyticsSummary } from "@/lib/api"
import { toast } from "sonner"

const COLORS = ["hsl(25, 95%, 53%)", "hsl(0, 84%, 60%)", "hsl(217, 91%, 60%)", "hsl(215, 14%, 34%)"]

function RiskAssessmentPanel() {
  const [loading, setLoading] = useState(false)
  const [assessment, setAssessment] = useState<{
    risk_level?: string; summary?: string
    top_risks?: Array<{ area: string; risk: string; frequency: number }>
    recommendations?: string[]; trend?: string
  } | null>(null)

  const runAssessment = async () => {
    setLoading(true)
    try {
      const result = await aiApi.riskAssessment()
      setAssessment(result)
    } catch {
      toast.error("Risk assessment failed — ensure backend is running")
    } finally {
      setLoading(false)
    }
  }

  const riskColor = {
    low: "text-success border-success/30 bg-success/5",
    medium: "text-warning border-warning/30 bg-warning/5",
    high: "text-emergency border-emergency/30 bg-emergency/5",
    critical: "text-emergency border-emergency/50 bg-emergency/10",
  }

  return (
    <Card className="glass border-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>AI Risk Assessment</CardTitle>
              <CardDescription>Claude analyzes incident patterns to predict risks</CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={runAssessment} disabled={loading}
            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30">
            {loading ? "Analyzing..." : <><Zap className="h-3.5 w-3.5 mr-1.5" />Run Assessment</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {assessment ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn("px-3 py-1.5 rounded-lg border text-sm font-semibold capitalize",
                riskColor[assessment.risk_level as keyof typeof riskColor] || riskColor.medium)}>
                <Shield className="h-3.5 w-3.5 inline mr-1.5" />
                {assessment.risk_level} risk
              </div>
              {assessment.trend && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {assessment.trend === "improving" ? <TrendingDown className="h-4 w-4 text-success" /> :
                   assessment.trend === "worsening" ? <TrendingUp className="h-4 w-4 text-emergency" /> :
                   <Activity className="h-4 w-4" />}
                  {assessment.trend}
                </div>
              )}
            </div>

            {assessment.summary && (
              <p className="text-sm text-foreground/80">{assessment.summary}</p>
            )}

            {assessment.top_risks && assessment.top_risks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Top Risk Areas</p>
                <div className="space-y-2">
                  {assessment.top_risks.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <AlertOctagon className="h-4 w-4 text-warning flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{r.area}</span>
                        <p className="text-xs text-muted-foreground">{r.risk}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{r.frequency}x</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {assessment.recommendations && assessment.recommendations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Recommendations</p>
                <ul className="space-y-2">
                  {assessment.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Click "Run Assessment" to get AI-powered property risk analysis based on your incident history.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AnalyticsContent() {
  const { t } = useI18n()
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(14)

  useEffect(() => {
    setLoading(true)
    analyticsApi.summary(days).then(data => {
      setAnalytics(data)
    }).catch(() => {
      toast.error("Could not load analytics — check backend connection")
    }).finally(() => setLoading(false))
  }, [days])

  const rs = analytics?.resolution_stats

  const statCards = [
    {
      title: "Avg Response Time", value: rs?.average_response_time ?? "—",
      change: "-12%", changeType: "positive" as const, icon: Clock, desc: "From previous period",
    },
    {
      title: "Total Incidents", value: rs?.total_incidents?.toString() ?? "—",
      change: "+8", changeType: "neutral" as const, icon: AlertTriangle, desc: `Last ${days} days`,
    },
    {
      title: "Resolution Rate", value: rs ? `${rs.resolution_rate}%` : "—",
      change: "+2.3%", changeType: "positive" as const, icon: CheckCircle2, desc: "From previous period",
    },
    {
      title: "Active Responders", value: "24",
      change: "On duty", changeType: "neutral" as const, icon: Zap, desc: "Across all shifts",
    },
  ]

  return (
    <div className="container px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t("analytics.title")}</h1>
          <p className="text-muted-foreground mt-1">Data-driven insights to improve emergency response performance</p>
        </div>
        <div className="flex items-center gap-2">
          {([7, 14, 30] as const).map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={cn("px-3 py-1.5 rounded-lg text-sm border transition-all",
                days === d ? "bg-primary text-primary-foreground border-primary" :
                "border-border/50 text-muted-foreground hover:border-primary/30")}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="glass border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{loading ? "..." : stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={cn("font-medium",
                    stat.changeType === "positive" && "text-success",
                    stat.changeType === "negative" && "text-destructive")}>
                    {stat.change}
                  </span>{" "}{stat.desc}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Response Time Trend */}
        <Card className="glass border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{t("analytics.responseTime")}</CardTitle>
                <CardDescription>Average response time trend</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.daily_stats ?? []}>
                  <defs>
                    <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tickFormatter={v => v.slice(-2)} className="text-xs" />
                  <YAxis tickFormatter={v => `${v}m`} className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(v: number) => [`${v} min`, "Response Time"]}
                    labelFormatter={l => `Date: ${l}`} />
                  <Area type="monotone" dataKey="avg_response_time" stroke="hsl(217, 91%, 60%)"
                    strokeWidth={2} fillOpacity={1} fill="url(#colorResponse)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Incident Frequency */}
        <Card className="glass border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{t("analytics.incidentFrequency")}</CardTitle>
                <CardDescription>Daily incidents vs. resolutions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.daily_stats ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tickFormatter={v => v.slice(-2)} className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                    labelFormatter={l => `Date: ${l}`} />
                  <Legend />
                  <Bar dataKey="incidents" fill="hsl(0, 84%, 60%)" name="Incidents" radius={[4,4,0,0]} />
                  <Bar dataKey="resolved"  fill="hsl(142, 71%, 45%)" name="Resolved"  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Pie */}
        <Card className="glass border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Incident Distribution</CardTitle>
                <CardDescription>By category</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics?.incident_type_stats ?? []}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    paddingAngle={5} dataKey="count" nameKey="type">
                    {(analytics?.incident_type_stats ?? []).map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(v: number, name: string) => [`${v} incidents`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Resolution Stats */}
        <Card className="lg:col-span-2 glass border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-success" />
              <div>
                <CardTitle>{t("analytics.resolution")}</CardTitle>
                <CardDescription>Performance metrics and targets</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { label: "Resolution Rate", value: rs?.resolution_rate ?? 96.9, color: "bg-success", desc: `${rs?.resolved_incidents ?? 124} of ${rs?.total_incidents ?? 128} incidents resolved` },
                { label: "Response Time Target (5 min)", value: 92, color: "bg-primary", desc: "92% of incidents responded within 5 minutes" },
                { label: "Critical Incidents Handled", value: 100, color: "bg-emergency", desc: "All critical incidents received immediate response" },
              ].map(({ label, value, color, desc }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{label}</span>
                    <span className={cn("text-sm font-bold", color === "bg-success" ? "text-success" : color === "bg-primary" ? "text-primary" : "text-emergency")}>
                      {loading ? "..." : `${value}%`}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-1000", color)}
                      style={{ width: loading ? "0%" : `${value}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                {[["24", "Active Responders"], ["8", "Response Teams"], ["3", "Shifts Covered"]].map(([val, label]) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl font-bold font-mono">{val}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Risk Assessment */}
      <RiskAssessmentPanel />
    </div>
  )
}

export default function AnalyticsPage() {
  return <AppWrapper><AnalyticsContent /></AppWrapper>
}
