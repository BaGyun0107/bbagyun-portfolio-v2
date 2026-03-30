/**
 * 문의 메시지 처리 상태 정의
 */
export type ContactMessageStatus = "UNREAD" | "READ" | "REPLIED";

/**
 * 문의 메시지 정보에 대한 DTO 인터페이스
 */
export interface ContactMessageDto {
  id: string;
  name: string;
  email: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: Date | string;
}

/**
 * 새로운 문의 메시지 생성을 위한 DTO
 */
export interface CreateContactMessageDto {
  name: string;
  email: string;
  message: string;
}

/**
 * 문의 메시지 상태 업데이트를 위한 DTO
 */
export interface UpdateContactMessageStatusDto {
  status: ContactMessageStatus;
}
