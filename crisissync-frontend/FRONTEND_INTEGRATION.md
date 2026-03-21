# 🔌 CrisisSync — Frontend Integration Guide

## Files to Copy into Your Next.js Project

```
crisissync-frontend/
├── app/
│   ├── dashboard/page.tsx     → replace your app/dashboard/page.tsx
│   ├── report/page.tsx        → replace your app/report/page.tsx
│   ├── communication/page.tsx → replace your app/communication/page.tsx
│   ├── analytics/page.tsx     → replace your app/analytics/page.tsx
│   └── login/page.tsx         → NEW — add as app/login/page.tsx
├── .env.local.example         → copy to .env.local, fill in URLs
```

Plus from `crisissync-backend/frontend-integration/`:
```
lib/api.ts              → copy to your lib/api.ts
hooks/useIncidents.ts   → copy to your hooks/useIncidents.ts
```

---

## Step 1 — Environment

```bash
cp .env.local.example .env.local
# Edit: set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL
```

## Step 2 — Copy lib/api.ts

```bash
cp ../crisissync-backend/frontend-integration/lib/api.ts lib/api.ts
```

## Step 3 — Copy page files

```bash
cp app/dashboard/page.tsx     ../crisissync/app/dashboard/page.tsx
cp app/report/page.tsx        ../crisissync/app/report/page.tsx
cp app/communication/page.tsx ../crisissync/app/communication/page.tsx
cp app/analytics/page.tsx     ../crisissync/app/analytics/page.tsx
cp app/login/page.tsx         ../crisissync/app/login/page.tsx
```

## Step 4 — Update your IncidentCard import

The new pages import from `@/lib/api` instead of `@/lib/mock-data`.
Your existing `components/incident-card.tsx` imports from mock-data —
update its type import:

```typescript
// OLD:
import type { Incident, IncidentType, IncidentStatus } from "@/lib/mock-data"

// NEW:
import type { Incident, IncidentType, IncidentStatus } from "@/lib/api"
```

## Step 5 — Add Login to Navbar

Add to your `navItems` in `components/navbar.tsx`:

```typescript
{ href: "/login", labelKey: "nav.login", icon: LogIn },
```

And add the translation to `lib/i18n.tsx`:
```typescript
'nav.login': { en: 'Login', hi: 'लॉगिन' },
```

---

## What Changed in Each Page

### Dashboard (`app/dashboard/page.tsx`)
- ✅ Fetches incidents from `GET /api/v1/incidents` instead of mock data
- ✅ Real-time WebSocket subscription — incidents update live
- ✅ Live/Offline indicator in header
- ✅ AI Triage Panel inside incident detail dialog (Claude analysis on demand)
- ✅ AI severity score badge on each incident card
- ✅ Auto-generated tags displayed on cards
- ✅ "Mark Resolved" button in detail dialog
- ✅ AI severity color coding (red/yellow/green)

### Report (`app/report/page.tsx`)
- ✅ Submits to `POST /api/v1/incidents` (real API call)
- ✅ Severity selector (low / medium / high / critical)
- ✅ Quick-pick location chips (Lobby, Pool, etc.)
- ✅ AI badge explaining Claude will auto-triage the report
- ✅ Success dialog offers "Join Incident Chat" button
- ✅ Error handling with toast notifications

### Communication (`app/communication/page.tsx`)
- ✅ Loads incident list from API (active + pending only)
- ✅ Loads message history from `GET /api/v1/messages/incident/{id}`
- ✅ WebSocket real-time chat (connects per incident room)
- ✅ Optimistic message updates (message appears instantly)
- ✅ Live online count from WS events
- ✅ AI Smart Suggestions powered by Claude (refreshable)
- ✅ Supports `?incident=ID` URL param (from report success dialog)
- ✅ Reconnects automatically if WS drops

### Analytics (`app/analytics/page.tsx`)
- ✅ All chart data from `GET /api/v1/analytics/summary?days=N`
- ✅ Day-range selector (7d / 14d / 30d)
- ✅ AI Risk Assessment panel (Claude analyzes incident patterns)
- ✅ Risk level badge (low/medium/high/critical)
- ✅ Top risk areas with frequency
- ✅ Prevention recommendations from Claude
- ✅ Trend indicator (improving/stable/worsening)

### Login (`app/login/page.tsx`) — NEW PAGE
- ✅ JWT authentication via `POST /api/v1/auth/token`
- ✅ Tokens stored in localStorage (auto-refresh built into api.ts)
- ✅ One-click demo logins (Manager / Staff / Responder)
- ✅ Links guests directly to /report (no auth needed to report)

---

## Hackathon Demo Flow

1. **Start backend**: `docker compose up -d && python seed.py`
2. **Start frontend**: `pnpm dev`
3. **Open two browsers** (or incognito):
   - Browser 1: Login as `manager`
   - Browser 2: Login as `fire_team_a`
4. **Browser 2**: Go to Report → Submit a Fire emergency
5. **Browser 1**: Watch it appear on Dashboard **in real-time** ✨
6. **Browser 1**: Click the incident → Run AI Triage → Show Claude's analysis
7. **Both browsers**: Go to Communication → Join the incident chat → messages sync live
8. **Browser 1**: Go to Analytics → Run AI Risk Assessment → Claude analyzes patterns

This 3-minute demo shows: real-time sync, AI triage, live chat, smart analytics — everything a hackathon judge wants to see. 🏆
