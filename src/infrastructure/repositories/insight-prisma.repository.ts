import { IInsightRepository } from "../../core/domain/repositories/insight.repository";
import { InsightDto, CreateInsightDto, UpdateInsightDto } from "../../core/application/dtos/insight.dto";
import { prisma } from "../config/prisma";
import type { Insight, Prisma } from "@/generated/prisma/client";

/**
 * Prisma를 이용한 인사이트 저장소 구현체
 */
export class InsightPrismaRepository implements IInsightRepository {
  /**
   * ID를 이용하여 인사이트를 조회합니다.
   * @param id - 조회할 인사이트의 ID
   * @returns 조회된 인사이트 정보 또는 null
   */
  async findById(id: string): Promise<InsightDto | null> {
    const doc = await prisma.insight.findUnique({ where: { id } });
    if (!doc) return null;
    return this.mapToDto(doc);
  }

  /**
   * 슬러그(Slug)를 이용하여 인사이트를 조회합니다.
   * @param slug - 조회할 인사이트의 고유 슬러그
   * @returns 조회된 인사이트 정보 또는 null
   */
  async findBySlug(slug: string): Promise<InsightDto | null> {
    const doc = await prisma.insight.findUnique({ where: { slug } });
    if (!doc) return null;
    return this.mapToDto(doc);
  }

  /**
   * 모든 인사이트 목록을 날짜 기준 내림차순 정렬하여 조회합니다.
   * @returns 인사이트 DTO 배열
   */
  async findAll(): Promise<InsightDto[]> {
    const docs = await prisma.insight.findMany({
      orderBy: { date: 'desc' },
    });
    return docs.map((doc: Insight) => this.mapToDto(doc));
  }

  /**
   * 새로운 인사이트를 생성합니다.
   * @param data - 생성할 인사이트 정보 (CreateInsightDto)
   * @returns 생성된 인사이트 DTO
   */
  async create(data: CreateInsightDto): Promise<InsightDto> {
    const doc = await prisma.insight.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        date: new Date(data.date),
        tags: JSON.stringify(data.tags),
        readTime: data.readTime,
      },
    });
    return this.mapToDto(doc);
  }

  /**
   * 기존 인사이트를 수정합니다.
   * @param id - 수정할 인사이트의 ID
   * @param data - 수정할 내용 (UpdateInsightDto)
   * @returns 수정이 완료된 인사이트 DTO
   */
  async update(id: string, data: UpdateInsightDto): Promise<InsightDto> {
    const { tags, ...restData } = data;
    const updateData: Prisma.InsightUpdateInput = { ...restData };
    if (tags) {
      updateData.tags = JSON.stringify(tags);
    }
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    const doc = await prisma.insight.update({
      where: { id },
      data: updateData,
    });
    return this.mapToDto(doc);
  }

  /**
   * 특정 인사이트를 삭제합니다.
   * @param id - 삭제할 인사이트의 ID
   * @returns Promise<void>
   */
  async delete(id: string): Promise<void> {
    await prisma.insight.delete({ where: { id } });
  }

  /**
   * Prisma 데이터베이스 모델 객체를 DTO 객체로 매핑합니다.
   * @param doc - Prisma 원본 데이터 객체
   * @returns 변환된 인사이트 DTO
   */
  private mapToDto(doc: Insight): InsightDto {
    return {
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      excerpt: doc.excerpt,
      content: doc.content,
      date: doc.date,
      tags: JSON.parse(doc.tags),
      readTime: doc.readTime,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
