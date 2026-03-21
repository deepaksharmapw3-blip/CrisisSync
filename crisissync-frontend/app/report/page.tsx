"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppWrapper } from "@/components/app-wrapper"
import { useI18n } from "@/lib/i18n"
import { SirenSpinner } from "@/components/siren-spinner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  AlertDialog, AlertDialogAction, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  Flame, HeartPulse, ShieldAlert, AlertCircle, MapPin, FileText,
  Send, CheckCircle2, ArrowLeft, Brain, ChevronRight, Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { incidentsApi, type IncidentType } from "@/lib/api"

const emergencyTypes: { type: IncidentType; icon: typeof Flame; color: string; bgColor: string; desc: string }[] = [
  { type: "fire",     icon: Flame,      color: "text-orange-500", bgColor: "bg-orange-500/10 border-orange-500/20 hover:border-orange-500/50", desc: "Fire, smoke, gas leak" },
  { type: "medical",  icon: HeartPulse, color: "text-red-500",    bgColor: "bg-red-500/10 border-red-500/20 hover:border-red-500/50",          desc: "Injury, illness, cardiac" },
  { type: "security", icon: ShieldAlert,color: "text-blue-500",   bgColor: "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/50",        desc: "Theft, threat, intrusion" },
  { type: "other",    icon: AlertCircle,color: "text-gray-500",   bgColor: "bg-gray-500/10 border-gray-500/20 hover:border-gray-500/50",        desc: "Utilities, flooding, other" },
]

const quickLocations = ["Lobby", "Pool Area", "Restaurant", "Gym", "Parking Lot", "Conference Room", "Guest Room"]

function ReportContent() {
  const { t } = useI18n()
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null)
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdIncidentId, setCreatedIncidentId] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedType) { toast.error("Please select an emergency type"); return }
    if (!location.trim()) { toast.error("Please enter a location"); return }

    setIsSubmitting(true)
    try {
      const incident = await incidentsApi.create({
        title: `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Emergency — ${location}`,
        description: notes.trim() || `${selectedType} incident reported at ${location}`,
        type: selectedType,
        location: location.trim(),
        severity,
      })
      setCreatedIncidentId(incident.id)
      setShowSuccess(true)
      setSelectedType(null)
      setLocation("")
      setNotes("")
      setSeverity("medium")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit report")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-2xl px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />Back to Dashboard
      </Link>

      <Card className="border-2 glass border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emergency/10 border border-emergency/20 animate-pulse-emergency">
              <AlertCircle className="h-8 w-8 text-emergency" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t("report.title")}</CardTitle>
          <CardDescription className="text-base">
            Select the emergency type and provide location details for rapid response
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Emergency Type */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">{t("report.selectType")}</Label>
              <div className="grid grid-cols-2 gap-3">
                {emergencyTypes.map(({ type, icon: Icon, color, bgColor, desc }) => (
                  <button key={type} type="button" onClick={() => setSelectedType(type)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 transition-all text-left",
                      bgColor,
                      selectedType === type && "ring-2 ring-offset-2 ring-offset-background",
                      selectedType === type && type === "fire"     && "ring-orange-500",
                      selectedType === type && type === "medical"  && "ring-red-500",
                      selectedType === type && type === "security" && "ring-blue-500",
                      selectedType === type && type === "other"    && "ring-gray-500",
                    )}>
                    <Icon className={cn("h-9 w-9", color)} />
                    <span className="font-semibold capitalize">{t(`report.${type}`)}</span>
                    <span className="text-xs text-muted-foreground text-center">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <Label htmlFor="location" className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />{t("report.location")}
              </Label>
              <Input id="location" value={location} onChange={e => setLocation(e.target.value)}
                placeholder={t("report.locationPlaceholder")} className="h-12 text-base" required />
              {/* Quick location chips */}
              <div className="flex flex-wrap gap-2">
                {quickLocations.map(loc => (
                  <button key={loc} type="button" onClick={() => setLocation(loc)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs border transition-all",
                      location === loc
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/50 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground"
                    )}>
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4" />Severity Level
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {(["low", "medium", "high", "critical"] as const).map(s => (
                  <button key={s} type="button" onClick={() => setSeverity(s)}
                    className={cn(
                      "py-2 rounded-lg border-2 text-xs font-semibold capitalize transition-all",
                      severity === s ? (
                        s === "critical" ? "bg-emergency/20 border-emergency text-emergency" :
                        s === "high"     ? "bg-orange-500/20 border-orange-500 text-orange-500" :
                        s === "medium"   ? "bg-warning/20 border-warning text-warning" :
                        "bg-success/20 border-success text-success"
                      ) : "border-border/50 text-muted-foreground hover:border-primary/30"
                    )}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />{t("report.notes")}
              </Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder={t("report.notesPlaceholder")} className="min-h-[120px] text-base resize-none" />
            </div>

            {/* AI Badge */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <Brain className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary">AI-Powered Triage</p>
                <p className="text-xs text-muted-foreground">Claude will automatically analyze your report and generate response recommendations for the team.</p>
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" size="lg" disabled={isSubmitting || !selectedType}
              className={cn(
                "w-full h-14 text-lg font-semibold transition-all",
                selectedType ? "bg-emergency hover:bg-emergency/90 text-emergency-foreground" : "bg-muted text-muted-foreground"
              )}>
              {isSubmitting ? (
                <><SirenSpinner size="sm" className="mr-3" />Submitting Report...</>
              ) : (
                <><Send className="mr-2 h-5 w-5" />{t("report.submit")}</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Emergency contact card */}
      <Card className="mt-6 border-dashed">
        <CardContent className="pt-6">
          <p className="text-center text-sm text-muted-foreground">
            For life-threatening emergencies, call <strong className="text-foreground">911</strong> immediately.
            This system is for internal incident reporting and coordination.
          </p>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent className="glass border-primary/20">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 border border-success/20">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl">Report Submitted Successfully</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              Your emergency report has been received and Claude AI is already analyzing the situation.
              The response team has been notified and will respond immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center flex-col gap-2">
            <AlertDialogAction onClick={() => { setShowSuccess(false); router.push("/dashboard") }}
              className="bg-primary hover:bg-primary/90">
              <ChevronRight className="h-4 w-4 mr-1" />View on Dashboard
            </AlertDialogAction>
            {createdIncidentId && (
              <Button variant="ghost" size="sm" onClick={() => { setShowSuccess(false); router.push(`/communication?incident=${createdIncidentId}`) }}>
                Join Incident Chat →
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function ReportPage() {
  return <AppWrapper><ReportContent /></AppWrapper>
}
