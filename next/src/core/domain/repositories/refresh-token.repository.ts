import { RefreshTokenDto } from "../../application/dtos/auth.dto";

/**
 * 리프레시 토큰(Refresh Token) 데이터베이스 접근을 추상화한 Repository 인터페이스입니다.
 */
export interface IRefreshTokenRepository {
  /**
   * 새 리프레시 토큰을 저장합니다.
   * @param {string} userId - 사용자 ID
   * @param {string} token - 저장할 JWT 토큰값
   * @param {Date} expiresAt - 만료 일시
   */
  create(userId: string, token: string, expiresAt: Date): Promise<RefreshTokenDto>;
  /** 실제 토큰값으로 리프레시 토큰 기록 조회 */
  findByToken(token: string): Promise<RefreshTokenDto | null>;
  /** 실제 토큰값을 기반으로 단일 기록 삭제 */
  deleteByToken(token: string): Promise<void>;
  /** 지정된 사용자의 모든 리프레시 토큰 (기기전체 로그아웃용) 삭제 */
  deleteAllByUserId(userId: string): Promise<void>;
}
