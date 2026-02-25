import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/application/middlewares/api-handler";
import { successResponse, errorResponse } from "@/core/application/utils/api-response.util";
import { AuthUseCases } from "@/core/application/use-cases/auth.use-case";
import { UserPrismaRepository } from "@/infrastructure/repositories/user-prisma.repository";
import { RefreshTokenPrismaRepository } from "@/infrastructure/repositories/refresh-token-prisma.repository";
import { cookies } from "next/headers";

const authUseCases = new AuthUseCases(
  new UserPrismaRepository(),
  new RefreshTokenPrismaRepository()
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: 사용자 로그아웃
 *     description: 인증된 사용자의 모든 리프레시 토큰을 무효화(삭제)합니다.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 */
import { TokenPayload } from "@/core/application/utils/jwt.util";

/**
 * 로그아웃을 처리하는 핸들러입니다.
 * @param {NextRequest} req - 요청 객체
 * @param {unknown} params - 경로 파라미터 미사용
 * @param {TokenPayload} [user] - api-handler 미들웨어에서 주입된 인증된 사용자 정보
 * @returns {Promise<Response>} API 기본 응답
 */
async function logoutHandler(req: NextRequest, params: unknown, user?: TokenPayload) {
  if (!user || !user.userId) {
    return errorResponse("User context missing", 401);
  }

  await authUseCases.logout(user.userId);

  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  cookieStore.delete("csrfToken");

  return successResponse(null, "Logged out successfully");
}

export const POST = withApiHandler(logoutHandler, { requireAuth: true });
