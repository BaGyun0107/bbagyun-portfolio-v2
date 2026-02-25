/**
 * API 설정 상수 관리 파일
 * 환경 변수 통합 및 기본 API 설정값 정의
 */

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== "undefined") return "/api/v1";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api/v1`;
  return "http://127.0.0.1:1104/api/v1";
};

export const API_CONFIG = {
  // 환경변수가 문자열 "true"일 때만 true 로 파싱, 없으면 기본적으로 false
  USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK_API === "true",
  BASE_URL: getBaseUrl(),
};
