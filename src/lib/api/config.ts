/**
 * API 설정 상수 관리 파일
 * 환경 변수 통합 및 기본 API 설정값 정의
 */

const getBaseUrl = () => {
  // 1. 클라이언트 사이드 (브라우저): 항상 상대경로 사용 (동일 도메인)
  if (typeof window !== "undefined") return "/api/v1";

  // 2. 서버 사이드 SSR: 내부 localhost 로 직접 호출 (외부 도메인 왕복 제거)
  //    SERVER_INTERNAL_URL: 서버의 .env 에서 설정 (예: http://127.0.0.1:3000)
  //    없을 경우 로컬 개발 기본 포트(1104)로 폴백
  if (process.env.SERVER_INTERNAL_URL) return `${process.env.SERVER_INTERNAL_URL}/api/v1`;

  // 3. Vercel 환경
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api/v1`;

  // 4. 로컬 개발 기본값
  return "http://127.0.0.1:1104/api/v1";
};

export const API_CONFIG = {
  // 환경변수가 문자열 "true"일 때만 true 로 파싱, 없으면 기본적으로 false
  USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK_API === "true",
  BASE_URL: getBaseUrl(),
};
