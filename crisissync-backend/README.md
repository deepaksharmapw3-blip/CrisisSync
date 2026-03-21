# 🚨 CrisisSync Backend

**Rapid Crisis Response Platform — FastAPI + PostgreSQL + Claude AI**

A production-grade backend for the CrisisSync emergency management system,
built for hospitality properties (hotels, resorts, event venues).

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│              Next.js 16 Frontend                    │
│         (Your existing CrisisSync UI)               │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP REST + WebSocket
┌──────────────────▼──────────────────────────────────┐
│              FastAPI Gateway                        │
│  JWT Auth · Rate Limiting · CORS · GZip             │
├─────────────┬───────────────┬───────────────────────┤
│  Incidents  │  Messages     │  Analytics            │
│  Router     │  Router       │  Router               │
├─────────────┴───────────────┴───────────────────────┤
│              AI Layer (Claude)                      │
│  Triage · Summaries · Smart Replies · Risk Score   │
├─────────────────────────────────────────────────────┤
│  PostgreSQL │ Redis Cache │ S3 Media │ WebSocket    │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.12+
- Docker + Docker Compose
- Anthropic API key

### 2. Clone and configure

```bash
cd crisissync-backend
cp .env.example .env
# Edit .env — add your ANTHROPIC_API_KEY and SECRET_KEY
```

### 3. Start with Docker (recommended)

```bash
docker compose up -d
```

The API will be at `http://localhost:8000`
Docs at `http://localhost:8000/docs`

### 4. Or run locally

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start PostgreSQL and Redis (if not using Docker for DB)
docker compose up db redis -d

# Run database migrations
alembic upgrade head

# Start the API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📂 Project Structure

```
crisissync-backend/
├── app/
│   ├── main.py                  # FastAPI app, middleware, router registration
│   ├── core/
│   │   ├── config.py            # All settings via pydantic-settings
│   │   ├── database.py          # Async SQLAlchemy engine + session
│   │   └── security.py          # JWT, bcrypt, auth dependencies
│   ├── models/
│   │   ├── user.py              # User (guest/staff/responder/manager)
│   │   ├── incident.py          # Incident (fire/medical/security/other)
│   │   ├── message.py           # Per-incident chat messages
│   │   └── notification.py      # In-app notifications
│   ├── schemas/
│   │   ├── user.py              # Pydantic request/response schemas
│   │   ├── incident.py
│   │   └── message.py
│   ├── routers/
│   │   ├── auth.py              # POST /register, /token, /refresh
│   │   ├── incidents.py         # Full CRUD + AI triage trigger
│   │   ├── messages.py          # Per-incident chat
│   │   ├── analytics.py         # Charts data, heatmaps, leaderboard
│   │   ├── ai_features.py       # Claude-powered endpoints
│   │   ├── users.py             # Profile, duty status
│   │   └── websocket_router.py  # WS: /incidents/{id}, /global
│   ├── services/
│   │   ├── ai_service.py        # All Claude API calls
│   │   └── notification_service.py
│   └── websocket/
│       └── manager.py           # Connection manager (rooms + broadcast)
├── frontend-integration/
│   ├── lib/api.ts               # → copy to your Next.js lib/api.ts
│   └── hooks/useIncidents.ts    # → copy to your Next.js hooks/
├── alembic/                     # Database migrations
├── tests/
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── requirements.txt
└── .env.example
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/token` | Login (returns JWT) |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET  | `/api/v1/auth/me` | Current user |

### Incidents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/v1/incidents` | List with filters |
| POST   | `/api/v1/incidents` | Report new incident |
| GET    | `/api/v1/incidents/{id}` | Get incident detail |
| PATCH  | `/api/v1/incidents/{id}` | Update incident |
| PATCH  | `/api/v1/incidents/{id}/status` | Update status |
| DELETE | `/api/v1/incidents/{id}` | Delete incident |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/v1/messages/incident/{id}` | Get chat history |
| POST | `/api/v1/messages` | Send message |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/summary?days=14` | All charts data |
| GET | `/api/v1/analytics/leaderboard` | Top responders |

