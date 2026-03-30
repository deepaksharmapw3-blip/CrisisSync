/**
 * CrisisSync API Client
 * Drop this file into your Next.js project: lib/api.ts
 *
 * Usage:
 *   import { api } from "@/lib/api"
 *   const incidents = await api.incidents.list()
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://crisissync-api.onrender.com/api/v1"
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "wss://crisissync-api.onrender.com/ws"

// ── Token helpers ─────────────────────────────────────────────────────────────
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("access_token") : null

const setTokens = (access: string, refresh: string) => {
  localStorage.setItem("access_token", access)
  localStorage.setItem("refresh_token", refresh)
}

const clearTokens = () => {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}

// ── Base fetch with auth + auto-refresh ───────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401 && retry) {
    // Attempt token refresh
    const refreshed = await refreshAccessToken()
    if (refreshed) return apiFetch<T>(path, options, false)
    clearTokens()
    if (typeof window !== "undefined") window.location.href = "/login"
    throw new Error("Session expired")
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `API error ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refresh_token")
  if (!refreshToken) return false
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return false
    const data = await res.json()
    setTokens(data.access_token, data.refresh_token)
    return true
  } catch {
    return false
  }
}

// ── Types (mirrors backend schemas) ──────────────────────────────────────────
export type IncidentType = "fire" | "medical" | "security" | "other"
export type IncidentStatus = "pending" | "active" | "resolved" | "closed"
export type IncidentSeverity = "low" | "medium" | "high" | "critical"
export type UserRole = "guest" | "staff" | "responder" | "manager"

export interface User {
  id: number
  email: string
  username: string
  full_name: string
  role: UserRole
  property_name?: string
  department?: string
  phone?: string
  avatar_url?: string
  is_active: boolean
  is_on_duty: boolean
  preferred_language: string
  created_at: string
}

export interface Incident {
  id: number
  title: string
  description: string
  type: IncidentType
  status: IncidentStatus
  severity: IncidentSeverity
  location: string
  floor?: string
  room_number?: string
  reporter_id?: number
  reporter_name?: string
  assignee_id?: number
  reported_at: string
  acknowledged_at?: string
  resolved_at?: string
  response_time_minutes?: number
  is_drill: boolean
  requires_evacuation: boolean
  ai_triage_summary?: string
  ai_suggested_actions?: string[]
  ai_severity_score?: number
  ai_tags?: string[]
  image_urls?: string[]
  property_name?: string
}

export interface IncidentListResponse {
  incidents: Incident[]
  total: number
  active: number
  pending: number
  resolved: number
}

export interface Message {
  id: number
  content: string
  message_type: string
  incident_id: number
  sender_id?: number
  sender_name?: string
  sender_role?: string
  is_read: boolean
  timestamp: string
}

export interface AnalyticsSummary {
  daily_stats: Array<{ date: string; incidents: number; resolved: number; avg_response_time?: number }>
  incident_type_stats: Array<{ type: string; count: number; percentage: number }>
  resolution_stats: {
    average_response_time: string
    total_incidents: number
    resolved_incidents: number
    resolution_rate: number
    avg_resolution_time_minutes?: number
  }
  severity_breakdown: Record<string, number>
  hourly_heatmap: Array<{ hour: number; count: number }>
}

export interface VisitorSession {
  id: number
  session_id: string
  ip_address?: string
  browser?: string
  os?: string
  device_type?: string
  country?: string
  city?: string
  referrer?: string
  user_id?: number
  is_authenticated: boolean
  first_seen: string
  last_seen: string
  total_page_views: number
}

export interface VisitorActivity {
  id: number
  method: string
  path: string
  full_url?: string
  status_code?: number
  response_time_ms?: number
  user_id?: number
  timestamp: string
}

export interface VisitorStats {
  total_visitors: number
  total_sessions: number
  total_page_views: number
  authenticated_sessions: number
  unique_countries: number
  avg_page_views_per_session: number
  top_pages: Array<{ page: string; hits: number }>
  top_countries: Array<{ country: string; count: number }>
  top_browsers: Array<{ browser: string; count: number }>
  top_devices: Array<{ device: string; count: number }>
  recent_visitors: VisitorSession[]
}

export interface VisitorTimelinePoint {
  date: string
  visitors: number
  page_views: number
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  async register(data: {
    email: string; username: string; full_name: string
    password: string; role?: UserRole; property_name?: string
  }) {
    return apiFetch<User>("/auth/register", {
      method: "POST", body: JSON.stringify(data),
    })
  },

  async login(username: string, password: string) {
    const form = new URLSearchParams({ username, password })
    const res = await fetch(`${API_BASE}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    })
    if (!res.ok) throw new Error("Invalid credentials")
    const data = await res.json()
    setTokens(data.access_token, data.refresh_token)
    return data as { access_token: string; refresh_token: string; user: User }
  },

  async me() { return apiFetch<User>("/auth/me") },
  logout() { clearTokens() },
}

// ── Incidents ─────────────────────────────────────────────────────────────────
export const incidentsApi = {
  async list(params?: {
    status?: IncidentStatus; type?: IncidentType
    search?: string; skip?: number; limit?: number
  }) {
    const q = new URLSearchParams()
    if (params?.status) q.set("status", params.status)
    if (params?.type) q.set("type", params.type)
    if (params?.search) q.set("search", params.search)
    if (params?.skip) q.set("skip", String(params.skip))
    if (params?.limit) q.set("limit", String(params.limit))
    return apiFetch<IncidentListResponse>(`/incidents?${q}`)
  },

  async get(id: number) { return apiFetch<Incident>(`/incidents/${id}`) },

  async create(data: {
    title: string; description: string; type: IncidentType
    location: string; severity?: IncidentSeverity
    floor?: string; room_number?: string
    reporter_name?: string; image_urls?: string[]
  }) {
    return apiFetch<Incident>("/incidents", {
      method: "POST", body: JSON.stringify(data),
    })
  },

  async updateStatus(id: number, status: IncidentStatus, note?: string) {
    return apiFetch<Incident>(`/incidents/${id}/status`, {
      method: "PATCH", body: JSON.stringify({ status, note }),
    })
  },

  async update(id: number, data: Partial<Incident>) {
    return apiFetch<Incident>(`/incidents/${id}`, {
      method: "PATCH", body: JSON.stringify(data),
    })
  },

  async delete(id: number) {
    return apiFetch<void>(`/incidents/${id}`, { method: "DELETE" })
  },
}

// ── Messages ──────────────────────────────────────────────────────────────────
export const messagesApi = {
  async list(incidentId: number, skip = 0, limit = 100) {
    return apiFetch<Message[]>(`/messages/incident/${incidentId}?skip=${skip}&limit=${limit}`)
  },

  async send(incidentId: number, content: string) {
    return apiFetch<Message>("/messages", {
      method: "POST",
      body: JSON.stringify({ incident_id: incidentId, content }),
    })
  },

  async markRead(messageId: number) {
    return apiFetch<void>(`/messages/${messageId}/read`, { method: "PATCH" })
  },
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  async summary(days = 14) {
    return apiFetch<AnalyticsSummary>(`/analytics/summary?days=${days}`)
  },
  async leaderboard() {
    return apiFetch<Array<{ user_id: number; full_name: string; total_handled: number }>>("/analytics/leaderboard")
  },
}

// ── AI Features ───────────────────────────────────────────────────────────────
export const aiApi = {
  async triage(incidentId: number) {
    return apiFetch<{
      severity_score: number; summary: string
      suggested_actions: string[]; tags: string[]
      requires_evacuation: boolean; call_911: boolean
    }>("/ai/triage", { method: "POST", body: JSON.stringify({ incident_id: incidentId }) })
  },

  async summarize(incidentId: number) {
    return apiFetch<{ summary: string }>("/ai/summarize", {
      method: "POST", body: JSON.stringify({ incident_id: incidentId }),
    })
  },

  async suggestResponses(incidentId: number, userRole: string) {
    return apiFetch<{ suggestions: string[] }>("/ai/suggest-response", {
      method: "POST",
      body: JSON.stringify({ incident_id: incidentId, user_role: userRole }),
    })
  },

  async riskAssessment() {
    return apiFetch<{
      risk_level: string; summary: string
      top_risks: Array<{ area: string; risk: string; frequency: number }>
      recommendations: string[]; trend: string
    }>("/ai/risk-assessment")
  },
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  async getMe() { return apiFetch<User>("/users/me") },
  async toggleDuty() { return apiFetch<User>("/users/me/duty", { method: "PATCH" }) },
  async listResponders(onDutyOnly = false) {
    return apiFetch<User[]>(`/users/responders?on_duty_only=${onDutyOnly}`)
  },
}

// ── Visitors & Activity ───────────────────────────────────────────────────────
export const visitorsApi = {
  async getStats(days = 30) {
    return apiFetch<VisitorStats>(`/visitors/stats?days=${days}`)
  },
  async getTimeline(days = 30) {
    return apiFetch<VisitorTimelinePoint[]>(`/visitors/timeline?days=${days}`)
  },
  async listSessions(params?: { skip?: number; limit?: number; authenticated_only?: boolean }) {
    const q = new URLSearchParams()
    if (params?.skip) q.set("skip", String(params.skip))
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.authenticated_only) q.set("authenticated_only", "true")
    return apiFetch<VisitorSession[]>(`/visitors/sessions?${q}`)
  },
  async listActivities(params?: { skip?: number; limit?: number; path_filter?: string; user_id?: number }) {
    const q = new URLSearchParams()
    if (params?.skip) q.set("skip", String(params.skip))
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.path_filter) q.set("path_filter", params.path_filter)
    if (params?.user_id) q.set("user_id", String(params.user_id))
    return apiFetch<VisitorActivity[]>(`/visitors/activities?${q}`)
  },
}

// ── WebSocket Client ──────────────────────────────────────────────────────────
export class CrisisSyncWS {
  private ws: WebSocket | null = null
  private incidentId: number | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private handlers: Map<string, ((data: any) => void)[]> = new Map()
  private onConnectHandlers: (() => void)[] = []
  private onDisconnectHandlers: (() => void)[] = []

  /**
   * Connect to an incident's real-time chat room.
   * Use incidentId=null to join the global dashboard feed.
   */
  connect(incidentId: number | null = null) {
    const token = getToken()
    const url = incidentId
      ? `${WS_BASE}/incidents/${incidentId}?token=${token}`
      : `${WS_BASE}/global?token=${token}`

    this.incidentId = incidentId
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.info("CrisisSync WS established")
      this.onConnectHandlers.forEach(h => h())
    }

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        const handlers = this.handlers.get(payload.type) || []
        handlers.forEach((h) => h(payload))
        const wildcards = this.handlers.get("*") || []
        wildcards.forEach((h) => h(payload))
      } catch { /* ignore malformed */ }
    }

    this.ws.onclose = () => {
      this.onDisconnectHandlers.forEach(h => h())
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
      this.reconnectTimer = setTimeout(() => this.connect(incidentId), 3000)
    }

    this.ws.onerror = (e) => {
      console.warn("CrisisSync WS error", e)
    }

    return this
  }

  onConnect(handler: () => void) {
    this.onConnectHandlers.push(handler)
    return this
  }

  onDisconnect(handler: () => void) {
    this.onDisconnectHandlers.push(handler)
    return this
  }

  on(eventType: string, handler: (data: unknown) => void) {
    const existing = this.handlers.get(eventType) || []
    this.handlers.set(eventType, [...existing, handler])
    return this
  }

  send(type: string, data: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, incident_id: this.incidentId, ...data }))
    }
  }

  sendMessage(content: string, senderName: string, senderRole: string) {
    this.send("message", { content, sender_name: senderName, sender_role: senderRole })
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
  }
}

// ── Convenience singleton ─────────────────────────────────────────────────────
export const api = {
  auth: authApi,
  incidents: incidentsApi,
  messages: messagesApi,
  analytics: analyticsApi,
  ai: aiApi,
  users: usersApi,
  visitors: visitorsApi,
  ws: (incidentId?: number) => new CrisisSyncWS().connect(incidentId ?? null),
}

export default api
