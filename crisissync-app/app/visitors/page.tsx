"use client"

import { useState, useEffect, useMemo } from "react"
import { AppWrapper } from "@/components/app-wrapper"
import { api, VisitorStats, VisitorTimelinePoint, VisitorSession, VisitorActivity } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    AreaChart,
    Area,
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
} from "recharts"
import {
    Users,
    Eye,
    Globe,
    Monitor,
    MousePointer2,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    History,
    Activity,
    ShieldCheck,
    Zap,
    Loader2,
    Laptop,
    Smartphone,
    Tablet,
    Search,
    ShieldAlert,
    Download,
    FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { format, parseISO } from "date-fns"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export default function VisitorsPage() {
    const [stats, setStats] = useState<VisitorStats | null>(null)
    const [timeline, setTimeline] = useState<VisitorTimelinePoint[]>([])
    const [activities, setActivities] = useState<VisitorActivity[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [days, setDays] = useState(30)
    const [generatingPDF, setGeneratingPDF] = useState(false)

    const generatePDF = async () => {
        if (!stats) return
        setGeneratingPDF(true)

        try {
            const doc = new jsPDF()
            const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss')

            // Header
            doc.setFontSize(22)
            doc.setTextColor(59, 130, 246) // Primary blue
            doc.text("CrisisSync - Mission Intelligence Report", 14, 22)

            doc.setFontSize(10)
            doc.setTextColor(100)
            doc.text(`Generated on: ${timestamp}`, 14, 30)
            doc.text(`Tracking Period: Last ${days} Days`, 14, 35)

            // Summary Section
            doc.setFontSize(16)
            doc.setTextColor(30)
            doc.text("Visitor Engagement Summary", 14, 50)

            autoTable(doc, {
                startY: 55,
                head: [['Metric', 'Value', 'Status']],
                body: [
                    ['Total Unique Visitors', stats.total_visitors.toString(), 'ACTIVE'],
                    ['Total Page Views', stats.total_page_views.toString(), 'SYNCHRONIZED'],
                    ['Avg Interactions/Session', stats.avg_page_views_per_session.toFixed(2), 'OPTIMAL'],
                    ['Global Reach (Countries)', stats.unique_countries.toString(), 'REACHED']
                ],
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] }
            })

            // Top Pages Section
            doc.text("Top Platform Access Points", 14, (doc as any).lastAutoTable.finalY + 15)

            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 20,
                head: [['Rank', 'Page Path', 'Engagement (Hits)']],
                body: stats.top_pages.map((p, i) => [(i + 1).toString(), p.page, p.hits.toString()]),
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] }
            })

            // Device & OS Summary
            doc.addPage()
            doc.text("Infrastructure Breakdown (Devices & OS)", 14, 22)

            autoTable(doc, {
                startY: 28,
                head: [['Category', 'Details', 'Utilization %']],
                body: [
                    ...stats.top_devices.map(d => ['Device', d.device.toUpperCase(), `${((d.count / stats.total_sessions) * 100).toFixed(1)}%`]),
                    ...stats.top_browsers.map(b => ['Browser', b.browser, `${((b.count / stats.total_sessions) * 100).toFixed(1)}%`])
                ],
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] } // Success green
            })

            // Activity Stream
            doc.text("Critical Activity Audit Log (Recent)", 14, (doc as any).lastAutoTable.finalY + 15)

            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 20,
                head: [['Time', 'Method', 'Path', 'Status', 'Latency']],
                body: activities.map(a => [
                    format(parseISO(a.timestamp), 'HH:mm:ss'),
                    a.method,
                    a.path.length > 50 ? a.path.substring(0, 47) + "..." : a.path,
                    a.status_code?.toString() || '200',
                    `${a.response_time_ms?.toFixed(0) || 0}ms`
                ]),
                theme: 'striped',
                margin: { bottom: 30 }
            })

            // Footer on all pages
            const pageCount = (doc as any).internal.getNumberOfPages()
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i)
                doc.setFontSize(8)
                doc.setTextColor(150)
                doc.text("CONFIDENTIAL - CRISISSYNC STRATEGIC INTELLIGENCE", 14, 285)
                doc.text(`Page ${i} / ${pageCount}`, 180, 285)
            }

            doc.save(`CrisisSync_Intelligence_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
        } catch (err) {
            console.error("PDF GENERATION ERROR", err)
        } finally {
            setGeneratingPDF(false)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setError(null)
            try {
                const [statsRes, timelineRes, activitiesRes] = await Promise.all([
                    api.visitors.getStats(days),
                    api.visitors.getTimeline(days),
                    api.visitors.listActivities({ limit: 12 })
                ])
                setStats(statsRes)
                setTimeline(timelineRes)
                setActivities(activitiesRes)
            } catch (err: any) {
                setError(err.message || "FAILED TO SYNC VISITOR DATA")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [days])

    const isHighTraffic = useMemo(() => {
        if (!stats) return false
        // Heuristic for high traffic: average page views > 5 or total page views > 1000
        // In a real app, this would be based on real-time activity in the last 5 mins
        return stats.avg_page_views_per_session > 5 || stats.total_page_views > 1000
    }, [stats])

    if (error && error.includes("403")) {
        return (
            <AppWrapper>
                <div className="flex h-[70vh] items-center justify-center p-8">
                    <Card className="max-w-md w-full border-emergency/20 bg-emergency/5 shadow-2xl">
                        <CardHeader className="text-center">
                            <ShieldAlert className="h-12 w-12 text-emergency mx-auto mb-4" />
                            <CardTitle className="text-2xl font-black">Restricted Intelligence</CardTitle>
                            <CardDescription className="font-bold text-emergency/70 uppercase tracking-widest text-[10px] mt-2">
                                Security Level: Alpha Required
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Access to Visitor Intelligence requires **Manager** authorization. Your current credentials do not have the required clearance level for these strategic insights.
                            </p>
                            <div className="mt-8">
                                <button onClick={() => window.location.href = "/dashboard"} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:glow-cyan transition-all">
                                    Return to Operational Dashboard
                                </button>
                                <p className="mt-4 text-[9px] font-bold text-muted-foreground opacity-40 uppercase">CrisisSync Defense protocols Active</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppWrapper>
        )
    }

    if (loading && !stats) {
        return (
            <AppWrapper>
                <div className="flex h-[70vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
                        <p className="text-sm font-medium text-muted-foreground">Synchronizing Visitor Intelligence...</p>
                    </div>
                </div>
            </AppWrapper>
        )
    }

    const kpis = [
        {
            label: "Total Visitors",
            value: stats?.total_visitors || 0,
            icon: Users,
            trend: "+12%",
            trendUp: true,
            description: "Unique people tracked"
        },
        {
            label: "Page Views",
            value: stats?.total_page_views || 0,
            icon: Eye,
            trend: "+24%",
            trendUp: true,
            description: "Total interaction scale"
        },
        {
            label: "Avg Interactions",
            value: stats?.avg_page_views_per_session.toFixed(1) || "0",
            icon: MousePointer2,
            trend: "-5%",
            trendUp: false,
            description: "Pages per session"
        },
        {
            label: "Global Reach",
            value: stats?.unique_countries || 0,
            icon: Globe,
            trend: "Stable",
            trendUp: true,
            description: "Nations connected"
        }
    ]

    const deviceData = stats?.top_devices.map((d, i) => ({
        name: d.device,
        value: d.count,
        icon: d.device === "mobile" ? Smartphone : d.device === "tablet" ? Tablet : Laptop
    })) || []

    return (
        <AppWrapper>
            <div className="container max-w-7xl px-4 py-8 space-y-8 pb-24">
                {/* High Traffic Alert Banner */}
                {isHighTraffic && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-amber-500 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-amber-500/20 border border-amber-400 group">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 animate-pulse group-hover:scale-110 transition-transform">
                                    <Zap className="h-6 w-6 fill-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm uppercase tracking-widest">High Traffic Alert</h3>
                                    <p className="text-[11px] font-bold opacity-80 uppercase leading-tight">Elevated engagement detected: {stats?.avg_page_views_per_session.toFixed(1)} interactions/session</p>
                                </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-3">
                                <div className="h-[2px] w-12 bg-white/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-white animate-progress" />
                                </div>
                                <span className="text-[10px] font-black border border-white/40 px-2 py-1 rounded bg-white/10 uppercase">Critical Priority</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                            Visitor Intelligence
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
                                LIVE
                            </span>
                        </h1>
                        <p className="text-muted-foreground mt-2 font-medium">
                            Real-time analysis of property visitors, engagement patterns, and platform utilization.
                        </p>
                    </motion.div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={generatePDF}
                            disabled={generatingPDF}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50",
                                generatingPDF && "animate-pulse"
                            )}
                        >
                            {generatingPDF ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileText className="h-4 w-4" />
                            )}
                            {generatingPDF ? "Mission Syncing..." : "Generate Report"}
                        </button>

                        <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-2xl border border-muted-foreground/10 backdrop-blur-sm">
                            {[7, 30, 90].map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setDays(d)}
                                    className={cn(
                                        "px-4 py-1.5 text-xs font-bold rounded-xl transition-all uppercase tracking-widest",
                                        days === d
                                            ? "bg-white text-primary shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {d}D
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.map((kpi, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className="relative overflow-hidden group hover:border-primary/30 transition-colors shadow-none border-muted-foreground/10">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <kpi.icon className="h-4 w-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                                        <div className={cn(
                                            "flex items-center gap-0.5 text-[10px] font-black uppercase tracking-tighter",
                                            kpi.trendUp ? "text-success" : "text-emergency"
                                        )}>
                                            {kpi.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                            {kpi.trend}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black">{kpi.value}</div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">{kpi.label}</p>
                                    <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-between text-[10px] opacity-40">
                                        <span className="font-bold">{kpi.description}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Main Charts Area */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Timeline Chart */}
                    <Card className="lg:col-span-2 shadow-sm border-muted-foreground/10">
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 py-4 px-6">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm font-bold uppercase tracking-tight">Traffic Velocity</CardTitle>
                            </div>
                            <ShieldCheck className="h-4 w-4 text-success opacity-50" />
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timeline}>
                                        <defs>
                                            <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorPV" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                            tickFormatter={(val) => format(parseISO(val), 'MMM d')}
                                        />
                                        <YAxis hide axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            labelClassName="text-xs font-bold text-muted-foreground mb-1"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="visitors"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorVis)"
                                            name="Visitors"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="page_views"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            fillOpacity={1}
                                            fill="url(#colorPV)"
                                            name="Page Views"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Device & OS Card */}
                    <Card className="shadow-sm border-muted-foreground/10">
                        <CardHeader className="border-b bg-muted/10 py-4 px-6">
                            <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm font-bold uppercase tracking-tight">Devices & OS</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-6">
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={deviceData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={85}
                                                paddingAngle={8}
                                                dataKey="value"
                                            >
                                                {deviceData.map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.1)" strokeWidth={1} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="border-t divide-y divide-muted-foreground/5">
                                {deviceData.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <d.icon className="h-4 w-4 opacity-40" />
                                            <span className="text-sm font-semibold capitalize">{d.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                                            {((d.value / (stats?.total_sessions || 1)) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Global Reach & Top Pages */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <Card className="shadow-sm border-muted-foreground/10 overflow-hidden">
                        <CardHeader className="border-b bg-muted/10 py-4 px-6">
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-500" />
                                <CardTitle className="text-sm font-bold uppercase tracking-tight">Top Access Points</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-muted-foreground/5">
                                {stats?.top_pages.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-all cursor-default group">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <span className="text-xs font-black opacity-10 group-hover:opacity-40 transition-opacity w-3">{i + 1}</span>
                                            <span className="text-sm font-medium truncate max-w-[300px] font-mono">{p.page}</span>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs font-bold">{p.hits}</span>
                                            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${(p.hits / (stats?.top_pages[0]?.hits || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-muted-foreground/10">
                        <CardHeader className="border-b bg-muted/10 py-4 px-6">
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm font-bold uppercase tracking-tight">Live Activity Stream</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-muted-foreground/5">
                                {activities.map((act, i) => (
                                    <div key={i} className="flex items-center justify-between px-6 py-3.5 group">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "text-[10px] font-black px-1.5 py-0.5 rounded uppercase",
                                                    act.method === "GET" ? "bg-blue-500/10 text-blue-600" : "bg-green-500/10 text-green-600"
                                                )}>
                                                    {act.method}
                                                </span>
                                                <span className="text-[11px] font-bold truncate max-w-[200px]">{act.path}</span>
                                            </div>
                                            <span className="text-[9px] font-medium text-muted-foreground flex items-center gap-1 opacity-60">
                                                <Clock className="h-2 w-2" />
                                                {format(parseISO(act.timestamp), 'HH:mm:ss')} • {act.status_code === 200 ? 'SUCCESS' : 'INTERCEPTION'}
                                            </span>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <span className={cn(
                                                "text-[11px] font-black tracking-tight px-2 py-0.5 bg-muted rounded-lg border border-muted-foreground/10",
                                                act.response_time_ms && act.response_time_ms > 500 ? "text-amber-500" : "text-primary"
                                            )}>
                                                {act.response_time_ms?.toFixed(0)}MS
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t bg-muted/5 text-center">
                                <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all">
                                    View Audit Log
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppWrapper>
    )
}