### AI Features (Claude)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/triage` | AI incident triage |
| POST | `/api/v1/ai/summarize` | Summarize incident |
| POST | `/api/v1/ai/suggest-response` | Smart quick replies |
| GET  | `/api/v1/ai/risk-assessment` | Property risk score |

### WebSocket
| URL | Description |
|-----|-------------|
| `ws://host/ws/incidents/{id}` | Real-time incident chat |
| `ws://host/ws/global` | Global incident feed (dashboard) |

---

## 🤖 AI Features

All powered by Claude (`claude-sonnet-4-20250514`):

### Automatic Triage
When an incident is reported, Claude automatically:
- Assigns a **severity score** (0.0–1.0)
- Writes a **triage summary** for responders
- Generates **5 step-by-step actions** to take
- Creates **descriptive tags**
- Flags if **evacuation** or **911** is needed

### Smart Quick Replies
Context-aware message suggestions based on incident type, status, and recent chat history.

### Incident Summarizer
Generates a formal incident report from the description + chat thread — ready for management and insurance.

### Property Risk Assessment
Analyzes 30-day incident patterns and produces a risk level + prevention recommendations.

---

## 🔗 Frontend Integration

### 1. Copy integration files

```bash
cp frontend-integration/lib/api.ts    ../crisissync-frontend/lib/api.ts
cp frontend-integration/hooks/useIncidents.ts  ../crisissync-frontend/hooks/
```

### 2. Add environment variables to your Next.js .env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

### 3. Update your Dashboard page

```typescript
// app/dashboard/page.tsx — replace mock data with:
import { useIncidents } from "@/hooks/useIncidents"

const { incidents, active, pending, resolved, loading, updateStatus } = useIncidents({
  search: searchQuery,
  type: typeFilter !== "all" ? typeFilter : undefined,
  status: statusFilter !== "all" ? statusFilter : undefined,
  realtime: true,  // subscribe to live WebSocket updates
})
```

### 4. Update your Report page

```typescript
// app/report/page.tsx — replace simulate API call with:
import { api } from "@/lib/api"

const handleSubmit = async (e) => {
  e.preventDefault()
  setIsSubmitting(true)
  await api.incidents.create({
    title: `${selectedType} emergency at ${location}`,
    description: notes || `${selectedType} incident reported`,
    type: selectedType,
    location,
  })
  setIsSubmitting(false)
  setShowSuccess(true)
}
```

### 5. Update Analytics page

```typescript
// app/analytics/page.tsx — replace mock data with:
import { analyticsApi } from "@/lib/api"
const [analytics, setAnalytics] = useState(null)
useEffect(() => {
  analyticsApi.summary(14).then(setAnalytics)
}, [])
// Use analytics.daily_stats, analytics.incident_type_stats, etc.
```

---

## 🧪 Testing

```bash
pytest tests/ -v
pytest tests/ -v --cov=app --cov-report=html
```

---

## 🚢 Production Deployment

### Render / Railway / Fly.io

```bash
# Set environment variables in your platform dashboard
# Build command:
pip install -r requirements.txt && alembic upgrade head
# Start command:
uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4
```

### Vercel (Frontend) + Railway (Backend)
1. Deploy this backend to Railway (connects to PostgreSQL addon)
2. Set `NEXT_PUBLIC_API_URL` in Vercel to your Railway URL
3. Deploy your Next.js frontend to Vercel

---

## 🏆 Hackathon Features Checklist

- ✅ Real-time WebSocket incident feed
- ✅ Claude AI triage (automatic severity scoring)
- ✅ Claude smart quick-reply suggestions
- ✅ Claude incident report summarizer
- ✅ Claude property risk assessment
- ✅ Role-based access (guest/staff/responder/manager)
- ✅ PostgreSQL with full incident history
- ✅ Analytics with response time trends
- ✅ Responder duty status management
- ✅ In-app notifications
- ✅ Docker + Nginx production setup
- ✅ Auto-refresh JWT tokens
- ✅ Background AI processing (non-blocking)

---

Built with ❤️ for CrisisSync | FastAPI + PostgreSQL + Claude AI
