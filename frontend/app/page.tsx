"use client"

import Link from "next/link"
import { AppWrapper } from "@/components/app-wrapper"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle,
  Wifi,
  Shield,
  Zap,
  Globe,
  BarChart3,
  Users,
  Radio,
  Activity,
} from "lucide-react"

function LandingContent() {
  const { t } = useI18n()

  const stats = [
    { value: "< 3 min", label: t("landing.stats.responseTime"), icon: Clock },
    { value: "10,000+", label: t("landing.stats.incidents"), icon: CheckCircle },
    { value: "99.99%", label: t("landing.stats.uptime"), icon: Wifi },
    { value: "500+", label: t("landing.stats.properties"), icon: Shield },
  ]

  const features = [
    {
      icon: Zap,
      title: t("features.realtime"),
      description: t("features.realtimeDesc"),
    },
    {
      icon: BarChart3,
      title: t("features.analytics"),
      description: t("features.analyticsDesc"),
    },
    {
      icon: Globe,
      title: t("features.multilingual"),
      description: t("features.multilingualDesc"),
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Techie Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
          <div className="absolute inset-0 grid-pattern" />
          {/* Glowing orbs */}
          <div className="absolute top-20 right-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-float" />
          <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-emergency/10 rounded-full blur-[120px]" />
          {/* Tech lines */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        </div>

        <div className="container px-4 py-20 md:py-32">
          <div className="max-w-5xl mx-auto text-center">
            {/* Tech Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass border border-primary/30 mb-8 animate-glow">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium text-primary">24/7 Emergency Response System</span>
              <Radio className="h-4 w-4 text-primary animate-pulse" />
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 text-balance">
              <span className="text-foreground">Rapid Crisis</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-cyan to-primary bg-clip-text text-transparent animate-gradient">
                Response
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 text-pretty">
              {t("landing.description")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-emergency hover:bg-emergency/90 text-emergency-foreground text-lg px-8 py-6 w-full sm:w-auto glow-orange transition-all duration-300 hover:scale-105"
              >
                <Link href="/report">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  {t("landing.reportEmergency")}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 w-full sm:w-auto border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
              >
                <Link href="/dashboard">
                  {t("landing.viewDashboard")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Tech decoration */}
            <div className="mt-16 flex justify-center">
              <div className="flex items-center gap-8 text-muted-foreground/50">
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-primary/30" />
                <Activity className="h-5 w-5 text-primary/50" />
                <div className="h-px w-20 bg-gradient-to-l from-transparent to-primary/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center group">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 group-hover:glow-cyan transition-all duration-300">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-1 font-mono">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 grid-pattern opacity-50" />
        
        <div className="container px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Platform Features
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything you need for{" "}
              <span className="text-primary">crisis management</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete platform designed to protect your guests, empower your staff, and coordinate response teams.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="glass border-primary/10 hover:border-primary/30 transition-all duration-300 group hover:-translate-y-1">
                  <CardContent className="pt-8 pb-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mb-6 group-hover:glow-cyan transition-all duration-300">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Bento Grid Section */}
      <section className="py-24 md:py-32 bg-card/30">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Large Feature Card */}
            <Card className="md:col-span-2 md:row-span-2 overflow-hidden glass border-primary/10 hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-8 h-full flex flex-col justify-between min-h-[400px]">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emergency/10 border border-emergency/20 mb-6">
                    <AlertTriangle className="h-7 w-7 text-emergency" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Real-time Crisis Feed</h3>
                  <p className="text-muted-foreground text-lg">
                    Monitor all active incidents across your property in real-time. Get instant notifications, track response progress, and coordinate teams efficiently.
                  </p>
                </div>
                <div className="mt-8 p-5 rounded-xl bg-background/50 border border-border/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emergency/20 border border-emergency/30 animate-pulse-emergency">
                      <AlertTriangle className="h-6 w-6 text-emergency" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Active Incident</span>
                        <span className="text-xs text-emergency font-medium px-3 py-1 bg-emergency/10 border border-emergency/20 rounded-full flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emergency animate-pulse" />
                          LIVE
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">Kitchen - Floor 1</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emergency to-warning animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Communication Card */}
            <Card className="glass border-primary/10 hover:border-primary/30 transition-all duration-300 group hover:-translate-y-1">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mb-4 group-hover:glow-cyan transition-all duration-300">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">Team Communication</h3>
                <p className="text-muted-foreground text-sm flex-1">
                  Instant messaging between staff, security, and emergency responders.
                </p>
              </CardContent>
            </Card>

            {/* Analytics Card */}
            <Card className="glass border-primary/10 hover:border-primary/30 transition-all duration-300 group hover:-translate-y-1">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 border border-success/20 mb-4 group-hover:animate-glow transition-all duration-300">
                  <BarChart3 className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-lg font-bold mb-2">Smart Analytics</h3>
                <p className="text-muted-foreground text-sm flex-1">
                  Data-driven insights to improve response times and prevent incidents.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-background to-background" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
        </div>
        
        <div className="container px-4">
          <Card className="glass border-primary/20 overflow-hidden">
            <CardContent className="p-8 md:p-16 text-center relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
              
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Ready to protect your property?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                Join hundreds of hospitality leaders who trust CrisisSync for their emergency response needs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 glow-cyan transition-all duration-300 hover:scale-105"
                >
                  <Link href="/dashboard">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="text-lg hover:text-primary">
                  <Link href="/report">Report a Demo Emergency</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 bg-card/30">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-lg">CrisisSync</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} CrisisSync. Rapid Crisis Response Platform.
            </p>
          </div>
        </div>
      </footer>
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
