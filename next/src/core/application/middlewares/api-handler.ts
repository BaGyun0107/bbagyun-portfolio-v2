import { NextRequest } from "next/server";
import { LogPrismaRepository } from "@/infrastructure/repositories/log-prisma.repository";
import { errorResponse } from "@/core/application/utils/api-response.util";
import { JwtUtil, TokenPayload } from "@/core/application/utils/jwt.util";
import { logger } from "@/lib/utils/logger";
import { LogMethod } from "@/core/application/dtos/log.dto";

import { cookies } from "next/headers";

type HandlerWithUser<P = unknown> = (
  req: NextRequest,
  params: P,
  user?: TokenPayload
) => Promise<Response>;

interface HandlerOptions {
  requireAuth?: boolean;
  allowedRoles?: string[];
}

const logRepository = new LogPrismaRepository();

/**
 * Next.js API 라우트 핸들러를 래핑하는 고차 함수입니다.
 * 에러 처리, 성공/실패 응답 포맷팅, 인증/인가 및 시스템 로그(SystemLog) 적재를 처리합니다.
 * @param {HandlerWithUser} handler - 실제 로직을 수행할 API 라우트 핸들러 함수
 * @param {HandlerOptions} [options] - 인증 및 권한 확인을 위한 옵션
 * @returns {Promise<Response>} 래핑된 API 핸들러 함수를 반환합니다.
 */
export function withApiHandler<P = unknown>(handler: HandlerWithUser<P>, options?: HandlerOptions) {
  return async (req: NextRequest, { params }: { params: P }): Promise<Response> => {
    const startTime = Date.now();
    let response: Response;
    let logicalStatus = 200;
    let requestBody: unknown = null;
    let user: TokenPayload | null = null;
    let errorMessage: string | null = null;

    try {
      // 1. 로깅을 위해 본문(Request Body) 파싱 시도 (GET 요청 제외)
      if (req.method !== "GET" && req.headers.get("content-type")?.includes("application/json")) {
        // 원본 핸들러가 JSON을 다시 읽을 수 있도록 요청을 복제
        const clonedReq = req.clone();
        try {
          requestBody = await clonedReq.json();
        } catch (_e) {
          // ignore or handle invalid json
        }
      }

      // 2. 읽기 전용 모드: 콘텐츠 CRUD만 차단 (실제 DB 연결 시 READONLY_MODE=false로 변경)
      const isReadOnly = process.env.READONLY_MODE !== 'false';
      const isMutationMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
      const readonlyPaths = ['/api/v1/features', '/api/v1/insights', '/api/v1/studies', '/api/v1/users', '/api/v1/settings'];
      const isProtectedPath = readonlyPaths.some(p => req.nextUrl.pathname.startsWith(p));
      if (isReadOnly && isMutationMethod && isProtectedPath) {
        logicalStatus = 403;
        throw new Error('현재 읽기 전용 모드입니다. 데이터 변경이 비활성화되어 있습니다.');
      }

      // 3. 인증(Authentication) 및 인가(Authorization) 처리
      if (options?.requireAuth) {
        const authHeader = req.headers.get("authorization");
        let token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

        if (!token) {
          const cookieStore = await cookies();
          token = cookieStore.get("accessToken")?.value || null;
        }

        if (!token) {
          logicalStatus = 401;
          throw new Error("인증 실패: 토큰이 누락되었습니다.");
        }

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          user = JwtUtil.verifyAccessToken(token) as TokenPayload;
        } catch (_err) {
          logicalStatus = 401;
          throw new Error("인증 실패: 유효하지 않거나 만료된 토큰입니다.");
        }

        if (options.allowedRoles && options.allowedRoles.length > 0) {
          if (!user || !options.allowedRoles.includes(user.role)) {
            logicalStatus = 403;
            throw new Error("권한 없음: 관리자 권한이 필요합니다.");
          }
        }
      }

      // 4. 실제 핸들러 실행
      response = await handler(req, params, user || undefined);
      
      // 가능하면 응답 본문에서 논리적 상태 코드를 파싱 시도 (기본값 200)
      const clonedResponse = response.clone();
      try {
        const data = await clonedResponse.json();
        if (data && data.code) {
          logicalStatus = data.code;
        }
      } catch(_e) {}
      
    } catch (error) {
      logicalStatus = logicalStatus === 200 ? 500 : logicalStatus;
      const err = error as Error;
      errorMessage = err.message || "Internal Server Error";
      response = errorResponse(errorMessage || "Unknown Error", logicalStatus);
    }

    // 4. 비동기식으로 로그 기록 (서버리스 환경에서는 await가 필요하므로 블로킹 구조 유지)
    const latency = Date.now() - startTime;
    
    // JSON인 경우에만 로깅을 위해 응답 본문 파싱 시도
    let responseBody: unknown = null;
    if (response.headers.get("content-type")?.includes("application/json")) {
      const respClone = response.clone();
      try {
        responseBody = await respClone.json();
      } catch(_e) {}
    }

    const logData = {
      method: (req.method as LogMethod) || "UNKNOWN",
      path: req.nextUrl.pathname,
      status: logicalStatus,
      latency,
      requestData: requestBody ? JSON.stringify(requestBody) : undefined,
      responseData: responseBody ? JSON.stringify(responseBody) : undefined,
      errorMessage: errorMessage || undefined,
    };

    try {
      // 1. Winston 파일 로깅 (모든 요청 기록)
      if (logicalStatus >= 400) {
        logger.error(`[API ERR] ${req.method} ${req.nextUrl.pathname}`, logData);
      } else {
        logger.info(`[API REQ] ${req.method} ${req.nextUrl.pathname}`, logData);
      }

      // 2. 조건부 DB 로깅 (에러 상태이거나, POST/PUT/DELETE 등 상태 변경 요청인 경우에만)
      const isMutation = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);
      if (logicalStatus >= 400 || isMutation) {
        await logRepository.create(logData);
      }
    } catch (logError) {
      console.error("Failed to insert log", logError);
    }

    return response;
  };
}
