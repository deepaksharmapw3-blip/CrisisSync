"use client"

import { useState, useRef, useEffect } from "react"
import { AppWrapper } from "@/components/app-wrapper"
import { useI18n } from "@/lib/i18n"
import { RoleBadge } from "@/components/role-badge"
import { mockMessages, mockIncidents, type Message, type UserRole } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Send,
  MessageSquare,
  AlertTriangle,
  Users,
  Clock,
  Flame,
  HeartPulse,
  ShieldAlert,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

function CommunicationContent() {
  const { t } = useI18n()
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [newMessage, setNewMessage] = useState("")
  const [selectedIncident, setSelectedIncident] = useState<string>("1")
  const [currentUserRole] = useState<UserRole>("staff")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeIncidents = mockIncidents.filter((i) => i.status === "active" || i.status === "pending")

  const filteredMessages = messages.filter(
    (m) => !m.incidentId || m.incidentId === selectedIncident
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [filteredMessages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: "You (Hotel Staff)",
      senderRole: currentUserRole,
      timestamp: new Date(),
      incidentId: selectedIncident,
    }

    setMessages([...messages, message])
    setNewMessage("")
  }

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case "fire":
        return <Flame className="h-4 w-4 text-orange-500" />
      case "medical":
        return <HeartPulse className="h-4 w-4 text-red-500" />
      case "security":
        return <ShieldAlert className="h-4 w-4 text-blue-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getAvatarColor = (role: UserRole) => {
    switch (role) {
      case "responder":
        return "bg-emergency/20 text-emergency"
      case "staff":
        return "bg-primary/20 text-primary"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const selectedIncidentData = mockIncidents.find((i) => i.id === selectedIncident)

  return (
    <div className="container px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("communication.title")}</h1>
        <p className="text-muted-foreground mt-1">
          Real-time communication between staff and emergency responders
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Incident List Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-emergency" />
              Active Incidents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1 p-3">
                {activeIncidents.map((incident) => (
                  <button
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      selectedIncident === incident.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getIncidentIcon(incident.type)}
                      <span className="font-medium capitalize text-sm">{incident.type}</span>
                      {incident.status === "active" && (
                        <span className="relative flex h-2 w-2 ml-auto">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emergency opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emergency"></span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{incident.location}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(incident.reportedAt, { addSuffix: true })}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <Card className="lg:col-span-3 flex flex-col">
          {/* Chat Header */}
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedIncidentData && (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emergency/10">
                      {getIncidentIcon(selectedIncidentData.type)}
                    </div>
                    <div>
                      <CardTitle className="text-base capitalize">
                        {selectedIncidentData.type} - {selectedIncidentData.location}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            selectedIncidentData.status === "active" &&
                              "border-emergency text-emergency"
                          )}
                        >
                          {selectedIncidentData.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(selectedIncidentData.reportedAt, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>3 online</span>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[400px] p-4">
              <div className="space-y-4">
                {filteredMessages.map((message) => {
                  const isCurrentUser = message.sender.includes("You")
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        isCurrentUser && "flex-row-reverse"
                      )}
                    >
                      <Avatar className={cn("h-8 w-8", getAvatarColor(message.senderRole))}>
                        <AvatarFallback className="text-xs">
                          {message.sender.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "flex flex-col max-w-[70%]",
                          isCurrentUser && "items-end"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{message.sender}</span>
                          <RoleBadge role={message.senderRole} />
                        </div>
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2",
                            isCurrentUser
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Message Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Select value={currentUserRole} disabled>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="responder">Responder</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t("communication.placeholder")}
                className="flex-1"
              />
              <Button type="submit" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4 mr-2" />
                {t("communication.sendMessage")}
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Quick Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              "En route to location",
              "Situation under control",
              "Need additional support",
              "Area secured",
              "Medical team dispatched",
              "Evacuating area",
            ].map((msg) => (
              <Button
                key={msg}
                variant="outline"
                size="sm"
                onClick={() => setNewMessage(msg)}
              >
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
  return (
    <AppWrapper>
      <CommunicationContent />
    </AppWrapper>
  )
}
