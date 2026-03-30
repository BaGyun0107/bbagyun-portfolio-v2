import { IFeatureRepository } from "../../core/domain/repositories/feature.repository";
import { FeatureDto, CreateFeatureDto, UpdateFeatureDto, FeatureStatus, FeatureCategory } from "../../core/application/dtos/feature.dto";
import { prisma } from "../config/prisma";
import type { Feature } from "@prisma/client";

export class FeaturePrismaRepository implements IFeatureRepository {
  async findById(id: string): Promise<FeatureDto | null> {
    const doc = await prisma.feature.findUnique({ where: { id } });
    if (!doc) return null;
    return this.mapToDto(doc);
  }

  async findBySlug(slug: string): Promise<FeatureDto | null> {
    const doc = await prisma.feature.findUnique({ where: { slug } });
    if (!doc) return null;
    return this.mapToDto(doc);
  }

  async findAll(): Promise<FeatureDto[]> {
    const docs = await prisma.feature.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((doc: Feature) => this.mapToDto(doc));
  }

  async create(data: CreateFeatureDto): Promise<FeatureDto> {
    const doc = await prisma.feature.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        iconName: data.iconName,
        category: data.category,
        techStack: JSON.stringify(data.techStack),
        status: data.status,
        apiCount: data.apiCount || 0,
        overview: data.overview,
        diagramUrl: data.diagramUrl,
        period: data.period,
        team: data.team,
        content: data.content,
      },
    });
    return this.mapToDto(doc);
  }

  async update(id: string, data: UpdateFeatureDto): Promise<FeatureDto> {
    const { techStack, ...restData } = data;
    const doc = await prisma.feature.update({
      where: { id },
      data: {
        ...restData,
        ...(techStack ? { techStack: JSON.stringify(techStack) } : {}),
      },
    });
    return this.mapToDto(doc);
  }

  async delete(id: string): Promise<void> {
    await prisma.feature.delete({ where: { id } });
  }

  private mapToDto(doc: Feature): FeatureDto {
    return {
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      description: doc.description || "",
      iconName: doc.iconName || "",
      category: doc.category as FeatureCategory,
      techStack: JSON.parse(doc.techStack),
      status: doc.status as FeatureStatus,
      apiCount: doc.apiCount,
      overview: doc.overview || "",
      diagramUrl: doc.diagramUrl || undefined,
      period: doc.period || undefined,
      team: doc.team || undefined,
      content: doc.content || undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
