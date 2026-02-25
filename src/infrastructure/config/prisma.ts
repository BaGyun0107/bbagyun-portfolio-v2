import { PrismaClient } from "@/generated/prisma/client";
import path from "path";

// Next.js 개발 환경을 위한 전역 Prisma Client 인스턴스화 (핫 리로드 시 다중 인스턴스 생성 방지용)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"],
    datasources: {
      db: {
        url: `file:${path.join(process.cwd(), "prisma", "dev.db")}`,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
