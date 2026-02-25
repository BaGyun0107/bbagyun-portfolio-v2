import { UserDto, CreateUserDto, UpdateUserDto } from "../../application/dtos/user.dto";

/**
 * 사용자(User) 데이터베이스 접근을 추상화한 Repository 인터페이스입니다.
 */
export interface IUserRepository {
  /** 지정된 ID로 사용자 조회 */
  findById(id: string): Promise<UserDto | null>;
  /** 이메일로 사용자 조회 */
  findByEmail(email: string): Promise<UserDto | null>;
  /** 전체 사용자 목록 조회 */
  findAll(): Promise<UserDto[]>;
  /** 새로운 사용자 생성 */
  create(data: CreateUserDto): Promise<UserDto>;
  /** 지정된 사용자의 정보 수정 */
  update(id: string, data: UpdateUserDto): Promise<UserDto>;
  /** 지정된 사용자 삭제 */
  delete(id: string): Promise<void>;
}
