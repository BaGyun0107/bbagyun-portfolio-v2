import { IInsightRepository } from "../../domain/repositories/insight.repository";
import { CreateInsightDto, UpdateInsightDto, InsightDto } from "../dtos/insight.dto";

/**
 * 인사이트(Insight) 게시물 정보를 처리하는 Use Case 클래스입니다.
 */
export class InsightUseCases {
  constructor(private readonly insightRepository: IInsightRepository) {}

  /**
   * 지정된 슬러그(slug)로 인사이트 게시물을 조회합니다.
   * @param {string} slug - 고유 슬러그
   * @returns {Promise<InsightDto | null>} 조회된 게시물 정보 또는 존재하지 않을 시 null 반환
   */

  async getInsightBySlug(slug: string): Promise<InsightDto | null> {
    return this.insightRepository.findBySlug(slug);
  }

  /**
   * 지정된 ID로 인사이트 게시물을 조회합니다.
   * @param {string} id - 게시물 ID
   * @returns {Promise<InsightDto | null>} 조회된 게시물 정보 또는 존재하지 않을 시 null 반환
   */
  async getInsightById(id: string): Promise<InsightDto | null> {
    return this.insightRepository.findById(id);
  }

  /**
   * 모든 인사이트 게시물 목록을 조회합니다.
   * @returns {Promise<InsightDto[]>} 인사이트 게시물 배열 반환
   */
  async getAllInsights(): Promise<InsightDto[]> {
    return this.insightRepository.findAll();
  }

  /**
   * 새로운 인사이트 게시물을 생성합니다.
   * @param {CreateInsightDto} data - 생성할 인사이트 정보
   * @returns {Promise<InsightDto>} 생성된 게시물 결과
   * @throws {Error} 슬러그가 중복되는 경우 에러 발생
   */
  async createInsight(data: CreateInsightDto): Promise<InsightDto> {
    const existing = await this.insightRepository.findBySlug(data.slug);
    if (existing) {
      throw new Error(`이미 존재하는 인사이트 슬러그입니다: ${data.slug}`);
    }
    return this.insightRepository.create(data);
  }

  /**
   * 지정된 인사이트 게시물을 수정합니다.
   * @param {string} id - 게시물 ID
   * @param {UpdateInsightDto} data - 갱신할 내용
   * @returns {Promise<InsightDto>} 갱신된 게시물 정보 반환
   * @throws {Error} 해당 게시물이 없거나 수정할 슬러그가 다른 데이터와 중복되는 경우
   */
  async updateInsight(id: string, data: UpdateInsightDto): Promise<InsightDto> {
    const insight = await this.insightRepository.findById(id);
    if (!insight) {
      throw new Error("인사이트를 찾을 수 없습니다.");
    }
    if (data.slug && data.slug !== insight.slug) {
      const existing = await this.insightRepository.findBySlug(data.slug);
      if (existing) {
        throw new Error(`이미 존재하는 인사이트 슬러그입니다: ${data.slug}`);
      }
    }
    return this.insightRepository.update(id, data);
  }

  /**
   * 지정된 인사이트 게시물을 삭제합니다.
   * @param {string} id - 삭제할 ID
   * @throws {Error} 존재하지 않는 ID인 경우 에러 발생
   */
  async deleteInsight(id: string): Promise<void> {
    const insight = await this.insightRepository.findById(id);
    if (!insight) {
      throw new Error("인사이트를 찾을 수 없습니다.");
    }
    return this.insightRepository.delete(id);
  }
}
