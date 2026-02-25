import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-dev";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "super-secret-refresh-key";

/**
 * JWT(JSON Web Token)에 포함되는 페이로드 인터페이스입니다.
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * JWT 발급 및 검증을 담당하는 유틸리티 클래스입니다.
 */
export class JwtUtil {
  /**
   * 엑세스 토큰(Access Token)을 생성합니다. (만료시간 10분)
   * @param {TokenPayload} payload - 토큰에 담길 사용자 정보
   * @returns {string} 발급된 JWT 토큰 문자열
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "10m" });
  }

  /**
   * 리프레시 토큰(Refresh Token)을 생성합니다. (만료시간 7일)
   * @param {TokenPayload} payload - 토큰에 담길 사용자 정보
   * @returns {string} 발급된 JWT 리프레시 토큰 문자열
   */
  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
  }

  /**
   * 제공된 엑세스 토큰이 유효한지 검증합니다.
   * @param {string} token - 검증할 토큰
   * @returns {TokenPayload} 복호화 된 페이로드 데이터
   * @throws {Error} 만료되거나 유효하지 않은 형태일 경우 에러 발생
   */
  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  /**
   * 제공된 리프레시 토큰이 유효한지 검증합니다.
   * @param {string} token - 검증할 토큰
   * @returns {TokenPayload} 복호화 된 페이로드 데이터
   * @throws {Error} 만료되거나 유효하지 않은 형태일 경우 에러 발생
   */
  static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  }
}
