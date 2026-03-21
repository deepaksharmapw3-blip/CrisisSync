"use client"

import { AppWrapper } from "@/components/app-wrapper"
import { useI18n } from "@/lib/i18n"
import { mockAnalytics, incidentTypeStats, resolutionStats } from "@/lib/mock-data"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

const COLORS = ["hsl(25, 95%, 53%)", "hsl(0, 84%, 60%)", "hsl(217, 91%, 60%)", "hsl(215, 14%, 34%)"]

function AnalyticsContent() {
  const { t } = useI18n()

  const statCards = [
    {
      title: "Avg Response Time",
      value: resolutionStats.averageResponseTime,
      change: "-12%",
      changeType: "positive" as const,
      icon: Clock,
      description: "From previous month",
    },
    {
      title: "Total Incidents",
      value: resolutionStats.totalIncidents.toString(),
      change: "+8",
      changeType: "neutral" as const,
      icon: AlertTriangle,
      description: "This month",
    },
    {
      title: "Resolution Rate",
      value: `${resolutionStats.resolutionRate}%`,
      change: "+2.3%",
      changeType: "positive" as const,
      icon: CheckCircle2,
      description: "From previous month",
    },
    {
      title: "Active Responders",
      value: "24",
      change: "On duty",
      changeType: "neutral" as const,
      icon: Zap,
      description: "Across all shifts",
    },
  ]

  return (
    <div className="container px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("analytics.title")}</h1>
        <p className="text-muted-foreground mt-1">
          Data-driven insights to improve emergency response performance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span
                    className={cn(
                      "font-medium",
                      stat.changeType === "positive" && "text-success",
                      stat.changeType === "negative" && "text-destructive"
                    )}
                  >
                    {stat.change}
                  </span>{" "}
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Response Time Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{t("analytics.responseTime")}</CardTitle>
                <CardDescription>Average response time over the past 14 days</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockAnalytics}>
                  <defs>
                    <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => value.slice(-2)}
                    className="text-xs"
                  />
                  <YAxis
                    tickFormatter={(value) => `${value}m`}
                    className="text-xs"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} min`, "Response Time"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="responseTime"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorResponse)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Incident Frequency */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{t("analytics.incidentFrequency")}</CardTitle>
                <CardDescription>Daily incidents and resolutions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => value.slice(-2)}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="incidents"
                    fill="hsl(0, 84%, 60%)"
                    name="Incidents"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="resolved"
                    fill="hsl(142, 71%, 45%)"
                    name="Resolved"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Incident Types Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Incident Distribution</CardTitle>
                <CardDescription>By category this month</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incidentTypeStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="type"
                  >
                    {incidentTypeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => [`${value} incidents`, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Resolution Stats */}
        <Card className="lg:col-span-2">
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
              {/* Resolution Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Resolution Rate</span>
                  <span className="text-sm font-bold text-success">
                    {resolutionStats.resolutionRate}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-success transition-all"
                    style={{ width: `${resolutionStats.resolutionRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {resolutionStats.resolvedIncidents} of {resolutionStats.totalIncidents} incidents resolved
                </p>
              </div>

              {/* Response Time Target */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Response Time Target (5 min)</span>
                  <span className="text-sm font-bold text-primary">92%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: "92%" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  92% of incidents responded within 5 minutes
                </p>
              </div>

              {/* Critical Incident Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Critical Incidents Handled</span>
                  <span className="text-sm font-bold text-emergency">100%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emergency transition-all"
                    style={{ width: "100%" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All critical incidents received immediate response
                </p>
              </div>

              {/* Team Performance */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">24</div>
                  <div className="text-xs text-muted-foreground">Active Responders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">8</div>
                  <div className="text-xs text-muted-foreground">Response Teams</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">3</div>
                  <div className="text-xs text-muted-foreground">Shifts Covered</div>
                </div>
              </div>
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
