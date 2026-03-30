import { IRefreshTokenRepository } from "../../core/domain/repositories/refresh-token.repository";
import { RefreshTokenDto } from "../../core/application/dtos/auth.dto";
import { prisma } from "../config/prisma";
import type { RefreshToken } from "@prisma/client";

/**
 * Prisma를 이용한 리프레시 토큰 저장소 구현체
 */
export class RefreshTokenPrismaRepository implements IRefreshTokenRepository {
  /**
   * 새로운 리프레시 토큰을 생성하여 저장합니다.
   * @param userId - 사용자 ID
   * @param token - 생성된 리프레시 토큰 값
   * @param expiresAt - 토큰의 만료 일시
   * @returns 생성된 리프레시 토큰의 DTO 객체
   */
  async create(userId: string, token: string, expiresAt: Date): Promise<RefreshTokenDto> {
    const doc = await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
    return this.mapToDto(doc);
  }

  /**
   * 토큰 값으로 리프레시 토큰 정보를 조회합니다.
   * @param token - 조회할 리프레시 토큰 값
   * @returns 조회된 리프레시 토큰 정보 또는 null (존재하지 않을 경우)
   */
  async findByToken(token: string): Promise<RefreshTokenDto | null> {
    const doc = await prisma.refreshToken.findUnique({ where: { token } });
    if (!doc) return null;
    return this.mapToDto(doc);
  }

  /**
   * 특정 리프레시 토큰을 삭제합니다.
   * @param token - 삭제할 리프레시 토큰 값
   * @returns Promise<void>
   */
  async deleteByToken(token: string): Promise<void> {
    await prisma.refreshToken.delete({ where: { token } });
  }

  /**
   * 특정 사용자의 모든 리프레시 토큰을 삭제합니다.
   * @param userId - 사용자 ID
   * @returns Promise<void>
   */
  async deleteAllByUserId(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  /**
   * Prisma 데이터베이스 모델 객체를 DTO 객체로 변환합니다.
   * @param doc - Prisma에서 반환된 원본 데이터 객체
   * @returns 변환된 리프레시 토큰 DTO 반환
   */
  private mapToDto(doc: RefreshToken): RefreshTokenDto {
    return {
      id: doc.id,
      token: doc.token,
      userId: doc.userId,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt,
    };
  }
}
