import { PrismaClient } from "@/generated/prisma/client";
import path from "path";

// Next.js 개발 환경을 위한 전역 Prisma Client 인스턴스화 (핫 리로드 시 다중 인스턴스 생성 방지용)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * DATABASE_URL 환경 변수 기반으로 DB 접속 URL을 결정합니다.
 * 환경 변수에 절대 경로가 이미 포함되어 있으면 그대로 사용하고,
 * 상대경로(file:./)인 경우에만 process.cwd() 기반 절대경로로 변환합니다.
 */
const getDbUrl = (): string | undefined => {
  const envUrl = process.env.DATABASE_URL;
  if (!envUrl) return undefined;

  // 이미 절대경로면 그대로 사용
  if (envUrl.startsWith("file:/") || envUrl.startsWith("/")) return envUrl;

  // 상대경로(file:./)인 경우 → process.cwd() 기반 절대경로로 변환
  // e.g. "file:./prisma/dev.db" → "file:/absolute/path/to/prisma/dev.db"
  const relativePart = envUrl.replace(/^file:\.\//, "");
  const absolutePath = path.resolve(process.cwd(), relativePart);
  return `file:${absolutePath}`;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
    datasources: {
      db: {
        url: getDbUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
