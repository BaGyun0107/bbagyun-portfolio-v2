import { api } from "../fetcher";
import { API_CONFIG } from "../config";
import { FeatureDto, CreateFeatureDto, UpdateFeatureDto } from "@/core/application/dtos/feature.dto";
import { FEATURES } from "@/data/mock";

/**
 * 기능 (Feature) 도메인 API 서비스
 */
export const FeatureService = {
  /**
   * 전체 기능 목록을 조회합니다.
   * @param options useMock: true 일 경우 목업 데이터를 강제 반환합니다.
   */
  async getAllFeatures(options?: { useMock?: boolean }): Promise<FeatureDto[]> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return FEATURES;
    }
    return api.get<FeatureDto[]>("/features");
  },

  /**
   * 단일 기능을 슬러그로 조회합니다.
   */
  async getFeatureBySlug(slug: string, options?: { useMock?: boolean }): Promise<FeatureDto | null> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return FEATURES.find((f) => f.slug === slug) || null;
    }
    return api.get<FeatureDto>(`/features/${slug}`);
  },

  /**
   * 새로운 기능을 생성합니다.
   */
  async createFeature(data: CreateFeatureDto, options?: { useMock?: boolean }): Promise<FeatureDto> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newMock: FeatureDto = {
        id: `f${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newMock;
    }
    return api.post<FeatureDto>("/features", data);
  },

  /**
   * 기존 기능을 수정합니다.
   */
  async updateFeature(slug: string, data: UpdateFeatureDto, options?: { useMock?: boolean }): Promise<FeatureDto> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      // 목업 수정을 모방 (실제 배열을 수정하진 않음)
      const existing = FEATURES.find((f) => f.slug === slug);
      if (!existing) throw new Error("Feature not found in mock data");
      return { ...existing, ...data, updatedAt: new Date().toISOString() };
    }
    return api.patch<FeatureDto>(`/features/${slug}`, data);
  },

  /**
   * 기능을 삭제합니다.
   */
  async deleteFeature(slug: string, options?: { useMock?: boolean }): Promise<void> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return;
    }
    return api.delete<void>(`/features/${slug}`);
  }
};
