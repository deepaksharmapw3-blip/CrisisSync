"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { AppWrapper } from "@/components/app-wrapper"
import { useI18n } from "@/lib/i18n"
import { RoleBadge } from "@/components/role-badge"
import { api, type Incident, type Message, type UserRole } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Send,
  MessageSquare,
  AlertTriangle,
  Users,
  Clock,
  Flame,
  HeartPulse,
  ShieldAlert,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

function CommunicationContent() {
  const { t } = useI18n()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<any>(null)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incRes, userRes] = await Promise.all([
          api.incidents.list({ status: "active" }),
          api.auth.me()
        ])
        setIncidents(incRes.incidents)
        setMe(userRes)
        if (incRes.incidents.length > 0) {
          setSelectedIncidentId(incRes.incidents[0].id)
        }
      } catch (err) {
        toast.error("COMMUNICATION ERROR: SYSTEM OFFLINE")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // WebSocket Management
  const connectWS = useCallback((id: number) => {
    if (wsRef.current) wsRef.current.disconnect()

    const ws = api.ws(id)
    ws.on("message", (payload: any) => {
      setMessages(prev => [...prev, payload.data])
    })
    wsRef.current = ws
  }, [])

  useEffect(() => {
    if (selectedIncidentId) {
      // Fetch past messages
      api.messages.list(selectedIncidentId).then(msgs => setMessages(msgs))
      // Connect to live updates
      connectWS(selectedIncidentId)
    }
    return () => wsRef.current?.disconnect()
  }, [selectedIncidentId, connectWS])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedIncidentId || !me) return

    try {
      wsRef.current.sendMessage(newMessage, me.full_name, me.role)
      setNewMessage("")
    } catch (err) {
      toast.error("SEND ERROR: SIGNAL LOST")
    }
  }

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case "fire": return <Flame className="h-4 w-4 text-orange-500" />
      case "medical": return <HeartPulse className="h-4 w-4 text-red-500" />
      case "security": return <ShieldAlert className="h-4 w-4 text-blue-500" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getAvatarColor = (role: string) => {
    switch (role) {
      case "responder": return "bg-emergency/20 text-emergency"
      case "staff": return "bg-primary/20 text-primary"
      case "manager": return "bg-cyan/20 text-cyan"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  const selectedIncidentData = incidents.find((i) => i.id === selectedIncidentId)

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">COMMUNICATION CENTER</h1>
        <div className="flex items-center gap-2 text-muted-foreground mt-1">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span>REAL-TIME ENCRYPTED CHANNEL ACTIVE</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Incident List Sidebar */}
        <Card className="lg:col-span-1 glass border-primary/20">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-emergency" />
              LIVE FEEDS
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1 p-3">
                {incidents.length === 0 && (
                  <p className="text-xs text-muted-foreground p-4 text-center">No active missions detected.</p>
                )}
                {incidents.map((incident) => (
                  <button
                    key={incident.id}
                    onClick={() => setSelectedIncidentId(incident.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all duration-200",
                      selectedIncidentId === incident.id
                        ? "bg-primary/10 border border-primary/30 shadow-sm"
                        : "hover:bg-muted/50 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getIncidentIcon(incident.type)}
                      <span className="font-bold capitalize text-xs tracking-wider">{incident.type}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono truncate uppercase">{incident.location}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <Card className="lg:col-span-3 flex flex-col glass border-primary/20">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedIncidentData && (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 animate-glow">
                      {getIncidentIcon(selectedIncidentData.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold tracking-tight uppercase">
                        {selectedIncidentData.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="border-primary/30 text-primary text-[10px] font-mono">
                          SECURE-ID: {selectedIncidentData.id}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDistanceToNow(new Date(selectedIncidentData.reported_at), { addSuffix: true }).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-0 bg-background/20">
            <ScrollArea className="h-[400px] p-6">
              <div className="space-y-6">
                {messages.length === 0 && (
                  <div className="text-center py-20 opacity-30 italic">Encryption established. Awaiting signals...</div>
                )}
                {messages.map((message) => {
                  const isMe = me && me.full_name === message.sender_name
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-4",
                        isMe && "flex-row-reverse"
                      )}
                    >
                      <Avatar className={cn("h-9 w-9 border-2 border-background shadow-md", getAvatarColor(message.sender_role || "staff"))}>
                        <AvatarFallback className="font-bold text-xs uppercase">
                          {(message.sender_name || "??").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn("flex flex-col max-w-[75%]", isMe && "items-end")}>
                        <div className="flex items-center gap-2 mb-1.5 px-1">
                          <span className="text-[10px] font-bold tracking-tighter uppercase opacity-70">
                            {message.sender_name}
                          </span>
                          <span className="text-[8px] opacity-40 font-mono">
                            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: false })}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "rounded-2xl px-5 py-3 shadow-sm transition-all",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-tr-none glow-cyan"
                              : "glass rounded-tl-none"
                          )}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Message Input */}
          <div className="border-t border-border/50 p-4 bg-muted/20">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="ENTER MISSION SIGNAL..."
                className="flex-1 bg-background/50 border-primary/20 font-mono text-xs h-12 rounded-xl focus-visible:ring-primary"
              />
              <Button type="submit" disabled={!newMessage.trim()} className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function CommunicationPage() {
  return (
    <AppWrapper>
      <CommunicationContent />
    </AppWrapper>
  )
}
