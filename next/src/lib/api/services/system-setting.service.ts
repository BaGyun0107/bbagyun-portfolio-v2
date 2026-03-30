import { API_CONFIG } from "../config";
import { api } from "../fetcher";
import { SystemSettingsDto, UpdateSystemSettingsDto } from "@/core/application/dtos/system-setting.dto";
import { SETTINGS } from "@/data/mock";

export const SystemSettingService = {
  getSettings: async (options?: { useMock?: boolean }): Promise<SystemSettingsDto> => {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((res) => setTimeout(res, 500));
      return SETTINGS;
    }
    return api.get<SystemSettingsDto>("/settings");
  },

  updateSettings: async (
    data: UpdateSystemSettingsDto,
    options?: { useMock?: boolean },
  ): Promise<SystemSettingsDto> => {
    const isMock = options?.useMock ?? API_CONFIG.USE_MOCK;
    if (isMock) {
      await new Promise((res) => setTimeout(res, 500));
      return { ...SETTINGS, ...data } as SystemSettingsDto;
    }
    return api.patch<SystemSettingsDto>("/settings", { body: JSON.stringify(data) });
  },
};
