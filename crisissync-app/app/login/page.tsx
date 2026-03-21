"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppWrapper } from "@/components/app-wrapper"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Zap, LogIn, AlertTriangle } from "lucide-react"
import { authApi } from "@/lib/api"

function LoginContent() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.login(username, password)
      toast.success("Welcome back!")
      router.push("/dashboard")
    } catch {
      toast.error("Invalid credentials. Use demo123 or check your manual ID.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    setLoading(true)
    toast.loading("Initiating Google Sync...")
    setTimeout(() => {
      toast.dismiss()
      toast.success("Google Authentication Successful")
      router.push("/dashboard")
    }, 1200)
  }

  const demoLogin = async (role: string) => {
    const creds: Record<string, { u: string; p: string }> = {
      manager: { u: "manager", p: "demo123" },
      staff: { u: "front_desk", p: "demo123" },
      responder: { u: "fire_team_a", p: "demo123" },
    }
    const { u, p } = creds[role]
    setUsername(u)
    setPassword(p)
    setLoading(true)
    try {
      await authApi.login(u, p)
      toast.success(`Logged in as ${role}`)
      router.push("/dashboard")
    } catch {
      toast.error("Demo login failed — ensure backend + seed data are running")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
      </div>

      <Card className="w-full max-w-md glass border-primary/20 shadow-xl rounded-2xl">
        <CardHeader className="text-center pt-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30">
              <Zap className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight uppercase italic">CrisisSync</CardTitle>
          <CardDescription>Sign in to your mission account</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-8 pb-10">
          {/* Google Button - Re-integrated into original UI */}
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            variant="outline"
            className="w-full h-11 border-primary/20 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-95 transition-all"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-xs font-bold uppercase tracking-tight">Sync with Google</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted-foreground/10" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-white px-2 text-muted-foreground opacity-40 italic">OR MANUAL AUTHORITY</span></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold tracking-tight opacity-70">Username</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)}
                placeholder="OPERATOR_CODE" className="h-11 rounded-xl border-primary/20 bg-muted/20" required />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold tracking-tight opacity-70">Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className="h-11 rounded-xl border-primary/20 bg-muted/20" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg">
              {loading ? "Authenticating..." : <><LogIn className="h-4 w-4 mr-2" />Sign In</>}
            </Button>
          </form>

          <div>
            <p className="text-[10px] text-center font-bold uppercase tracking-widest opacity-20 mb-3">— Demo Preset Controls —</p>
            <div className="grid grid-cols-3 gap-2">
              {(["manager", "staff", "responder"] as const).map(role => (
                <button key={role} onClick={() => demoLogin(role)} disabled={loading}
                  className="px-2 py-2.5 bg-muted/40 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-primary/10 hover:text-primary transition-all duration-200">
                  {role}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground opacity-60">
            Guest? <Link href="/report" className="text-primary hover:underline">Report Incident →</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return <AppWrapper><LoginContent /></AppWrapper>
}
