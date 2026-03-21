"use client"
import { useState, useEffect } from "react"
import { incidentsApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import { AppWrapper } from "@/components/app-wrapper"
import { useI18n } from "@/lib/i18n"
import { SirenSpinner } from "@/components/siren-spinner"
import type { IncidentType } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  Flame,
  HeartPulse,
  ShieldAlert,
  AlertCircle,
  MapPin,
  FileText,
  Send,
  CheckCircle2,
  ArrowLeft,
  Navigation,
  Satellite,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

const emergencyTypes: { type: IncidentType; icon: typeof Flame; color: string; bgColor: string }[] = [
  {
    type: "fire",
    icon: Flame,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10 border-orange-500/20 hover:border-orange-500/50",
  },
  {
    type: "medical",
    icon: HeartPulse,
    color: "text-red-500",
    bgColor: "bg-red-500/10 border-red-500/20 hover:border-red-500/50",
  },
  {
    type: "security",
    icon: ShieldAlert,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/50",
  },
  {
    type: "other",
    icon: AlertCircle,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10 border-gray-500/20 hover:border-gray-500/50",
  },
]

function ReportContent() {
  const { t } = useI18n()
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null)
  const [location, setLocation] = useState("")
  const [gpsCoords, setGpsCoords] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleGetLocation = () => {
    setIsLocating(true)
    if (!navigator.geolocation) {
      toast.error("GPS SIGNAL LOST: BROWSER NOT SUPPORTED")
      setIsLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const coords = `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° W`
        setGpsCoords(coords)
        // If empty, pre-fill with coords
        if (!location) setLocation(`GPS COORDINATES: ${coords}`)
        setIsLocating(false)
        toast.success("SATELLITE LINK ESTABLISHED")
      },
      (error) => {
        toast.error("GPS SIGNAL LOST: PERMISSION DENIED")
        setIsLocating(false)
      },
      { enableHighAccuracy: true }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedType) {
      toast.error("MISSION ERROR: SELECT EMERGENCY TYPE")
      return
    }

    if (!location.trim()) {
      toast.error("MISSION ERROR: ENTER LOCATION")
      return
    }

    setIsSubmitting(true)
    try {
      await incidentsApi.create({
        title: `${selectedType.toUpperCase()} INCIDENT REPORTED`,
        description: `${notes}\n\n[GPS_SIGNATURE]: ${gpsCoords || "UNKNOWN"}`,
        type: selectedType,
        location: location,
        severity: "medium"
      })
      setShowSuccess(true)
      // Reset form
      setSelectedType(null)
      setLocation("")
      setNotes("")
      setGpsCoords(null)
    } catch (error) {
      toast.error("CONNECTION ERROR: SYSTEM OFFLINE")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccess(false)
    router.push("/dashboard")
  }

  return (
    <div className="container max-w-2xl px-4 py-8">
      {/* Back Link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground hover:text-primary mb-6 transition-all uppercase"
      >
        <ArrowLeft className="h-3 w-3" />
        RETURN TO MISSION CONTROL
      </Link>

      <Card className="glass border-primary/20 shadow-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emergency/10 border border-emergency/20"
            >
              <AlertCircle className="h-8 w-8 text-emergency pulse" />
            </motion.div>
          </div>
          <CardTitle className="text-2xl font-black tracking-tighter uppercase">{t("report.title")}</CardTitle>
          <CardDescription className="text-sm font-mono opacity-60">
            AWAITING MISSION DATA INPUT...
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Emergency Type Selection */}
            <div className="space-y-3">
              <Label className="text-xs font-bold tracking-widest uppercase opacity-70">1. IDENTIFY THREAT TYPE</Label>
              <div className="grid grid-cols-2 gap-3">
                {emergencyTypes.map(({ type, icon: Icon, color, bgColor }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300",
                      selectedType === type
                        ? "bg-primary/10 border-primary ring-1 ring-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                        : "bg-muted/30 border-transparent grayscale hover:grayscale-0 hover:bg-muted/50"
                    )}
                  >
                    <Icon className={cn("h-8 w-8", selectedType === type ? color : "text-muted-foreground")} />
                    <span className="text-[10px] font-black tracking-widest uppercase">{t(`report.${type}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location Input with GPS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="location" className="text-xs font-bold tracking-widest uppercase opacity-70 flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-primary" />
                  2. ESTABLISH COORDINATES
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="h-7 text-[10px] font-bold tracking-tighter bg-primary/5 hover:bg-primary/20 border border-primary/10 text-primary"
                >
                  {isLocating ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  ) : (
                    <Satellite className="h-3 w-3 mr-2" />
                  )}
                  {isLocating ? "ACQUIRING..." : "SATELLITE LOCK"}
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="ENTER PHYSICAL LOCATION (E.G. ROOM 404, LOBBY)"
                  className="h-14 text-sm font-mono bg-background/50 border-primary/20 uppercase focus-visible:ring-primary"
                  required
                />
                <AnimatePresence>
                  {gpsCoords && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute right-3 top-4 hidden sm:flex items-center gap-2 px-3 py-1 bg-success/10 border border-success/30 rounded-full"
                    >
                      <Navigation className="h-3 w-3 text-success animate-pulse" />
                      <span className="text-[10px] font-black text-success tracking-tighter font-mono">{gpsCoords}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-xs font-bold tracking-widest uppercase opacity-70 flex items-center gap-2">
                <FileText className="h-3 w-3 text-primary" />
                3. MISSION INTEL
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="PROVIDE ADDITIONAL DESCRIPTION OF THE SITUATION..."
                className="min-h-[120px] text-sm font-mono bg-background/50 border-primary/20 uppercase resize-none focus-visible:ring-primary"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !selectedType}
              className={cn(
                "w-full h-16 text-lg font-black tracking-widest uppercase transition-all duration-500 rounded-2xl",
                selectedType
                  ? "bg-emergency hover:bg-emergency/90 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  : "bg-muted text-muted-foreground opacity-50"
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  TRANSMITTING SIGNAL...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Send className="h-6 w-6" />
                  {t("report.submit")}
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <div className="mt-8 p-6 glass border-dashed border-primary/10 rounded-2xl text-center">
        <p className="text-[10px] font-mono tracking-widest text-muted-foreground/60 leading-relaxed">
          SECURITY PROTOCOL ACTIVE. THIS IS A PRIVATE MISSION COMMUNICATION CHANNEL.<br />
          FOR LIFE-THREATENING EMERGENCIES, REQUEST IMMEDIATE EXTRACTION VIA <strong className="text-white">911</strong>.
        </p>
      </div>

      {/* Success Dialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent className="glass border-primary/30">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 border border-success/30">
                <CheckCircle2 className="h-10 w-10 text-success glow-success" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-2xl font-black uppercase tracking-tighter">
              SIGNAL TRANSMITTED
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm font-mono opacity-70">
              MISSION DATA RECEIVED BY HQ. RESPONSE TEAM HAS BEEN DISPATCHED TO YOUR GPS COORDINATES. MAINTAIN POSITION.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-6">
            <AlertDialogAction
              onClick={handleSuccessClose}
              className="bg-primary hover:bg-primary/90 text-white font-black tracking-widest h-12 rounded-xl"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function ReportPage() {
  return (
    <AppWrapper>
      <ReportContent />
    </AppWrapper>
  )
}
