import { IFeatureRepository } from "../../domain/repositories/feature.repository";
import { CreateFeatureDto, UpdateFeatureDto, FeatureDto } from "../dtos/feature.dto";

/**
 * 기능(Feature) 정보를 처리하는 Use Case 클래스입니다.
 */
export class FeatureUseCases {
  constructor(private readonly featureRepository: IFeatureRepository) {}

  /**
   * 지정된 슬러그(slug)로 기능 정보를 조회합니다.
   * @param {string} slug - 고유 슬러그
   * @returns {Promise<FeatureDto | null>} 조회된 기능 정보 또는 존재하지 않을 시 null 반환
   */

  async getFeatureBySlug(slug: string): Promise<FeatureDto | null> {
    return this.featureRepository.findBySlug(slug);
  }

  /**
   * 지정된 ID로 기능 정보를 조회합니다.
   * @param {string} id - 기능 ID
   * @returns {Promise<FeatureDto | null>} 조회된 기능 정보 또는 존재하지 않을 시 null 반환
   */
  async getFeatureById(id: string): Promise<FeatureDto | null> {
    return this.featureRepository.findById(id);
  }

  /**
   * 모든 기능 목록을 조회합니다.
   * @returns {Promise<FeatureDto[]>} 기능 배열 반환
   */
  async getAllFeatures(): Promise<FeatureDto[]> {
    return this.featureRepository.findAll();
  }

  /**
   * 새로운 기능을 생성합니다.
   * @param {CreateFeatureDto} data - 생성할 기능 정보
   * @returns {Promise<FeatureDto>} 생성된 기능 결과
   * @throws {Error} 슬러그가 중복되는 경우 에러 발생
   */
  async createFeature(data: CreateFeatureDto): Promise<FeatureDto> {
    const existingFeature = await this.featureRepository.findBySlug(data.slug);
    if (existingFeature) {
      throw new Error(`이미 존재하는 작업물 슬러그입니다: ${data.slug}`);
    }
    return this.featureRepository.create(data);
  }

  /**
   * 지정된 기능을 수정합니다.
   * @param {string} id - 기능 ID
   * @param {UpdateFeatureDto} data - 갱신할 내용
   * @returns {Promise<FeatureDto>} 갱신된 기능 정보 반환
   * @throws {Error} 해당 기능이 없거나 수정할 슬러그가 다른 데이터와 중복되는 경우
   */
  async updateFeature(id: string, data: UpdateFeatureDto): Promise<FeatureDto> {
    const feature = await this.featureRepository.findById(id);
    if (!feature) {
      throw new Error("작업물을 찾을 수 없습니다.");
    }
    if (data.slug && data.slug !== feature.slug) {
      const existing = await this.featureRepository.findBySlug(data.slug);
      if (existing) {
        throw new Error(`이미 존재하는 작업물 슬러그입니다: ${data.slug}`);
      }
    }
    return this.featureRepository.update(id, data);
  }

  /**
   * 지정된 기능을 삭제합니다.
   * @param {string} id - 삭제할 ID
   * @throws {Error} 존재하지 않는 ID인 경우 에러 발생
   */
  async deleteFeature(id: string): Promise<void> {
    const feature = await this.featureRepository.findById(id);
    if (!feature) {
      throw new Error("작업물을 찾을 수 없습니다.");
    }
    return this.featureRepository.delete(id);
  }
}
