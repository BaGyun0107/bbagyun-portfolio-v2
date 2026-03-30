import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse } from "@/core/application/utils/api-response.util";
import { InsightUseCases } from "@/core/application/use-cases/insight.use-case";
import { InsightPrismaRepository } from "@/infrastructure/repositories/insight-prisma.repository";
import { unstable_cache } from "next/cache";

const insightUseCases = new InsightUseCases(new InsightPrismaRepository());

const getCachedArchive = unstable_cache(
  async () => insightUseCases.getInsightArchive(),
  ["insight-archive"],
  { tags: ["insights"] }
);

/**
 * @swagger
 * /api/v1/insights/archive:
 *   get:
 *     summary: 연도별 인사이트 아카이브 조회
 *     tags: [Insights]
 *     responses:
 *       200:
 *         description: 아카이브 목록 반환
 */
async function getHandler(req: NextRequest) {
  const archive = await getCachedArchive();
  return successResponse(archive);
}

export const GET = withApiHandler(getHandler);
