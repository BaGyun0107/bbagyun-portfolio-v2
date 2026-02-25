import {
  ContactMessageDto,
  CreateContactMessageDto,
  UpdateContactMessageStatusDto
} from "../../application/dtos/contact-message.dto";

/**
 * 고객 문의 메시지(Contact Message) 데이터베이스 접근을 추상화한 Repository 인터페이스입니다.
 */
export interface IContactMessageRepository {
  /** 지정된 ID로 문의 메시지 조회 */
  findById(id: string): Promise<ContactMessageDto | null>;
  /** 전체 문의 내역 조회 */
  findAll(): Promise<ContactMessageDto[]>;
  /** 새로운 문의 메시지 등록 */
  create(data: CreateContactMessageDto): Promise<ContactMessageDto>;
  /**
   * 문의 메시지의 처리 상태 업데이트
   * @param {string} id - 메시지 ID
   * @param {UpdateContactMessageStatusDto} data - 변경할 상태 정보
   */
  updateStatus(id: string, data: UpdateContactMessageStatusDto): Promise<ContactMessageDto>;
  /** 지정된 문의 메시지 삭제 */
  delete(id: string): Promise<void>;
}
