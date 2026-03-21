"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { AppWrapper } from "@/components/app-wrapper"
import { useI18n } from "@/lib/i18n"
import { RoleBadge } from "@/components/role-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Send, MessageSquare, AlertTriangle, Users, Clock,
  Flame, HeartPulse, ShieldAlert, Brain, Zap, Wifi, WifiOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { incidentsApi, messagesApi, aiApi, CrisisSyncWS, type Incident, type Message } from "@/lib/api"

interface ChatMessage {
  id: string | number
  content: string
  sender_name: string
  sender_role: string
  timestamp: string
  isOptimistic?: boolean
}

function getIncidentIcon(type: string) {
  switch (type) {
    case "fire":     return <Flame      className="h-4 w-4 text-orange-500" />
    case "medical":  return <HeartPulse className="h-4 w-4 text-red-500" />
    case "security": return <ShieldAlert className="h-4 w-4 text-blue-500" />
    default:         return <AlertTriangle className="h-4 w-4 text-gray-500" />
  }
}

function CommunicationContent() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [onlineCount, setOnlineCount] = useState(1)
  const [wsConnected, setWsConnected] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([
    "En route to location",
    "Situation under control",
    "Need additional support",
    "Area secured",
    "Medical team dispatched",
    "Evacuating area",
  ])
  const [loadingAI, setLoadingAI] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<CrisisSyncWS | null>(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  useEffect(() => { scrollToBottom() }, [messages])

  // Load incidents
  useEffect(() => {
    incidentsApi.list({ limit: 20 }).then(data => {
      const active = data.incidents.filter(i => i.status === "active" || i.status === "pending")
      setIncidents(active)
      const paramId = searchParams.get("incident")
      const defaultId = paramId || (active[0]?.id?.toString() ?? "")
      setSelectedIncidentId(defaultId)
    })
  }, [searchParams])

  // Load messages + connect WS when incident changes
  useEffect(() => {
    if (!selectedIncidentId) return

    // Disconnect old WS
    wsRef.current?.disconnect()
    setWsConnected(false)
    setMessages([])
    setLoadingMsgs(true)

    const incId = parseInt(selectedIncidentId)

    // Load history
    messagesApi.list(incId, 0, 100).then(msgs => {
      setMessages(msgs.map(m => ({
        id: m.id,
        content: m.content,
        sender_name: m.sender_name ?? "Staff",
        sender_role: m.sender_role ?? "staff",
        timestamp: m.timestamp,
      })))
      setLoadingMsgs(false)
    }).catch(() => setLoadingMsgs(false))

    // Connect WS
    try {
      const ws = new CrisisSyncWS().connect(incId)
      wsRef.current = ws
      setWsConnected(true)

      ws.on("message", (payload: unknown) => {
        const p = payload as { data: ChatMessage }
        setMessages(prev => {
          // Remove optimistic duplicate if any
          const filtered = prev.filter(m => !m.isOptimistic || m.content !== p.data.content)
          return [...filtered, { ...p.data, id: p.data.id || Date.now() }]
        })
      })
      ws.on("user_joined", (p: unknown) => setOnlineCount((p as { data: { online: number } }).data.online))
      ws.on("user_left",   (p: unknown) => setOnlineCount((p as { data: { online: number } }).data.online))
    } catch {
      setWsConnected(false)
    }

    return () => { wsRef.current?.disconnect() }
  }, [selectedIncidentId])

  // Fetch AI suggestions when incident changes
  const fetchAISuggestions = useCallback(async () => {
    if (!selectedIncidentId) return
    setLoadingAI(true)
    try {
      const result = await aiApi.suggestResponses(parseInt(selectedIncidentId), "staff")
      if (result.suggestions?.length) setAiSuggestions(result.suggestions)
    } catch {
      // Keep defaults silently
    } finally {
      setLoadingAI(false)
    }
  }, [selectedIncidentId])

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedIncidentId) return
    const content = newMessage.trim()
    setNewMessage("")

    // Optimistic update
    const optimistic: ChatMessage = {
      id: `opt-${Date.now()}`,
      content,
      sender_name: "You (Hotel Staff)",
      sender_role: "staff",
      timestamp: new Date().toISOString(),
      isOptimistic: true,
    }
    setMessages(prev => [...prev, optimistic])

    // Send via WS
    if (wsRef.current && wsConnected) {
      wsRef.current.sendMessage(content, "You (Hotel Staff)", "staff")
    } else {
      // Fallback to REST
      messagesApi.send(parseInt(selectedIncidentId), content).catch(() => {
        toast.error("Failed to send message")
      })
    }
  }

  const selectedIncident = incidents.find(i => i.id?.toString() === selectedIncidentId)

  return (
    <div className="container px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("communication.title")}</h1>
        <p className="text-muted-foreground mt-1">Real-time communication between staff and emergency responders</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar — Active Incidents */}
        <Card className="lg:col-span-1 glass border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-emergency" />Active Incidents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1 p-3">
                {incidents.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">No active incidents</p>
                )}
                {incidents.map(incident => (
                  <button key={incident.id} onClick={() => setSelectedIncidentId(incident.id.toString())}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      selectedIncidentId === incident.id.toString()
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted"
                    )}>
                    <div className="flex items-center gap-2 mb-1">
                      {getIncidentIcon(incident.type)}
                      <span className="font-medium capitalize text-sm">{incident.type}</span>
                      {incident.status === "active" && (
                        <span className="relative flex h-2 w-2 ml-auto">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emergency opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emergency" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{incident.location}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(incident.reported_at), { addSuffix: true })}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <Card className="lg:col-span-3 flex flex-col glass border-primary/10">
          {/* Chat Header */}
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedIncident ? (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emergency/10">
                      {getIncidentIcon(selectedIncident.type)}
                    </div>
                    <div>
                      <CardTitle className="text-base capitalize">
                        {selectedIncident.type} — {selectedIncident.location}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline"
                          className={cn(selectedIncident.status === "active" && "border-emergency text-emergency")}>
                          {selectedIncident.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(selectedIncident.reported_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Select an incident to view chat</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className={cn("flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border",
                  wsConnected ? "text-success border-success/30 bg-success/5" : "text-muted-foreground border-border")}>
                  {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {wsConnected ? "Live" : "Offline"}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />{onlineCount} online
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[380px] p-4">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                  <MessageSquare className="h-10 w-10 opacity-20" />
                  <p>No messages yet. Be the first to update the team.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(message => {
                    const isMe = message.sender_name.includes("You")
                    return (
                      <div key={message.id} className={cn("flex gap-3", isMe && "flex-row-reverse")}>
                        <Avatar className={cn("h-8 w-8 flex-shrink-0",
                          message.sender_role === "responder" ? "bg-emergency/20" :
                          message.sender_role === "manager"   ? "bg-primary/30" : "bg-primary/20")}>
                          <AvatarFallback className={cn("text-xs",
                            message.sender_role === "responder" ? "text-emergency" : "text-primary")}>
                            {message.sender_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn("flex flex-col max-w-[70%]", isMe && "items-end")}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{message.sender_name}</span>
                            <RoleBadge role={message.sender_role as "staff" | "responder" | "guest"} />
                          </div>
                          <div className={cn("rounded-2xl px-4 py-2",
                            isMe ? "bg-primary text-primary-foreground rounded-br-md" :
                            message.sender_role === "responder" ? "bg-emergency/10 border border-emergency/20 rounded-bl-md" :
                            "bg-muted rounded-bl-md",
                            message.isOptimistic && "opacity-60"
                          )}>
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </CardContent>

          {/* Input */}
          <div className="border-t border-border/50 p-4">
            <div className="flex gap-2">
              <Input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                placeholder={t("communication.placeholder")}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                className="flex-1 rounded-xl border-primary/20 focus:border-primary/50" />
              <Button onClick={sendMessage} disabled={!newMessage.trim()}
                className="bg-primary hover:bg-primary/90 rounded-xl px-5">
                <Send className="h-4 w-4 mr-2" />{t("communication.sendMessage")}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Quick Replies + Smart Suggestions */}
      <Card className="mt-6 glass border-primary/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              AI Smart Suggestions
            </CardTitle>
            <Button size="sm" variant="outline" onClick={fetchAISuggestions} disabled={loadingAI || !selectedIncidentId}
              className="h-7 text-xs border-primary/30 hover:bg-primary/10">
              {loadingAI ? "..." : <><Zap className="h-3 w-3 mr-1" />Refresh AI</>}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {aiSuggestions.map(msg => (
              <Button key={msg} variant="outline" size="sm"
                onClick={() => setNewMessage(msg)}
                className="border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all text-xs rounded-lg">
                {msg}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CommunicationPage() {
  return <AppWrapper><CommunicationContent /></AppWrapper>
}
