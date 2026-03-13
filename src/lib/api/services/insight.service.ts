import { api } from "../fetcher";
import { API_CONFIG } from "../config";
import { InsightDto, CreateInsightDto, UpdateInsightDto, InsightArchiveDto, InsightTagDto, InsightNavigationDto } from "@/core/application/dtos/insight.dto";
import { INSIGHTS } from "@/data/mock";

/**
 * 인사이트 (Insight) 도메인 API 서비스
 */
export const InsightService = {
  /**
   * 전체 인사이트 목록을 조회합니다.
   */
  async getAllInsights(options?: { useMock?: boolean }): Promise<InsightDto[]> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return INSIGHTS;
    }
    return api.get<InsightDto[]>("/insights");
  },

  /**
   * 단일 인사이트를 슬러그로 조회합니다.
   */
  async getInsightBySlug(slug: string, options?: { useMock?: boolean }): Promise<InsightDto | null> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return INSIGHTS.find((i) => i.slug === slug) || null;
    }
    return api.get<InsightDto>(`/insights/${slug}`);
  },

  /**
   * 새로운 인사이트를 생성합니다.
   */
  async createInsight(data: CreateInsightDto, options?: { useMock?: boolean }): Promise<InsightDto> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newMock: InsightDto = {
        id: `i${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newMock;
    }
    return api.post<InsightDto>("/insights", data);
  },

  /**
   * 기존 인사이트를 수정합니다.
   */
  async updateInsight(slug: string, data: UpdateInsightDto, options?: { useMock?: boolean }): Promise<InsightDto> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const existing = INSIGHTS.find((i) => i.slug === slug);
      if (!existing) throw new Error("모의 데이터에서 인사이트를 찾을 수 없습니다.");
      return { ...existing, ...data, updatedAt: new Date().toISOString() };
    }
    return api.patch<InsightDto>(`/insights/${slug}`, data);
  },

  /**
   * 인사이트를 삭제합니다.
   */
  async deleteInsight(slug: string, options?: { useMock?: boolean }): Promise<void> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return;
    }
    return api.delete<void>(`/insights/${slug}`);
  },

  /**
   * 연도별 게시물 목록을 조회합니다.
   */
  async getInsightArchive(options?: { useMock?: boolean }): Promise<InsightArchiveDto[]> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      // Mock logic can be improved later
      await new Promise((resolve) => setTimeout(resolve, 300));
      return [];
    }
    return api.get<InsightArchiveDto[]>("/insights/archive");
  },

  /**
   * 태그 클라우드를 조회합니다.
   */
  async getInsightTags(options?: { useMock?: boolean }): Promise<InsightTagDto[]> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return [];
    }
    return api.get<InsightTagDto[]>("/insights/tags");
  },

  /**
   * 특정 태그를 포함한 인사이트 목록을 조회합니다.
   */
  async getInsightsByTag(tag: string, options?: { useMock?: boolean }): Promise<InsightDto[]> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return INSIGHTS.filter(i => i.tags && i.tags.includes(tag));
    }
    return api.get<InsightDto[]>(`/insights/tags?tag=${encodeURIComponent(tag)}`);
  },

  /**
   * 이전글/다음글 네비게이션을 조회합니다.
   */
  async getInsightNavigation(slug: string, options?: { useMock?: boolean }): Promise<{ prev: InsightNavigationDto | null; next: InsightNavigationDto | null }> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { prev: null, next: null };
    }
    return api.get<{ prev: InsightNavigationDto | null; next: InsightNavigationDto | null }>(`/insights/${slug}/navigation`);
  }
};
