import { IStudyRepository } from "../../core/domain/repositories/study.repository";
import { StudyDto, CreateStudyDto, UpdateStudyDto, StudyStatus, StudyCategory } from "../../core/application/dtos/study.dto";
import { prisma } from "../config/prisma";
import type { Study } from "@prisma/client";

export class StudyPrismaRepository implements IStudyRepository {
  async findById(id: string): Promise<StudyDto | null> {
    const doc = await prisma.study.findUnique({ where: { id } });
    if (!doc) return null;
    return this.mapToDto(doc);
  }

  async findBySlug(slug: string): Promise<StudyDto | null> {
    const doc = await prisma.study.findUnique({ where: { slug } });
    if (!doc) return null;
    return this.mapToDto(doc);
  }

  async findAll(): Promise<StudyDto[]> {
    const docs = await prisma.study.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((doc: Study) => this.mapToDto(doc));
  }

  async create(data: CreateStudyDto): Promise<StudyDto> {
    const doc = await prisma.study.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        iconName: data.iconName,
        category: data.category,
        techStack: JSON.stringify(data.techStack),
        status: data.status,
        overview: data.overview,
        period: data.period,
        content: data.content,
      },
    });
    return this.mapToDto(doc);
  }

  async update(id: string, data: UpdateStudyDto): Promise<StudyDto> {
    const { techStack, ...restData } = data;
    const doc = await prisma.study.update({
      where: { id },
      data: {
        ...restData,
        ...(techStack ? { techStack: JSON.stringify(techStack) } : {}),
      },
    });
    return this.mapToDto(doc);
  }

  async delete(id: string): Promise<void> {
    await prisma.study.delete({ where: { id } });
  }

  private mapToDto(doc: Study): StudyDto {
    return {
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      description: doc.description || "",
      iconName: doc.iconName || "",
      category: doc.category as StudyCategory,
      techStack: JSON.parse(doc.techStack),
      status: doc.status as StudyStatus,
      overview: doc.overview || "",
      period: doc.period || undefined,
      content: doc.content || undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
