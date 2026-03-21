Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CrisisSync - Full Stack Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Check Docker ──────────────────────────────────
Write-Host "[1/4] Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running." -ForegroundColor Green

# ── Step 2: Start Backend + Database + Redis ─────────────
Write-Host ""
Write-Host "[2/4] Starting Backend (PostgreSQL + Redis + FastAPI)..." -ForegroundColor Yellow
Set-Location "c:\Users\DEEPAK\OneDrive\Desktop\CrisisSync\crisissync-backend"
docker compose up -d db redis api
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start backend services!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend services started." -ForegroundColor Green

# ── Step 3: Wait for backend to be ready ─────────────────
Write-Host ""
Write-Host "[3/4] Waiting for backend API to be ready..." -ForegroundColor Yellow
$retries = 0
do {
    Start-Sleep -Seconds 3
    $retries++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -ErrorAction Stop
        $ready = $response.StatusCode -eq 200
    } catch {
        $ready = $false
    }
    Write-Host "   Attempt $retries/10..." -ForegroundColor Gray
} while (-not $ready -and $retries -lt 10)

if ($ready) {
    Write-Host "✅ Backend API is ready at http://localhost:8000" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend may still be starting. Continuing anyway..." -ForegroundColor Yellow
}

# ── Step 4: Seed database (first time only) ──────────────
$seedFlag = "c:\Users\DEEPAK\OneDrive\Desktop\CrisisSync\.db_seeded"
if (-not (Test-Path $seedFlag)) {
    Write-Host ""
    Write-Host "[3.5/4] Seeding database with demo data..." -ForegroundColor Yellow
    python seed.py
    if ($LASTEXITCODE -eq 0) {
        New-Item $seedFlag -ItemType File -Force | Out-Null
        Write-Host "✅ Database seeded!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Seeding failed - you may need to seed manually." -ForegroundColor Yellow
    }
}

# ── Step 5: Start Frontend ────────────────────────────────
Write-Host ""
Write-Host "[4/4] Starting Frontend (Next.js)..." -ForegroundColor Yellow
Set-Location "c:\Users\DEEPAK\OneDrive\Desktop\CrisisSync\crisissync-app"

# Install deps if node_modules missing
if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing frontend dependencies..." -ForegroundColor Gray
    npm install
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ✅ CrisisSync is starting!" -ForegroundColor Green
Write-Host ""
Write-Host " Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host " Backend:   http://localhost:8000" -ForegroundColor White
Write-Host " API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host " Demo logins:" -ForegroundColor Yellow
Write-Host "   Manager:   manager / manager123" -ForegroundColor White
Write-Host "   Staff:     staff1  / staff123" -ForegroundColor White
Write-Host "   Responder: fire_team_a / responder123" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
