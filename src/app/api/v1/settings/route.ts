import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse } from "@/core/application/utils/api-response.util";
import { SystemSettingsUseCases } from "@/core/application/use-cases/system-setting.use-case";
import { SystemSettingsPrismaRepository } from "@/infrastructure/repositories/system-setting-prisma.repository";

const systemSettingsUseCases = new SystemSettingsUseCases(new SystemSettingsPrismaRepository());

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     summary: 시스템 설정 조회
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: 데이터 정상 반환
 *   put:
 *     summary: 시스템 설정 수정
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               siteName:
 *                 type: string
 *               seoDescription:
 *                 type: string
 *               maintenanceMode:
 *                 type: boolean
 *               analyticsEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 수정 성공
 */
/**
 * 저장된 시스템 설정값을 조회하는 핸들러입니다.
 * @param {NextRequest} req - 요청 객체
 * @returns {Promise<Response>} 시스템 설정 정보 응답 반환
 */
async function getHandler(req: NextRequest) {
  const settings = await systemSettingsUseCases.getSettings();
  return successResponse(settings);
}

/**
 * 전역적인 시스템 설정을 변경하는 핸들러입니다.
 * @param {NextRequest} req - 요청 객체
 * @returns {Promise<Response>} 시스템 설정이 갱신된 결과 반환
 */
async function putHandler(req: NextRequest) {
  const body = await req.json();
  const updated = await systemSettingsUseCases.updateSettings(body);
  return successResponse(updated, "Settings updated successfully");
}

export const GET = withApiHandler(getHandler);
export const PUT = withApiHandler(putHandler, { requireAuth: true, allowedRoles: ["Admin"] });
