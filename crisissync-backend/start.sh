#!/bin/bash
set -e

# Wait for DB if needed (init_db in main.py handles table creation)
echo "🚀 Starting CrisisSync API..."

# Start Uvicorn
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
