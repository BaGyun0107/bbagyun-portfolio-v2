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
 * /api/v1/auth/login:
 *   post:
 *     summary: 사용자 로그인 및 토큰 발급
 *     description: 이메일과 비밀번호로 인증하고 JWT 토큰(Access, Refresh)과 CSRF 토큰을 발급합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공 및 토큰 반환
 */
/**
 * 이메일/비밀번호 기반 로그인을 처리하는 핸들러입니다.
 * 성공 시 accessToken(HttpOnly), refreshToken(HttpOnly), csrfToken(JS readable) 쿠키를 모두 세팅합니다.
 * @param {NextRequest} req - 요청 객체
 * @returns {Promise<Response>} API 기본 응답
 */
async function loginHandler(req: NextRequest) {
  const body = await req.json();
  if (!body.email) {
    return errorResponse("Email is required", 400);
  }
  if (!body.password) {
    return errorResponse("Password is required", 400);
  }

  const result = await authUseCases.login(body.email, body.password);

  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  
  // 1. accessToken: HttpOnly, 10분 유효
  cookieStore.set("accessToken", result.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10분
  });

  // 2. refreshToken: HttpOnly, 7일 유효 (Rotation을 위해 /api/v1/auth/refresh 경로에서만 전송)
  cookieStore.set("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: 60 * 60 * 24 * 7, // 7일
  });

  // 3. csrfToken: JS에서 읽을 수 있게 httpOnly: false, 10분 유효
  const csrfToken = crypto.randomUUID();
  cookieStore.set("csrfToken", csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10분 (accessToken과 동일 생명주기)
  });

  return successResponse({ user: result.user, csrfToken }, "Login successful");
}

export const POST = withApiHandler(loginHandler);
