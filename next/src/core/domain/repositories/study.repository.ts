import { StudyDto, CreateStudyDto, UpdateStudyDto } from "../../application/dtos/study.dto";

/**
 * Study 데이터베이스 접근을 추상화한 Repository 인터페이스입니다.
 */
export interface IStudyRepository {
  /** 지정된 ID로 Study 조회 */
  findById(id: string): Promise<StudyDto | null>;
  /** 고유 슬러그(slug)로 Study 조회 */
  findBySlug(slug: string): Promise<StudyDto | null>;
  /** 전체 Study 목록 조회 */
  findAll(): Promise<StudyDto[]>;
  /** 새로운 Study 생성 */
  create(data: CreateStudyDto): Promise<StudyDto>;
  /** 지정된 Study 정보 수정 */
  update(id: string, data: UpdateStudyDto): Promise<StudyDto>;
  /** 지정된 Study 삭제 */
  delete(id: string): Promise<void>;
}
