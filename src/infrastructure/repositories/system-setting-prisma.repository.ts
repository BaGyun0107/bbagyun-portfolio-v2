import { ISystemSettingsRepository } from "../../core/domain/repositories/system-setting.repository";
import { SystemSettingsDto, UpdateSystemSettingsDto } from "../../core/application/dtos/system-setting.dto";
import { prisma } from "../config/prisma";
import type { SystemSettings } from "@/generated/prisma/client";

export class SystemSettingsPrismaRepository implements ISystemSettingsRepository {
  async getSettings(): Promise<SystemSettingsDto | null> {
    const settings = await prisma.systemSettings.findFirst();
    if (!settings) return null;
    return this.mapToDto(settings);
  }

  async updateSettings(data: UpdateSystemSettingsDto): Promise<SystemSettingsDto> {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          siteName: data.siteName ?? "My Portfolio",
          seoDescription: data.seoDescription ?? "",
          maintenanceMode: data.maintenanceMode ?? false,
          analyticsEnabled: data.analyticsEnabled ?? true,
          apiVersion: data.apiVersion ?? "v1",
        }
      });
    } else {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data,
      });
    }
    return this.mapToDto(settings);
  }

  private mapToDto(doc: SystemSettings): SystemSettingsDto {
    return {
      id: doc.id,
      siteName: doc.siteName,
      seoDescription: doc.seoDescription,
      maintenanceMode: doc.maintenanceMode,
      analyticsEnabled: doc.analyticsEnabled,
      apiVersion: doc.apiVersion,
      updatedAt: doc.updatedAt,
    };
  }
}
