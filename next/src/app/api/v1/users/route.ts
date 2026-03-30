import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse, errorResponse } from "@/core/application/utils/api-response.util";
import { UserUseCases } from "@/core/application/use-cases/user.use-case";
import { UserPrismaRepository } from "@/infrastructure/repositories/user-prisma.repository";

const userUseCases = new UserUseCases(new UserPrismaRepository());

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: 전체 사용자 목록 조회
 *     description: 시스템에 등록된 모든 사용자를 조회합니다. 관리자(Admin) 권한이 필요합니다.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공적인 조회
 *   post:
 *     summary: 새로운 사용자 생성
 *     description: 시스템에 새로운 사용자를 등록합니다. 관리자(Admin) 권한이 필요합니다.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *         description: 사용자 생성 성공
 */
/**
 * 전체 사용자 목록을 반환하는 핸들러입니다.
 * @param {NextRequest} req - 요청 객체
 * @returns {Promise<Response>} 전체 사용자 배열을 포함한 응답
 */
async function getHandler(req: NextRequest) {
  const users = await userUseCases.getAllUsers();
  return successResponse(users);
}

/**
 * 새로운 사용자를 추가하는 로직을 처리하는 핸들러입니다.
 * @param {NextRequest} req - 요청 객체 (본문에 사용자 정보 포함)
 * @returns {Promise<Response>} 생성 결과 반환
 */
async function postHandler(req: NextRequest) {
  const body = await req.json();
  if (!body.name || !body.email || !body.role) {
    return errorResponse("필수 항목이 누락되었습니다.", 400);
  }
  const newUser = await userUseCases.createUser(body);
  return successResponse(newUser, "User created successfully", 201);
}

const adminOptions = { requireAuth: true, allowedRoles: ["Admin"] };

export const GET = withApiHandler(getHandler, adminOptions);
export const POST = withApiHandler(postHandler, adminOptions);
