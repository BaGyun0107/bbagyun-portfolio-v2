import { Prisma } from "@prisma/client";
import { IInsightRepository } from "../../core/domain/repositories/insight.repository";
import { InsightDto, CreateInsightDto, UpdateInsightDto, InsightArchiveDto, InsightTagDto, InsightNavigationDto } from "../../core/application/dtos/insight.dto";
import { prisma } from "../config/prisma";

/** 태그를 포함한 Insight include 설정 */
const INSIGHT_INCLUDE = {
  feature: { select: { slug: true } },
  tags: { include: { tag: { select: { name: true } } } },
} as const;

/** Prisma가 생성한 Insight 모델 타입 (Include 포함) */
type InsightWithRelations = Prisma.InsightGetPayload<{ include: typeof INSIGHT_INCLUDE }>;

/**
 * Prisma를 이용한 인사이트 저장소 구현체
 * - Tag를 M:N 분리 모델(InsightTag)로 관리
 * - @@index([date]) 인덱스로 날짜 기반 쿼리 최적화
 */
export class InsightPrismaRepository implements IInsightRepository {
  /**
   * ID를 이용하여 인사이트를 조회합니다.
   */
  async findById(id: string): Promise<InsightDto | null> {
    const doc = await prisma.insight.findUnique({
      where: { id },
      include: INSIGHT_INCLUDE as any,
    });
    if (!doc) return null;
    return this.mapToDto(doc as unknown as InsightWithRelations);
  }

  /**
   * 슬러그(Slug)를 이용하여 인사이트를 조회합니다.
   */
  async findBySlug(slug: string): Promise<InsightDto | null> {
    const doc = await prisma.insight.findUnique({
      where: { slug },
      include: INSIGHT_INCLUDE as any,
    });
    if (!doc) return null;
    return this.mapToDto(doc as unknown as InsightWithRelations);
  }

  /**
   * 모든 인사이트 목록을 날짜 기준 내림차순 정렬하여 조회합니다.
   * @@index([date]) 인덱스를 타 빠른 정렬이 보장됩니다.
   */
  async findAll(): Promise<InsightDto[]> {
    const docs = await prisma.insight.findMany({
      orderBy: { date: 'desc' },
      include: INSIGHT_INCLUDE as any,
    });
    return (docs as unknown as InsightWithRelations[]).map((doc) => this.mapToDto(doc));
  }

  /**
   * 연도별 게시물 목록 조회 (아카이브)
   * date 인덱스로 정렬이 최적화됩니다.
   */
  async getArchiveList(): Promise<InsightArchiveDto[]> {
    const docs = await prisma.insight.findMany({
      orderBy: { date: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        date: true,
        tags: { include: { tag: { select: { name: true } } } },
      } as any,
    });

    const grouped: Record<string, { id: string; slug: string; title: string; date: Date; tags: string[] }[]> = {};
    for (const doc of (docs as unknown as InsightWithRelations[])) {
      const year = new Date(doc.date).getFullYear().toString();
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push({
        id: doc.id,
        slug: doc.slug,
        title: doc.title,
        date: doc.date,
        tags: doc.tags.map((t: any) => t.tag.name),
      });
    }

    return Object.keys(grouped)
      .sort((a, b) => Number(b) - Number(a))
      .map(year => ({ year, insights: grouped[year] }));
  }

  /**
   * 전체 태그 목록 및 글 개수 조회
   * DB 레벨에서 집계하므로 애플리케이션 메모리 부담이 없습니다.
   */
  async getTags(): Promise<InsightTagDto[]> {
    const tags = await prisma.tag.findMany({
      include: {
        _count: { select: { insights: true } },
      },
      orderBy: { name: 'asc' },
    });

    return tags.map(tag => ({
      tag: tag.name,
      count: tag._count.insights,
    }));
  }

