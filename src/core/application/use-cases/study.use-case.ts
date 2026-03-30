import { IStudyRepository } from "../../domain/repositories/study.repository";
import { CreateStudyDto, UpdateStudyDto, StudyDto } from "../dtos/study.dto";

/**
 * Study 정보를 처리하는 Use Case 클래스입니다.
 */
export class StudyUseCases {
  constructor(private readonly studyRepository: IStudyRepository) {}

  /**
   * 지정된 슬러그(slug)로 Study 정보를 조회합니다.
   */
  async getStudyBySlug(slug: string): Promise<StudyDto | null> {
    return this.studyRepository.findBySlug(slug);
  }

  /**
   * 지정된 ID로 Study 정보를 조회합니다.
   */
  async getStudyById(id: string): Promise<StudyDto | null> {
    return this.studyRepository.findById(id);
  }

  /**
   * 모든 Study 목록을 조회합니다.
   */
  async getAllStudies(): Promise<StudyDto[]> {
    return this.studyRepository.findAll();
  }

  /**
   * 새로운 Study를 생성합니다.
   */
  async createStudy(data: CreateStudyDto): Promise<StudyDto> {
    const existingStudy = await this.studyRepository.findBySlug(data.slug);
    if (existingStudy) {
      throw new Error(`이미 존재하는 Study 슬러그입니다: ${data.slug}`);
    }
    return this.studyRepository.create(data);
  }

  /**
   * 지정된 Study를 수정합니다.
   */
  async updateStudy(id: string, data: UpdateStudyDto): Promise<StudyDto> {
    const study = await this.studyRepository.findById(id);
    if (!study) {
      throw new Error("Study를 찾을 수 없습니다.");
    }
    if (data.slug && data.slug !== study.slug) {
      const existing = await this.studyRepository.findBySlug(data.slug);
      if (existing) {
        throw new Error(`이미 존재하는 Study 슬러그입니다: ${data.slug}`);
      }
    }
    return this.studyRepository.update(id, data);
  }

  /**
   * 지정된 Study를 삭제합니다.
   */
  async deleteStudy(id: string): Promise<void> {
    const study = await this.studyRepository.findById(id);
    if (!study) {
      throw new Error("Study를 찾을 수 없습니다.");
    }
    return this.studyRepository.delete(id);
  }
}
