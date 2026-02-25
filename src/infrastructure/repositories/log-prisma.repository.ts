import { ILogRepository } from "../../core/domain/repositories/log.repository";
import { LogDto, CreateLogDto, LogMethod } from "../../core/application/dtos/log.dto";
import { prisma } from "../config/prisma";
import type { Log } from "@/generated/prisma/client";

export class LogPrismaRepository implements ILogRepository {
  async findById(id: string): Promise<LogDto | null> {
    const doc = await prisma.log.findUnique({ where: { id } });
    if (!doc) return null;
    return this.mapToDto(doc);
  }

  async findAll(): Promise<LogDto[]> {
    const docs = await prisma.log.findMany({
      orderBy: { timestamp: 'desc' },
      take: 1000, // Limit for safety
    });
    return docs.map((doc: Log) => this.mapToDto(doc));
  }

  async create(data: CreateLogDto): Promise<LogDto> {
    const doc = await prisma.log.create({
      data: {
        method: data.method,
        path: data.path,
        status: data.status,
        latency: data.latency,
        requestData: data.requestData || null,
        responseData: data.responseData || null,
        errorMessage: data.errorMessage || null,
      },
    });
    return this.mapToDto(doc);
  }

  async deleteOldLogs(daysToKeep: number): Promise<number> {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - daysToKeep);
    const result = await prisma.log.deleteMany({
      where: {
        timestamp: {
          lt: dateLimit,
        },
      },
    });
    return result.count;
  }

  private mapToDto(doc: Log): LogDto {
    return {
      id: doc.id,
      method: doc.method as LogMethod,
      path: doc.path,
      status: doc.status,
      latency: doc.latency,
      requestData: doc.requestData ? JSON.parse(doc.requestData) : undefined,
      responseData: doc.responseData ? JSON.parse(doc.responseData) : undefined,
      errorMessage: doc.errorMessage || undefined,
      timestamp: doc.timestamp,
    };
  }
}
