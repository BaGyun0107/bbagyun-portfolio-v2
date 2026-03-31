#!/bin/sh
set -e

# 템플릿 DB(seed 데이터 포함)를 항상 복사하여 최신 상태 유지
echo "Initializing database from template..."
cp /app/prisma/empty.db /app/data/prod.db
echo "Database ready."

echo "Starting Next.js..."
exec "$@"
