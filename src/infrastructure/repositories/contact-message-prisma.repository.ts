import { IContactMessageRepository } from "../../core/domain/repositories/contact-message.repository";
import { ContactMessageDto, CreateContactMessageDto, UpdateContactMessageStatusDto, ContactMessageStatus } from "../../core/application/dtos/contact-message.dto";
import { prisma } from "../config/prisma";
import type { ContactMessage } from "@/generated/prisma/client";

export class ContactMessagePrismaRepository implements IContactMessageRepository {
  async findById(id: string): Promise<ContactMessageDto | null> {
    const doc = await prisma.contactMessage.findUnique({ where: { id } });
    if (!doc) return null;
    return this.mapToDto(doc);
  }

  async findAll(): Promise<ContactMessageDto[]> {
    const docs = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((doc: ContactMessage) => this.mapToDto(doc));
  }

  async create(data: CreateContactMessageDto): Promise<ContactMessageDto> {
    const doc = await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        message: data.message,
        status: "UNREAD",
      },
    });
    return this.mapToDto(doc);
  }

  async updateStatus(id: string, data: UpdateContactMessageStatusDto): Promise<ContactMessageDto> {
    const doc = await prisma.contactMessage.update({
      where: { id },
      data: { status: data.status },
    });
    return this.mapToDto(doc);
  }

  async delete(id: string): Promise<void> {
    await prisma.contactMessage.delete({ where: { id } });
  }

  private mapToDto(doc: ContactMessage): ContactMessageDto {
    return {
      id: doc.id,
      name: doc.name,
      email: doc.email,
      message: doc.message,
      status: doc.status as ContactMessageStatus,
      createdAt: doc.createdAt,
    };
  }
}
