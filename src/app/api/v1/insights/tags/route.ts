import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse } from "@/core/application/utils/api-response.util";
import { InsightUseCases } from "@/core/application/use-cases/insight.use-case";
import { InsightPrismaRepository } from "@/infrastructure/repositories/insight-prisma.repository";
import { unstable_cache } from "next/cache";

const insightUseCases = new InsightUseCases(new InsightPrismaRepository());

const getCachedTags = unstable_cache(
  async () => insightUseCases.getInsightTags(),
  ["insight-tags"],
  { tags: ["insights"] }
);

/**
 * @swagger
 * /api/v1/insights/tags:
 *   get:
 *     summary: 전체 인사이트 태그 클라우드 조회
 *     tags: [Insights]
 *     responses:
 *       200:
 *         description: 태그 클라우드 데이터 반환
 */
async function getHandler(req: NextRequest) {
  // 만약 쿼리스트링에 tag가 있으면 특정 태그의 게시물 목록을 반환
  const { searchParams } = new URL(req.url);
  const tagKeyword = searchParams.get('tag');

  if (tagKeyword) {
    const insightsByTag = await insightUseCases.getInsightsByTag(tagKeyword);
    return successResponse(insightsByTag);
  }

  const tags = await getCachedTags();
  return successResponse(tags);
}

export const GET = withApiHandler(getHandler);
