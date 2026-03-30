/**
 * 사용자 역할(Role) 정의
 */
export type UserRole = "Admin" | "Editor" | "Viewer";

/**
 * 사용자 계정 상태 정의
 */
export type UserStatus = "Active" | "Inactive";

/**
 * 사용자 정보에 대한 DTO 인터페이스
 */
export interface UserDto {
  id: string;
  name: string;
  password?: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 새로운 사용자 생성을 위한 DTO
 */
export interface CreateUserDto {
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
}

/**
 * 기존 사용자 수정을 위한 DTO
 */
export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  lastLogin?: Date | string;
}
