import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse, errorResponse } from "@/core/application/utils/api-response.util";
import { FeatureUseCases } from "@/core/application/use-cases/feature.use-case";
import { FeaturePrismaRepository } from "@/infrastructure/repositories/feature-prisma.repository";

const featureUseCases = new FeatureUseCases(new FeaturePrismaRepository());

/**
 * @swagger
 * /api/v1/features:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slug:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               iconName:
 *                 type: string
 *               category:
 *                 type: string
 *               techStack:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 기능에 사용된 기술 스택 목록
 *                 example: ["React", "TypeScript"]
 *               status:
 *                 type: string
 *                 description: '기능의 현재 상태 (예: "개발 중", "완료")'
 *                 example: '개발 중'
 *               overview:
 *                 type: string
 *                 description: '기능의 상세 개요'
 *                 example: '이 기능은 사용자 경험을 향상시키기 위해 개발되었습니다.'
 *     responses:
 *       201:
 *         description: 기능 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feature'
 *       400:
 *         description: 필수 필드 누락 오류 또는 잘못된 요청 데이터
 *       401:
 *         description: 인증되지 않은 요청입니다.
 *       403:
 *         description: 권한이 없습니다.
 *       500:
 *         description: 서버 오류
 */
/**
 * 모든 기능 파트 목록을 반환하는 핸들러입니다.
 * @param {NextRequest} req - 요청 객체
 * @returns {Promise<Response>} 해당 데이터를 포함하는 API 응답
 */
async function getHandler(req: NextRequest) {
  const features = await featureUseCases.getAllFeatures();
  return successResponse(features);
}

/**
 * 새로운 기능 파트를 데이터베이스에 생성하는 핸들러입니다.
 * @param {NextRequest} req - 요청 객체 (생성할 데이터 포함)
 * @returns {Promise<Response>} 성공 결과와 생성된 내용 반환
 */
async function postHandler(req: NextRequest) {
  const body = await req.json();
  const requiredFields = ["slug", "title", "description", "iconName", "category", "techStack", "status", "overview"];
  const missing = requiredFields.filter(field => !body[field]);
  
  if (missing.length > 0) {
    return errorResponse(`필수 항목이 누락되었습니다: ${missing.join(", ")}`, 400);
  }

  const newFeature = await featureUseCases.createFeature(body);
  return successResponse(newFeature, "Feature created successfully", 201);
}

// GET 요청은 공개 엔드포인트이며, POST 요청은 관리자(Admin, Editor)만 접근 가능합니다.
export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler, { requireAuth: true, allowedRoles: ["Admin", "Editor"] });
