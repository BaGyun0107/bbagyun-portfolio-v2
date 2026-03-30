import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse } from "@/core/application/utils/api-response.util";
import { DashboardUseCases } from "@/core/application/use-cases/dashboard.use-case";

const dashboardUseCases = new DashboardUseCases();

/**
 * @swagger
 * /api/v1/dashboard/summary:
 *   get:
 *     summary: 관리자 대시보드 요약 통계 조회
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 대시보드 요약 데이터 조회 성공
 */
async function getHandler(req: NextRequest) {
  const summary = await dashboardUseCases.getSummary();
  return successResponse(summary);
}

export const GET = withApiHandler(getHandler, { requireAuth: true, allowedRoles: ["Admin", "Editor", "Viewer"] });