  /**
   * 주어진 날짜 기준 이전/다음 게시물 조회
   * @@index([date])를 사용해 DB 레벨에서 빠른 비교 가능.
   */
  async getNavigation(currentDate: Date | string): Promise<{ prev: InsightNavigationDto | null; next: InsightNavigationDto | null }> {
    const targetDate = new Date(currentDate);

    const [prevDoc, nextDoc] = await Promise.all([
      prisma.insight.findFirst({
        where: { date: { lt: targetDate } },
        orderBy: { date: 'desc' },
        select: { slug: true, title: true },
      }),
      prisma.insight.findFirst({
        where: { date: { gt: targetDate } },
        orderBy: { date: 'asc' },
        select: { slug: true, title: true },
      }),
    ]);

    return {
      prev: prevDoc ? { slug: prevDoc.slug, title: prevDoc.title } : null,
      next: nextDoc ? { slug: nextDoc.slug, title: nextDoc.title } : null,
    };
  }

  /**
   * 특정 태그를 포함한 인사이트 목록 조회
   * 관계 테이블을 통한 DB 레벨 필터링으로 완전한 인덱스 활용.
   */
  async findByTag(tag: string): Promise<InsightDto[]> {
    const docs = await prisma.insight.findMany({
      where: {
        tags: { some: { tag: { name: tag } } },
      } as any,
      orderBy: { date: 'desc' },
      include: INSIGHT_INCLUDE as any,
    });
    return (docs as unknown as InsightWithRelations[]).map((doc) => this.mapToDto(doc));
  }

  /**
   * 새로운 인사이트를 생성합니다.
   * 태그는 upsert로 없으면 생성, 있으면 연결합니다.
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
        readTime: data.readTime,
        featureId,
        tags: {
          create: data.tags.map(name => ({
            tag: {
              connectOrCreate: {
                where: { name },
                create: { name },
              },
            },
          })),
        } as any,
      } as any,
      include: INSIGHT_INCLUDE as any,
    });
    return this.mapToDto(doc as unknown as InsightWithRelations);
  }

  /**
   * 기존 인사이트를 수정합니다.
   * 태그 수정 시 기존 연결을 모두 끊고 새로 연결합니다.
   */
  async update(id: string, data: UpdateInsightDto): Promise<InsightDto> {
    const { tags, featureSlug, date, ...restData } = data;
    
    // 1. 태그 업데이트 (있을 경우에만)
    if (tags !== undefined) {
      await prisma.insightTag.deleteMany({ where: { insightId: id } });
    }

    let newFeatureId: string | null | undefined = undefined;
    if (featureSlug !== undefined) {
      if (featureSlug === null) {
        newFeatureId = null;
      } else {
        const feature = await prisma.feature.findUnique({ where: { slug: featureSlug } });
        newFeatureId = feature ? feature.id : null;
      }
    }

    // Prisma Update Input에 맞게 객체 조립 (null 허용 관계 처리를 위해 필드별 할당)
    const updatePayload: Prisma.InsightUpdateInput = {
      ...restData,
    };

    if (date !== undefined) updatePayload.date = new Date(date);
    if (newFeatureId !== undefined) {
      if (newFeatureId === null) {
        updatePayload.feature = { disconnect: true };
      } else {
        updatePayload.feature = { connect: { id: newFeatureId } };
      }
    }

    if (tags !== undefined) {
      updatePayload.tags = {
        create: tags.map(name => ({
          tag: {
            connectOrCreate: {
              where: { name },
              create: { name },
            },
          },
        })),
      };
    }

    const doc = await prisma.insight.update({
      where: { id },
      data: updatePayload as any,
      include: INSIGHT_INCLUDE as any,
    });
    return this.mapToDto(doc as unknown as InsightWithRelations);
  }

  /**
   * 특정 인사이트를 삭제합니다.
   * InsightTag는 onDelete: Cascade로 자동 삭제됩니다.
   */
  async delete(id: string): Promise<void> {
    await prisma.insight.delete({ where: { id } });
  }

  /**
   * Prisma 데이터베이스 모델 객체를 DTO 객체로 매핑합니다.
   * tags는 InsightTag[] 관계에서 tag.name 배열로 변환합니다.
   */
  private mapToDto(doc: InsightWithRelations): InsightDto {
    return {
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      excerpt: doc.excerpt,
      content: doc.content,
      date: doc.date,
      tags: doc.tags.map((it) => it.tag.name),
      readTime: doc.readTime,
      featureSlug: doc.feature?.slug || null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
