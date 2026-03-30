#!/bin/sh
set -e

# Initialize SQLite database if it doesn't exist
if [ ! -f /app/data/prod.db ]; then
  echo "Initializing database..."
  cp /app/prisma/empty.db /app/data/prod.db 2>/dev/null || true
fi

echo "Starting Next.js..."
exec "$@"
