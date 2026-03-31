# ---- Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY next/package.json next/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY next/ ./

# DATABASE_URL is needed for prisma generate (build-time only)
ENV DATABASE_URL="file:/app/data/prod.db"

RUN pnpm prisma generate
RUN pnpm build

# Run migration + seed at build time to create a template DB with data
RUN mkdir -p /app/data && \
    pnpm prisma migrate deploy && \
    pnpm prisma db seed && \
    cp /app/data/prod.db /app/prisma/empty.db && \
    rm -f /app/data/prod.db /app/data/prod.db-journal /app/data/prod.db-wal

# Seed 데이터 + 마이그레이션 해시 기록 (배포 시 변경 감지용)
RUN cat prisma/data/*.ts prisma/seed.ts prisma/migrations/*/migration.sql | sha256sum | cut -d' ' -f1 > /app/prisma/seed-hash.txt

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma client for runtime query engine
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma ./node_modules/.prisma

# Copy Prisma schema + migrations for runtime use
COPY --from=builder /app/prisma ./prisma

# Create directories with correct ownership
RUN mkdir -p /app/logs /app/data && \
    chown -R nextjs:nodejs /app/logs /app/data

# Copy entrypoint script
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
