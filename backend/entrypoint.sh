#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/backend
PYTHONPATH=/app alembic upgrade head
cd /app

echo "Starting server..."
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000
