import { IUserRepository } from "../../domain/repositories/user.repository";
import { IRefreshTokenRepository } from "../../domain/repositories/refresh-token.repository";
import { AuthResultDto } from "../dtos/auth.dto";
import { JwtUtil } from "../utils/jwt.util";
import * as bcrypt from "bcryptjs";

/**
 * 인증 관련 비즈니스 로직을 처리하는 Use Case 클래스입니다.
 * (현재 User Schema에 비밀번호가 없으므로 유효한 사용자 매칭만으로 로그인을 시뮬레이션합니다.
 * 실제 서비스 환경에서는 OAuth 인증 방식이나 매직 링크를 연동해야 합니다.)
 */
export class AuthUseCases {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository
  ) {}

  /**
   * 사용자 로그인을 처리합니다.
   * @param {string} email - 로그인할 사용자 이메일
   * @param {string} password - 로그인할 사용자 비밀번호
   * @returns {Promise<AuthResultDto>} 로그인 성공 결과(토큰 및 사용자 정보)
   * @throws {Error} 유효하지 않은 인증 정보이거나 비활성화된 계정일 때
   */
  async login(email: string, password?: string): Promise<AuthResultDto> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || user.status !== "Active") {
      throw new Error("잘못된 자격 증명이거나 비활성화된 사용자입니다.");
    }

    if (user.password && password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
         throw new Error("잘못된 자격 증명입니다.");
      }
    } else if (password) {
        // DB에 패스워드가 없는 계정이지만 프론트에서 전송한 경우 (또는 그 반대)
        throw new Error("잘못된 자격 증명입니다.");
    }

    // 마지막 로그인 시간 갱신
    await this.userRepository.update(user.id, { lastLogin: new Date() });

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = JwtUtil.generateAccessToken(tokenPayload);
    const refreshToken = JwtUtil.generateRefreshToken(tokenPayload);

    // DB에 리프레시 토큰 저장
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 현재로부터 7일 후
    await this.refreshTokenRepository.create(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * 로그아웃 처리를 위해 사용자의 모든 리프레시 토큰을 삭제합니다.
   * @param {string} userId - 사용자 ID
   */
  async logout(userId: string): Promise<void> {
    await this.refreshTokenRepository.deleteAllByUserId(userId);
  }

  /**
   * 리프레시 토큰을 사용하여 새로운 엑세스 및 리프레시 토큰을 발급합니다.
   * @param {string} token - 기존 리프레시 토큰
   * @returns {Promise<AuthResultDto>} 갱신된 토큰 및 사용자 정보
   * @throws {Error} 토큰이 유효하지 않거나 만료되었을 때
   */
  async refresh(token: string): Promise<AuthResultDto> {
    // 1. 토큰 자체의 유효성 검증
    const payload = JwtUtil.verifyRefreshToken(token);

    // 2. DB에 존재하는지 검증
    const savedToken = await this.refreshTokenRepository.findByToken(token);
    if (!savedToken) {
      throw new Error("유효하지 않거나 폐기된 리프레시 토큰입니다.");
    }
    
    // 3. 만료 여부 확인
    if (new Date(savedToken.expiresAt) < new Date()) {
      await this.refreshTokenRepository.deleteByToken(token);
      throw new Error("리프레시 토큰이 만료되었습니다.");
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user || user.status !== "Active") {
      throw new Error("사용자를 찾을 수 없거나 비활성화되었습니다.");
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const newAccessToken = JwtUtil.generateAccessToken(tokenPayload);

    // 리프레시 토큰 갱신(Rotation) 처리: 새로운 토큰 발급
    const newRefreshToken = JwtUtil.generateRefreshToken(tokenPayload);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // 이전 토큰 삭제 후 새 토큰 생성
    await this.refreshTokenRepository.deleteByToken(token);
    await this.refreshTokenRepository.create(user.id, newRefreshToken, expiresAt);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
