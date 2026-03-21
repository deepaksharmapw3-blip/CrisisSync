/**
 * useIncidents — React hook for the Dashboard page.
 * Fetches incidents from the API, subscribes to real-time WS updates.
 *
 * Drop into: hooks/useIncidents.ts
 */

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { api, type Incident, type IncidentType, type IncidentStatus, CrisisSyncWS } from "@/lib/api"

interface UseIncidentsOptions {
  status?: IncidentStatus
  type?: IncidentType
  search?: string
  realtime?: boolean
}

interface IncidentsState {
  incidents: Incident[]
  total: number
  active: number
  pending: number
  resolved: number
  loading: boolean
  error: string | null
}

export function useIncidents(options: UseIncidentsOptions = {}) {
  const [state, setState] = useState<IncidentsState>({
    incidents: [],
    total: 0,
    active: 0,
    pending: 0,
    resolved: 0,
    loading: true,
    error: null,
  })

  const wsRef = useRef<CrisisSyncWS | null>(null)

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await api.incidents.list({
        status: options.status,
        type: options.type,
        search: options.search,
        limit: 100,
      })
      setState({
        incidents: data.incidents,
        total: data.total,
        active: data.active,
        pending: data.pending,
        resolved: data.resolved,
        loading: false,
        error: null,
      })
    } catch (err: unknown) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch incidents",
      }))
    }
  }, [options.status, options.type, options.search])

  // Initial fetch + refetch when filters change
  useEffect(() => {
    fetch()
  }, [fetch])

  // Subscribe to global WebSocket for live updates
  useEffect(() => {
    if (!options.realtime) return

    const ws = new CrisisSyncWS().connect(null)
    wsRef.current = ws

    ws.on("incident_new", () => {
      // Refetch when a new incident is reported
      fetch()
    })

    ws.on("incident_update", (payload: unknown) => {
      const p = payload as { data: Partial<Incident>; incident_id: number }
      setState((s) => ({
        ...s,
        incidents: s.incidents.map((inc) =>
          inc.id === p.incident_id ? { ...inc, ...p.data } : inc
        ),
        active: s.incidents.filter(i => i.status === "active").length,
      }))
    })

    return () => ws.disconnect()
  }, [options.realtime, fetch])

  const updateStatus = async (id: number, status: IncidentStatus) => {
    const updated = await api.incidents.updateStatus(id, status)
    setState((s) => ({
      ...s,
      incidents: s.incidents.map((i) => (i.id === id ? updated : i)),
    }))
    return updated
  }

  return { ...state, refetch: fetch, updateStatus }
}


/**
 * useIncidentChat — Hook for Communication page live chat.
 * Manages messages state + WebSocket connection for an incident room.
 */
export function useIncidentChat(incidentId: number) {
  const [messages, setMessages] = useState<Array<{
    id: number | string
    content: string
    sender_name: string
    sender_role: string
    timestamp: string
  }>>([])
  const [onlineCount, setOnlineCount] = useState(1)
  const [loading, setLoading] = useState(true)
  const wsRef = useRef<CrisisSyncWS | null>(null)

  useEffect(() => {
    // Fetch message history
    api.messages.list(incidentId).then((msgs) => {
      setMessages(msgs.map(m => ({
        id: m.id,
        content: m.content,
        sender_name: m.sender_name ?? "Unknown",
        sender_role: m.sender_role ?? "staff",
        timestamp: m.timestamp,
      })))
      setLoading(false)
    })

    // Connect to WS room
    const ws = new CrisisSyncWS().connect(incidentId)
    wsRef.current = ws

    ws.on("message", (payload: unknown) => {
      const p = payload as { data: { id: number; content: string; sender_name: string; sender_role: string; timestamp: string } }
      setMessages((prev) => [...prev, p.data])
    })

    ws.on("user_joined", (p: unknown) => {
      const pp = p as { data: { online: number } }
      setOnlineCount(pp.data.online)
    })
    ws.on("user_left", (p: unknown) => {
      const pp = p as { data: { online: number } }
      setOnlineCount(pp.data.online)
    })

    return () => ws.disconnect()
  }, [incidentId])

  const sendMessage = (content: string, senderName: string, senderRole: string) => {
    // Optimistic UI
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content,
      sender_name: senderName,
      sender_role: senderRole,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])
    wsRef.current?.sendMessage(content, senderName, senderRole)
  }

  return { messages, onlineCount, loading, sendMessage }
}
