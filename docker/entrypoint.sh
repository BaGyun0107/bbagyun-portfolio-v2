#!/bin/sh
set -e

DB_PATH="/app/data/prod.db"
HASH_FILE="/app/prisma/seed-hash.txt"
DEPLOYED_HASH_FILE="/app/data/seed-hash.txt"

# 1. DB가 없으면 초기 생성
if [ ! -f "$DB_PATH" ]; then
  echo "Initializing database..."
  cp /app/prisma/empty.db "$DB_PATH" 2>/dev/null || true
  cp "$HASH_FILE" "$DEPLOYED_HASH_FILE" 2>/dev/null || true
fi

# 2. Seed 데이터 또는 마이그레이션 변경 감지 → 자동 업데이트
if [ -f "$HASH_FILE" ]; then
  NEW_HASH=$(cat "$HASH_FILE")
  OLD_HASH=$(cat "$DEPLOYED_HASH_FILE" 2>/dev/null || echo "none")

  if [ "$NEW_HASH" != "$OLD_HASH" ]; then
    echo "Seed data or migration changed. Updating database..."
    # 마이그레이션 적용 (스키마 변경 대응)
    npx prisma migrate deploy 2>&1 || echo "Migration warning (may be up to date)"
    # 기존 DB를 새 template DB로 교체 (seed 데이터 갱신)
    cp /app/prisma/empty.db "$DB_PATH"
    cp "$HASH_FILE" "$DEPLOYED_HASH_FILE"
    echo "Database updated with latest seed data."
  fi
fi

echo "Starting Next.js..."
exec "$@"
