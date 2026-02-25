import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse } from "@/core/application/utils/api-response.util";
import { LogUseCases } from "@/core/application/use-cases/log.use-case";
import { LogPrismaRepository } from "@/infrastructure/repositories/log-prisma.repository";

const logUseCases = new LogUseCases(new LogPrismaRepository());

/**
 * @swagger
 * /api/v1/logs:
 *   get:
 *     summary: 전체 시스템 로그 목록 조회
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 조회 성공
 */
/**
 * 저장된 모든 시스템 로그를 응답으로 반환하는 핸들러입니다.
 * @param {NextRequest} req - 요청 객체
 * @returns {Promise<Response>} 전체 시스템 로그 반환
 */
async function getHandler(req: NextRequest) {
  const logs = await logUseCases.getAllLogs();
  return successResponse(logs);
}

export const GET = withApiHandler(getHandler, { requireAuth: true, allowedRoles: ["Admin"] });
