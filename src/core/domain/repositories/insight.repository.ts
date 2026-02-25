import { InsightDto, CreateInsightDto, UpdateInsightDto } from "../../application/dtos/insight.dto";

/**
 * 인사이트(Insight) 게시물 데이터베이스 접근을 추상화한 Repository 인터페이스입니다.
 */
export interface IInsightRepository {
  /** 지정된 ID로 게시물 조회 */
  findById(id: string): Promise<InsightDto | null>;
  /** 고유 슬러그(slug)로 게시물 조회 */
  findBySlug(slug: string): Promise<InsightDto | null>;
  /** 전체 게시물 목록 조회 */
  findAll(): Promise<InsightDto[]>;
  /** 새로운 게시물 생성 */
  create(data: CreateInsightDto): Promise<InsightDto>;
  /** 지정된 게시물 정보 수정 */
  update(id: string, data: UpdateInsightDto): Promise<InsightDto>;
  /** 지정된 게시물 삭제 */
  delete(id: string): Promise<void>;
}
