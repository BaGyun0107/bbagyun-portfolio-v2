import { IUserRepository } from "../../domain/repositories/user.repository";
import { CreateUserDto, UpdateUserDto, UserDto } from "../dtos/user.dto";

/**
 * 사용자 정보 관리를 담당하는 Use Case 클래스입니다.
 */
export class UserUseCases {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * 지정된 ID의 사용자 정보를 조회합니다.
   * @param {string} id - 사용자 ID
   * @returns {Promise<UserDto | null>} 사용자 정보 또는 존재하지 않을 시 null 반환
   */

  async getUser(id: string): Promise<UserDto | null> {
    return this.userRepository.findById(id);
  }

  /**
   * 모든 사용자 목록을 조회합니다.
   * @returns {Promise<UserDto[]>} 사용자 배열 반환
   */
  async getAllUsers(): Promise<UserDto[]> {
    return this.userRepository.findAll();
  }

  /**
   * 새로운 사용자를 생성합니다.
   * @param {CreateUserDto} data - 생성할 사용자 데이터
   * @returns {Promise<UserDto>} 생성된 사용자 정보
   * @throws {Error} 동일한 이메일이 이미 존재하는 경우 에러 발생
   */
  async createUser(data: CreateUserDto): Promise<UserDto> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error("이미 해당 이메일로 가입된 사용자가 있습니다.");
    }
    return this.userRepository.create(data);
  }

  /**
   * 특정 사용자의 정보를 수정합니다.
   * @param {string} id - 수정할 사용자 ID
   * @param {UpdateUserDto} data - 업데이트할 내용
   * @returns {Promise<UserDto>} 수정이 반영된 사용자 정보
   * @throws {Error} 해당 사용자가 존재하지 않을 경우 에러 발생
   */
  async updateUser(id: string, data: UpdateUserDto): Promise<UserDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }
    return this.userRepository.update(id, data);
  }

  /**
   * 특정 사용자를 삭제합니다.
   * @param {string} id - 삭제할 사용자 ID
   * @throws {Error} 해당 사용자가 존재하지 않을 경우 에러 발생
   */
  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }
    return this.userRepository.delete(id);
  }
}
