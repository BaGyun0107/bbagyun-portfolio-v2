import { api } from "../fetcher";
import { API_CONFIG } from "../config";
import { StudyDto, CreateStudyDto, UpdateStudyDto } from "@/core/application/dtos/study.dto";

// 임시 모의 데이터
const STUDIES: StudyDto[] = [
  {
    id: "s1",
    slug: "clean-architecture-study",
    title: "클린 아키텍처 스터디",
    description: "NestJS, Next.js 환경에서의 클린 아키텍처 도입과 설계 원칙 리뷰",
    iconName: "BookOpen",
    category: "Architecture",
    techStack: ["Node.js", "Clean Architecture", "TypeScript"],
    status: "Published",
    overview: "개인적으로 진행한 클린 아키텍처 패턴 분석 및 실무 적용 방안 연구 내용입니다.",
    period: "2026.01 - 2026.02",
    content: "상세 스터디 내용...",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const StudyService = {
  async getAllStudies(options?: { useMock?: boolean }): Promise<StudyDto[]> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return STUDIES;
    }
    return api.get<StudyDto[]>("/studies");
  },

  async getStudyBySlug(slug: string, options?: { useMock?: boolean }): Promise<StudyDto | null> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return STUDIES.find((s) => s.slug === slug) || null;
    }
    return api.get<StudyDto>(`/studies/${slug}`);
  },

  async createStudy(data: CreateStudyDto, options?: { useMock?: boolean }): Promise<StudyDto> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newMock: StudyDto = {
        id: `s${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newMock;
    }
    return api.post<StudyDto>("/studies", data);
  },

  async updateStudy(slug: string, data: UpdateStudyDto, options?: { useMock?: boolean }): Promise<StudyDto> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const existing = STUDIES.find((s) => s.slug === slug);
      if (!existing) throw new Error("모의 데이터에서 Study를 찾을 수 없습니다.");
      return { ...existing, ...data, updatedAt: new Date().toISOString() };
    }
    return api.patch<StudyDto>(`/studies/${slug}`, data);
  },

  async deleteStudy(slug: string, options?: { useMock?: boolean }): Promise<void> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return;
    }
    return api.delete<void>(`/studies/${slug}`);
  }
};
