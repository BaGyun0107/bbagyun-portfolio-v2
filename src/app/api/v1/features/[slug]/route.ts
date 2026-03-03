import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse, errorResponse } from "@/core/application/utils/api-response.util";
import { FeatureUseCases } from "@/core/application/use-cases/feature.use-case";
import { FeaturePrismaRepository } from "@/infrastructure/repositories/feature-prisma.repository";

const featureUseCases = new FeatureUseCases(new FeaturePrismaRepository());

/**
 * @swagger
 * /api/v1/features/{slug}:
 *   get:
 *     summary: 슬러그로 기능(Feature) 조회
 *     tags: [Features]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 조회 성공
 *   patch:
 *     summary: 기능(Feature) 수정
 *     tags: [Features]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: 수정 성공
 *   delete:
 *     summary: 기능(Feature) 삭제
 *     tags: [Features]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 삭제 성공
 */
/**
 * 슬러그 값을 기반으로 기능 게시물을 가져오는 핸들러입니다.
 * @param {NextRequest} req - 요청 객체
 * @param {Object} params - 경로 파라미터 (slug 포함)
 * @returns {Promise<Response>} 정보 응답 반환
 */
async function getHandler(req: NextRequest, params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const feature = await featureUseCases.getFeatureBySlug(slug);
  if (!feature) {
    return errorResponse("작업물을 찾을 수 없습니다.", 404);
  }
  return successResponse(feature);
}

/**
 * 슬러그 값을 기반으로 기능 게시물을 수정하는 핸들러입니다.
 * @param {NextRequest} req - 요청 객체
 * @param {Object} params - 경로 파라미터 (slug 포함)
 * @returns {Promise<Response>} 갱신 응답 반환
 */
async function patchHandler(req: NextRequest, params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const feature = await featureUseCases.getFeatureBySlug(slug);
  if (!feature) {
    return errorResponse("작업물을 찾을 수 없습니다.", 404);
  }

  const body = await req.json();
  const updatedFeature = await featureUseCases.updateFeature(feature.id, body);
  return successResponse(updatedFeature, "Feature updated successfully");
}

/**
 * 슬러그 값을 기반으로 기능 게시물을 삭제하는 핸들러입니다.
 * @param {NextRequest} req - 요청 객체
 * @param {Object} params - 경로 파라미터 (slug 포함)
 * @returns {Promise<Response>} 삭제 결과 응답 반환
 */
async function deleteHandler(req: NextRequest, params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const feature = await featureUseCases.getFeatureBySlug(slug);
  if (!feature) {
    return errorResponse("작업물을 찾을 수 없습니다.", 404);
  }

  await featureUseCases.deleteFeature(feature.id);
  return successResponse(null, "Feature deleted successfully");
}

const adminOptions = { requireAuth: true, allowedRoles: ["Admin", "Editor"] };

export const GET = withApiHandler(getHandler);
export const PATCH = withApiHandler(patchHandler, adminOptions);
export const DELETE = withApiHandler(deleteHandler, adminOptions);
