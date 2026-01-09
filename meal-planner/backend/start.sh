#!/bin/bash
set -e

# Run migrations
echo "Running database migrations..."
# Run migrations
echo "Running database migrations..."
# alembic upgrade head # We use our custom fixer for now
python scripts/check_and_fix.py || echo "⚠️ Warning: DB Fix script failed, changing permissions?"


# Start server
echo "Starting server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
