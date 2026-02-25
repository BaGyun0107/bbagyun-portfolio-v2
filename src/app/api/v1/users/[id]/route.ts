import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse, errorResponse } from "@/core/application/utils/api-response.util";
import { UserUseCases } from "@/core/application/use-cases/user.use-case";
import { UserPrismaRepository } from "@/infrastructure/repositories/user-prisma.repository";

const userUseCases = new UserUseCases(new UserPrismaRepository());

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: 특정 사용자 정보 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 조회 성공
 *   put:
 *     summary: 특정 사용자 정보 수정
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: 수정 성공
 *   delete:
 *     summary: 특정 사용자 삭제
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 삭제 성공
 */
/**
 * 지정된 ID의 사용자 정보를 조회하는 핸들러입니다.
 * @param {NextRequest} req - 요청 객체
 * @param {Object} params - 경로 파라미터 (id 포함)
 * @returns {Promise<Response>} 사용자 데이터 응답
 */
async function getHandler(req: NextRequest, params: Promise<{ id: string }>) {
  const { id } = await params;
  const user = await userUseCases.getUser(id);
  if (!user) {
    return errorResponse("User not found", 404);
  }
  return successResponse(user);
}

/**
 * 지정된 ID의 사용자 정보를 수정하는 핸들러입니다.
 * @param {NextRequest} req - 요청 객체
 * @param {Object} params - 경로 파라미터 (id 포함)
 * @returns {Promise<Response>} 수정된 사용자 데이터 응답
 */
async function putHandler(req: NextRequest, params: Promise<{ id: string }>) {
  const { id } = await params;
  const body = await req.json();
  const updatedUser = await userUseCases.updateUser(id, body);
  return successResponse(updatedUser, "User updated successfully");
}

/**
 * 지정된 ID의 사용자를 식제하는 핸들러입니다.
 * @param {NextRequest} req - 요청 객체
 * @param {Object} params - 경로 파라미터 (id 포함)
 * @returns {Promise<Response>} 기본 응답
 */
async function deleteHandler(req: NextRequest, params: Promise<{ id: string }>) {
  const { id } = await params;
  await userUseCases.deleteUser(id);
  return successResponse(null, "User deleted successfully");
}

const adminOptions = { requireAuth: true, allowedRoles: ["Admin"] };

export const GET = withApiHandler(getHandler, adminOptions);
export const PUT = withApiHandler(putHandler, adminOptions);
export const DELETE = withApiHandler(deleteHandler, adminOptions);
