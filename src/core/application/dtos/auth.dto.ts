/**
 * 로그인 인증 결과 DTO 인터페이스
 */
export interface AuthResultDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * 리프레시 토큰 정보에 대한 DTO 인터페이스
 */
export interface RefreshTokenDto {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date | string;
  createdAt: Date | string;
}
