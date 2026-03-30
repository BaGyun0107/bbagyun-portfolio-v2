import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse, errorResponse } from "@/core/application/utils/api-response.util";
import { InsightUseCases } from "@/core/application/use-cases/insight.use-case";
import { InsightPrismaRepository } from "@/infrastructure/repositories/insight-prisma.repository";

const insightUseCases = new InsightUseCases(new InsightPrismaRepository());

/**
 * @swagger
 * /api/v1/insights/{slug}/navigation:
 *   get:
 *     summary: 특정 인사이트의 이전글/다음글 네비게이션 조회
 *     tags: [Insights]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 네비게이션 데이터 반환
 */
async function getHandler(req: NextRequest, params: Promise<{ slug: string }>) {
  const { slug } = await params;
  
  const insight = await insightUseCases.getInsightBySlug(slug);
  if (!insight) {
    return errorResponse("해당 게시물을 찾을 수 없습니다.", 404);
  }

  const navigation = await insightUseCases.getInsightNavigation(insight.date);
  return successResponse(navigation);
}

export const GET = withApiHandler(getHandler);
