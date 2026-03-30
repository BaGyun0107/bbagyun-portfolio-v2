import { FeatureDto, CreateFeatureDto, UpdateFeatureDto } from "../../application/dtos/feature.dto";

/**
 * 기능(Feature) 데이터베이스 접근을 추상화한 Repository 인터페이스입니다.
 */
export interface IFeatureRepository {
  /** 지정된 ID로 기능 게시물 조회 */
  findById(id: string): Promise<FeatureDto | null>;
  /** 고유 슬러그(slug)로 기능 게시물 조회 */
  findBySlug(slug: string): Promise<FeatureDto | null>;
  /** 전체 기능 게시물 목록 조회 */
  findAll(): Promise<FeatureDto[]>;
  /** 새로운 기능 게시물 생성 */
  create(data: CreateFeatureDto): Promise<FeatureDto>;
  /** 지정된 기능 게시물 정보 수정 */
  update(id: string, data: UpdateFeatureDto): Promise<FeatureDto>;
  /** 지정된 기능 게시물 삭제 */
  delete(id: string): Promise<void>;
}
