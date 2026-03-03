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
 * /api/v1/auth/refresh:
 *   post:
 *     summary: 엑세스 토큰 갱신
 *     description: 유효한 리프레시 토큰을 사용하여 새로운 엑세스 토큰(및 리프레시 토큰)을 발급받습니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 */
/**
 * 리프레시 토큰으로 권한을 갱신하는 핸들러입니다.
 * @param {NextRequest} req - 요청 객체
 * @returns {Promise<Response>} API 기본 응답
 */
async function refreshHandler(req: NextRequest) {
  let refreshToken: string | null = null;
  const cookieStore = await cookies();

  // 1. Check body (if posted)
  if (req.headers.get("content-type")?.includes("application/json")) {
    try {
      const body = await req.json();
      refreshToken = body.refreshToken || null;
    } catch {
      // ignore
    }
  }

  // 2. Check cookies
  if (!refreshToken) {
    refreshToken = cookieStore.get("refreshToken")?.value || null;
  }

  if (!refreshToken) {
    return errorResponse("리프레시 토큰은 필수 항목입니다.", 400);
  }

  const result = await authUseCases.refresh(refreshToken);
  
  const isProd = process.env.NODE_ENV === "production";

  // 새 accessToken 쿠키 갱신
  cookieStore.set("accessToken", result.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10분
  });

  // 새 refreshToken 쿠키 갱신 (Rotation)
  cookieStore.set("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: 60 * 60 * 24 * 7, // 7일
  });

  // csrfToken 갱신
  const csrfToken = crypto.randomUUID();
  cookieStore.set("csrfToken", csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return successResponse({ user: result.user, csrfToken }, "Token refreshed successfully");
}

export const POST = withApiHandler(refreshHandler);
