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
      toast.error("Invalid credentials. Try: manager / demo123")
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = async (role: string) => {
    const creds: Record<string, { u: string; p: string }> = {
      manager:   { u: "manager",       p: "demo123" },
      staff:     { u: "front_desk",    p: "demo123" },
      responder: { u: "fire_team_a",   p: "demo123" },
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
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-md glass border-primary/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/30">
              <Zap className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">CrisisSync</CardTitle>
          <CardDescription>Sign in to access the emergency response platform</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username" className="h-11 rounded-xl border-primary/20" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" className="h-11 rounded-xl border-primary/20" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-primary hover:bg-primary/90 rounded-xl">
              {loading ? "Signing in..." : <><LogIn className="h-4 w-4 mr-2" />Sign In</>}
            </Button>
          </form>

          {/* Demo logins */}
          <div>
            <p className="text-xs text-center text-muted-foreground mb-3">— or try a demo account —</p>
            <div className="grid grid-cols-3 gap-2">
              {(["manager", "staff", "responder"] as const).map(role => (
                <Button key={role} variant="outline" size="sm" onClick={() => demoLogin(role)} disabled={loading}
                  className="capitalize border-primary/20 hover:bg-primary/10 text-xs rounded-lg">
                  {role}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Demo mode: Run <code className="bg-muted px-1 rounded">python seed.py</code> in the backend to create demo accounts.
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Guest?{" "}
            <Link href="/report" className="text-primary hover:underline">Report an emergency without an account →</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return <AppWrapper><LoginContent /></AppWrapper>
}
