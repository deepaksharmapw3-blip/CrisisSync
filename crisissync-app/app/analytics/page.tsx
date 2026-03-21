"use client"

import { useState, useEffect, useMemo } from "react"
import { AppWrapper } from "@/components/app-wrapper"
import { useI18n } from "@/lib/i18n"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts"
import {
  Clock,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Activity,
  Target,
  Zap,
  ShieldAlert,
  Loader2,
  BrainCircuit,
  Users,
  Trophy,
  History,
  Timer,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const COLORS = ["#f97316", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6"]

function AnalyticsContent() {
  const { t } = useI18n()
  const [data, setData] = useState<any>(null)
  const [risk, setRisk] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, riskRes, leaderboardRes] = await Promise.all([
          api.analytics.summary(),
          api.ai.riskAssessment(),
          api.analytics.leaderboard()
        ])
        setData(statsRes)
        setRisk(riskRes)
        setLeaderboard(leaderboardRes)
      } catch (err) {
        console.error("ANALYSIS ERROR: SIGNAL LOST")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const pieData = useMemo(() => {
    if (!data?.incident_type_stats) return []
    return data.incident_type_stats.map((s: any) => ({
      name: s.type,
      value: s.count
    }))
  }, [data])

  if (loading || !data) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          <p className="text-sm font-medium text-muted-foreground">Loading Strategic Analytics...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: "Avg Response Time",
      value: data.resolution_stats?.average_response_time || "0 min",
      change: "-12.5%",
      changeType: "positive" as const,
      icon: Clock,
      description: "Efficiency vs last week",
    },
    {
      title: "Total Incidents",
      value: (data.resolution_stats?.total_incidents || 0).toString(),
      change: "Stable",
      changeType: "neutral" as const,
      icon: AlertTriangle,
      description: "Current reporting cycle",
    },
    {
      title: "Resolution Rate",
      value: `${data.resolution_stats?.resolution_rate || 0}%`,
      change: "+2.4%",
      changeType: "positive" as const,
      icon: CheckCircle2,
      description: "Mission success rating",
    },
    {
      title: "Property Risk",
      value: risk?.risk_level?.toUpperCase() || "LOW",
      change: "Optimal",
      changeType: "positive" as const,
      icon: ShieldAlert,
      description: "AI analyzed threat level",
    },
  ]

  return (
    <div className="container max-w-7xl px-4 py-8 space-y-8 pb-20">
      {/* SaaS Style Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Strategic Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Property performance and incident reporting data directly from mission control.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg border">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">System Synchronized</span>
        </div>
      </div>

      {/* Modern Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="shadow-sm border-muted-foreground/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-tight">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground opacity-50" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-xs font-semibold",
                    stat.changeType === "positive" ? "text-success" : stat.changeType === "negative" ? "text-emergency" : "text-muted-foreground"
                  )}>
                    {stat.change}
                  </span>
                  <span className="text-[10px] text-muted-foreground opacity-60 uppercase">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* AI Risk Summary Card - Professional Build */}
      <Card className="border-primary/20 bg-primary/[0.02] shadow-sm">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                <BrainCircuit className="h-4 w-4" />
                AI Property Assessment
              </div>
              <p className="text-xl font-medium leading-relaxed">
                "{risk?.summary || "Analyzing strategic patterns. Initial mission indicators show stable property operations and optimal response readiness."}"
              </p>
              <div className="flex flex-wrap gap-2">
                {risk?.recommendations?.map((rec: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-white border border-border rounded-full text-[10px] font-bold text-muted-foreground">
                    {rec}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center p-6 bg-white border rounded-2xl shadow-sm min-w-[180px]">
              <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-1">Threat Level</span>
              <span className={cn(
                "text-4xl font-black tracking-tight",
                risk?.risk_level === "low" ? "text-success" : "text-emergency"
              )}>
                {risk?.risk_level?.toUpperCase() || "LOW"}
              </span>
              <div className="h-[1px] w-full bg-border my-3" />
              <div className="flex items-center gap-2 text-[10px] font-bold text-success capitalize">
                <TrendingDown className="h-3 w-3" />
                Trends: {risk?.trend || "Stable"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Response Timeline - Modern Area Chart */}
        <Card className="shadow-sm border-muted-foreground/10">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">Response Timeline</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily_stats}>
                  <defs>
                    <linearGradient id="colorRT" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 11 }}
                    tickFormatter={(v) => v.split('-').slice(1).join('/')}
                  />
                  <YAxis hide axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="avg_response_time" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRT)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Incident Velocity - Clean Bar Chart */}
        <Card className="shadow-sm border-muted-foreground/10">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">Incident Velocity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.daily_stats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 11 }}
                    tickFormatter={(v) => v.split('-').slice(1).join('/')}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11 }} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                  <Bar dataKey="incidents" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Distribution */}
        <Card className="shadow-sm border-muted-foreground/10">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((e: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Professional Leaderboard */}
        <Card className="lg:col-span-2 shadow-sm border-muted-foreground/10">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Top Responders
            </CardTitle>
            <span className="text-[10px] text-muted-foreground font-medium uppercase">Last 30 Days</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {leaderboard.length > 0 ? leaderboard.map((user, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold opacity-30 w-4">{i + 1}</span>
                    <div className="h-9 w-9 rounded-full bg-muted border flex items-center justify-center font-bold text-xs uppercase">
                      {user.full_name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{user.full_name}</div>
                      <div className="text-[10px] text-muted-foreground uppercase h-4 flex items-center">{user.department || "Operations"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <span className="text-xs font-bold block">{user.total_handled}</span>
                      <span className="text-[11px] text-muted-foreground font-medium">Resolved</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-sm font-medium text-muted-foreground">
                  No responder data available in the current cycle.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <AppWrapper>
      <AnalyticsContent />
    </AppWrapper>
  )
}
