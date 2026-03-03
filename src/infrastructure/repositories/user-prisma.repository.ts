import { User } from "@prisma/client";
import { IUserRepository } from "../../core/domain/repositories/user.repository";
import { UserDto, CreateUserDto, UpdateUserDto } from "../../core/application/dtos/user.dto";

// NOTE: Usually PrismaClient is injected or imported from a singleton.
// We'll assume a global singleton exists or is passed in.
import { prisma } from "../config/prisma";

export class UserPrismaRepository implements IUserRepository {
  async findById(id: string): Promise<UserDto | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return this.mapToDto(user);
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return this.mapToDto(user);
  }

  async findAll(): Promise<UserDto[]> {
    const users = await prisma.user.findMany();
    return users.map((u: User) => this.mapToDto(u));
  }

  async create(data: CreateUserDto): Promise<UserDto> {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status || "Active",
        lastLogin: new Date(),
      },
    });
    return this.mapToDto(user);
  }

  async update(id: string, data: UpdateUserDto): Promise<UserDto> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,
      },
    });
    return this.mapToDto(user);
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  private mapToDto(user: User): UserDto {
    return {
      id: user.id,
      name: user.name,
      password: user.password || undefined,
      email: user.email,
      role: user.role as UserDto["role"],
      status: user.status as UserDto["status"],
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
