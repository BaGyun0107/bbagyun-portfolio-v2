import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse, errorResponse } from "@/core/application/utils/api-response.util";
import { InsightUseCases } from "@/core/application/use-cases/insight.use-case";
import { InsightPrismaRepository } from "@/infrastructure/repositories/insight-prisma.repository";

const insightUseCases = new InsightUseCases(new InsightPrismaRepository());

/**
 * @swagger
 * /api/v1/insights:
 *   get:
 *     summary: 전체 인사이트(Insight) 목록 조회
 *     tags: [Insights]
 *     responses:
 *       200:
 *         description: 성공적인 조회
 *   post:
 *     summary: 새로운 인사이트 생성
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               content:
 *                 type: string
 *               date:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               readTime:
 *                 type: string
 *     responses:
 *       200:
 *         description: 정상적으로 데이터가 생성됨
 */
/**
 * 모든 인사이트 내용을 불러오는 요청 핸들러입니다.
 * @param {NextRequest} req - 요청 객체
 * @returns {Promise<Response>} 전체 인사이트 배열 응답 반환
 */
async function getHandler(req: NextRequest) {
  const insights = await insightUseCases.getAllInsights();
  return successResponse(insights);
}

/**
 * 새로운 인사이트 게시물을 추가하는 요청 핸들러입니다.
 * @param {NextRequest} req - 요청 객체
 * @returns {Promise<Response>} 저장된 후 생성된 엔티티가 포함된 응답 반환
 */
async function postHandler(req: NextRequest) {
  const body = await req.json();
  const requiredFields = ["title", "slug", "excerpt", "content", "date", "tags", "readTime"];
  const missing = requiredFields.filter(field => !body[field]);
  
  if (missing.length > 0) {
    return errorResponse(`필수 항목이 누락되었습니다: ${missing.join(", ")}`, 400);
  }

  const newInsight = await insightUseCases.createInsight(body);
  return successResponse(newInsight, "Insight created successfully", 201);
}

// GET is public, POST is Admin-only
export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler, { requireAuth: true, allowedRoles: ["Admin", "Editor"] });
