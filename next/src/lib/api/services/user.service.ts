import { api } from "../fetcher";
import { API_CONFIG } from "../config";
import { UserDto, CreateUserDto, UpdateUserDto } from "@/core/application/dtos/user.dto";
import { USERS } from "@/data/mock";

/**
 * 사용자 (User) 도메인 API 서비스
 */
export const UserService = {
  /**
   * 전체 사용자 목록을 조회합니다.
   */
  async getAllUsers(options?: { useMock?: boolean }): Promise<UserDto[]> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return USERS;
    }
    return api.get<UserDto[]>("/users");
  },

  /**
   * 단일 사용자를 ID로 조회합니다.
   */
  async getUserById(id: string, options?: { useMock?: boolean }): Promise<UserDto | null> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return USERS.find((u) => u.id === id) || null;
    }
    return api.get<UserDto>(`/users/${id}`);
  },

  /**
   * 새로운 사용자를 생성합니다.
   */
  async createUser(data: CreateUserDto, options?: { useMock?: boolean }): Promise<UserDto> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newMock: UserDto = {
        id: `u${Date.now()}`,
        ...data,
        status: data.status || "Active",
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newMock;
    }
    return api.post<UserDto>("/users", data);
  },

  /**
   * 기존 사용자를 수정합니다.
   */
  async updateUser(id: string, data: UpdateUserDto, options?: { useMock?: boolean }): Promise<UserDto> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const existing = USERS.find((u) => u.id === id);
      if (!existing) throw new Error("모의 데이터에서 사용자를 찾을 수 없습니다.");
      return { ...existing, ...data, updatedAt: new Date().toISOString() };
    }
    return api.patch<UserDto>(`/users/${id}`, data);
  },

  /**
   * 사용자를 삭제합니다.
   */
  async deleteUser(id: string, options?: { useMock?: boolean }): Promise<void> {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return;
    }
    return api.delete<void>(`/users/${id}`);
  }
};
