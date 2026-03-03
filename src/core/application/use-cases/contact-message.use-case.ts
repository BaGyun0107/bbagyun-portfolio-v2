import { IContactMessageRepository } from "../../domain/repositories/contact-message.repository";
import { CreateContactMessageDto, ContactMessageDto, UpdateContactMessageStatusDto } from "../dtos/contact-message.dto";

/**
 * 고객 문의 메시지(Contact Message)를 처리하는 Use Case 클래스입니다.
 */
export class ContactMessageUseCases {
  constructor(private readonly contactMessageRepository: IContactMessageRepository) {}

  /**
   * 지정된 ID로 문의 메시지를 조회합니다.
   * @param {string} id - 메시지 ID
   * @returns {Promise<ContactMessageDto | null>} 문의 메시지 반환
   */

  async getMessageById(id: string): Promise<ContactMessageDto | null> {
    return this.contactMessageRepository.findById(id);
  }

  /**
   * 등록된 모든 문의 메시지 목록을 조회합니다.
   * @returns {Promise<ContactMessageDto[]>} 메시지 배열
   */
  async getAllMessages(): Promise<ContactMessageDto[]> {
    return this.contactMessageRepository.findAll();
  }

  /**
   * 새로운 문의 메시지를 등록(생성)합니다.
   * @param {CreateContactMessageDto} data - 문의 내용
   * @returns {Promise<ContactMessageDto>} 등록된 메시지 결과
   */
  async createMessage(data: CreateContactMessageDto): Promise<ContactMessageDto> {
    return this.contactMessageRepository.create(data);
  }

  /**
   * 지정된 문의 메시지를 '읽음(READ)' 상태로 변경합니다.
   * @param {string} id - 상태를 변경할 메시지 ID
   * @returns {Promise<ContactMessageDto>} 상태가 변경된 메시지 결과 반환
   * @throws {Error} 지정된 메시지가 없을 경우 에러 발생
   */
  async markAsRead(id: string): Promise<ContactMessageDto> {
    const message = await this.contactMessageRepository.findById(id);
    if (!message) {
      throw new Error("문의 메시지를 찾을 수 없습니다.");
    }
    return this.contactMessageRepository.updateStatus(id, { status: "READ" });
  }

  /**
   * 지정된 문의 메시지를 시스템에서 삭제합니다.
   * @param {string} id - 삭제할 메시지 ID
   * @throws {Error} 지정된 메시지가 없을 경우 에러 발생
   */
  async deleteMessage(id: string): Promise<void> {
    const message = await this.contactMessageRepository.findById(id);
    if (!message) {
      throw new Error("문의 메시지를 찾을 수 없습니다.");
    }
    return this.contactMessageRepository.delete(id);
  }
}
