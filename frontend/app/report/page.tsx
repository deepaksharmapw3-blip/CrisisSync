"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppWrapper } from "@/components/app-wrapper"
import { useI18n } from "@/lib/i18n"
import { SirenSpinner } from "@/components/siren-spinner"
import type { IncidentType } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedType) {
      toast.error("Please select an emergency type")
      return
    }

    if (!location.trim()) {
      toast.error("Please enter a location")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsSubmitting(false)
    setShowSuccess(true)

    // Reset form
    setSelectedType(null)
    setLocation("")
    setNotes("")
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
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <Card className="border-2">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emergency/10">
              <AlertCircle className="h-8 w-8 text-emergency" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t("report.title")}</CardTitle>
          <CardDescription className="text-base">
            Select the emergency type and provide location details for quick response
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Emergency Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">{t("report.selectType")}</Label>
              <div className="grid grid-cols-2 gap-3">
                {emergencyTypes.map(({ type, icon: Icon, color, bgColor }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all",
                      bgColor,
                      selectedType === type && "ring-2 ring-offset-2 ring-offset-background",
                      selectedType === type && type === "fire" && "ring-orange-500",
                      selectedType === type && type === "medical" && "ring-red-500",
                      selectedType === type && type === "security" && "ring-blue-500",
                      selectedType === type && type === "other" && "ring-gray-500"
                    )}
                  >
                    <Icon className={cn("h-10 w-10", color)} />
                    <span className="font-semibold capitalize">{t(`report.${type}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location Input */}
            <div className="space-y-3">
              <Label htmlFor="location" className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t("report.location")}
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("report.locationPlaceholder")}
                className="h-12 text-base"
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("report.notes")}
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("report.notesPlaceholder")}
                className="min-h-[120px] text-base resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || !selectedType}
              className={cn(
                "w-full h-14 text-lg font-semibold transition-all",
                selectedType
                  ? "bg-emergency hover:bg-emergency/90 text-emergency-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isSubmitting ? (
                <>
                  <SirenSpinner size="sm" className="mr-3" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  {t("report.submit")}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card className="mt-6 border-dashed">
        <CardContent className="pt-6">
          <p className="text-center text-sm text-muted-foreground">
            For life-threatening emergencies, please call <strong className="text-foreground">911</strong> immediately.
            This system is for internal incident reporting and coordination.
          </p>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Report Submitted Successfully
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              Your emergency report has been received. The response team has been notified and will
              respond immediately. You will receive updates on the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={handleSuccessClose}
              className="bg-primary hover:bg-primary/90"
            >
              Go to Dashboard
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
