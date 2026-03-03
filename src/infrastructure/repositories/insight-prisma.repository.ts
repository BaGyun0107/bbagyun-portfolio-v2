import { IInsightRepository } from "../../core/domain/repositories/insight.repository";
import { InsightDto, CreateInsightDto, UpdateInsightDto } from "../../core/application/dtos/insight.dto";
import { prisma } from "../config/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Prisma를 이용한 인사이트 저장소 구현체
 */
export class InsightPrismaRepository implements IInsightRepository {
  /**
   * ID를 이용하여 인사이트를 조회합니다.
   */
  async findById(id: string): Promise<InsightDto | null> {
    const doc = await prisma.insight.findUnique({
      where: { id },
      include: { feature: { select: { slug: true } } },
    });
    if (!doc) return null;
    return this.mapToDto(doc);
  }

  /**
   * 슬러그(Slug)를 이용하여 인사이트를 조회합니다.
   */
  async findBySlug(slug: string): Promise<InsightDto | null> {
    const doc = await prisma.insight.findUnique({
      where: { slug },
      include: { feature: { select: { slug: true } } },
    });
    if (!doc) return null;
    return this.mapToDto(doc);
  }

  /**
   * 모든 인사이트 목록을 날짜 기준 내림차순 정렬하여 조회합니다.
   */
  async findAll(): Promise<InsightDto[]> {
    const docs = await prisma.insight.findMany({
      orderBy: { date: 'desc' },
      include: { feature: { select: { slug: true } } },
    });
    return docs.map((doc) => this.mapToDto(doc));
  }

  /**
   * 새로운 인사이트를 생성합니다.
   */
  async create(data: CreateInsightDto): Promise<InsightDto> {
    let featureId = null;
    if (data.featureSlug) {
      const feature = await prisma.feature.findUnique({ where: { slug: data.featureSlug } });
      if (feature) featureId = feature.id;
    }

    const doc = await prisma.insight.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        date: new Date(data.date),
        tags: JSON.stringify(data.tags),
        readTime: data.readTime,
        featureId,
      },
      include: { feature: { select: { slug: true } } },
    });
    return this.mapToDto(doc);
  }

  /**
   * 기존 인사이트를 수정합니다.
   */
  async update(id: string, data: UpdateInsightDto): Promise<InsightDto> {
    const { tags, featureSlug, ...restData } = data;
    const updateData: Prisma.InsightUncheckedUpdateInput = { ...restData };
    if (tags) {
      updateData.tags = JSON.stringify(tags);
    }
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    if (featureSlug !== undefined) {
      if (featureSlug === null) {
        updateData.featureId = null;
      } else {
        const feature = await prisma.feature.findUnique({ where: { slug: featureSlug } });
        updateData.featureId = feature ? feature.id : null;
      }
    }
    const doc = await prisma.insight.update({
      where: { id },
      data: updateData,
      include: { feature: { select: { slug: true } } },
    });
    return this.mapToDto(doc);
  }

  /**
   * 특정 인사이트를 삭제합니다.
   */
  async delete(id: string): Promise<void> {
    await prisma.insight.delete({ where: { id } });
  }

  /**
   * Prisma 데이터베이스 모델 객체를 DTO 객체로 매핑합니다.
   */
  private mapToDto(doc: any): InsightDto {
    return {
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      excerpt: doc.excerpt,
      content: doc.content,
      date: doc.date,
      tags: JSON.parse(doc.tags),
      readTime: doc.readTime,
      featureSlug: doc.feature?.slug || null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
