import { API_CONFIG } from "./config";
import { toast } from "sonner";

/**
 * 프론트엔드 공통 API Fetcher 유틸리티
 */
export const api = {
  /**
   * 공통 Fetch 로직 및 응답 에러 핸들링
   * @param endpoint API 엔드포인트 주소 (예: '/features')
   * @param options RequestInit 옵션 객체
   */
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    // 추가할 공용 헤더 설정
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> || {})
    };

    const response = await fetch(url, { ...options, headers });

    // 응답 상태 파싱 연동 (api-response.util 양식 따름)
    const json = await response.json().catch(() => null);

    // HTTP 레벨 에러 검사 (일부 환경에선 실제 HTTP 에러가 날 수 있음)
    if (!response.ok) {
      if (response.status === 403 || json?.message?.includes("Forbidden: Insufficient permissions")) {
        toast.error("권한이 없습니다.", { description: "해당 기능을 수행할 권한이 존재하지 않습니다." });
        throw new Error("권한이 없습니다.");
      }

      const errorMsg = json?.message || json?.errorMessage || response.statusText || "알 수 없는 오류가 발생했습니다.";
      throw new Error(errorMsg);
    }

    // ⚠️ API가 HTTP 200을 항상 반환하는 설계이므로 success 필드를 추가로 확인
    if (json && json.success === false) {
      if (json?.message?.includes("Forbidden: Insufficient permissions")) {
        toast.error("권한이 없습니다.", { description: "해당 기능을 수행할 권한이 존재하지 않습니다." });
        throw new Error("권한이 없습니다.");
      }

      const errorMsg = json.message || json.errorMessage || "서버 오류가 발생했습니다.";
      throw new Error(errorMsg);
    }

    // 서버의 response.data 항목이 있는 경우 해당 값만 추출
    if (json && 'data' in json) {
        return json.data as T;
    }

    // 만약 래핑되지 않은 응답이라면 그대로 반환
    return json as T;
  },

  get<T>(endpoint: string, options?: Omit<RequestInit, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body: unknown, options?: Omit<RequestInit, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
  },

  put<T>(endpoint: string, body: unknown, options?: Omit<RequestInit, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
  },

  patch<T>(endpoint: string, body: unknown, options?: Omit<RequestInit, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
  },

  delete<T>(endpoint: string, options?: Omit<RequestInit, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
