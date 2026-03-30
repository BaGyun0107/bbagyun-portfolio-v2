import { NextResponse } from "next/server";

/**
 * API 공통 응답 구조를 정의하는 인터페이스입니다.
 * @template T - 유효 데이터의 타입
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
  error?: unknown;
}

/**
 * 항상 HTTP 200 상태 코드를 반환하지만, 
 * `success`와 `code` 필드를 사용하여 논리적인 결과를 전달하는 표준 JSON 응답 객체를 생성합니다.
 * @param {Object} params - 생성 옵션
 * @param {boolean} params.success - 성공 여부
 * @param {number} [params.code] - 논리적 응답 코드
 * @param {string} [params.message] - 클라이언트에게 전달할 메시지
 * @param {T} [params.data] - 실제 데이터 본문
 * @param {any} [params.error] - 발생한 에러 정보
 * @returns {NextResponse} 포맷팅된 JSON 응답
 */
export function createResponse<T>(params: {
  success: boolean;
  code?: number;
  message?: string;
  data?: T;
  error?: unknown;
}) {
  const code = params.code ?? (params.success ? 200 : 400);
  const message = params.message ?? (params.success ? "Success" : "Error");
  
  const body: ApiResponse<T> = {
    success: params.success,
    code,
    message,
    ...(params.data !== undefined && { data: params.data }),
    ...(params.error !== undefined && { error: params.error }),
  };

  return NextResponse.json(body, { status: 200 });
}

/**
 * 성공적인 API 응답을 생성하는 헬퍼 함수입니다.
 * @param {T} [data] - 반환할 데이터
 * @param {string} [message="Success"] - 성공 메시지
 * @param {number} [code=200] - 논리적 상태 코드
 * @returns {NextResponse} 포맷팅된 상태 200 응답 객체
 */
export function successResponse<T>(data?: T, message = "Success", code = 200) {
  return createResponse({ success: true, code, message, data });
}

/**
 * 에러 내용을 포함하는 API 응답을 생성하는 헬퍼 함수입니다. (HTTP 200 반환, success=false)
 * @param {string} message - 에러 메시지
 * @param {number} [code=400] - 논리적 에러 상태 코드
 * @param {any} [error] - 더 자세한 에러 정보 (선택 사항)
 * @returns {NextResponse} 포맷팅된 응답 객체
 */
export function errorResponse(message: string, code = 400, error?: unknown) {
  return createResponse({ success: false, code, message, error });
}
